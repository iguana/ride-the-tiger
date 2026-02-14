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

  // Pre-allocated scratch vectors to avoid per-frame allocation
  private readonly _direction = new THREE.Vector3();
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();

  // Shake system
  private shakeIntensity: number = 0;
  private shakeDecay: number = 8; // how fast shake dampens
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  // Recoil system
  private recoilPitch: number = 0;
  private recoilApplied: number = 0; // currently-applied offset to undo each frame
  private readonly RECOIL_KICK = 0.035; // radians (~2 degrees)
  private readonly RECOIL_RETURN_SPEED = 8;

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
    this.camera.getWorldDirection(this._direction);
    return this._direction;
  }

  public getForward(): THREE.Vector3 {
    this.camera.getWorldDirection(this._forward);
    this._forward.y = 0;
    this._forward.normalize();
    return this._forward;
  }

  public getRight(): THREE.Vector3 {
    const fwd = this.getForward();
    this._right.set(-fwd.z, 0, fwd.x);
    return this._right;
  }

  public get locked(): boolean {
    return this.isLocked;
  }

  public applyShake(intensity: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  public applyRecoil(): void {
    this.recoilPitch = this.RECOIL_KICK;
  }

  public updateEffects(deltaTime: number): void {
    // Handle camera shake
    if (this.shakeIntensity > 0.001) {
      // Remove previous shake offset
      this.camera.position.x -= this.shakeOffsetX;
      this.camera.position.y -= this.shakeOffsetY;

      // Generate new random shake offset
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;

      // Apply new shake offset
      this.camera.position.x += this.shakeOffsetX;
      this.camera.position.y += this.shakeOffsetY;

      // Exponential decay
      this.shakeIntensity *= Math.exp(-this.shakeDecay * deltaTime);
    } else {
      // Clear shake state when intensity is negligible
      this.camera.position.x -= this.shakeOffsetX;
      this.camera.position.y -= this.shakeOffsetY;
      this.shakeIntensity = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Handle recoil (offset-tracked, same pattern as shake)
    if (this.recoilPitch > 0.001) {
      this.euler.setFromQuaternion(this.camera.quaternion);

      // Undo previous frame's offset, apply current decayed offset
      this.euler.x += this.recoilApplied;
      this.recoilApplied = this.recoilPitch;
      this.euler.x -= this.recoilApplied;

      // Clamp vertical look to prevent over-rotation
      this.euler.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.euler.x));

      this.camera.quaternion.setFromEuler(this.euler);

      // Exponential decay
      this.recoilPitch *= Math.exp(-this.RECOIL_RETURN_SPEED * deltaTime);
    } else {
      // Remove any remaining applied recoil
      if (this.recoilApplied !== 0) {
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.x += this.recoilApplied;
        this.euler.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);
        this.recoilApplied = 0;
      }
      this.recoilPitch = 0;
    }
  }
}
