import * as THREE from 'three';

export interface Department {
  id: string;
  name: string;
  position: THREE.Vector3;
  artifactColor: number;
  missionDescription?: string;
}

const DEPARTMENTS: Department[] = [
  { id: 'engineering', name: 'Engineering', position: new THREE.Vector3(-20, 0, -25), artifactColor: 0xffd700 },
  { id: 'product', name: 'Product', position: new THREE.Vector3(0, 0, -25), artifactColor: 0x3182ce },
  { id: 'oocto', name: 'Office of the CTO', position: new THREE.Vector3(20, 0, -25), artifactColor: 0xffd700 },
  { id: 'it', name: 'IT', position: new THREE.Vector3(-20, 0, 0), artifactColor: 0x2d3748 },
  // center cell (0,0,0) is spawn atrium — no department
  { id: 'gtm', name: 'Go To Market', position: new THREE.Vector3(20, 0, 0), artifactColor: 0xff6b35 },
  { id: 'support', name: 'Support', position: new THREE.Vector3(-20, 0, 25), artifactColor: 0x718096 },
  { id: 'people', name: 'People', position: new THREE.Vector3(0, 0, 25), artifactColor: 0xe53e3e },
  { id: 'revops', name: 'Revenue Ops', position: new THREE.Vector3(20, 0, 25), artifactColor: 0x38a169 },
  { id: 'delivery', name: 'Delivery', position: new THREE.Vector3(0, 0, 15), artifactColor: 0x8b6914 },
  { id: 'vc', name: 'Venture Capital', position: new THREE.Vector3(0, 0, -45), artifactColor: 0x2ecc71, missionDescription: 'Get More Funding' },
  { id: 'cancun', name: 'Cancún', position: new THREE.Vector3(0, 0, 85), artifactColor: 0x00bcd4, missionDescription: 'Viva Los Replicantes!' },
];

export class CallCenter {
  public group: THREE.Group;
  public colliders: THREE.Box3[] = [];

  private readonly FLOOR_SIZE = 60;
  private readonly CUBICLE_HEIGHT = 1.5;

  private animatedObjects: { mesh: THREE.Object3D; type: string }[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.createFloor();
    this.createCeiling();
    this.createWalls();
    this.createDepartments();
  }

  // --- Floor, ceiling, walls (kept from original) ---

  private createFloor(): void {
    const floorGeometry = new THREE.PlaneGeometry(this.FLOOR_SIZE, this.FLOOR_SIZE);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    const gridHelper = new THREE.GridHelper(this.FLOOR_SIZE, 30, 0x3d4852, 0x3d4852);
    gridHelper.position.y = 0.01;
    (gridHelper.material as THREE.Material).opacity = 0.3;
    (gridHelper.material as THREE.Material).transparent = true;
    this.group.add(gridHelper);
  }

  private createCeiling(): void {
    const ceilingGeometry = new THREE.PlaneGeometry(this.FLOOR_SIZE, this.FLOOR_SIZE);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 1,
      metalness: 0,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4;
    this.group.add(ceiling);

    const lightPanelGeometry = new THREE.PlaneGeometry(2, 4);
    const lightPanelMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
    });
    for (let x = -20; x <= 20; x += 10) {
      for (let z = -20; z <= 20; z += 10) {
        const lightPanel = new THREE.Mesh(lightPanelGeometry, lightPanelMaterial);
        lightPanel.rotation.x = Math.PI / 2;
        lightPanel.position.set(x, 3.98, z);
        this.group.add(lightPanel);
      }
    }
  }

  private createWalls(): void {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });
    const halfSize = this.FLOOR_SIZE / 2;
    const wallHeight = 4;
    const doorWidth = 6;

    // North wall — split into two segments with a doorway to the VC patio
    const northSegmentWidth = (this.FLOOR_SIZE - doorWidth) / 2;

    // Left segment
    const northLeft = this.createWall(northSegmentWidth, wallHeight, wallMaterial);
    northLeft.position.set(-(northSegmentWidth / 2 + doorWidth / 2), wallHeight / 2, -halfSize);
    this.group.add(northLeft);

    // Right segment
    const northRight = this.createWall(northSegmentWidth, wallHeight, wallMaterial);
    northRight.position.set(northSegmentWidth / 2 + doorWidth / 2, wallHeight / 2, -halfSize);
    this.group.add(northRight);

    // Door frame top (lintel)
    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + 0.4, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 })
    );
    lintel.position.set(0, wallHeight, -halfSize);
    this.group.add(lintel);

    // "EXIT" sign above door
    const exitSign = this.createExitSign();
    exitSign.position.set(0, wallHeight - 0.5, -halfSize + 0.2);
    this.group.add(exitSign);

    // North wall colliders (two segments, gap in center)
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(-(northSegmentWidth / 2 + doorWidth / 2), wallHeight / 2, -halfSize),
      new THREE.Vector3(northSegmentWidth, wallHeight, 0.5)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(northSegmentWidth / 2 + doorWidth / 2, wallHeight / 2, -halfSize),
      new THREE.Vector3(northSegmentWidth, wallHeight, 0.5)
    ));

    // South wall — split with doorway to Cancún beach
    const southSegmentWidth = (this.FLOOR_SIZE - doorWidth) / 2;

    const southLeft = this.createWall(southSegmentWidth, wallHeight, wallMaterial);
    southLeft.position.set(-(southSegmentWidth / 2 + doorWidth / 2), wallHeight / 2, halfSize);
    southLeft.rotation.y = Math.PI;
    this.group.add(southLeft);

    const southRight = this.createWall(southSegmentWidth, wallHeight, wallMaterial);
    southRight.position.set(southSegmentWidth / 2 + doorWidth / 2, wallHeight / 2, halfSize);
    southRight.rotation.y = Math.PI;
    this.group.add(southRight);

    // South door lintel
    const southLintel = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + 0.4, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 })
    );
    southLintel.position.set(0, wallHeight, halfSize);
    this.group.add(southLintel);

    // Beach exit sign
    const beachSign = this.createBeachExitSign();
    beachSign.position.set(0, wallHeight - 0.5, halfSize - 0.2);
    this.group.add(beachSign);

    // South wall colliders (two segments)
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(-(southSegmentWidth / 2 + doorWidth / 2), wallHeight / 2, halfSize),
      new THREE.Vector3(southSegmentWidth, wallHeight, 0.5)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(southSegmentWidth / 2 + doorWidth / 2, wallHeight / 2, halfSize),
      new THREE.Vector3(southSegmentWidth, wallHeight, 0.5)
    ));

    // East wall
    const eastWall = this.createWall(this.FLOOR_SIZE, wallHeight, wallMaterial);
    eastWall.position.set(halfSize, wallHeight / 2, 0);
    eastWall.rotation.y = -Math.PI / 2;
    this.group.add(eastWall);

    // West wall
    const westWall = this.createWall(this.FLOOR_SIZE, wallHeight, wallMaterial);
    westWall.position.set(-halfSize, wallHeight / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    this.group.add(westWall);

    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(halfSize, wallHeight / 2, 0),
      new THREE.Vector3(0.5, wallHeight, this.FLOOR_SIZE)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(-halfSize, wallHeight / 2, 0),
      new THREE.Vector3(0.5, wallHeight, this.FLOOR_SIZE)
    ));

    // --- Outdoor areas ---
    this.createVCPatio();
    this.createCancunBeach();
  }

  private createWall(width: number, height: number, material: THREE.Material): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, height);
    const wall = new THREE.Mesh(geometry, material);
    wall.receiveShadow = true;
    return wall;
  }

  private createExitSign(): THREE.Group {
    const sign = new THREE.Group();
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.4, 0.05),
      new THREE.MeshStandardMaterial({
        color: 0xcc0000,
        emissive: 0xcc0000,
        emissiveIntensity: 0.4,
      })
    );
    sign.add(plate);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.3),
      new THREE.MeshStandardMaterial({ map: texture, transparent: true })
    );
    textPlane.position.z = 0.03;
    sign.add(textPlane);

    return sign;
  }

  private createVCPatio(): void {
    const halfSize = this.FLOOR_SIZE / 2;
    const patioWidth = 20;
    const patioDepth = 25;

    // Outdoor concrete floor
    const patioFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(patioWidth, patioDepth),
      new THREE.MeshStandardMaterial({ color: 0x8a9a5b, roughness: 0.95 })
    );
    patioFloor.rotation.x = -Math.PI / 2;
    patioFloor.position.set(0, 0.005, -halfSize - patioDepth / 2);
    patioFloor.receiveShadow = true;
    this.group.add(patioFloor);

    // Walkway from door to patio (connecting strip)
    const walkway = new THREE.Mesh(
      new THREE.PlaneGeometry(6, patioDepth),
      new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 })
    );
    walkway.rotation.x = -Math.PI / 2;
    walkway.position.set(0, 0.008, -halfSize - patioDepth / 2);
    walkway.receiveShadow = true;
    this.group.add(walkway);

    // Low boundary walls around the patio (waist height)
    const fenceHeight = 1.2;
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.7 });

    // Back fence
    const backFence = new THREE.Mesh(
      new THREE.BoxGeometry(patioWidth, fenceHeight, 0.15),
      fenceMat
    );
    backFence.position.set(0, fenceHeight / 2, -halfSize - patioDepth);
    this.group.add(backFence);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      backFence.position.clone(),
      new THREE.Vector3(patioWidth, fenceHeight, 0.5)
    ));

    // Left fence
    const leftFence = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, fenceHeight, patioDepth),
      fenceMat
    );
    leftFence.position.set(-patioWidth / 2, fenceHeight / 2, -halfSize - patioDepth / 2);
    this.group.add(leftFence);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      leftFence.position.clone(),
      new THREE.Vector3(0.5, fenceHeight, patioDepth)
    ));

    // Right fence
    const rightFence = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, fenceHeight, patioDepth),
      fenceMat
    );
    rightFence.position.set(patioWidth / 2, fenceHeight / 2, -halfSize - patioDepth / 2);
    this.group.add(rightFence);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      rightFence.position.clone(),
      new THREE.Vector3(0.5, fenceHeight, patioDepth)
    ));

    // Decorative bushes along the fences
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f });
    const bushPositions = [
      [-8, 0.5, -halfSize - 3], [8, 0.5, -halfSize - 3],
      [-8, 0.5, -halfSize - patioDepth + 2], [8, 0.5, -halfSize - patioDepth + 2],
    ];
    for (const pos of bushPositions) {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), bushMat);
      bush.position.set(pos[0], pos[1], pos[2]);
      bush.scale.set(1, 0.8, 1);
      this.group.add(bush);
    }

    // Sky backdrop (simple blue plane behind the patio)
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 20),
      new THREE.MeshStandardMaterial({
        color: 0x87ceeb,
        emissive: 0x87ceeb,
        emissiveIntensity: 0.3,
      })
    );
    sky.position.set(0, 8, -halfSize - patioDepth - 0.5);
    this.group.add(sky);
  }

  private createBeachExitSign(): THREE.Group {
    const sign = new THREE.Group();
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.4, 0.05),
      new THREE.MeshStandardMaterial({
        color: 0x00838f,
        emissive: 0x00838f,
        emissiveIntensity: 0.4,
      })
    );
    sign.add(plate);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    ctx.fillStyle = '#00838f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CANCÚN  ☀', canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.3),
      new THREE.MeshStandardMaterial({ map: texture, transparent: true })
    );
    textPlane.position.z = 0.03;
    sign.add(textPlane);

    return sign;
  }

  private createCancunBeach(): void {
    const halfSize = this.FLOOR_SIZE / 2;
    const corridorWidth = 8;
    const corridorLength = 40;
    const corridorStart = halfSize;
    const corridorEnd = corridorStart + corridorLength;
    const wallHeight = 4;
    const beachWidth = 24;
    const beachDepth = 25;
    const beachStart = corridorEnd;

    // ===== AIRPORT CORRIDOR =====

    const corridorWallMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.7 });
    const corridorFloorMat = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.5, metalness: 0.05 });

    // Corridor floor (shiny terminal tile)
    const corrFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(corridorWidth, corridorLength),
      corridorFloorMat
    );
    corrFloor.rotation.x = -Math.PI / 2;
    corrFloor.position.set(0, 0.005, corridorStart + corridorLength / 2);
    corrFloor.receiveShadow = true;
    this.group.add(corrFloor);

    // Floor center stripe (walkway guide)
    const floorStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, corridorLength),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 })
    );
    floorStripe.rotation.x = -Math.PI / 2;
    floorStripe.position.set(0, 0.008, corridorStart + corridorLength / 2);
    this.group.add(floorStripe);

    // Corridor ceiling
    const corrCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(corridorWidth, corridorLength),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 1 })
    );
    corrCeiling.rotation.x = Math.PI / 2;
    corrCeiling.position.y = wallHeight;
    corrCeiling.position.set(0, wallHeight, corridorStart + corridorLength / 2);
    this.group.add(corrCeiling);

    // Corridor walls (left and right)
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(
        new THREE.PlaneGeometry(corridorLength, wallHeight),
        corridorWallMat
      );
      wall.position.set(side * corridorWidth / 2, wallHeight / 2, corridorStart + corridorLength / 2);
      wall.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
      this.group.add(wall);

      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(side * corridorWidth / 2, wallHeight / 2, corridorStart + corridorLength / 2),
        new THREE.Vector3(0.5, wallHeight, corridorLength)
      ));
    }

    // Corridor ceiling lights
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
    });
    for (let z = corridorStart + 5; z < corridorEnd; z += 8) {
      const light = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3), lightMat);
      light.rotation.x = Math.PI / 2;
      light.position.set(0, wallHeight - 0.02, z);
      this.group.add(light);
    }

    // "AIRPORT" signs along the corridor
    const airportSignPositions = [
      corridorStart + 5,
      corridorStart + 20,
      corridorStart + 35,
    ];
    for (const zPos of airportSignPositions) {
      const sign = this.createAirportSign();
      sign.position.set(0, wallHeight - 0.6, zPos);
      this.group.add(sign);
    }

    // Gate sign at the end of the corridor
    const gateSign = this.createGateSign();
    gateSign.position.set(0, wallHeight - 0.6, corridorEnd - 2);
    this.group.add(gateSign);

    // Window panels on left wall (blue rectangles suggesting sky views)
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      emissive: 0x87ceeb,
      emissiveIntensity: 0.2,
    });
    for (let z = corridorStart + 4; z < corridorEnd - 2; z += 6) {
      const window = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8), windowMat);
      window.position.set(-corridorWidth / 2 + 0.05, 2.2, z);
      window.rotation.y = Math.PI / 2;
      this.group.add(window);
    }

    // Benches along right wall
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x4a5568 });
    for (let z = corridorStart + 8; z < corridorEnd - 5; z += 12) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.5), benchMat);
      bench.position.set(corridorWidth / 2 - 0.8, 0.5, z);
      this.group.add(bench);
      // Bench legs
      for (const lx of [-0.5, 0.5]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), benchMat);
        leg.position.set(corridorWidth / 2 - 0.8 + lx, 0.25, z);
        this.group.add(leg);
      }
    }

    // ===== BEACH AREA (at end of corridor) =====

    // Sand floor
    const sandFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(beachWidth, beachDepth),
      new THREE.MeshStandardMaterial({ color: 0xf4e1b0, roughness: 1.0 })
    );
    sandFloor.rotation.x = -Math.PI / 2;
    sandFloor.position.set(0, 0.005, beachStart + beachDepth / 2);
    sandFloor.receiveShadow = true;
    this.group.add(sandFloor);

    // Ocean
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 12),
      new THREE.MeshStandardMaterial({
        color: 0x0077be,
        emissive: 0x006699,
        emissiveIntensity: 0.2,
        roughness: 0.2,
        metalness: 0.1,
      })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, 0.003, beachStart + beachDepth + 3);
    this.group.add(ocean);

    // Tropical sky backdrop
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 20),
      new THREE.MeshStandardMaterial({
        color: 0x87ceeb,
        emissive: 0xffb347,
        emissiveIntensity: 0.15,
      })
    );
    sky.position.set(0, 8, beachStart + beachDepth + 8);
    sky.rotation.y = Math.PI;
    this.group.add(sky);

    // Palm trees
    const palmPositions = [
      { x: -8, z: beachStart + 6 },
      { x: 8, z: beachStart + 8 },
      { x: -5, z: beachStart + 18 },
      { x: 7, z: beachStart + 16 },
    ];
    for (const pp of palmPositions) {
      const palm = this.createPalmTree();
      palm.position.set(pp.x, 0, pp.z);
      this.group.add(palm);
    }

    // Beach umbrella
    const umbrella = this.createBeachUmbrella();
    umbrella.position.set(-3, 0, beachStart + 12);
    this.group.add(umbrella);

    // Beach chairs
    for (const xOff of [-4.5, -1.5]) {
      const chair = this.createBeachChair();
      chair.position.set(xOff, 0, beachStart + 12);
      this.group.add(chair);
    }

    // Tiki bar
    const tiki = this.createTikiBar();
    tiki.position.set(5, 0, beachStart + 10);
    this.group.add(tiki);

    // Boundary fences (low bamboo-style)
    const fenceHeight = 1.0;
    const bambootMat = new THREE.MeshStandardMaterial({ color: 0xc4a35a, roughness: 0.8 });

    // Back fence
    const backFence = new THREE.Mesh(new THREE.BoxGeometry(beachWidth, fenceHeight, 0.12), bambootMat);
    backFence.position.set(0, fenceHeight / 2, beachStart + beachDepth);
    this.group.add(backFence);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      backFence.position.clone(), new THREE.Vector3(beachWidth, fenceHeight, 0.5)
    ));

    // "Viva Los Replicantes!" banner on back fence
    const bannerCanvas = document.createElement('canvas');
    const bannerCtx = bannerCanvas.getContext('2d')!;
    bannerCanvas.width = 1024;
    bannerCanvas.height = 128;
    bannerCtx.fillStyle = '#ff4444';
    bannerCtx.fillRect(0, 0, bannerCanvas.width, bannerCanvas.height);
    bannerCtx.fillStyle = '#ffdd44';
    bannerCtx.font = 'bold 72px Segoe UI, sans-serif';
    bannerCtx.textAlign = 'center';
    bannerCtx.textBaseline = 'middle';
    bannerCtx.fillText('¡Viva Los Replicantes!', bannerCanvas.width / 2, bannerCanvas.height / 2);
    const bannerTexture = new THREE.CanvasTexture(bannerCanvas);

    const bannerPlate = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1.2, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xff4444 })
    );
    bannerPlate.position.set(0, 2.2, beachStart + beachDepth - 0.2);
    this.group.add(bannerPlate);

    const bannerText = new THREE.Mesh(
      new THREE.PlaneGeometry(7.8, 1.0),
      new THREE.MeshStandardMaterial({ map: bannerTexture })
    );
    bannerText.position.set(0, 2.2, beachStart + beachDepth - 0.26);
    bannerText.rotation.y = Math.PI;
    this.group.add(bannerText);

    // Side fences
    for (const side of [-1, 1]) {
      const sideFence = new THREE.Mesh(new THREE.BoxGeometry(0.12, fenceHeight, beachDepth), bambootMat);
      sideFence.position.set(side * beachWidth / 2, fenceHeight / 2, beachStart + beachDepth / 2);
      this.group.add(sideFence);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        sideFence.position.clone(), new THREE.Vector3(0.5, fenceHeight, beachDepth)
      ));
    }
  }

  private createAirportSign(): THREE.Group {
    const sign = new THREE.Group();

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.6, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    sign.add(plate);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 96;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✈  AIRPORT', canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 0.5),
      new THREE.MeshStandardMaterial({ map: texture, transparent: true })
    );
    textPlane.position.z = 0.03;
    sign.add(textPlane);

    // Back face
    const backPlane = textPlane.clone();
    backPlane.rotation.y = Math.PI;
    backPlane.position.z = -0.03;
    sign.add(backPlane);

    return sign;
  }

  private createGateSign(): THREE.Group {
    const sign = new THREE.Group();

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.8, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    sign.add(plate);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 96;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 44px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GATE C1 → CANCÚN', canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 0.6),
      new THREE.MeshStandardMaterial({ map: texture, transparent: true })
    );
    textPlane.position.z = 0.03;
    sign.add(textPlane);

    const backPlane = textPlane.clone();
    backPlane.rotation.y = Math.PI;
    backPlane.position.z = -0.03;
    sign.add(backPlane);

    return sign;
  }

  private createPalmTree(): THREE.Group {
    const palm = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });

    // Trunk (single tapered cylinder)
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.16, 5, 8),
      trunkMat
    );
    trunk.position.y = 2.5;
    palm.add(trunk);

    // Fronds (flat leaf shapes radiating out)
    const frondCount = 7;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;
      const frond = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.04, 1.8),
        leafMat
      );
      frond.position.set(
        Math.cos(angle) * 0.8,
        5.0,
        Math.sin(angle) * 0.8
      );
      frond.rotation.y = -angle;
      frond.rotation.x = 0.5;
      palm.add(frond);

      // Leaf tip droop
      const tip = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.03, 0.8),
        leafMat
      );
      tip.position.set(
        Math.cos(angle) * 1.5,
        4.6,
        Math.sin(angle) * 1.5
      );
      tip.rotation.y = -angle;
      tip.rotation.x = 0.9;
      palm.add(tip);
    }

    // Coconuts
    const coconutMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    for (let i = 0; i < 3; i++) {
      const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), coconutMat);
      const a = (i / 3) * Math.PI * 2;
      coconut.position.set(Math.cos(a) * 0.15, 4.7, Math.sin(a) * 0.15);
      palm.add(coconut);
    }

    return palm;
  }

  private createBeachUmbrella(): THREE.Group {
    const umbrella = new THREE.Group();

    // Pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xdedede })
    );
    pole.position.y = 1.25;
    umbrella.add(pole);

    // Canopy (cone)
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0xff4444 })
    );
    canopy.position.y = 2.5;
    umbrella.add(canopy);

    // Alternating color stripe
    const stripe = new THREE.Mesh(
      new THREE.ConeGeometry(1.52, 0.15, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    stripe.position.y = 2.35;
    umbrella.add(stripe);

    return umbrella;
  }

  private createBeachChair(): THREE.Group {
    const chair = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xdedede });
    const fabricMat = new THREE.MeshStandardMaterial({ color: 0x1e90ff });

    // Frame legs
    for (const x of [-0.25, 0.25]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), frameMat);
      leg.position.set(x, 0.25, -0.3);
      chair.add(leg);
      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.04), frameMat);
      leg2.position.set(x, 0.175, 0.3);
      chair.add(leg2);
    }

    // Seat (angled)
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.8), fabricMat);
    seat.position.set(0, 0.35, 0);
    seat.rotation.x = -0.15;
    chair.add(seat);

    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.03), fabricMat);
    back.position.set(0, 0.55, -0.35);
    back.rotation.x = -0.4;
    chair.add(back);

    return chair;
  }

  private createTikiBar(): THREE.Group {
    const tiki = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.9 });
    const thatchMat = new THREE.MeshStandardMaterial({ color: 0xbfa25e, roughness: 1.0 });

    // Counter
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.8), woodMat);
    counter.position.y = 1.1;
    tiki.add(counter);

    // Front panel
    const front = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.0, 0.08), woodMat);
    front.position.set(0, 0.55, 0.36);
    tiki.add(front);

    // Support posts
    for (const x of [-1.15, 1.15]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), woodMat);
      post.position.set(x, 1.4, -0.3);
      tiki.add(post);
    }

    // Thatch roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 0.8, 4), thatchMat);
    roof.position.y = 3.1;
    roof.rotation.y = Math.PI / 4;
    tiki.add(roof);

    // Cocktail on counter
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0xff6347, transparent: true, opacity: 0.7 })
    );
    glass.position.set(0.3, 1.22, 0);
    tiki.add(glass);

    // Tiny umbrella in drink
    const miniUmbrella = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.03, 8),
      new THREE.MeshStandardMaterial({ color: 0xff69b4 })
    );
    miniUmbrella.position.set(0.3, 1.35, 0);
    tiki.add(miniUmbrella);

    return tiki;
  }

  // --- Department zone generation ---

  private createDepartments(): void {
    for (const dept of DEPARTMENTS) {
      this.createDepartmentZone(dept);
    }
  }

  private createDepartmentZone(dept: Department): void {
    const zone = new THREE.Group();
    const pos = dept.position;

    // 2x2 cubicle cluster around the department center
    const offsets = [
      { x: -4, z: -4 },
      { x: 4, z: -4 },
      { x: -4, z: 4 },
      { x: 4, z: 4 },
    ];
    for (const off of offsets) {
      const cubicle = this.createCubicle();
      cubicle.position.set(off.x, 0, off.z);
      zone.add(cubicle);

      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(pos.x + off.x, this.CUBICLE_HEIGHT / 2, pos.z + off.z),
        new THREE.Vector3(3, this.CUBICLE_HEIGHT, 3)
      ));
    }

    // Department name sign (floating above artifact)
    const sign = this.createDepartmentSign(dept.name);
    sign.position.set(0, 3.2, 0);
    zone.add(sign);

    // Green marker ring
    const marker = this.createMarkerRing();
    marker.position.set(0, 0.02, 0);
    zone.add(marker);

    // Artifact platform
    const platform = this.createPlatform();
    platform.position.set(0, 0, 0);
    zone.add(platform);

    // Department-specific artifact
    const artifact = this.createArtifact(dept.id);
    artifact.position.set(0, 0.15, 0);
    zone.add(artifact);

    zone.position.copy(pos);
    this.group.add(zone);
  }

  private createMarkerRing(): THREE.Mesh {
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.5, 32),
      new THREE.MeshStandardMaterial({
        color: 0x4ade80,
        emissive: 0x4ade80,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide,
      })
    );
    marker.rotation.x = -Math.PI / 2;
    return marker;
  }

  private createPlatform(): THREE.Mesh {
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.0, 0.15, 32),
      new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.6 })
    );
    platform.position.y = 0.075;
    platform.receiveShadow = true;
    return platform;
  }

  private createDepartmentSign(name: string): THREE.Group {
    const sign = new THREE.Group();

    // Background plate
    const charWidth = 0.28;
    const plateWidth = Math.max(name.length * charWidth + 0.4, 2.5);
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(plateWidth, 0.5, 0.05),
      new THREE.MeshStandardMaterial({
        color: 0x1a202c,
        roughness: 0.3,
      })
    );
    sign.add(plate);

    // Create text using individual letter planes with canvas textures
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 64;
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.toUpperCase(), canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(plateWidth - 0.1, 0.4),
      new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
      })
    );
    textPlane.position.z = 0.03;
    sign.add(textPlane);

    // Back face
    const textPlaneBack = textPlane.clone();
    textPlaneBack.rotation.y = Math.PI;
    textPlaneBack.position.z = -0.03;
    sign.add(textPlaneBack);

    return sign;
  }

  // --- Cubicle (simplified, no random options) ---

  private createCubicle(): THREE.Group {
    const cubicle = new THREE.Group();
    const partitionMaterial = new THREE.MeshStandardMaterial({ color: 0x718096, roughness: 0.8 });

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(3, this.CUBICLE_HEIGHT, 0.1),
      partitionMaterial
    );
    backWall.position.set(0, this.CUBICLE_HEIGHT / 2, -1.5);
    backWall.castShadow = true;
    cubicle.add(backWall);

    // Side wall
    const sideWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, this.CUBICLE_HEIGHT, 3),
      partitionMaterial
    );
    sideWall.position.set(-1.5, this.CUBICLE_HEIGHT / 2, 0);
    sideWall.castShadow = true;
    cubicle.add(sideWall);

    // Desk
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.6 });
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 1), deskMat);
    desk.position.set(0, 0.75, -0.8);
    cubicle.add(desk);

    // Monitor
    const monitor = this.createMonitor();
    monitor.position.set(0, 0.75, -1.1);
    cubicle.add(monitor);

    // Chair
    const chair = this.createChair();
    chair.position.set(0, 0, 0.3);
    cubicle.add(chair);

    return cubicle;
  }

  private createMonitor(): THREE.Group {
    const monitor = new THREE.Group();
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.4, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x2d3748 })
    );
    screen.position.y = 0.3;
    monitor.add(screen);

    const screenFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.35),
      new THREE.MeshStandardMaterial({
        color: 0x3182ce,
        emissive: 0x3182ce,
        emissiveIntensity: 0.3,
      })
    );
    screenFace.position.set(0, 0.3, 0.02);
    monitor.add(screenFace);

    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.15, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 })
    );
    stand.position.y = 0.075;
    monitor.add(stand);

    return monitor;
  }

  private createChair(): THREE.Group {
    const chair = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a202c });

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), mat);
    seat.position.y = 0.5;
    chair.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.08), mat);
    back.position.set(0, 0.8, 0.2);
    chair.add(back);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 })
    );
    base.position.y = 0.2;
    chair.add(base);

    return chair;
  }

  // --- Department artifacts ---

  private createArtifact(deptId: string): THREE.Group {
    switch (deptId) {
      case 'engineering': return this.createGear();
      case 'product': return this.createRoadmapBoard();
      case 'oocto': return this.createTrophy();
      case 'it': return this.createServerRack();
      case 'gtm': return this.createMegaphone();
      case 'support': return this.createHeadset();
      case 'people': return this.createHeart();
      case 'revops': return this.createDashboardChart();
      case 'delivery': return this.createShippingBoxes();
      case 'vc': return this.createMoneyBags();
      case 'cancun': return this.createBeachArtifact();
      default: return new THREE.Group();
    }
  }

  /** Engineering: Large spinning golden gear */
  private createGear(): THREE.Group {
    const gear = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.2,
    });

    // Outer ring
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.15, 8, 32), goldMat);
    outerRing.position.y = 1.2;
    outerRing.rotation.x = Math.PI / 2;
    gear.add(outerRing);

    // Inner hub
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 16), goldMat);
    hub.position.y = 1.2;
    gear.add(hub);

    // Spokes
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.55), goldMat);
      spoke.position.set(Math.cos(angle) * 0.5, 1.2, Math.sin(angle) * 0.5);
      spoke.rotation.y = -angle;
      gear.add(spoke);
    }

    // Teeth around the outside
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.15), goldMat);
      tooth.position.set(Math.cos(angle) * 0.95, 1.2, Math.sin(angle) * 0.95);
      tooth.rotation.y = -angle;
      gear.add(tooth);
    }

    this.animatedObjects.push({ mesh: gear, type: 'spin' });
    return gear;
  }

  /** Product: Whiteboard with colored sticky notes */
  private createRoadmapBoard(): THREE.Group {
    const board = new THREE.Group();

    // Whiteboard
    const wb = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.2, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xf7fafc })
    );
    wb.position.y = 1.5;
    board.add(wb);

    // Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a5568 });
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.1), frameMat);
    frameTop.position.set(0, 2.1, 0);
    board.add(frameTop);
    const frameBot = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.1), frameMat);
    frameBot.position.set(0, 0.9, 0);
    board.add(frameBot);

    // Stand legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x718096 });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.5, 0.05), legMat);
    leftLeg.position.set(-0.8, 0.75, 0);
    board.add(leftLeg);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.5, 0.05), legMat);
    rightLeg.position.set(0.8, 0.75, 0);
    board.add(rightLeg);

    // Sticky notes in columns
    const colors = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xee6ff8];
    const columns = 3;
    const rows = 3;
    for (let c = 0; c < columns; c++) {
      for (let r = 0; r < rows; r++) {
        const note = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.2, 0.02),
          new THREE.MeshStandardMaterial({ color: colors[(c + r) % colors.length] })
        );
        note.position.set(-0.5 + c * 0.5, 1.2 + r * 0.28, 0.05);
        board.add(note);
      }
    }

    return board;
  }

  /** OoCTO: Golden trophy on a pedestal */
  private createTrophy(): THREE.Group {
    const trophy = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.2,
    });

    // Pedestal base
    const pedestalBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.2, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.4 })
    );
    pedestalBase.position.y = 0.1;
    trophy.add(pedestalBase);

    // Pedestal column
    const pedestalCol = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.4 })
    );
    pedestalCol.position.y = 0.5;
    trophy.add(pedestalCol);

    // Cup base
    const cupBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.15, 16), goldMat);
    cupBase.position.y = 0.9;
    trophy.add(cupBase);

    // Cup body (wider top)
    const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.5, 16), goldMat);
    cupBody.position.y = 1.25;
    trophy.add(cupBody);

    // Handles
    for (const side of [-1, 1]) {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 8, 16), goldMat);
      handle.position.set(side * 0.38, 1.2, 0);
      handle.rotation.y = Math.PI / 2;
      trophy.add(handle);
    }

    // Star on top
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.3,
      })
    );
    star.position.y = 1.65;
    trophy.add(star);

    return trophy;
  }

  /** IT: Server rack with blinking LEDs */
  private createServerRack(): THREE.Group {
    const rack = new THREE.Group();
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.5, roughness: 0.3 });

    // Main rack body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.0, 0.6), blackMat);
    body.position.y = 1.0;
    rack.add(body);

    // Server blades (horizontal lines)
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x2d3748 });
    for (let i = 0; i < 6; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.02), bladeMat);
      blade.position.set(0, 0.3 + i * 0.3, 0.31);
      rack.add(blade);

      // LED lights (green and amber)
      for (let j = 0; j < 3; j++) {
        const ledColor = j === 1 ? 0xffa500 : 0x4ade80;
        const led = new THREE.Mesh(
          new THREE.SphereGeometry(0.02, 6, 6),
          new THREE.MeshStandardMaterial({
            color: ledColor,
            emissive: ledColor,
            emissiveIntensity: 0.8,
          })
        );
        led.position.set(-0.2 + j * 0.15, 0.3 + i * 0.3, 0.33);
        rack.add(led);
        this.animatedObjects.push({ mesh: led, type: 'blink' });
      }
    }

    return rack;
  }

  /** GTM: Megaphone on pedestal */
  private createMegaphone(): THREE.Group {
    const mega = new THREE.Group();
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.4 });

    // Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.35, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 })
    );
    pedestal.position.y = 0.3;
    mega.add(pedestal);

    // Megaphone cone (narrower end → wider bell)
    const cone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.12, 1.2, 16),
      orangeMat
    );
    cone.position.set(0, 1.2, 0);
    cone.rotation.z = Math.PI / 6;
    mega.add(cone);

    // Handle
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x2d3748 })
    );
    handle.position.set(-0.15, 0.85, 0);
    handle.rotation.z = Math.PI / 6;
    mega.add(handle);

    // Speaker grill (at bell end)
    const grill = new THREE.Mesh(
      new THREE.CircleGeometry(0.45, 16),
      new THREE.MeshStandardMaterial({ color: 0x2d3748, side: THREE.DoubleSide })
    );
    grill.position.set(0.35, 1.55, 0);
    grill.rotation.z = Math.PI / 6;
    grill.rotation.y = Math.PI / 2;
    mega.add(grill);

    return mega;
  }

  /** Support: Giant headset on a stand */
  private createHeadset(): THREE.Group {
    const headset = new THREE.Group();
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.4 });
    const padMat = new THREE.MeshStandardMaterial({ color: 0x4a5568 });

    // Stand pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), darkMat);
    pole.position.y = 0.75;
    headset.add(pole);

    // Stand base
    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.1, 16), darkMat);
    standBase.position.y = 0.05;
    headset.add(standBase);

    // Headband (arc)
    const headband = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.06, 8, 24, Math.PI),
      darkMat
    );
    headband.position.y = 1.7;
    headband.rotation.z = Math.PI;
    headset.add(headband);

    // Left earpiece
    const leftEar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16), padMat);
    leftEar.position.set(-0.45, 1.7, 0);
    leftEar.rotation.z = Math.PI / 2;
    headset.add(leftEar);

    // Right earpiece
    const rightEar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16), padMat);
    rightEar.position.set(0.45, 1.7, 0);
    rightEar.rotation.z = Math.PI / 2;
    headset.add(rightEar);

    // Microphone boom
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), darkMat);
    boom.position.set(-0.45, 1.45, 0.15);
    boom.rotation.x = Math.PI / 6;
    headset.add(boom);

    // Mic tip
    const micTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e })
    );
    micTip.position.set(-0.45, 1.2, 0.3);
    headset.add(micTip);

    return headset;
  }

  /** People: Red heart sculpture on pedestal */
  private createHeart(): THREE.Group {
    const heart = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xe53e3e,
      roughness: 0.3,
      metalness: 0.1,
    });

    // Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.35, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 })
    );
    pedestal.position.y = 0.3;
    heart.add(pedestal);

    // Heart shape from spheres + cone
    const leftLobe = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), redMat);
    leftLobe.position.set(-0.22, 1.4, 0);
    heart.add(leftLobe);

    const rightLobe = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), redMat);
    rightLobe.position.set(0.22, 1.4, 0);
    heart.add(rightLobe);

    // Bottom point
    const bottom = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.6, 16),
      redMat
    );
    bottom.position.set(0, 0.95, 0);
    bottom.rotation.z = Math.PI;
    heart.add(bottom);

    return heart;
  }

  /** Revenue Ops: Standing monitor with bar chart */
  private createDashboardChart(): THREE.Group {
    const dashboard = new THREE.Group();

    // Monitor frame
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.0, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x2d3748 })
    );
    frame.position.y = 1.4;
    dashboard.add(frame);

    // Screen
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.8),
      new THREE.MeshStandardMaterial({
        color: 0x1a202c,
        emissive: 0x1a202c,
        emissiveIntensity: 0.2,
      })
    );
    screen.position.set(0, 1.4, 0.05);
    dashboard.add(screen);

    // Bar chart bars (ascending for "growth")
    const barColors = [0x38a169, 0x48bb78, 0x68d391, 0x4ade80, 0x22c55e];
    const barHeights = [0.2, 0.35, 0.3, 0.5, 0.65];
    for (let i = 0; i < 5; i++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, barHeights[i], 0.02),
        new THREE.MeshStandardMaterial({
          color: barColors[i],
          emissive: barColors[i],
          emissiveIntensity: 0.3,
        })
      );
      bar.position.set(-0.4 + i * 0.2, 1.1 + barHeights[i] / 2, 0.06);
      dashboard.add(bar);
    }

    // Stand
    const standPole = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.9, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 })
    );
    standPole.position.y = 0.45;
    dashboard.add(standPole);

    // Base
    const standBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.05, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 })
    );
    standBase.position.y = 0.025;
    dashboard.add(standBase);

    return dashboard;
  }

  /** Delivery: Brown shipping boxes stacked */
  private createShippingBoxes(): THREE.Group {
    const boxes = new THREE.Group();
    const brownMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.8 });
    const tapeMat = new THREE.MeshStandardMaterial({ color: 0xd4a843 });

    // Bottom large box
    const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), brownMat);
    box1.position.y = 0.25;
    boxes.add(box1);
    // Tape stripe
    const tape1 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.06, 0.02), tapeMat);
    tape1.position.set(0, 0.5, 0.31);
    boxes.add(tape1);

    // Middle box (offset)
    const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), brownMat);
    box2.position.set(0.1, 0.7, 0);
    boxes.add(box2);
    const tape2 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.02), tapeMat);
    tape2.position.set(0.1, 0.9, 0.26);
    boxes.add(tape2);

    // Top box (open — slightly smaller, rotated)
    const box3 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.4), brownMat);
    box3.position.set(-0.1, 1.1, 0.05);
    box3.rotation.y = 0.2;
    boxes.add(box3);

    // Open flap (one side up)
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.2), brownMat);
    flap.position.set(-0.1, 1.29, -0.05);
    flap.rotation.x = -0.6;
    boxes.add(flap);

    // Packing peanuts (small white blobs)
    const peanutMat = new THREE.MeshStandardMaterial({ color: 0xfaf3e8 });
    for (let i = 0; i < 6; i++) {
      const peanut = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), peanutMat);
      peanut.position.set(
        -0.1 + (Math.random() - 0.5) * 0.3,
        1.3 + Math.random() * 0.05,
        0.05 + (Math.random() - 0.5) * 0.2
      );
      peanut.scale.set(1, 0.6, 1);
      boxes.add(peanut);
    }

    return boxes;
  }

  /** VC: Piles of money bags and cash */
  private createMoneyBags(): THREE.Group {
    const money = new THREE.Group();
    const bagMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.9 });
    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      emissive: 0x2ecc71,
      emissiveIntensity: 0.15,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.7,
      roughness: 0.2,
    });

    // Money bags (burlap sack shapes)
    const bagPositions = [
      { x: 0, z: 0, scale: 1.0 },
      { x: -0.5, z: 0.4, scale: 0.85 },
      { x: 0.5, z: 0.3, scale: 0.9 },
      { x: 0, z: -0.4, scale: 0.8 },
    ];
    for (const bp of bagPositions) {
      const bag = new THREE.Group();

      // Sack body
      const sack = new THREE.Mesh(
        new THREE.SphereGeometry(0.3 * bp.scale, 12, 12),
        bagMat
      );
      sack.scale.set(1, 1.2, 0.9);
      sack.position.y = 0.3 * bp.scale;
      bag.add(sack);

      // Tied top
      const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05 * bp.scale, 0.12 * bp.scale, 0.15 * bp.scale, 8),
        bagMat
      );
      top.position.y = 0.6 * bp.scale;
      bag.add(top);

      // Dollar sign (green circle with $)
      const dollarSign = new THREE.Mesh(
        new THREE.CircleGeometry(0.12 * bp.scale, 16),
        greenMat
      );
      dollarSign.position.set(0, 0.3 * bp.scale, 0.28 * bp.scale);
      bag.add(dollarSign);

      bag.position.set(bp.x, 0, bp.z);
      money.add(bag);
    }

    // Scattered gold coins
    for (let i = 0; i < 12; i++) {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.015, 12),
        goldMat
      );
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.4 + Math.random() * 0.6;
      coin.position.set(
        Math.cos(angle) * dist,
        0.01 + Math.random() * 0.03,
        Math.sin(angle) * dist
      );
      coin.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      coin.rotation.z = Math.random() * Math.PI;
      money.add(coin);
    }

    // Stacks of bills
    const billMat = new THREE.MeshStandardMaterial({ color: 0x85bb65 });
    const stackPositions = [
      { x: -0.6, z: -0.3 },
      { x: 0.65, z: -0.2 },
      { x: 0.2, z: 0.6 },
    ];
    for (const sp of stackPositions) {
      for (let j = 0; j < 4; j++) {
        const bill = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.02, 0.1),
          billMat
        );
        bill.position.set(sp.x, 0.01 + j * 0.025, sp.z);
        bill.rotation.y = (Math.random() - 0.5) * 0.3;
        money.add(bill);
      }
    }

    return money;
  }

  /** Cancún: Beach ball + surfboard on sand */
  private createBeachArtifact(): THREE.Group {
    const artifact = new THREE.Group();

    // Surfboard (standing upright, leaning)
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x00bcd4, roughness: 0.3 });
    const board = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.2, 1.6, 8, 16),
      boardMat
    );
    board.scale.set(1, 1, 0.15);
    board.position.set(0.5, 1.0, 0);
    board.rotation.z = 0.2;
    artifact.add(board);

    // Surfboard racing stripe
    const stripe = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.06, 1.4, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0xff6347 })
    );
    stripe.scale.set(1, 1, 0.3);
    stripe.position.set(0.5, 1.0, 0.04);
    stripe.rotation.z = 0.2;
    artifact.add(stripe);

    // Beach ball
    const ballGroup = new THREE.Group();
    const ballRadius = 0.35;
    const ballBase = new THREE.Mesh(
      new THREE.SphereGeometry(ballRadius, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    ballGroup.add(ballBase);

    // Colored stripes on ball (wedge overlays)
    const ballColors = [0xff4444, 0xffdd44, 0x4488ff, 0xff4444, 0xffdd44, 0x4488ff];
    for (let i = 0; i < 6; i++) {
      const wedge = new THREE.Mesh(
        new THREE.SphereGeometry(ballRadius + 0.005, 16, 16,
          (i / 6) * Math.PI * 2, Math.PI / 6),
        new THREE.MeshStandardMaterial({ color: ballColors[i] })
      );
      ballGroup.add(wedge);
    }

    ballGroup.position.set(-0.4, ballRadius + 0.05, 0.2);
    this.animatedObjects.push({ mesh: ballGroup, type: 'bobble' });
    artifact.add(ballGroup);

    // Flip-flops
    const flopMat = new THREE.MeshStandardMaterial({ color: 0xff69b4 });
    for (const side of [-0.12, 0.12]) {
      const sole = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.02, 0.2),
        flopMat
      );
      sole.position.set(side, 0.01, 0.5);
      sole.rotation.y = side > 0 ? 0.15 : -0.15;
      artifact.add(sole);
    }

    return artifact;
  }

  // --- Animation update (called from Game) ---

  public update(time: number): void {
    for (const obj of this.animatedObjects) {
      if (obj.type === 'spin') {
        // Rotate the entire gear group
        obj.mesh.rotation.y = time * 0.5;
      } else if (obj.type === 'blink') {
        // Blink LEDs using emissive intensity
        const mat = (obj.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = Math.random() > 0.3 ? 0.8 : 0.1;
      } else if (obj.type === 'bobble') {
        // Gentle floating bobble
        obj.mesh.position.y = 0.4 + Math.sin(time * 2) * 0.08;
        obj.mesh.rotation.y = time * 0.3;
      }
    }
  }

  public getColliders(): THREE.Box3[] {
    return this.colliders;
  }

  public getDepartments(): Department[] {
    return [...DEPARTMENTS];
  }
}
