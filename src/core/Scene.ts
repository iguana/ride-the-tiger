import * as THREE from 'three';

export class GameScene {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 20, 100);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupResizeHandler();
  }

  private setupLighting(): void {
    // Ambient light for general illumination (office fluorescent feel)
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // Main directional light (simulates overhead office lights)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -30;
    mainLight.shadow.camera.right = 30;
    mainLight.shadow.camera.top = 30;
    mainLight.shadow.camera.bottom = -30;
    mainLight.shadow.bias = -0.0001;
    this.scene.add(mainLight);

    // Fill light from the opposite side
    const fillLight = new THREE.DirectionalLight(0xfff4e6, 0.3);
    fillLight.position.set(-5, 10, -5);
    this.scene.add(fillLight);

    // Hemisphere light for sky/ground color
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.3);
    this.scene.add(hemiLight);
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  public render(camera: THREE.Camera): void {
    this.renderer.render(this.scene, camera);
  }
}
