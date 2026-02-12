import * as THREE from 'three';

export class GameScene {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87ceeb, 40, 200);

    // Sky gradient background (replaces flat color)
    this.scene.background = this.createSkyTexture();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupSkyDome();
    this.setupResizeHandler();
  }

  /** Canvas gradient → CubeTexture used as scene.background */
  private createSkyTexture(): THREE.CubeTexture {
    const size = 512;

    const makeFace = (top: string, bottom: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, top);
      grad.addColorStop(1, bottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      return canvas;
    };

    // Side faces: horizon at bottom, deeper blue at top
    const sideTop = '#3a7bd5';
    const sideBottom = '#c8e0f4';

    const sides = makeFace(sideTop, sideBottom);
    const topFace = makeFace('#2563a8', '#3a7bd5');   // zenith — deep blue
    const bottomFace = makeFace('#a0b8a0', '#7a9a6a'); // ground — muted green

    const cubeTexture = new THREE.CubeTexture([
      sides, sides,   // +x, -x
      topFace, bottomFace, // +y (up), -y (down)
      sides, sides,   // +z, -z
    ]);
    cubeTexture.needsUpdate = true;
    return cubeTexture;
  }

  /** Large sky sphere with gradient + clouds for visible outdoor sky geometry */
  private setupSkyDome(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Vertical gradient: warm horizon → sky blue → deep blue at top
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0.0, '#1e4d8c');    // zenith — deep blue
    grad.addColorStop(0.25, '#3a7bd5');   // upper sky
    grad.addColorStop(0.5, '#7ec8e3');    // mid sky
    grad.addColorStop(0.75, '#c8e0f4');   // near horizon — pale blue
    grad.addColorStop(0.88, '#f0e6d3');   // horizon glow — warm peach
    grad.addColorStop(1.0, '#d4c5a9');    // lowest — hazy
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun glow (bright spot near horizon)
    const sunX = canvas.width * 0.7;
    const sunY = canvas.height * 0.82;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 120);
    sunGrad.addColorStop(0, 'rgba(255, 248, 220, 0.9)');
    sunGrad.addColorStop(0.3, 'rgba(255, 223, 140, 0.4)');
    sunGrad.addColorStop(0.7, 'rgba(255, 200, 100, 0.1)');
    sunGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Soft clouds (translucent white ellipses)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    const clouds = [
      { x: 150, y: 180, w: 200, h: 30 },
      { x: 400, y: 140, w: 260, h: 40 },
      { x: 700, y: 200, w: 180, h: 25 },
      { x: 250, y: 240, w: 150, h: 20 },
      { x: 550, y: 160, w: 220, h: 35 },
      { x: 850, y: 220, w: 140, h: 22 },
      { x: 100, y: 280, w: 180, h: 28 },
      { x: 620, y: 260, w: 200, h: 30 },
    ];
    for (const c of clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Slightly brighter core
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w / 3, c.h / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    // Large inverted sphere — sits behind everything
    const skyGeo = new THREE.SphereGeometry(500, 32, 20);
    const skyMat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyDome);
  }

  private setupLighting(): void {
    // Ambient light for general illumination (office fluorescent feel)
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // Main directional light (sun-like)
    const mainLight = new THREE.DirectionalLight(0xfff8e7, 0.9);
    mainLight.position.set(30, 40, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 1;
    mainLight.shadow.camera.far = 120;
    // Tighter frustum focused on the main indoor play area (120x120)
    // gives ~3.4x better shadow texel density vs the old -100..100 range
    mainLight.shadow.camera.left = -70;
    mainLight.shadow.camera.right = 70;
    mainLight.shadow.camera.top = 70;
    mainLight.shadow.camera.bottom = -70;
    mainLight.shadow.bias = -0.0005;
    this.scene.add(mainLight);

    // Fill light from the opposite side
    const fillLight = new THREE.DirectionalLight(0xfff4e6, 0.3);
    fillLight.position.set(-5, 10, -5);
    this.scene.add(fillLight);

    // Hemisphere light for sky/ground color
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.35);
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
