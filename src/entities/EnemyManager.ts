import * as THREE from 'three';

type EnemyType = 'manager' | 'salesBro' | 'itZombie' | 'hrEnforcer' | 'financeGoblin' | 'executive';

interface Enemy {
  mesh: THREE.Group;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  speed: number;
  health: number;
  state: 'patrol' | 'dying';
  deathTimer: number;
  type: EnemyType;
}

interface DeathParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
}

interface SpawnZone {
  position: THREE.Vector3;
  types: EnemyType[];
}

const ENEMY_CONFIG: Record<EnemyType, { speedMin: number; speedMax: number; health: number; scale: number }> = {
  manager:        { speedMin: 2.0, speedMax: 3.5, health: 1, scale: 1.1 },
  salesBro:       { speedMin: 3.5, speedMax: 5.0, health: 1, scale: 1.05 },
  itZombie:       { speedMin: 1.2, speedMax: 2.0, health: 1, scale: 1.0 },
  hrEnforcer:     { speedMin: 2.0, speedMax: 3.0, health: 1, scale: 1.1 },
  financeGoblin:  { speedMin: 2.5, speedMax: 3.5, health: 1, scale: 0.95 },
  executive:      { speedMin: 1.5, speedMax: 2.5, health: 2, scale: 1.3 },
};

// ─── Shared material cache (avoids creating duplicate GPU materials) ──
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function mat(color: number, roughness = 0.6): THREE.MeshStandardMaterial {
  const key = `${color}:${roughness}`;
  let m = materialCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness });
    materialCache.set(key, m);
  }
  return m;
}

function emissiveMat(color: number, intensity: number): THREE.MeshStandardMaterial {
  const key = `e:${color}:${intensity}`;
  let m = materialCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity });
    materialCache.set(key, m);
  }
  return m;
}

/** Dispose all geometries (but NOT shared materials) in a group hierarchy */
function disposeGroup(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      // Materials are shared via cache — do NOT dispose them
    }
  });
}

export class EnemyManager {
  private scene: THREE.Scene;
  private enemies: Enemy[] = [];
  private deathParticles: DeathParticle[] = [];
  private colliders: THREE.Box3[] = [];
  private playerPosition: THREE.Vector3 = new THREE.Vector3();
  private spawnTimer: number = 0;
  private killCount: number = 0;
  private onKillCallback: ((count: number) => void) | null = null;

  private readonly MAX_ENEMIES = 24;
  private readonly SPAWN_INTERVAL = 3;
  private readonly ENEMY_RADIUS = 0.6;
  private readonly ENEMY_HALF_SIZE = new THREE.Vector3(0.4, 0.9, 0.4);
  private readonly BLAST_RADIUS = 4;
  private readonly DETECTION_RANGE = 22;

  // Pre-allocated scratch objects to avoid per-frame allocation
  private readonly _toPlayer = new THREE.Vector3();
  private readonly _velocity = new THREE.Vector3();
  private readonly _enemyBox = new THREE.Box3();
  private readonly _enemySize = new THREE.Vector3();
  private readonly _testPos = new THREE.Vector3();
  private elapsedTime: number = 0;

  // Spawn zones mapped to department clusters with relevant enemy types
  private readonly SPAWN_ZONES: SpawnZone[] = [
    // North wing — engineering/product/CTO
    { position: new THREE.Vector3(-13, 0, -45), types: ['itZombie', 'itZombie', 'manager'] },
    { position: new THREE.Vector3(13, 0, -45),  types: ['manager', 'itZombie'] },
    { position: new THREE.Vector3(40, 0, -45),  types: ['executive', 'manager'] },
    { position: new THREE.Vector3(-40, 0, -45), types: ['hrEnforcer', 'hrEnforcer', 'manager'] },

    // Upper middle — security/data/warroom/exec
    { position: new THREE.Vector3(-40, 0, -20), types: ['itZombie', 'manager'] },
    { position: new THREE.Vector3(-13, 0, -20), types: ['itZombie', 'itZombie'] },
    { position: new THREE.Vector3(13, 0, -20),  types: ['executive', 'executive', 'manager'] },
    { position: new THREE.Vector3(40, 0, -20),  types: ['executive', 'executive'] },

    // Center — IT/breakroom/GTM
    { position: new THREE.Vector3(-40, 0, 5),   types: ['itZombie', 'itZombie', 'itZombie'] },
    { position: new THREE.Vector3(0, 0, -5),    types: ['manager', 'salesBro'] },
    { position: new THREE.Vector3(40, 0, 5),    types: ['salesBro', 'salesBro', 'manager'] },

    // Lower middle — marketing/delivery/people/revops
    { position: new THREE.Vector3(-40, 0, 30),  types: ['salesBro', 'salesBro', 'manager'] },
    { position: new THREE.Vector3(-13, 0, 30),  types: ['manager', 'manager'] },
    { position: new THREE.Vector3(13, 0, 30),   types: ['hrEnforcer', 'hrEnforcer', 'manager'] },
    { position: new THREE.Vector3(40, 0, 30),   types: ['financeGoblin', 'financeGoblin', 'manager'] },

    // South wing — support/finance
    { position: new THREE.Vector3(-25, 0, 50),  types: ['hrEnforcer', 'hrEnforcer'] },
    { position: new THREE.Vector3(25, 0, 50),   types: ['financeGoblin', 'financeGoblin'] },

    // Outside — VC
    { position: new THREE.Vector3(0, 0, -75),   types: ['financeGoblin', 'financeGoblin', 'executive'] },

    // Hallway roamers
    { position: new THREE.Vector3(0, 0, -30),   types: ['manager', 'salesBro'] },
    { position: new THREE.Vector3(0, 0, 15),    types: ['manager', 'hrEnforcer'] },
    { position: new THREE.Vector3(-25, 0, 10),  types: ['itZombie', 'manager'] },
    { position: new THREE.Vector3(25, 0, 10),   types: ['salesBro', 'manager'] },

    // East outdoor — Parking Garage + Server Farm
    { position: new THREE.Vector3(75, 0, 0),    types: ['manager', 'salesBro', 'manager'] },
    { position: new THREE.Vector3(85, 0, -5),   types: ['salesBro', 'manager'] },
    { position: new THREE.Vector3(110, 0, 0),   types: ['itZombie', 'itZombie', 'itZombie'] },

    // West outdoor — Startup Graveyard + Food Trucks
    { position: new THREE.Vector3(-80, 0, 0),   types: ['financeGoblin', 'executive', 'financeGoblin'] },
    { position: new THREE.Vector3(-80, 0, -10), types: ['executive', 'financeGoblin'] },
    { position: new THREE.Vector3(-80, 0, 30),  types: ['salesBro', 'manager', 'salesBro'] },

    // North outdoor — Executive Helipad
    { position: new THREE.Vector3(0, 0, -105),  types: ['executive', 'executive', 'executive'] },
    { position: new THREE.Vector3(-5, 0, -95),  types: ['executive', 'financeGoblin'] },
  ];

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Spawn initial batch
    for (let i = 0; i < 10; i++) {
      this.spawnEnemy();
    }
  }

  public setColliders(colliders: THREE.Box3[]): void {
    this.colliders = colliders;
  }

  public setOnKill(callback: (count: number) => void): void {
    this.onKillCallback = callback;
  }

  private spawnEnemy(): void {
    if (this.enemies.length >= this.MAX_ENEMIES) return;

    const zone = this.SPAWN_ZONES[Math.floor(Math.random() * this.SPAWN_ZONES.length)];
    const type = zone.types[Math.floor(Math.random() * zone.types.length)];

    const spawnPos = zone.position.clone();
    spawnPos.x += (Math.random() - 0.5) * 10;
    spawnPos.z += (Math.random() - 0.5) * 10;

    const config = ENEMY_CONFIG[type];
    const mesh = this.createEnemyMesh(type);
    mesh.position.copy(spawnPos);
    this.scene.add(mesh);

    this.enemies.push({
      mesh,
      position: spawnPos.clone(),
      targetPosition: spawnPos.clone(),
      speed: config.speedMin + Math.random() * (config.speedMax - config.speedMin),
      health: config.health,
      state: 'patrol',
      deathTimer: 0,
      type,
    });
  }

  // ─── Mesh builders per type ────────────────────────────────────────

  private createEnemyMesh(type: EnemyType): THREE.Group {
    switch (type) {
      case 'manager': return this.buildManager();
      case 'salesBro': return this.buildSalesBro();
      case 'itZombie': return this.buildITZombie();
      case 'hrEnforcer': return this.buildHREnforcer();
      case 'financeGoblin': return this.buildFinanceGoblin();
      case 'executive': return this.buildExecutive();
    }
  }

  /** Standard corporate manager — dark suit, briefcase, red tie */
  private buildManager(): THREE.Group {
    const g = new THREE.Group();
    const suit = mat(0x2d2d3d);
    const shirt = mat(0xeeeeee);
    const tie = mat(0xcc2222);
    const skin = mat(0xf0c8a0, 0.8);
    const hair = mat(0x3d2b1f);
    const shoe = mat(0x1a1a1a);

    this.addLegs(g, suit, shoe);
    this.addTorso(g, suit);
    this.addShirt(g, shirt);
    this.addTie(g, tie);
    this.addArms(g, suit, skin);
    this.addHead(g, skin, hair);
    this.addAngryEyes(g, 0xff3333);
    this.addBrows(g, hair);

    // Briefcase
    const bc = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.06), mat(0x3d2b1f, 0.4));
    bc.position.set(0.35, 0.5, 0);
    g.add(bc);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.02), shoe);
    handle.position.set(0.35, 0.6, 0);
    g.add(handle);

    g.scale.setScalar(ENEMY_CONFIG.manager.scale);
    return g;
  }

  /** Sales Bro — bright blue jacket, slicked hair, headset, finger guns */
  private buildSalesBro(): THREE.Group {
    const g = new THREE.Group();
    const blazer = mat(0x1565c0);
    const pants = mat(0x1a237e);
    const shirt = mat(0xffffff);
    const skin = mat(0xdeb887, 0.8);
    const hair = mat(0xf5deb3);
    const shoe = mat(0x4e342e);

    this.addLegs(g, pants, shoe);
    this.addTorso(g, blazer);
    this.addShirt(g, shirt);
    this.addArms(g, blazer, skin);
    this.addHead(g, skin, hair);
    this.addAngryEyes(g, 0x00e5ff);
    this.addBrows(g, hair);

    // Slicked-back hair (taller)
    const slick = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.35), hair);
    slick.position.set(0, 1.6, -0.03);
    g.add(slick);

    // Headset
    const headband = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.03), mat(0x333333));
    headband.position.set(0, 1.55, 0);
    g.add(headband);
    const earpiece = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), mat(0x333333));
    earpiece.position.set(-0.16, 1.45, 0.08);
    g.add(earpiece);
    const mic = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), mat(0x333333));
    mic.position.set(-0.16, 1.35, 0.12);
    g.add(mic);

    // Toothy grin
    const grin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.02), mat(0xffffff));
    grin.position.set(0, 1.35, 0.15);
    g.add(grin);

    g.scale.setScalar(ENEMY_CONFIG.salesBro.scale);
    return g;
  }

  /** IT Zombie — gray hoodie, pale skin, coffee mug, slouched */
  private buildITZombie(): THREE.Group {
    const g = new THREE.Group();
    const hoodie = mat(0x546e7a);
    const jeans = mat(0x37474f);
    const skin = mat(0xc8d6c8, 0.8);  // sickly pale
    const hair = mat(0x212121);
    const shoe = mat(0x424242);

    this.addLegs(g, jeans, shoe);
    this.addTorso(g, hoodie);
    this.addArms(g, hoodie, skin);
    this.addHead(g, skin, hair);

    // Messy hair
    const messy = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.32), hair);
    messy.position.set(0, 1.6, 0);
    messy.rotation.y = 0.3;
    g.add(messy);

    // Hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.15), hoodie);
    hood.position.set(0, 1.55, -0.1);
    g.add(hood);

    // Tired eyes (dim, bags under)
    for (const side of [-0.07, 0.07]) {
      const eye = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.03, 0.02),
        emissiveMat(0x66ff66, 0.3)
      );
      eye.position.set(side, 1.44, 0.15);
      g.add(eye);
      // Eye bags
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.015, 0.02), mat(0x7a8a7a));
      bag.position.set(side, 1.42, 0.15);
      g.add(bag);
    }

    // Coffee mug
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.1, 8), mat(0xffffff));
    mug.position.set(0.35, 0.6, 0.05);
    g.add(mug);
    const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8), mat(0x3e2723));
    coffee.position.set(0.35, 0.66, 0.05);
    g.add(coffee);

    g.scale.setScalar(ENEMY_CONFIG.itZombie.scale);
    return g;
  }

  /** HR Enforcer — pantsuit, clipboard, glasses, stern expression */
  private buildHREnforcer(): THREE.Group {
    const g = new THREE.Group();
    const suit = mat(0x5c3d6e);  // dark purple
    const blouse = mat(0xf8bbd0);
    const skin = mat(0xd4a574, 0.8);
    const hair = mat(0x4a0e0e);
    const shoe = mat(0x1a1a1a);

    this.addLegs(g, suit, shoe);
    this.addTorso(g, suit);
    this.addShirt(g, blouse);
    this.addArms(g, suit, skin);
    this.addHead(g, skin, hair);

    // Bun hairstyle
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), hair);
    bun.position.set(0, 1.65, -0.05);
    g.add(bun);
    const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.15), hair);
    bangs.position.set(0, 1.58, 0.06);
    g.add(bangs);

    // Glasses
    for (const side of [-0.07, 0.07]) {
      const lens = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.06, 0.02),
        mat(0x88ccff, 0.2)
      );
      lens.position.set(side, 1.46, 0.15);
      g.add(lens);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.02), mat(0x333333));
    bridge.position.set(0, 1.47, 0.15);
    g.add(bridge);

    // Stern eyes behind glasses
    this.addAngryEyes(g, 0xff6666);

    // Clipboard
    const cb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.02), mat(0x8d6e63));
    cb.position.set(-0.35, 0.75, 0.1);
    cb.rotation.z = 0.2;
    g.add(cb);
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.01), mat(0xffffff));
    paper.position.set(-0.35, 0.74, 0.12);
    paper.rotation.z = 0.2;
    g.add(paper);

    // Thin frown
    const frown = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.02), mat(0x8b4513));
    frown.position.set(0, 1.35, 0.15);
    g.add(frown);

    g.scale.setScalar(ENEMY_CONFIG.hrEnforcer.scale);
    return g;
  }

  /** Finance Goblin — green visor, hunched, calculator, green-tinted skin */
  private buildFinanceGoblin(): THREE.Group {
    const g = new THREE.Group();
    const vest = mat(0x1b5e20);
    const shirt = mat(0xe8e8d0);
    const skin = mat(0xc5d5a5, 0.8);  // slightly green
    const hair = mat(0x555555);
    const shoe = mat(0x2e2e2e);

    this.addLegs(g, mat(0x33691e), shoe);
    // Shorter torso (hunched)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.25), vest);
    torso.position.set(0, 0.85, 0.05);  // slightly forward = hunched
    torso.rotation.x = 0.15;
    torso.castShadow = true;
    g.add(torso);
    this.addShirt(g, shirt);
    this.addArms(g, vest, skin);
    this.addHead(g, skin, hair);

    // Balding head + comb-over
    const bald = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.26), skin);
    bald.position.set(0, 1.57, 0);
    g.add(bald);
    const combover = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.12), hair);
    combover.position.set(0, 1.58, -0.08);
    g.add(combover);

    // Green visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.15), mat(0x00e676, 0.3));
    visor.position.set(0, 1.55, 0.12);
    visor.rotation.x = -0.3;
    g.add(visor);
    const visorBand = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.02), mat(0x111111));
    visorBand.position.set(0, 1.56, 0.05);
    g.add(visorBand);

    // Beady eyes
    this.addAngryEyes(g, 0x00ff00);

    // Calculator in hand
    const calc = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.02), mat(0x222222));
    calc.position.set(0.35, 0.6, 0.05);
    g.add(calc);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.01), emissiveMat(0x33ff33, 0.5));
    screen.position.set(0.35, 0.65, 0.06);
    g.add(screen);

    g.scale.setScalar(ENEMY_CONFIG.financeGoblin.scale);
    return g;
  }

  /** Executive — tall, power suit, gold accessories, imposing, takes 2 hits */
  private buildExecutive(): THREE.Group {
    const g = new THREE.Group();
    const powerSuit = mat(0x0d1b2a);
    const shirt = mat(0xfafafa);
    const powerTie = mat(0xb8860b);
    const skin = mat(0xdeb887, 0.8);
    const hair = mat(0xc0c0c0);  // silver
    const shoe = mat(0x0a0a0a);

    this.addLegs(g, powerSuit, shoe);
    // Broader torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.3), powerSuit);
    torso.position.set(0, 0.9, 0);
    torso.castShadow = true;
    g.add(torso);
    this.addShirt(g, shirt);
    this.addTie(g, powerTie);
    // Broad shoulders
    for (const side of [-1, 1]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.28), powerSuit);
      pad.position.set(side * 0.32, 1.17, 0);
      g.add(pad);
    }
    this.addArms(g, powerSuit, skin);
    this.addHead(g, skin, hair);
    this.addAngryEyes(g, 0xff0000);
    this.addBrows(g, mat(0x888888));

    // Distinguished silver hair
    const distinguished = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.3), hair);
    distinguished.position.set(0, 1.6, -0.01);
    g.add(distinguished);

    // Gold watch
    const watch = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.08), mat(0xffd700, 0.2));
    watch.position.set(-0.35, 0.58, 0);
    g.add(watch);

    // Gold cufflinks
    for (const side of [-1, 1]) {
      const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), mat(0xffd700, 0.2));
      cuff.position.set(side * 0.32, 0.58, 0.06);
      g.add(cuff);
    }

    g.scale.setScalar(ENEMY_CONFIG.executive.scale);
    return g;
  }

  // ─── Shared body part helpers ──────────────────────────────────────

  private addLegs(g: THREE.Group, legMat: THREE.MeshStandardMaterial, shoeMat: THREE.MeshStandardMaterial): void {
    for (const side of [-0.12, 0.12]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), legMat);
      leg.position.set(side, 0.3, 0);
      leg.castShadow = true;
      g.add(leg);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.28), shoeMat);
      shoe.position.set(side, 0.04, 0.03);
      g.add(shoe);
    }
  }

  private addTorso(g: THREE.Group, suitMat: THREE.MeshStandardMaterial): void {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.25), suitMat);
    torso.position.set(0, 0.88, 0);
    torso.castShadow = true;
    g.add(torso);
  }

  private addShirt(g: THREE.Group, shirtMat: THREE.MeshStandardMaterial): void {
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.2), shirtMat);
    shirt.position.set(0, 1.18, 0.02);
    g.add(shirt);
  }

  private addTie(g: THREE.Group, tieMat: THREE.MeshStandardMaterial): void {
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.02), tieMat);
    tie.position.set(0, 0.95, 0.14);
    g.add(tie);
  }

  private addArms(g: THREE.Group, suitMat: THREE.MeshStandardMaterial, skinMat: THREE.MeshStandardMaterial): void {
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.5, 0.13), suitMat);
      arm.position.set(side * 0.32, 0.85, 0);
      g.add(arm);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), skinMat);
      hand.position.set(side * 0.32, 0.55, 0);
      g.add(hand);
    }
  }

  private addHead(g: THREE.Group, skinMat: THREE.MeshStandardMaterial, hairMat: THREE.MeshStandardMaterial): void {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), skinMat);
    head.position.set(0, 1.42, 0);
    head.castShadow = true;
    g.add(head);
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), hairMat);
    hair.position.set(0, 1.6, 0);
    g.add(hair);
  }

  private addAngryEyes(g: THREE.Group, color: number): void {
    for (const side of [-0.07, 0.07]) {
      const eye = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.04, 0.02),
        emissiveMat(color, 0.6)
      );
      eye.position.set(side, 1.45, 0.15);
      g.add(eye);
    }
  }

  private addBrows(g: THREE.Group, browMat: THREE.MeshStandardMaterial): void {
    for (const side of [-1, 1]) {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), browMat);
      brow.position.set(side * 0.07, 1.5, 0.15);
      brow.rotation.z = side * -0.4;
      g.add(brow);
    }
  }

  // ─── Collision ─────────────────────────────────────────────────────

  private isCollidingAt(position: THREE.Vector3): boolean {
    this._enemySize.set(
      this.ENEMY_HALF_SIZE.x * 2,
      this.ENEMY_HALF_SIZE.y * 2,
      this.ENEMY_HALF_SIZE.z * 2
    );
    this._enemyBox.setFromCenterAndSize(position, this._enemySize);
    for (const collider of this.colliders) {
      if (this._enemyBox.intersectsBox(collider)) return true;
    }
    return false;
  }

  private moveWithCollision(position: THREE.Vector3, velocity: THREE.Vector3): THREE.Vector3 {
    this._testPos.copy(position).add(velocity);
    if (!this.isCollidingAt(this._testPos)) return this._testPos;

    this._testPos.copy(position);
    this._testPos.x += velocity.x;
    if (!this.isCollidingAt(this._testPos)) return this._testPos;

    this._testPos.copy(position);
    this._testPos.z += velocity.z;
    if (!this.isCollidingAt(this._testPos)) return this._testPos;

    this._testPos.copy(position);
    return this._testPos;
  }

  // ─── Update ────────────────────────────────────────────────────────

  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    this.playerPosition.copy(playerPosition);
    this.elapsedTime += deltaTime;

    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    const time = this.elapsedTime;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (enemy.state === 'patrol') {
        this._toPlayer.copy(this.playerPosition).sub(enemy.position);
        this._toPlayer.y = 0;
        const distToPlayer = this._toPlayer.length();

        if (distToPlayer > 1.2) {
          // _toPlayer is now the direction (normalized in-place)
          this._toPlayer.normalize();

          if (distToPlayer > this.DETECTION_RANGE) {
            this._toPlayer.x += Math.sin(time + i * 2.5) * 0.4;
            this._toPlayer.z += Math.cos(time + i * 2.5) * 0.4;
            this._toPlayer.normalize();
          }

          const moveSpeed = enemy.speed * deltaTime;
          this._velocity.copy(this._toPlayer).multiplyScalar(moveSpeed);

          // Save the direction before moveWithCollision may overwrite _testPos
          const dirX = this._toPlayer.x;
          const dirZ = this._toPlayer.z;

          const newPos = this.moveWithCollision(enemy.position, this._velocity);
          enemy.position.copy(newPos);
          enemy.mesh.position.copy(enemy.position);

          // Face movement direction (use saved direction since _toPlayer may be reused)
          enemy.mesh.rotation.y = Math.atan2(dirX, dirZ);
        }

        // Walk bob — use elapsed time instead of Date.now()
        enemy.mesh.position.y = Math.abs(Math.sin(time * 6 * enemy.speed)) * 0.06;

      } else if (enemy.state === 'dying') {
        enemy.deathTimer += deltaTime;
        const t = enemy.deathTimer / 0.5;
        const baseScale = ENEMY_CONFIG[enemy.type].scale;
        enemy.mesh.scale.setScalar(Math.max(0, baseScale * (1 - t)));
        enemy.mesh.rotation.y += 15 * deltaTime;
        enemy.mesh.position.y += 2 * deltaTime;

        if (enemy.deathTimer >= 0.5) {
          this.scene.remove(enemy.mesh);
          disposeGroup(enemy.mesh);
          this.enemies.splice(i, 1);
        }
      }
    }

    // Death particles
    for (let i = this.deathParticles.length - 1; i >= 0; i--) {
      const p = this.deathParticles[i];
      p.mesh.position.addScaledVector(p.velocity, deltaTime);
      p.velocity.y -= 8 * deltaTime;
      p.mesh.rotation.x += 4 * deltaTime;
      p.mesh.rotation.z += 3 * deltaTime;
      p.lifetime += deltaTime;

      const t = p.lifetime / p.maxLifetime;
      p.mesh.scale.setScalar(Math.max(0, 1 - t));
      const m = p.mesh.material as THREE.MeshStandardMaterial;
      m.opacity = Math.max(0, 1 - t * t);

      if (p.lifetime >= p.maxLifetime) {
        this.scene.remove(p.mesh);
        m.dispose();
        p.mesh.geometry.dispose();
        this.deathParticles.splice(i, 1);
      }
    }
  }

  // ─── Hit detection ─────────────────────────────────────────────────

  public checkProjectileHit(position: THREE.Vector3): boolean {
    for (const enemy of this.enemies) {
      if (enemy.state !== 'patrol') continue;
      const dist = position.distanceTo(enemy.position.clone().setY(position.y));
      if (dist < this.ENEMY_RADIUS + 0.3) {
        this.damageEnemy(enemy, 1);
        return true;
      }
    }
    return false;
  }

  public checkExplosionHits(position: THREE.Vector3): number {
    let kills = 0;
    for (const enemy of this.enemies) {
      if (enemy.state !== 'patrol') continue;
      const dist = position.distanceTo(enemy.position);
      if (dist < this.BLAST_RADIUS) {
        const wasDying = enemy.health <= 1;
        this.damageEnemy(enemy, 1);
        if (wasDying) kills++;
      }
    }
    return kills;
  }

  private static readonly HIT_FLASH_MAT = new THREE.MeshStandardMaterial({ color: 0xff0000 });

  private damageEnemy(enemy: Enemy, amount: number): void {
    enemy.health -= amount;
    if (enemy.health <= 0) {
      this.killEnemy(enemy);
    } else {
      // Flash red on hit (not dead yet — executives take 2 hits)
      // Swap materials temporarily (shared materials can't be mutated)
      const originals: { mesh: THREE.Mesh; material: THREE.Material }[] = [];
      enemy.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          originals.push({ mesh: child, material: child.material as THREE.Material });
          child.material = EnemyManager.HIT_FLASH_MAT;
        }
      });
      setTimeout(() => {
        for (const entry of originals) {
          entry.mesh.material = entry.material;
        }
      }, 100);
    }
  }

  private killEnemy(enemy: Enemy): void {
    if (enemy.state === 'dying') return;

    enemy.state = 'dying';
    enemy.deathTimer = 0;
    this.killCount++;

    this.spawnDeathParticles(enemy.position.clone(), enemy.type);

    if (this.onKillCallback) {
      this.onKillCallback(this.killCount);
    }
  }

  // ─── Death particles (themed per type) ─────────────────────────────

  private spawnDeathParticles(position: THREE.Vector3, type: EnemyType): void {
    const particleCount = 18;

    // Type-specific fragment colors
    const fragmentColors: Record<EnemyType, number[]> = {
      manager:        [0x2d2d3d, 0xcc2222, 0x3d2b1f, 0x1a1a1a],
      salesBro:       [0x1565c0, 0x1a237e, 0xffffff, 0x333333],
      itZombie:       [0x546e7a, 0x37474f, 0xffffff, 0x3e2723],
      hrEnforcer:     [0x5c3d6e, 0xf8bbd0, 0x8d6e63, 0xffffff],
      financeGoblin:  [0x1b5e20, 0x33691e, 0x00e676, 0x222222],
      executive:      [0x0d1b2a, 0xb8860b, 0xffd700, 0x0a0a0a],
    };

    // Papers
    for (let i = 0; i < particleCount * 0.6; i++) {
      const geometry = new THREE.PlaneGeometry(0.15, 0.2);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0xffffff : 0xfff8dc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.position.y += 0.8;
      mesh.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.3,
        (Math.random() - 0.5) * 0.5
      ));

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        3 + Math.random() * 5,
        (Math.random() - 0.5) * 6
      );

      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.scene.add(mesh);

      this.deathParticles.push({ mesh, velocity, lifetime: 0, maxLifetime: 1.2 + Math.random() * 1.0 });
    }

    // Type-colored fragments
    const colors = fragmentColors[type];
    for (let i = 0; i < particleCount * 0.4; i++) {
      const geometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      const material = new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.position.y += 0.6;
      mesh.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        Math.random() * 0.2,
        (Math.random() - 0.5) * 0.4
      ));

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        2 + Math.random() * 6,
        (Math.random() - 0.5) * 8
      );

      this.scene.add(mesh);
      this.deathParticles.push({ mesh, velocity, lifetime: 0, maxLifetime: 0.8 + Math.random() * 0.8 });
    }

    // Death flash
    const flashColor = type === 'executive' ? 0xffd700 : 0xff3333;
    const flash = new THREE.PointLight(flashColor, 4, 6);
    flash.position.copy(position);
    flash.position.y += 1;
    this.scene.add(flash);
    setTimeout(() => {
      this.scene.remove(flash);
      flash.dispose();
    }, 120);
  }

  // ─── Public getters ────────────────────────────────────────────────

  public getEnemies(): Enemy[] {
    return this.enemies;
  }

  public getKillCount(): number {
    return this.killCount;
  }
}

