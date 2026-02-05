import * as THREE from 'three';

export class FirstPersonCamera {
  public camera: THREE.PerspectiveCamera;
  private euler: THREE.Euler;
  private isLocked: boolean = false;

  // Camera settings
  private readonly RIDER_HEIGHT = 2.0;
  private readonly MOUSE_SENSITIVITY = 0.002;
  private readonly HEAD_BOB_SPEED = 10;
  private readonly HEAD_BOB_AMOUNT = 0.05;

  private headBobTime: number = 0;
  private baseY: number;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, this.RIDER_HEIGHT, 5);
    this.baseY = this.RIDER_HEIGHT;

    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.setupResizeHandler();
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  public setupPointerLock(element: HTMLElement, onLock: () => void, onUnlock: () => void): void {
    element.addEventListener('click', () => {
      if (!this.isLocked) {
        element.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === element;
      if (this.isLocked) {
        onLock();
      } else {
        onUnlock();
      }
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isLocked) return;

      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= event.movementX * this.MOUSE_SENSITIVITY;
      this.euler.x -= event.movementY * this.MOUSE_SENSITIVITY;

      // Clamp vertical look
      this.euler.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.euler.x));

      this.camera.quaternion.setFromEuler(this.euler);
    });
  }

  public updateHeadBob(isMoving: boolean, isSprinting: boolean, deltaTime: number): void {
    if (isMoving) {
      const speed = isSprinting ? this.HEAD_BOB_SPEED * 1.5 : this.HEAD_BOB_SPEED;
      this.headBobTime += deltaTime * speed;
      const bobAmount = isSprinting ? this.HEAD_BOB_AMOUNT * 1.3 : this.HEAD_BOB_AMOUNT;
      this.camera.position.y = this.baseY + Math.sin(this.headBobTime) * bobAmount;
    } else {
      this.headBobTime = 0;
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.baseY, 0.1);
    }
  }

  public setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
    this.baseY = y;
  }

  public getDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    return direction;
  }

  public getForward(): THREE.Vector3 {
    const direction = this.getDirection();
    direction.y = 0;
    direction.normalize();
    return direction;
  }

  public getRight(): THREE.Vector3 {
    const forward = this.getForward();
    return new THREE.Vector3(-forward.z, 0, forward.x);
  }

  public get locked(): boolean {
    return this.isLocked;
  }
}
