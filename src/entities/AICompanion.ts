import * as THREE from 'three';

export class AICompanion {
  public mesh: THREE.Group;
  private headGroup: THREE.Group;
  private antenna: THREE.Mesh;
  private eyeLeft: THREE.Mesh;
  private eyeRight: THREE.Mesh;
  private chestLight: THREE.Mesh;
  private elapsedTime: number = 0;

  constructor() {
    this.mesh = new THREE.Group();

    const silver = new THREE.MeshStandardMaterial({ color: 0xb0b8c0, roughness: 0.3, metalness: 0.7 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x606870, roughness: 0.4, metalness: 0.6 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 0.8 });
    const antennaTip = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff3333, emissiveIntensity: 0.6 });
    const chestMat = new THREE.MeshStandardMaterial({ color: 0x00ddff, emissive: 0x00ddff, emissiveIntensity: 0.5 });

    // Body (blocky torso)
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.25), silver);
    body.position.set(0, 0.3, 0);
    body.castShadow = true;
    this.mesh.add(body);

    // Chest light
    this.chestLight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), chestMat);
    this.chestLight.position.set(0, 0.32, 0.14);
    this.mesh.add(this.chestLight);

    // Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.65, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.22), silver);
    this.headGroup.add(head);

    // Eyes
    this.eyeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), eyeMat);
    this.eyeLeft.position.set(-0.06, 0.02, 0.12);
    this.headGroup.add(this.eyeLeft);

    this.eyeRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), eyeMat);
    this.eyeRight.position.set(0.06, 0.02, 0.12);
    this.headGroup.add(this.eyeRight);

    // Mouth (small visor line)
    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.015, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x445566 })
    );
    mouth.position.set(0, -0.05, 0.12);
    this.headGroup.add(mouth);

    // Antenna
    const antennaStick = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), darkMetal);
    antennaStick.position.set(0, 0.17, 0);
    this.headGroup.add(antennaStick);

    this.antenna = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), antennaTip);
    this.antenna.position.set(0, 0.24, 0);
    this.headGroup.add(this.antenna);

    this.mesh.add(this.headGroup);

    // Arms (small stubby)
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.08), darkMetal);
      arm.position.set(side * 0.22, 0.25, 0);
      this.mesh.add(arm);
      // Hand
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), silver);
      hand.position.set(side * 0.22, 0.1, 0);
      this.mesh.add(hand);
    }

    // Legs (short blocky)
    for (const side of [-0.08, 0.08]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.1), darkMetal);
      leg.position.set(side, 0.02, 0);
      this.mesh.add(leg);
    }

    this.mesh.scale.setScalar(0.7);
    this.mesh.visible = false;
  }

  public attach(tigerMesh: THREE.Group): void {
    tigerMesh.add(this.mesh);
    this.mesh.position.set(0, 1.2, -0.2);
  }

  public setVisible(visible: boolean): void {
    this.mesh.visible = visible;
  }

  public update(dt: number): void {
    if (!this.mesh.visible) return;
    this.elapsedTime += dt;

    // Head bob
    this.headGroup.position.y = 0.65 + Math.sin(this.elapsedTime * 2.5) * 0.015;

    // Antenna wiggle
    this.antenna.position.x = Math.sin(this.elapsedTime * 4) * 0.015;

    // Eye glow pulse
    const eyeIntensity = 0.5 + Math.sin(this.elapsedTime * 3) * 0.3;
    (this.eyeLeft.material as THREE.MeshStandardMaterial).emissiveIntensity = eyeIntensity;
    (this.eyeRight.material as THREE.MeshStandardMaterial).emissiveIntensity = eyeIntensity;

    // Chest light pulse (different frequency)
    (this.chestLight.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + Math.sin(this.elapsedTime * 1.8) * 0.2;
  }
}
