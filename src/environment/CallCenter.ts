import * as THREE from 'three';

export interface Department {
  id: string;
  name: string;
  position: THREE.Vector3;
  artifactColor: number;
  missionDescription?: string;
}

const DEPARTMENTS: Department[] = [
  // ── North wing ──
  { id: 'legal', name: 'Legal', position: new THREE.Vector3(-40, 0, -45), artifactColor: 0x6b7280, missionDescription: 'Mitigate all outstanding liability vectors' },
  { id: 'engineering', name: 'Engineering', position: new THREE.Vector3(-13, 0, -45), artifactColor: 0xffd700, missionDescription: 'Accelerate the velocity of innovation' },
  { id: 'product', name: 'Product', position: new THREE.Vector3(13, 0, -45), artifactColor: 0x3182ce, missionDescription: 'Align the roadmap with customer value streams' },
  { id: 'oocto', name: 'Office of the CTO', position: new THREE.Vector3(40, 0, -45), artifactColor: 0xffd700, missionDescription: 'Synergize the technical vision' },

  // ── Upper middle ──
  { id: 'security', name: 'Security', position: new THREE.Vector3(-40, 0, -20), artifactColor: 0xdc2626, missionDescription: 'Harden the zero-trust perimeter' },
  { id: 'data', name: 'Data Science', position: new THREE.Vector3(-13, 0, -20), artifactColor: 0x7c3aed, missionDescription: 'Leverage predictive analytics for actionable insights' },
  { id: 'warroom', name: 'The War Room', position: new THREE.Vector3(13, 0, -20), artifactColor: 0xb91c1c, missionDescription: 'Facilitate cross-functional strategic alignment' },
  { id: 'executive', name: 'Executive Suite', position: new THREE.Vector3(40, 0, -20), artifactColor: 0x1e3a5f, missionDescription: 'Interface with C-suite stakeholders' },

  // ── Center row ──
  { id: 'it', name: 'IT', position: new THREE.Vector3(-40, 0, 5), artifactColor: 0x2d3748, missionDescription: 'Optimize the digital infrastructure paradigm' },
  { id: 'breakroom', name: 'Break Room', position: new THREE.Vector3(0, 0, -5), artifactColor: 0xf59e0b, missionDescription: 'Recharge your human capital batteries' },
  // center (0,0,10) is spawn atrium
  { id: 'gtm', name: 'Go To Market', position: new THREE.Vector3(40, 0, 5), artifactColor: 0xff6b35, missionDescription: 'Maximize pipeline conversion velocity' },

  // ── Lower middle ──
  { id: 'marketing', name: 'Marketing', position: new THREE.Vector3(-40, 0, 30), artifactColor: 0xe91e63, missionDescription: 'Amplify brand awareness touchpoints' },
  { id: 'delivery', name: 'Delivery', position: new THREE.Vector3(-13, 0, 30), artifactColor: 0x8b6914, missionDescription: 'Ship value to stakeholders on cadence' },
  { id: 'people', name: 'People', position: new THREE.Vector3(13, 0, 30), artifactColor: 0xe53e3e, missionDescription: 'Foster cross-functional talent synergies' },
  { id: 'revops', name: 'Revenue Ops', position: new THREE.Vector3(40, 0, 30), artifactColor: 0x38a169, missionDescription: 'Operationalize the revenue flywheel' },

  // ── South wing ──
  { id: 'support', name: 'Support', position: new THREE.Vector3(-25, 0, 50), artifactColor: 0x718096, missionDescription: 'Deliver proactive customer success outcomes' },
  { id: 'finance', name: 'Finance', position: new THREE.Vector3(25, 0, 50), artifactColor: 0x059669, missionDescription: 'Optimize the burn rate to runway ratio' },

  // ── Outside areas ──
  { id: 'vc', name: 'Venture Capital', position: new THREE.Vector3(0, 0, -75), artifactColor: 0x2ecc71, missionDescription: 'Secure the next funding tranche' },
  { id: 'cancun', name: 'Cancún', position: new THREE.Vector3(0, 0, 135), artifactColor: 0x00bcd4, missionDescription: '¡Viva Los Replicantes!' },
  { id: 'parking', name: 'Parking Garage', position: new THREE.Vector3(82, 0, 0), artifactColor: 0x6b7280, missionDescription: 'Optimize the organizational mobility fleet' },
  { id: 'serverfarm', name: 'Server Farm', position: new THREE.Vector3(115, 0, 0), artifactColor: 0x22d3ee, missionDescription: 'Ensure five nines of uptime availability' },
  { id: 'graveyard', name: 'Startup Graveyard', position: new THREE.Vector3(-82, 0, 0), artifactColor: 0x6b21a8, missionDescription: 'Pay respects to disrupted business models' },
  { id: 'foodtrucks', name: 'Food Truck Court', position: new THREE.Vector3(-82, 0, 30), artifactColor: 0xf97316, missionDescription: 'Refuel the human capital engine' },
  { id: 'helipad', name: 'Executive Helipad', position: new THREE.Vector3(0, 0, -105), artifactColor: 0x0ea5e9, missionDescription: 'Secure the golden parachute extraction' },
];

export class CallCenter {
  public group: THREE.Group;
  public colliders: THREE.Box3[] = [];

  private readonly FLOOR_SIZE = 120;
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
    ceiling.position.y = 6;
    this.group.add(ceiling);

    const lightPanelGeometry = new THREE.PlaneGeometry(2, 4);
    const lightPanelMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
    });
    for (let x = -50; x <= 50; x += 10) {
      for (let z = -50; z <= 50; z += 10) {
        const lightPanel = new THREE.Mesh(lightPanelGeometry, lightPanelMaterial);
        lightPanel.rotation.x = Math.PI / 2;
        lightPanel.position.set(x, 5.98, z);
        this.group.add(lightPanel);
      }
    }
  }

  private createWalls(): void {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });
    const halfSize = this.FLOOR_SIZE / 2;
    const wallHeight = 6;
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

    // East wall — split with doorway to Parking Garage
    const eastSegmentLength = (this.FLOOR_SIZE - doorWidth) / 2;

    const eastTop = this.createWall(eastSegmentLength, wallHeight, wallMaterial);
    eastTop.position.set(halfSize, wallHeight / 2, -(eastSegmentLength / 2 + doorWidth / 2));
    eastTop.rotation.y = -Math.PI / 2;
    this.group.add(eastTop);

    const eastBottom = this.createWall(eastSegmentLength, wallHeight, wallMaterial);
    eastBottom.position.set(halfSize, wallHeight / 2, eastSegmentLength / 2 + doorWidth / 2);
    eastBottom.rotation.y = -Math.PI / 2;
    this.group.add(eastBottom);

    const eastLintel = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, doorWidth + 0.4),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 })
    );
    eastLintel.position.set(halfSize, wallHeight, 0);
    this.group.add(eastLintel);

    const eastExitSign = this.createExitSign();
    eastExitSign.position.set(halfSize - 0.2, wallHeight - 0.5, 0);
    eastExitSign.rotation.y = -Math.PI / 2;
    this.group.add(eastExitSign);

    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(halfSize, wallHeight / 2, -(eastSegmentLength / 2 + doorWidth / 2)),
      new THREE.Vector3(0.5, wallHeight, eastSegmentLength)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(halfSize, wallHeight / 2, eastSegmentLength / 2 + doorWidth / 2),
      new THREE.Vector3(0.5, wallHeight, eastSegmentLength)
    ));

    // West wall — split with doorway to Startup Graveyard
    const westSegmentLength = (this.FLOOR_SIZE - doorWidth) / 2;

    const westTop = this.createWall(westSegmentLength, wallHeight, wallMaterial);
    westTop.position.set(-halfSize, wallHeight / 2, -(westSegmentLength / 2 + doorWidth / 2));
    westTop.rotation.y = Math.PI / 2;
    this.group.add(westTop);

    const westBottom = this.createWall(westSegmentLength, wallHeight, wallMaterial);
    westBottom.position.set(-halfSize, wallHeight / 2, westSegmentLength / 2 + doorWidth / 2);
    westBottom.rotation.y = Math.PI / 2;
    this.group.add(westBottom);

    const westLintel = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, doorWidth + 0.4),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 })
    );
    westLintel.position.set(-halfSize, wallHeight, 0);
    this.group.add(westLintel);

    const westExitSign = this.createExitSign();
    westExitSign.position.set(-halfSize + 0.2, wallHeight - 0.5, 0);
    westExitSign.rotation.y = Math.PI / 2;
    this.group.add(westExitSign);

    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(-halfSize, wallHeight / 2, -(westSegmentLength / 2 + doorWidth / 2)),
      new THREE.Vector3(0.5, wallHeight, westSegmentLength)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(-halfSize, wallHeight / 2, westSegmentLength / 2 + doorWidth / 2),
      new THREE.Vector3(0.5, wallHeight, westSegmentLength)
    ));

    // --- Outdoor areas ---
    this.createVCPatio();
    this.createCancunBeach();
    this.createParkingGarage();
    this.createServerFarm();
    this.createStartupGraveyard();
    this.createFoodTruckCourt();
    this.createHelipad();
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

    // Back fence — split with gap for path to helipad
    const fenceGap = 6;
    const fenceSegW = (patioWidth - fenceGap) / 2;

    const backFenceL = new THREE.Mesh(
      new THREE.BoxGeometry(fenceSegW, fenceHeight, 0.15), fenceMat
    );
    backFenceL.position.set(-(fenceSegW / 2 + fenceGap / 2), fenceHeight / 2, -halfSize - patioDepth);
    this.group.add(backFenceL);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      backFenceL.position.clone(), new THREE.Vector3(fenceSegW, fenceHeight, 0.5)
    ));

    const backFenceR = new THREE.Mesh(
      new THREE.BoxGeometry(fenceSegW, fenceHeight, 0.15), fenceMat
    );
    backFenceR.position.set(fenceSegW / 2 + fenceGap / 2, fenceHeight / 2, -halfSize - patioDepth);
    this.group.add(backFenceR);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      backFenceR.position.clone(), new THREE.Vector3(fenceSegW, fenceHeight, 0.5)
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
    const wallHeight = 6;
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

  // ===== NEW OUTDOOR AREAS =====

  /** East exit → Parking Garage — concrete structure with cars and pillars */
  private createParkingGarage(): void {
    const halfSize = this.FLOOR_SIZE / 2;
    const garageWidth = 30;
    const garageDepth = 20;
    const startX = halfSize;

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.95 });
    const darkConcrete = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(garageWidth, garageDepth), concreteMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(startX + garageWidth / 2, 0.005, 0);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Walkway connecting door to garage
    const walk = new THREE.Mesh(
      new THREE.PlaneGeometry(garageWidth, 6),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 })
    );
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(startX + garageWidth / 2, 0.008, 0);
    this.group.add(walk);

    // Ceiling slab (partial roof — covered parking feel)
    const roof = new THREE.Mesh(
      new THREE.PlaneGeometry(garageWidth, garageDepth), darkConcrete
    );
    roof.rotation.x = Math.PI / 2;
    roof.position.set(startX + garageWidth / 2, 4, 0);
    this.group.add(roof);

    // Support pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 });
    const pillarPositions = [
      { x: startX + 8, z: -6 }, { x: startX + 8, z: 6 },
      { x: startX + 18, z: -6 }, { x: startX + 18, z: 6 },
      { x: startX + 28, z: -6 }, { x: startX + 28, z: 6 },
    ];
    for (const pp of pillarPositions) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4, 0.6), pillarMat);
      pillar.position.set(pp.x, 2, pp.z);
      pillar.castShadow = true;
      this.group.add(pillar);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(pp.x, 2, pp.z), new THREE.Vector3(0.6, 4, 0.6)
      ));
    }

    // Parking stripe lines
    for (let z = -8; z <= 8; z += 4) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 3), stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(startX + 12, 0.01, z);
      this.group.add(stripe);
      const stripe2 = stripe.clone();
      stripe2.position.set(startX + 22, 0.01, z);
      this.group.add(stripe2);
    }

    // Parked cars (simple box cars)
    const carConfigs = [
      { x: startX + 12, z: -6, color: 0x1e40af },
      { x: startX + 12, z: 2, color: 0xdc2626 },
      { x: startX + 22, z: -2, color: 0x374151 },
      { x: startX + 22, z: 6, color: 0xf5f5f5 },
      { x: startX + 26, z: -6, color: 0x16a34a },
    ];
    for (const cc of carConfigs) {
      const car = this.createCar(cc.color);
      car.position.set(cc.x, 0, cc.z);
      this.group.add(car);
    }

    // Flickering fluorescent lights under the roof
    const flickerLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4,
    });
    for (let x = startX + 7; x < startX + garageWidth; x += 10) {
      const light = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.3), flickerLightMat);
      light.rotation.x = Math.PI / 2;
      light.position.set(x, 3.98, 0);
      this.group.add(light);
      this.animatedObjects.push({ mesh: light, type: 'blink' });
    }

    // Boundary walls
    const wallH = 3;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });

    // Back wall (east end)
    const backW = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallH, garageDepth), wallMat);
    backW.position.set(startX + garageWidth, wallH / 2, 0);
    this.group.add(backW);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      backW.position.clone(), new THREE.Vector3(0.5, wallH, garageDepth)
    ));

    // Side walls
    for (const side of [-1, 1]) {
      const sideW = new THREE.Mesh(new THREE.BoxGeometry(garageWidth, wallH, 0.3), wallMat);
      sideW.position.set(startX + garageWidth / 2, wallH / 2, side * garageDepth / 2);
      this.group.add(sideW);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        sideW.position.clone(), new THREE.Vector3(garageWidth, wallH, 0.5)
      ));
    }
  }

  /** Simple blocky car */
  private createCar(color: number): THREE.Group {
    const car = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 1.0), bodyMat);
    body.position.y = 0.5;
    car.add(body);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 0.9), glassMat);
    cabin.position.set(-0.1, 0.95, 0);
    car.add(cabin);

    // Wheels
    for (const xOff of [-0.6, 0.6]) {
      for (const zOff of [-0.45, 0.45]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 8), wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(xOff, 0.18, zOff);
        car.add(wheel);
      }
    }

    // Headlights
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffff88, emissive: 0xffff44, emissiveIntensity: 0.3 });
    for (const z of [-0.35, 0.35]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.15), lightMat);
      hl.position.set(0.92, 0.45, z);
      car.add(hl);
    }

    return car;
  }

  /** East beyond parking → Server Farm — outdoor server containers and cooling units */
  private createServerFarm(): void {
    const startX = this.FLOOR_SIZE / 2 + 30; // after parking garage
    const farmWidth = 25;
    const farmDepth = 20;

    // Gravel floor
    const gravel = new THREE.Mesh(
      new THREE.PlaneGeometry(farmWidth, farmDepth),
      new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 1.0 })
    );
    gravel.rotation.x = -Math.PI / 2;
    gravel.position.set(startX + farmWidth / 2, 0.005, 0);
    gravel.receiveShadow = true;
    this.group.add(gravel);

    // Walkway from parking garage
    const walkway = new THREE.Mesh(
      new THREE.PlaneGeometry(farmWidth, 4),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 })
    );
    walkway.rotation.x = -Math.PI / 2;
    walkway.position.set(startX + farmWidth / 2, 0.008, 0);
    this.group.add(walkway);

    // Server container units (big metal boxes)
    const containerMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.4, roughness: 0.5 });
    const containerPositions = [
      { x: startX + 6, z: -6 }, { x: startX + 6, z: 6 },
      { x: startX + 16, z: -6 }, { x: startX + 16, z: 6 },
    ];
    for (const cp of containerPositions) {
      const container = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 3), containerMat);
      container.position.set(cp.x, 1.5, cp.z);
      container.castShadow = true;
      this.group.add(container);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(cp.x, 1.5, cp.z), new THREE.Vector3(4, 3, 3)
      ));

      // Blinking LEDs on container face
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 5; col++) {
          const ledColor = Math.random() > 0.3 ? 0x4ade80 : 0xff6b6b;
          const led = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 4, 4),
            new THREE.MeshStandardMaterial({ color: ledColor, emissive: ledColor, emissiveIntensity: 0.8 })
          );
          led.position.set(cp.x - 1.5 + col * 0.6, 0.8 + row * 0.5, cp.z > 0 ? cp.z - 1.52 : cp.z + 1.52);
          this.group.add(led);
          this.animatedObjects.push({ mesh: led, type: 'blink' });
        }
      }

      // Cooling unit on top
      const fan = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: 0x9ca3af })
      );
      fan.position.set(cp.x, 3.15, cp.z);
      this.group.add(fan);
    }

    // Chain-link fence boundary
    const fenceH = 2.5;
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, wireframe: true });

    const backFence = new THREE.Mesh(new THREE.PlaneGeometry(farmWidth, fenceH), fenceMat);
    backFence.position.set(startX + farmWidth, fenceH / 2, 0);
    backFence.rotation.y = -Math.PI / 2;
    this.group.add(backFence);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(startX + farmWidth, fenceH / 2, 0), new THREE.Vector3(0.3, fenceH, farmDepth)
    ));

    for (const side of [-1, 1]) {
      const sideFence = new THREE.Mesh(new THREE.PlaneGeometry(farmWidth, fenceH), fenceMat);
      sideFence.position.set(startX + farmWidth / 2, fenceH / 2, side * farmDepth / 2);
      this.group.add(sideFence);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(startX + farmWidth / 2, fenceH / 2, side * farmDepth / 2),
        new THREE.Vector3(farmWidth, fenceH, 0.3)
      ));
    }

    // "DANGER: HIGH VOLTAGE" sign
    const dangerSign = this.createTextSign('DANGER: HIGH VOLTAGE', 0xfbbf24, 0x1a1a1a);
    dangerSign.position.set(startX + farmWidth - 0.5, 2.5, 0);
    dangerSign.rotation.y = -Math.PI / 2;
    this.group.add(dangerSign);
  }

  /** West exit → Startup Graveyard — dark ground, tombstones with startup names */
  private createStartupGraveyard(): void {
    const halfSize = this.FLOOR_SIZE / 2;
    const graveyardWidth = 30;
    const graveyardDepth = 30;
    const startX = -(halfSize + graveyardWidth);

    // Dark grass floor
    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(graveyardWidth, graveyardDepth),
      new THREE.MeshStandardMaterial({ color: 0x2d4a2d, roughness: 1.0 })
    );
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(startX + graveyardWidth / 2, 0.005, 0);
    grass.receiveShadow = true;
    this.group.add(grass);

    // Fog-like ground plane (slightly translucent purple)
    const mist = new THREE.Mesh(
      new THREE.PlaneGeometry(graveyardWidth, graveyardDepth),
      new THREE.MeshStandardMaterial({
        color: 0x6b21a8, emissive: 0x6b21a8, emissiveIntensity: 0.1,
        transparent: true, opacity: 0.15,
      })
    );
    mist.rotation.x = -Math.PI / 2;
    mist.position.set(startX + graveyardWidth / 2, 0.1, 0);
    this.group.add(mist);

    // Tombstones with famous failed startup names
    const tombstones = [
      { name: 'Juicero', x: -8, z: -10 },
      { name: 'Theranos', x: 2, z: -8 },
      { name: 'Quibi', x: -12, z: -2 },
      { name: 'Pets.com', x: 5, z: -3 },
      { name: 'WeWork v1', x: -5, z: 4 },
      { name: 'Vine', x: 8, z: 5 },
      { name: 'Jawbone', x: -10, z: 10 },
      { name: 'Solyndra', x: 3, z: 10 },
      { name: 'Fyre Fest', x: -3, z: -12 },
      { name: 'Google+', x: 10, z: -6 },
      { name: 'Blockbuster', x: -7, z: 7 },
      { name: 'MySpace', x: 12, z: 0 },
    ];

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
    for (const ts of tombstones) {
      const stone = new THREE.Group();

      // Headstone
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.15), stoneMat);
      slab.position.y = 0.6;
      stone.add(slab);

      // Rounded top
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16, 1, false, 0, Math.PI), stoneMat);
      top.rotation.z = Math.PI / 2;
      top.rotation.y = Math.PI / 2;
      top.position.y = 1.2;
      stone.add(top);

      // Name text
      const nameSign = this.createTombstoneText(ts.name);
      nameSign.position.set(0, 0.7, 0.09);
      stone.add(nameSign);

      // RIP text
      const ripSign = this.createTombstoneText('R.I.P.');
      ripSign.position.set(0, 1.0, 0.09);
      stone.add(ripSign);

      // Random tilt for character
      stone.rotation.y = (Math.random() - 0.5) * 0.3;
      stone.rotation.z = (Math.random() - 0.5) * 0.08;

      stone.position.set(startX + graveyardWidth / 2 + ts.x, 0, ts.z);
      this.group.add(stone);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(startX + graveyardWidth / 2 + ts.x, 0.6, ts.z),
        new THREE.Vector3(0.8, 1.2, 0.5)
      ));
    }

    // Dead trees
    const deadTreeMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 1.0 });
    const treePositions = [
      { x: startX + 5, z: -12 },
      { x: startX + 25, z: 12 },
      { x: startX + 8, z: 8 },
    ];
    for (const tp of treePositions) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 4, 6), deadTreeMat);
      trunk.position.y = 2;
      tree.add(trunk);
      // Bare branches
      for (let i = 0; i < 5; i++) {
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 1.5, 4), deadTreeMat);
        branch.position.set(0, 2.5 + i * 0.3, 0);
        branch.rotation.z = (Math.random() - 0.5) * 1.5;
        branch.rotation.x = (Math.random() - 0.5) * 0.5;
        tree.add(branch);
      }
      tree.position.set(tp.x, 0, tp.z);
      this.group.add(tree);
    }

    // Wrought iron fence
    const fenceH = 1.5;
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5 });

    // Back fence
    const backFence = new THREE.Mesh(new THREE.BoxGeometry(0.15, fenceH, graveyardDepth), ironMat);
    backFence.position.set(startX, fenceH / 2, 0);
    this.group.add(backFence);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      backFence.position.clone(), new THREE.Vector3(0.5, fenceH, graveyardDepth)
    ));

    for (const side of [-1, 1]) {
      const sideFence = new THREE.Mesh(new THREE.BoxGeometry(graveyardWidth, fenceH, 0.15), ironMat);
      sideFence.position.set(startX + graveyardWidth / 2, fenceH / 2, side * graveyardDepth / 2);
      this.group.add(sideFence);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        sideFence.position.clone(), new THREE.Vector3(graveyardWidth, fenceH, 0.5)
      ));
    }

    // Iron fence posts (vertical bars)
    for (let z = -graveyardDepth / 2; z <= graveyardDepth / 2; z += 2) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, fenceH + 0.3, 0.05), ironMat);
      post.position.set(startX, fenceH / 2 + 0.15, z);
      this.group.add(post);
    }
  }

  /** Small tombstone text (using canvas texture) */
  private createTombstoneText(text: string): THREE.Mesh {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#d4d4d4';
    ctx.font = 'bold 28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.2),
      new THREE.MeshStandardMaterial({ map: texture, transparent: true })
    );
  }

  /** Southwest of graveyard → Food Truck Court */
  private createFoodTruckCourt(): void {
    const halfSize = this.FLOOR_SIZE / 2;
    const courtWidth = 20;
    const courtDepth = 18;
    const startX = -(halfSize);
    const startZ = 15;

    // Asphalt floor
    const asphalt = new THREE.Mesh(
      new THREE.PlaneGeometry(courtWidth, courtDepth),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.95 })
    );
    asphalt.rotation.x = -Math.PI / 2;
    asphalt.position.set(startX - courtWidth / 2, 0.005, startZ + courtDepth / 2);
    asphalt.receiveShadow = true;
    this.group.add(asphalt);

    // String lights above (festive feel)
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.5,
    });
    for (let i = 0; i < 8; i++) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), bulbMat);
      bulb.position.set(
        startX - courtWidth / 2 + (i / 7) * (courtWidth - 4) - (courtWidth / 2 - 2),
        3.5,
        startZ + courtDepth / 2
      );
      this.group.add(bulb);
    }

    // Food trucks (3 different ones)
    const truckConfigs = [
      { x: startX - 5, z: startZ + 5, color: 0xdc2626, rot: 0 },
      { x: startX - 15, z: startZ + 5, color: 0x2563eb, rot: 0 },
      { x: startX - 10, z: startZ + 14, color: 0x16a34a, rot: Math.PI },
    ];
    for (const tc of truckConfigs) {
      const truck = this.createFoodTruck(tc.color);
      truck.position.set(tc.x, 0, tc.z);
      truck.rotation.y = tc.rot;
      this.group.add(truck);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(tc.x, 1, tc.z), new THREE.Vector3(3.5, 2.5, 2)
      ));
    }

    // Picnic tables
    const tablePositions = [
      { x: startX - 7, z: startZ + 10 },
      { x: startX - 13, z: startZ + 10 },
    ];
    for (const tp of tablePositions) {
      const table = this.createPicnicTable();
      table.position.set(tp.x, 0, tp.z);
      this.group.add(table);
    }

    // Boundary bollards
    const bollardMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
    for (let x = startX - 2; x > startX - courtWidth; x -= 3) {
      for (const z of [startZ + 1, startZ + courtDepth - 1]) {
        const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), bollardMat);
        bollard.position.set(x, 0.4, z);
        this.group.add(bollard);
      }
    }
  }

  /** Simple blocky food truck */
  private createFoodTruck(color: number): THREE.Group {
    const truck = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d4, metalness: 0.3 });

    // Truck body
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 1.8), bodyMat);
    body.position.y = 1.3;
    truck.add(body);

    // Serving window
    const window = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    window.position.set(0, 1.6, 0.92);
    truck.add(window);

    // Window interior glow
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xfff3cd, emissive: 0xfff3cd, emissiveIntensity: 0.3 })
    );
    glow.position.set(0, 1.6, 0.9);
    truck.add(glow);

    // Awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.8), metalMat);
    awning.position.set(0, 2.1, 1.2);
    awning.rotation.x = -0.15;
    truck.add(awning);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    for (const xOff of [-1.0, 1.0]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.12, 8), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(xOff, 0.25, 0);
      truck.add(wheel);
    }

    return truck;
  }

  /** Picnic table */
  private createPicnicTable(): THREE.Group {
    const table = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.9 });

    // Table top
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.7), woodMat);
    top.position.y = 0.75;
    table.add(top);

    // Benches
    for (const zOff of [-0.5, 0.5]) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.3), woodMat);
      bench.position.set(0, 0.45, zOff);
      table.add(bench);
    }

    // Legs
    for (const x of [-0.6, 0.6]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 1.2), woodMat);
      leg.position.set(x, 0.375, 0);
      table.add(leg);
    }

    return table;
  }

  /** North beyond VC Patio → Executive Helipad */
  private createHelipad(): void {
    const halfSize = this.FLOOR_SIZE / 2;
    const vcPatioEnd = halfSize + 25; // VC patio back edge z = -85
    const pathLength = 20;
    const padSize = 20;

    // Walkway from VC patio gap to helipad
    const walkway = new THREE.Mesh(
      new THREE.PlaneGeometry(5, pathLength),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 })
    );
    walkway.rotation.x = -Math.PI / 2;
    walkway.position.set(0, 0.006, -(vcPatioEnd + pathLength / 2));
    walkway.receiveShadow = true;
    this.group.add(walkway);

    // Helipad floor (dark with markings)
    const padFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(padSize, padSize),
      new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.8 })
    );
    padFloor.rotation.x = -Math.PI / 2;
    padFloor.position.set(0, 0.005, -(vcPatioEnd + pathLength + padSize / 2));
    padFloor.receiveShadow = true;
    this.group.add(padFloor);

    const padCenterZ = -(vcPatioEnd + pathLength + padSize / 2);

    // Giant "H" marking
    const markMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
    // H vertical bars
    for (const x of [-2, 2]) {
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 6), markMat);
      bar.rotation.x = -Math.PI / 2;
      bar.position.set(x, 0.01, padCenterZ);
      this.group.add(bar);
    }
    // H crossbar
    const crossbar = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.8), markMat);
    crossbar.rotation.x = -Math.PI / 2;
    crossbar.position.set(0, 0.01, padCenterZ);
    this.group.add(crossbar);

    // Circle around the H
    const circle = new THREE.Mesh(
      new THREE.RingGeometry(4.5, 5, 32),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, side: THREE.DoubleSide })
    );
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(0, 0.012, padCenterZ);
    this.group.add(circle);

    // Corner warning lights
    const warningMat = new THREE.MeshStandardMaterial({
      color: 0xff4444, emissive: 0xff4444, emissiveIntensity: 0.6,
    });
    for (const x of [-padSize / 2 + 1, padSize / 2 - 1]) {
      for (const z of [padCenterZ - padSize / 2 + 1, padCenterZ + padSize / 2 - 1]) {
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), warningMat);
        light.position.set(x, 0.3, z);
        this.group.add(light);
        this.animatedObjects.push({ mesh: light, type: 'blink' });

        // Light pole
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6),
          new THREE.MeshStandardMaterial({ color: 0x6b7280 })
        );
        pole.position.set(x, 0.25, z);
        this.group.add(pole);
      }
    }

    // Parked helicopter
    const heli = this.createHelicopter();
    heli.position.set(0, 0, padCenterZ);
    this.group.add(heli);

    // Windsock pole
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
    const sockPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4, 6), poleMat);
    sockPole.position.set(padSize / 2 - 2, 2, padCenterZ - 4);
    this.group.add(sockPole);

    const sock = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xff6b35 })
    );
    sock.rotation.z = -Math.PI / 2;
    sock.position.set(padSize / 2 - 1.2, 3.8, padCenterZ - 4);
    this.group.add(sock);

    // Safety railing around pad
    const railMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.3 });
    const railH = 1.0;
    for (const side of [-1, 1]) {
      // Side rails
      const sideRail = new THREE.Mesh(new THREE.BoxGeometry(padSize, 0.06, 0.06), railMat);
      sideRail.position.set(0, railH, padCenterZ + side * padSize / 2);
      this.group.add(sideRail);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        sideRail.position.clone(), new THREE.Vector3(padSize, railH, 0.3)
      ));
    }
    // Back rail
    const backRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, padSize), railMat);
    backRail.position.set(-padSize / 2, railH, padCenterZ);
    this.group.add(backRail);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      backRail.position.clone(), new THREE.Vector3(0.3, railH, padSize)
    ));
    const backRail2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, padSize), railMat);
    backRail2.position.set(padSize / 2, railH, padCenterZ);
    this.group.add(backRail2);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      backRail2.position.clone(), new THREE.Vector3(0.3, railH, padSize)
    ));

  }

  /** Simple blocky helicopter */
  private createHelicopter(): THREE.Group {
    const heli = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.3, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.5 });

    // Fuselage
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 1.4), bodyMat);
    fuselage.position.y = 1.2;
    heli.add(fuselage);

    // Cockpit glass
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.35), glassMat);
    cockpit.position.set(1.0, 1.5, 0);
    heli.add(cockpit);

    // Tail boom
    const tail = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 0.3), bodyMat);
    tail.position.set(-2.0, 1.4, 0);
    heli.add(tail);

    // Tail fin
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.5), bodyMat);
    fin.position.set(-3.0, 1.8, 0);
    heli.add(fin);

    // Tail rotor
    const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.08), metalMat);
    tailRotor.position.set(-3.0, 2.0, 0.3);
    heli.add(tailRotor);

    // Main rotor mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), metalMat);
    mast.position.set(0, 2.05, 0);
    heli.add(mast);

    // Main rotor blades (cross shape)
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(4, 0.04, 0.2), metalMat);
      blade.position.set(0, 2.35, 0);
      blade.rotation.y = (i / 4) * Math.PI;
      heli.add(blade);
    }

    // Skids
    for (const z of [-0.6, 0.6]) {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.06), metalMat);
      skid.position.set(0, 0.3, z);
      heli.add(skid);
      // Struts
      for (const x of [-0.5, 0.5]) {
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), metalMat);
        strut.position.set(x, 0.6, z);
        heli.add(strut);
      }
    }

    // Gold accent stripe
    const goldStripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.08, 1.42),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.7 })
    );
    goldStripe.position.set(0, 1.2, 0);
    heli.add(goldStripe);

    return heli;
  }

  /** Generic text sign helper */
  private createTextSign(text: string, bgColor: number, textColor: number): THREE.Group {
    const sign = new THREE.Group();
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.6, 0.05),
      new THREE.MeshStandardMaterial({ color: bgColor })
    );
    sign.add(plate);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 96;
    ctx.fillStyle = '#' + bgColor.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#' + textColor.toString(16).padStart(6, '0');
    ctx.font = 'bold 36px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 0.5),
      new THREE.MeshStandardMaterial({ map: texture, transparent: true })
    );
    textPlane.position.z = 0.03;
    sign.add(textPlane);

    return sign;
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
      case 'legal': return this.createGavel();
      case 'security': return this.createShield();
      case 'data': return this.createDataCube();
      case 'warroom': return this.createWarTable();
      case 'executive': return this.createThrone();
      case 'breakroom': return this.createCoffeeMachine();
      case 'marketing': return this.createNeonSign();
      case 'finance': return this.createSafe();
      case 'parking': return this.createParkingSign();
      case 'serverfarm': return this.createServerRack(); // reuse
      case 'graveyard': return this.createSkullArtifact();
      case 'foodtrucks': return this.createFoodTray();
      case 'helipad': return this.createGoldenParachute();
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

  /** Legal: Gavel on a wooden block */
  private createGavel(): THREE.Group {
    const g = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.6 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.5 });
    // Sound block
    const block = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16), darkWood);
    block.position.y = 0.08;
    g.add(block);
    // Handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), woodMat);
    handle.position.set(0, 0.7, 0);
    handle.rotation.z = 0.3;
    g.add(handle);
    // Head
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 12), darkWood);
    head.rotation.z = Math.PI / 2 + 0.3;
    head.position.set(0.25, 1.05, 0);
    g.add(head);
    // Metal bands
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.7 });
    for (const offset of [-0.14, 0.14]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 12), metalMat);
      band.rotation.z = Math.PI / 2 + 0.3;
      band.position.set(0.25 + Math.cos(0.3) * offset, 1.05 + Math.sin(0.3) * offset, 0);
      g.add(band);
    }
    return g;
  }

  /** Security: Shield with lock icon */
  private createShield(): THREE.Group {
    const g = new THREE.Group();
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.4, roughness: 0.3 });
    // Shield body (stretched sphere)
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), shieldMat);
    body.scale.set(0.8, 1, 0.2);
    body.position.y = 1.2;
    g.add(body);
    // Shield border
    const borderMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 });
    const border = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 8, 32), borderMat);
    border.position.y = 1.2;
    g.add(border);
    // Lock body
    const lockMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.6 });
    const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.08), lockMat);
    lockBody.position.set(0, 1.1, 0.12);
    g.add(lockBody);
    // Lock shackle
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 16, Math.PI), lockMat);
    shackle.position.set(0, 1.3, 0.12);
    g.add(shackle);
    // Pedestal
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0x4a5568 }));
    ped.position.y = 0.25;
    g.add(ped);
    return g;
  }

  /** Data Science: Floating holographic data cube */
  private createDataCube(): THREE.Group {
    const g = new THREE.Group();
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.6, metalness: 0.3 });
    // Main cube
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), cubeMat);
    cube.position.y = 1.3;
    g.add(cube);
    // Wireframe overlay
    const wire = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.82, 0.82),
      new THREE.MeshStandardMaterial({ color: 0xa78bfa, wireframe: true })
    );
    wire.position.y = 1.3;
    g.add(wire);
    // Data points orbiting
    const dotMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 0.6 });
    for (let i = 0; i < 8; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), dotMat);
      const a = (i / 8) * Math.PI * 2;
      dot.position.set(Math.cos(a) * 0.6, 1.3 + Math.sin(a * 2) * 0.3, Math.sin(a) * 0.6);
      g.add(dot);
    }
    this.animatedObjects.push({ mesh: g, type: 'spin' });
    // Pedestal
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0x4a5568 }));
    ped.position.y = 0.25;
    g.add(ped);
    return g;
  }

  /** War Room: Round conference table with chairs */
  private createWarTable(): THREE.Group {
    const g = new THREE.Group();
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.4 });
    // Table top
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 24), tableMat);
    top.position.y = 0.8;
    g.add(top);
    // Table leg
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0x4a5568 }));
    leg.position.y = 0.4;
    g.add(leg);
    // Chairs around table
    const chairMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.22), chairMat);
      seat.position.set(Math.cos(a) * 1.2, 0.5, Math.sin(a) * 1.2);
      g.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.04), chairMat);
      back.position.set(Math.cos(a) * 1.35, 0.7, Math.sin(a) * 1.35);
      back.rotation.y = -a;
      g.add(back);
    }
    // Red button in center of table
    const btn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.4 })
    );
    btn.position.y = 0.85;
    g.add(btn);
    return g;
  }

  /** Executive Suite: Big leather throne */
  private createThrone(): THREE.Group {
    const g = new THREE.Group();
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.4 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.7), leatherMat);
    seat.position.y = 0.6;
    g.add(seat);
    // Back (tall)
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.1), leatherMat);
    back.position.set(0, 1.2, -0.3);
    g.add(back);
    // Armrests
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.6), leatherMat);
      arm.position.set(side * 0.4, 0.75, 0);
      g.add(arm);
    }
    // Base column
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x4a5568 }));
    base.position.y = 0.25;
    g.add(base);
    // Gold crown on top of chair back
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.12, 6), goldMat);
    crown.position.set(0, 1.86, -0.3);
    g.add(crown);
    // Nameplate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.04), goldMat);
    plate.position.set(0, 0.5, 0.36);
    g.add(plate);
    return g;
  }

  /** Break Room: Coffee machine with mug */
  private createCoffeeMachine(): THREE.Group {
    const g = new THREE.Group();
    const machineMat = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.3 });
    // Machine body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.5), machineMat);
    body.position.y = 0.85;
    g.add(body);
    // Top hopper
    const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0x4a4a4a }));
    hopper.position.y = 1.45;
    g.add(hopper);
    // Drip tray
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.35), new THREE.MeshStandardMaterial({ color: 0x6b7280 }));
    tray.position.set(0, 0.42, 0.1);
    g.add(tray);
    // Coffee mug
    const mugMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 10), mugMat);
    mug.position.set(0, 0.49, 0.1);
    g.add(mug);
    // Mug handle
    const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 10, Math.PI), mugMat);
    mugHandle.position.set(0.07, 0.5, 0.1);
    mugHandle.rotation.y = Math.PI / 2;
    g.add(mugHandle);
    // Coffee liquid
    const coffee = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.02, 10),
      new THREE.MeshStandardMaterial({ color: 0x3e1f00 })
    );
    coffee.position.set(0, 0.55, 0.1);
    g.add(coffee);
    // Green power LED
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x4ade80, emissiveIntensity: 0.8 })
    );
    led.position.set(0.22, 1.0, 0.26);
    g.add(led);
    this.animatedObjects.push({ mesh: led, type: 'blink' });
    // Counter underneath
    const counter = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.6), new THREE.MeshStandardMaterial({ color: 0x8b7355 }));
    counter.position.y = 0.4;
    g.add(counter);
    // Counter legs
    for (const x of [-0.4, 0.4]) {
      const cleg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), new THREE.MeshStandardMaterial({ color: 0x4a5568 }));
      cleg.position.set(x, 0.2, 0);
      g.add(cleg);
    }
    // Donut box
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: 0xff69b4 }));
    box.position.set(-0.3, 0.47, 0);
    g.add(box);
    return g;
  }

  /** Marketing: Neon arrow sign */
  private createNeonSign(): THREE.Group {
    const g = new THREE.Group();
    const neonPink = new THREE.MeshStandardMaterial({ color: 0xe91e63, emissive: 0xe91e63, emissiveIntensity: 0.6 });
    const neonBlue = new THREE.MeshStandardMaterial({ color: 0x2196f3, emissive: 0x2196f3, emissiveIntensity: 0.6 });
    // Backing board
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.05), new THREE.MeshStandardMaterial({ color: 0x1a1a2e }));
    board.position.y = 1.4;
    g.add(board);
    // Neon tubes forming "GO"
    const tube1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.06), neonPink);
    tube1.position.set(-0.25, 1.55, 0.04);
    g.add(tube1);
    const tube2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), neonPink);
    tube2.position.set(-0.44, 1.4, 0.04);
    g.add(tube2);
    const tube3 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.06), neonPink);
    tube3.position.set(-0.25, 1.25, 0.04);
    g.add(tube3);
    // O shape
    const o = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 8, 16), neonBlue);
    o.position.set(0.2, 1.4, 0.04);
    g.add(o);
    // Arrow underneath
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.06), neonPink);
    shaft.position.set(-0.05, 1.0, 0.04);
    g.add(shaft);
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 3), neonPink);
    arrowHead.position.set(0.5, 1.0, 0.04);
    arrowHead.rotation.z = -Math.PI / 2;
    g.add(arrowHead);
    // Stand
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), new THREE.MeshStandardMaterial({ color: 0x4a5568 }));
    pole.position.y = 0.45;
    g.add(pole);
    const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.3), new THREE.MeshStandardMaterial({ color: 0x4a5568 }));
    standBase.position.y = 0.025;
    g.add(standBase);
    return g;
  }

  /** Finance: Vault safe */
  private createSafe(): THREE.Group {
    const g = new THREE.Group();
    const safeMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    // Safe body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.8), safeMat);
    body.position.y = 0.5;
    g.add(body);
    // Door frame
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.85, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x4b5563 })
    );
    frame.position.set(0, 0.5, 0.41);
    g.add(frame);
    // Dial
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 20), goldMat);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0.15, 0.55, 0.43);
    g.add(dial);
    // Dial center
    const dialCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10), safeMat);
    dialCenter.rotation.x = Math.PI / 2;
    dialCenter.position.set(0.15, 0.55, 0.45);
    g.add(dialCenter);
    // Handle
    const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.04), goldMat);
    handleBar.position.set(-0.15, 0.55, 0.43);
    g.add(handleBar);
    // Hinges
    for (const y of [0.2, 0.8]) {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8), safeMat);
      hinge.position.set(-0.44, y, 0.35);
      g.add(hinge);
    }
    // Dollar sign on top
    const topPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 16), goldMat);
    topPlate.position.y = 1.02;
    g.add(topPlate);
    return g;
  }

  /** Parking Garage: P sign */
  private createParkingSign(): THREE.Group {
    const g = new THREE.Group();
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x2563eb, emissiveIntensity: 0.3 });
    // Sign plate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.08), blueMat);
    plate.position.y = 1.2;
    g.add(plate);
    // "P" letter using canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 128; canvas.height = 128;
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true })
    );
    face.position.set(0, 1.2, 0.05);
    g.add(face);
    // Post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b7280 }));
    post.position.y = 0.4;
    g.add(post);
    return g;
  }

  /** Graveyard: Glowing skull on a pedestal */
  private createSkullArtifact(): THREE.Group {
    const g = new THREE.Group();
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.7 });
    const glowMat = new THREE.MeshStandardMaterial({ color: 0x6b21a8, emissive: 0x6b21a8, emissiveIntensity: 0.5 });
    // Pedestal
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x374151 }));
    ped.position.y = 0.25;
    g.add(ped);
    // Skull (sphere + jaw)
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), boneMat);
    cranium.position.y = 1.0;
    cranium.scale.set(1, 0.9, 0.9);
    g.add(cranium);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.25), boneMat);
    jaw.position.set(0, 0.72, 0.08);
    g.add(jaw);
    // Glowing eye sockets
    for (const side of [-0.1, 0.1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), glowMat);
      eye.position.set(side, 1.02, 0.28);
      g.add(eye);
    }
    this.animatedObjects.push({ mesh: g, type: 'bobble' });
    return g;
  }

  /** Food Court: Tray of food */
  private createFoodTray(): THREE.Group {
    const g = new THREE.Group();
    const trayMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    // Tray
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.5), trayMat);
    tray.position.y = 0.8;
    g.add(tray);
    // Pedestal
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.7, 12),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 }));
    ped.position.y = 0.35;
    g.add(ped);
    // Taco
    const taco = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 4, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xdeb887 }));
    taco.position.set(-0.2, 0.85, 0);
    taco.rotation.z = -0.2;
    g.add(taco);
    // Burger
    const bun = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4a843 }));
    bun.position.set(0.15, 0.88, 0);
    g.add(bun);
    const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 8),
      new THREE.MeshStandardMaterial({ color: 0x5c3317 }));
    patty.position.set(0.15, 0.85, 0);
    g.add(patty);
    // Drink cup
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff }));
    cup.position.set(0, 0.9, 0.15);
    g.add(cup);
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xff4444 }));
    straw.position.set(0, 1.0, 0.15);
    g.add(straw);
    return g;
  }

  /** Helipad: Golden parachute on a pedestal */
  private createGoldenParachute(): THREE.Group {
    const g = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.7, roughness: 0.2 });
    // Pedestal
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 }));
    ped.position.y = 0.25;
    g.add(ped);
    // Parachute canopy (golden dome)
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), goldMat);
    canopy.position.y = 1.5;
    g.add(canopy);
    // Suspension lines
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.7, 4),
        new THREE.MeshStandardMaterial({ color: 0xb8860b }));
      line.position.set(Math.cos(angle) * 0.35, 1.1, Math.sin(angle) * 0.35);
      line.rotation.x = Math.sin(angle) * 0.3;
      line.rotation.z = -Math.cos(angle) * 0.3;
      g.add(line);
    }
    // Harness figure (tiny golden person)
    const figure = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.1), goldMat);
    figure.position.y = 0.8;
    g.add(figure);
    const figHead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), goldMat);
    figHead.position.y = 1.0;
    g.add(figHead);
    this.animatedObjects.push({ mesh: g, type: 'bobble' });
    return g;
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
