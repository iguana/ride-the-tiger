import * as THREE from 'three';

interface Projectile {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  lifetime: number;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
}

export class PhoneShooter {
  private scene: THREE.Scene;
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private colliders: THREE.Box3[] = [];
  private readonly PROJECTILE_SPEED = 30;
  private readonly MAX_LIFETIME = 5;
  private readonly SPIN_SPEED = 10;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setColliders(colliders: THREE.Box3[]): void {
    this.colliders = colliders;
  }

  public shoot(origin: THREE.Vector3, direction: THREE.Vector3): void {
    const phone = this.createPhone();
    phone.position.copy(origin);
    phone.position.add(direction.clone().multiplyScalar(1)); // Start slightly in front

    this.scene.add(phone);

    this.projectiles.push({
      mesh: phone,
      velocity: direction.clone().normalize().multiplyScalar(this.PROJECTILE_SPEED),
      lifetime: 0,
    });
  }

  private createPhone(): THREE.Group {
    const phone = new THREE.Group();

    // Old rotary phone style
    const phoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.3,
      metalness: 0.2,
    });

    // Base of phone
    const baseGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.3);
    const base = new THREE.Mesh(baseGeometry, phoneMaterial);
    phone.add(base);

    // Rotary dial area (circular bump)
    const dialBase = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
    const dial = new THREE.Mesh(dialBase, phoneMaterial);
    dial.position.set(0, 0.1, 0);
    phone.add(dial);

    // Dial face (cream colored)
    const dialFace = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
    const dialFaceMesh = new THREE.Mesh(dialFace, new THREE.MeshStandardMaterial({ color: 0xfff8dc }));
    dialFaceMesh.position.set(0, 0.12, 0);
    phone.add(dialFaceMesh);

    // Finger holes on dial
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 1.8 - Math.PI * 0.4;
      const holeGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8);
      const hole = new THREE.Mesh(holeGeometry, phoneMaterial);
      hole.position.set(
        Math.cos(angle) * 0.055,
        0.13,
        Math.sin(angle) * 0.055
      );
      phone.add(hole);
    }

    // Handset cradle (left side)
    const cradleLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.08, 0.08),
      phoneMaterial
    );
    cradleLeft.position.set(-0.15, 0.1, -0.08);
    phone.add(cradleLeft);

    // Handset cradle (right side)
    const cradleRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.08, 0.08),
      phoneMaterial
    );
    cradleRight.position.set(-0.15, 0.1, 0.08);
    phone.add(cradleRight);

    // Handset - earpiece
    const earpiece = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.08, 12),
      phoneMaterial
    );
    earpiece.rotation.x = Math.PI / 2;
    earpiece.position.set(-0.15, 0.18, -0.12);
    phone.add(earpiece);

    // Handset - handle/middle part
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8),
      phoneMaterial
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(-0.15, 0.18, 0);
    phone.add(handle);

    // Handset - mouthpiece
    const mouthpiece = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.04, 0.08, 12),
      phoneMaterial
    );
    mouthpiece.rotation.x = Math.PI / 2;
    mouthpiece.position.set(-0.15, 0.18, 0.12);
    phone.add(mouthpiece);

    // Curly cord (simplified as a spiral)
    const cordMaterial = new THREE.MeshStandardMaterial({ color: 0x2d2d2d });
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      points.push(new THREE.Vector3(
        0.05 + t * 0.1,
        0.08 + Math.sin(t * Math.PI * 4) * 0.02,
        Math.cos(t * Math.PI * 4) * 0.02
      ));
    }
    const cordCurve = new THREE.CatmullRomCurve3(points);
    const cordGeometry = new THREE.TubeGeometry(cordCurve, 20, 0.008, 6, false);
    const cord = new THREE.Mesh(cordGeometry, cordMaterial);
    phone.add(cord);

    // Add slight random rotation for variety
    phone.rotation.x = (Math.random() - 0.5) * 0.5;
    phone.rotation.z = (Math.random() - 0.5) * 0.5;

    // Scale up a bit so it's visible
    phone.scale.setScalar(1.5);

    return phone;
  }

  public update(deltaTime: number): void {
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];

      // Update position
      projectile.mesh.position.add(
        projectile.velocity.clone().multiplyScalar(deltaTime)
      );

      // Spin the phone as it flies
      projectile.mesh.rotation.x += this.SPIN_SPEED * deltaTime;
      projectile.mesh.rotation.y += this.SPIN_SPEED * 0.7 * deltaTime;

      // Apply gravity
      projectile.velocity.y -= 9.8 * deltaTime;

      // Update lifetime
      projectile.lifetime += deltaTime;

      // Check for collisions
      let hit = false;

      // Hit the ground
      if (projectile.mesh.position.y <= 0.1) {
        hit = true;
      }

      // Hit a wall/cubicle
      if (!hit) {
        const pos = projectile.mesh.position;
        const phoneBox = new THREE.Box3().setFromCenterAndSize(
          pos,
          new THREE.Vector3(0.4, 0.3, 0.4)
        );
        for (const collider of this.colliders) {
          if (phoneBox.intersectsBox(collider)) {
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        this.explode(projectile.mesh.position.clone());
        this.scene.remove(projectile.mesh);
        this.projectiles.splice(i, 1);
      } else if (projectile.lifetime > this.MAX_LIFETIME) {
        this.scene.remove(projectile.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // Update explosion particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      particle.mesh.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime)
      );

      // Lighter gravity so cash flutters
      particle.velocity.y -= 6 * deltaTime;

      // Tumble like paper bills
      particle.mesh.rotation.x += 5 * deltaTime;
      particle.mesh.rotation.z += 3 * deltaTime;
      particle.mesh.rotation.y += 2 * deltaTime;

      particle.lifetime += deltaTime;
      const t = particle.lifetime / particle.maxLifetime;

      // Shrink and fade out
      const scale = Math.max(0, 1 - t);
      particle.mesh.scale.setScalar(scale);

      // Fade opacity
      const mat = particle.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 1 - t * t);

      // Remove when done
      if (particle.lifetime >= particle.maxLifetime) {
        this.scene.remove(particle.mesh);
        mat.dispose();
        particle.mesh.geometry.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  private cashTexture: THREE.CanvasTexture | null = null;

  private getCashTexture(): THREE.CanvasTexture {
    if (!this.cashTexture) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#85bb65';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#2d6a2e';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 32, 32);
      this.cashTexture = new THREE.CanvasTexture(canvas);
    }
    return this.cashTexture;
  }

  private explode(position: THREE.Vector3): void {
    const particleCount = 24;

    for (let i = 0; i < particleCount; i++) {
      const isCoin = Math.random() > 0.65;
      let geometry: THREE.BufferGeometry;
      let material: THREE.MeshStandardMaterial;

      if (isCoin) {
        // Gold coin
        geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.012, 10);
        material = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          metalness: 0.7,
          roughness: 0.2,
          transparent: true,
          opacity: 1,
        });
      } else {
        // Cash bill
        geometry = new THREE.PlaneGeometry(0.18, 0.08);
        material = new THREE.MeshStandardMaterial({
          map: this.getCashTexture(),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 1,
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        Math.random() * 0.2,
        (Math.random() - 0.5) * 0.3
      ));

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        3 + Math.random() * 7,
        (Math.random() - 0.5) * 8
      );

      // Random initial tumble
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      this.scene.add(mesh);

      this.particles.push({
        mesh,
        velocity,
        lifetime: 0,
        maxLifetime: 1.0 + Math.random() * 1.5,
      });
    }

    // Green flash at impact
    const flash = new THREE.PointLight(0x4ade80, 5, 8);
    flash.position.copy(position);
    this.scene.add(flash);
    setTimeout(() => {
      this.scene.remove(flash);
      flash.dispose();
    }, 100);
  }

  public getProjectiles(): Projectile[] {
    return this.projectiles;
  }
}
