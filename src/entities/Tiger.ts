import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FirstPersonCamera } from '../core/Camera';
import { InputManager } from '../core/InputManager';

export class Tiger {
  public mesh: THREE.Group;
  private camera: FirstPersonCamera;
  private input: InputManager;

  // Movement settings
  private readonly WALK_SPEED = 5;
  private readonly SPRINT_SPEED = 10;
  private readonly ACCELERATION = 15;
  private readonly DECELERATION = 10;

  // Jump settings
  private readonly JUMP_FORCE = 12;
  private readonly GRAVITY = 20;

  private velocity: THREE.Vector3 = new THREE.Vector3();
  private verticalVelocity: number = 0;
  private isGrounded: boolean = true;
  private position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Pre-allocated scratch vector for movement calculations
  private readonly _moveDir = new THREE.Vector3();

  // GLB animation
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private modelLoaded: boolean = false;

  constructor(camera: FirstPersonCamera) {
    this.camera = camera;
    this.input = InputManager.getInstance();
    this.mesh = new THREE.Group();

    this.loadModel();
  }

  private loadModel(): void {
    const loader = new GLTFLoader();
    loader.load('/models/Tiger.glb', (gltf) => {
      const model = gltf.scene;

      // Measure the model's bounding box to auto-scale
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Target: roughly 2m long (matching the original procedural tiger)
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 2.0;
      const scale = targetSize / maxDim;
      model.scale.setScalar(scale);

      // Center horizontally and put feet on the ground
      model.position.set(
        -center.x * scale,
        -box.min.y * scale,
        -center.z * scale
      );

      // Enable shadows
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.mesh.add(model);
      this.modelLoaded = true;

      // Set up animations if present
      if (gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);

        for (const clip of gltf.animations) {
          const action = this.mixer.clipAction(clip);
          const name = clip.name.toLowerCase();
          this.animations.set(name, action);
        }

        // Try to play idle animation by default
        this.playAnimation('idle') ||
          this.playAnimation('stand') ||
          this.playFirstAnimation();
      }

      console.log(
        `Tiger model loaded: ${size.x.toFixed(1)}x${size.y.toFixed(1)}x${size.z.toFixed(1)} scaled to ${scale.toFixed(2)}`,
        gltf.animations.length > 0
          ? `| Animations: ${gltf.animations.map(a => a.name).join(', ')}`
          : '| No animations'
      );
    });
  }

  private playAnimation(name: string): boolean {
    // Try exact match first, then partial match
    let action = this.animations.get(name);
    if (!action) {
      for (const [key, a] of this.animations) {
        if (key.includes(name)) {
          action = a;
          break;
        }
      }
    }
    if (!action) return false;

    if (this.currentAction === action) return true;

    if (this.currentAction) {
      this.currentAction.fadeOut(0.3);
    }
    action.reset().fadeIn(0.3).play();
    this.currentAction = action;
    return true;
  }

  private playFirstAnimation(): boolean {
    const first = this.animations.values().next().value;
    if (!first) return false;
    first.reset().play();
    this.currentAction = first;
    return true;
  }

  public update(deltaTime: number): void {
    const isSprinting = this.input.sprint;
    const maxSpeed = isSprinting ? this.SPRINT_SPEED : this.WALK_SPEED;

    // Get movement direction (reuse scratch vector)
    const moveDirection = this._moveDir.set(0, 0, 0);

    // Camera returns shared vectors — read values before next call overwrites them
    if (this.input.forward || this.input.backward) {
      const fwd = this.camera.getForward();
      if (this.input.forward) moveDirection.add(fwd);
      if (this.input.backward) moveDirection.sub(fwd);
    }
    if (this.input.left || this.input.right) {
      const right = this.camera.getRight();
      if (this.input.right) moveDirection.add(right);
      if (this.input.left) moveDirection.sub(right);
    }

    const isMoving = moveDirection.lengthSq() > 0;

    // Apply movement
    if (isMoving) {
      moveDirection.normalize();

      // Accelerate
      this.velocity.x = THREE.MathUtils.lerp(
        this.velocity.x,
        moveDirection.x * maxSpeed,
        this.ACCELERATION * deltaTime
      );
      this.velocity.z = THREE.MathUtils.lerp(
        this.velocity.z,
        moveDirection.z * maxSpeed,
        this.ACCELERATION * deltaTime
      );

      // Rotate tiger to face movement direction
      const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
      this.mesh.rotation.y = THREE.MathUtils.lerp(
        this.mesh.rotation.y,
        targetRotation,
        10 * deltaTime
      );

      // Play walk/run animation
      if (this.modelLoaded) {
        if (isSprinting) {
          this.playAnimation('run') ||
            this.playAnimation('gallop') ||
            this.playAnimation('walk');
        } else {
          this.playAnimation('walk') ||
            this.playAnimation('run');
        }
        // Speed up animation when sprinting
        if (this.currentAction) {
          this.currentAction.timeScale = isSprinting ? 1.5 : 1.0;
        }
      }
    } else {
      // Decelerate
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, this.DECELERATION * deltaTime);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, this.DECELERATION * deltaTime);

      // Play idle animation
      if (this.modelLoaded) {
        this.playAnimation('idle') ||
          this.playAnimation('stand');
      }
    }

    // Jump
    if (this.input.jump && this.isGrounded) {
      this.verticalVelocity = this.JUMP_FORCE;
      this.isGrounded = false;
    }

    // Apply gravity
    if (!this.isGrounded) {
      this.verticalVelocity -= this.GRAVITY * deltaTime;
      this.position.y += this.verticalVelocity * deltaTime;

      // Land on ground
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    this.mesh.position.copy(this.position);

    // Update camera position (rider's eye level)
    this.camera.setPosition(
      this.position.x,
      this.position.y + 2.0,
      this.position.z
    );

    // Update head bob
    this.camera.updateHeadBob(this.input.anyMovement, isSprinting, deltaTime);

    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  public setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    this.mesh.position.copy(this.position);
  }

  /** Returns the position vector directly. Do NOT mutate — use setPosition() instead. */
  public getPosition(): THREE.Vector3 {
    return this.position;
  }

  public setVelocity(x: number, y: number, z: number): void {
    this.velocity.set(x, y, z);
  }

  /** Returns the velocity vector directly. Do NOT mutate. */
  public getVelocity(): THREE.Vector3 {
    return this.velocity;
  }
}
