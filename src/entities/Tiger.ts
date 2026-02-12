import * as THREE from 'three';
import { FirstPersonCamera } from '../core/Camera';
import { InputManager } from '../core/InputManager';

export class Tiger {
  public mesh: THREE.Group;
  private body: THREE.Mesh;
  private head: THREE.Mesh;
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

  // Animation
  private walkCycle: number = 0;

  constructor(camera: FirstPersonCamera) {
    this.camera = camera;
    this.input = InputManager.getInstance();
    this.mesh = new THREE.Group();

    // Materials
    const orangeFur = new THREE.MeshStandardMaterial({
      color: 0xe85d04,
      roughness: 0.9,
    });
    const blackStripe = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
    });
    const whiteFur = new THREE.MeshStandardMaterial({
      color: 0xfaf3e8,
      roughness: 0.9,
    });
    const pinkNose = new THREE.MeshStandardMaterial({
      color: 0xffb6c1,
      roughness: 0.7,
    });

    // Main body - sleek and elongated
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 2.0, 8, 16);
    this.body = new THREE.Mesh(bodyGeometry, orangeFur);
    this.body.rotation.x = Math.PI / 2;
    this.body.scale.set(0.9, 1, 0.85);
    this.body.position.set(0, 0.65, 0);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.mesh.add(this.body);

    // White belly
    const bellyGeometry = new THREE.CapsuleGeometry(0.22, 1.6, 8, 16);
    const belly = new THREE.Mesh(bellyGeometry, whiteFur);
    belly.rotation.x = Math.PI / 2;
    belly.position.set(0, 0.5, 0);
    this.mesh.add(belly);

    // Body stripes - curved over the back
    const stripePositions = [-0.7, -0.35, 0, 0.35, 0.7];
    stripePositions.forEach((zPos, i) => {
      // Top stripe
      const stripeGeo = new THREE.BoxGeometry(0.06, 0.18, 0.4);
      const stripe = new THREE.Mesh(stripeGeo, blackStripe);
      stripe.position.set(0, 0.88, zPos);
      stripe.rotation.x = (i % 2 === 0) ? 0.15 : -0.15;
      this.mesh.add(stripe);

      // Left side stripe
      const leftStripe = new THREE.Mesh(stripeGeo, blackStripe);
      leftStripe.position.set(-0.25, 0.75, zPos + 0.05);
      leftStripe.rotation.z = 0.5;
      leftStripe.rotation.x = (i % 2 === 0) ? 0.1 : -0.1;
      this.mesh.add(leftStripe);

      // Right side stripe
      const rightStripe = new THREE.Mesh(stripeGeo, blackStripe);
      rightStripe.position.set(0.25, 0.75, zPos - 0.05);
      rightStripe.rotation.z = -0.5;
      rightStripe.rotation.x = (i % 2 === 0) ? -0.1 : 0.1;
      this.mesh.add(rightStripe);
    });

    // Head - leaner
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    this.head = new THREE.Mesh(headGeometry, orangeFur);
    this.head.scale.set(0.9, 0.85, 1.1);
    this.head.position.set(0, 0.78, 1.3);
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Snout/muzzle - white
    const muzzleGeometry = new THREE.SphereGeometry(0.18, 12, 12);
    const muzzle = new THREE.Mesh(muzzleGeometry, whiteFur);
    muzzle.scale.set(0.9, 0.65, 0.8);
    muzzle.position.set(0, 0.68, 1.58);
    this.mesh.add(muzzle);

    // Nose
    const noseGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const nose = new THREE.Mesh(noseGeometry, pinkNose);
    nose.position.set(0, 0.72, 1.74);
    this.mesh.add(nose);

    // Head stripes - forehead
    const foreheadStripe1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 0.07),
      blackStripe
    );
    foreheadStripe1.position.set(-0.1, 0.97, 1.42);
    foreheadStripe1.rotation.x = -0.3;
    this.mesh.add(foreheadStripe1);

    const foreheadStripe2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 0.07),
      blackStripe
    );
    foreheadStripe2.position.set(0.1, 0.97, 1.42);
    foreheadStripe2.rotation.x = -0.3;
    this.mesh.add(foreheadStripe2);

    // Cheek stripes
    const cheekStripeGeo = new THREE.BoxGeometry(0.03, 0.1, 0.05);
    [-1, 1].forEach(side => {
      for (let i = 0; i < 3; i++) {
        const cheekStripe = new THREE.Mesh(cheekStripeGeo, blackStripe);
        cheekStripe.position.set(
          side * (0.27 + i * 0.025),
          0.78 - i * 0.07,
          1.42 - i * 0.05
        );
        cheekStripe.rotation.z = side * 0.3;
        this.mesh.add(cheekStripe);
      }
    });

    // Ears - triangular with black backs
    const earShape = new THREE.Shape();
    earShape.moveTo(0, 0);
    earShape.lineTo(0.1, 0.2);
    earShape.lineTo(-0.1, 0.2);
    earShape.lineTo(0, 0);
    const earGeometry = new THREE.ExtrudeGeometry(earShape, { depth: 0.05, bevelEnabled: false });

    const leftEar = new THREE.Mesh(earGeometry, orangeFur);
    leftEar.position.set(-0.18, 1.07, 1.22);
    leftEar.rotation.x = -0.3;
    this.mesh.add(leftEar);

    const leftEarInner = new THREE.Mesh(earGeometry, blackStripe);
    leftEarInner.scale.set(0.6, 0.6, 0.5);
    leftEarInner.position.set(-0.18, 1.1, 1.24);
    leftEarInner.rotation.x = -0.3;
    this.mesh.add(leftEarInner);

    const rightEar = new THREE.Mesh(earGeometry, orangeFur);
    rightEar.position.set(0.18, 1.07, 1.22);
    rightEar.rotation.x = -0.3;
    this.mesh.add(rightEar);

    const rightEarInner = new THREE.Mesh(earGeometry, blackStripe);
    rightEarInner.scale.set(0.6, 0.6, 0.5);
    rightEarInner.position.set(0.18, 1.1, 1.24);
    rightEarInner.rotation.x = -0.3;
    this.mesh.add(rightEarInner);

    // Eyes - amber/yellow with black pupils
    const eyeGeometry = new THREE.SphereGeometry(0.08, 12, 12);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffc107,
      emissive: 0xffc107,
      emissiveIntensity: 0.1,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.13, 0.84, 1.56);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.13, 0.84, 1.56);
    this.mesh.add(rightEye);

    // Pupils - vertical slits
    const pupilGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.scale.set(0.5, 1.2, 1);
    leftPupil.position.set(-0.13, 0.84, 1.63);
    this.mesh.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.scale.set(0.5, 1.2, 1);
    rightPupil.position.set(0.13, 0.84, 1.63);
    this.mesh.add(rightPupil);

    // Whisker dots
    const whiskerDotGeo = new THREE.SphereGeometry(0.012, 6, 6);
    [-1, 1].forEach(side => {
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const dot = new THREE.Mesh(whiskerDotGeo, blackStripe);
          dot.position.set(
            side * (0.08 + col * 0.035),
            0.65 - row * 0.035,
            1.66
          );
          this.mesh.add(dot);
        }
      }
    });

    // Legs with stripes
    const createLeg = (x: number, z: number): THREE.Group => {
      const leg = new THREE.Group();

      // Upper leg
      const upperLeg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.09, 0.3, 6, 12),
        orangeFur
      );
      upperLeg.position.y = 0.35;
      upperLeg.castShadow = true;
      leg.add(upperLeg);

      // Lower leg / paw - white
      const paw = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.07, 0.15, 6, 12),
        whiteFur
      );
      paw.position.y = 0.1;
      paw.castShadow = true;
      leg.add(paw);

      // Leg stripes
      for (let i = 0; i < 2; i++) {
        const legStripe = new THREE.Mesh(
          new THREE.BoxGeometry(0.19, 0.025, 0.06),
          blackStripe
        );
        legStripe.position.set(0, 0.4 + i * 0.12, 0);
        leg.add(legStripe);
      }

      leg.position.set(x, 0, z);
      return leg;
    };

    const frontLeftLeg = createLeg(-0.3, 0.8);
    const frontRightLeg = createLeg(0.3, 0.8);
    const backLeftLeg = createLeg(-0.3, -0.8);
    const backRightLeg = createLeg(0.3, -0.8);

    this.mesh.add(frontLeftLeg);
    this.mesh.add(frontRightLeg);
    this.mesh.add(backLeftLeg);
    this.mesh.add(backRightLeg);

    // Tail - long with stripes and white tip
    const tailGroup = new THREE.Group();

    const tailBase = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.055, 1.0, 6, 12),
      orangeFur
    );
    tailBase.rotation.x = Math.PI / 2 + 0.5;
    tailBase.position.set(0, 0.3, -0.6);
    tailGroup.add(tailBase);

    // Tail stripes
    for (let i = 0; i < 5; i++) {
      const tailStripe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.05, 8),
        blackStripe
      );
      tailStripe.rotation.x = Math.PI / 2 + 0.5;
      const t = i / 5;
      tailStripe.position.set(0, 0.35 + t * 0.4, -0.65 - t * 0.8);
      tailGroup.add(tailStripe);
    }

    // White tail tip
    const tailTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 8, 8),
      whiteFur
    );
    tailTip.position.set(0, 0.8, -1.45);
    tailGroup.add(tailTip);

    tailGroup.position.set(0, 0.4, -0.4);
    this.mesh.add(tailGroup);

    // Store references for animation
    (this.mesh as any).legs = {
      frontLeft: frontLeftLeg,
      frontRight: frontRightLeg,
      backLeft: backLeftLeg,
      backRight: backRightLeg,
    };
    (this.mesh as any).tail = tailGroup;
  }

  public update(deltaTime: number): void {
    const isSprinting = this.input.sprint;
    const maxSpeed = isSprinting ? this.SPRINT_SPEED : this.WALK_SPEED;

    // Get movement direction
    const moveDirection = new THREE.Vector3();

    if (this.input.forward) {
      moveDirection.add(this.camera.getForward());
    }
    if (this.input.backward) {
      moveDirection.sub(this.camera.getForward());
    }
    if (this.input.left) {
      moveDirection.sub(this.camera.getRight());
    }
    if (this.input.right) {
      moveDirection.add(this.camera.getRight());
    }

    // Apply movement
    if (moveDirection.length() > 0) {
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

      // Animate legs
      this.animateWalk(deltaTime, isSprinting);
    } else {
      // Decelerate
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, this.DECELERATION * deltaTime);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, this.DECELERATION * deltaTime);

      // Reset leg positions
      this.resetLegs();
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
  }

  private animateWalk(deltaTime: number, isSprinting: boolean): void {
    const legs = (this.mesh as any).legs;
    const tail = (this.mesh as any).tail;

    const speed = isSprinting ? 15 : 10;
    const amplitude = isSprinting ? 0.3 : 0.2;

    this.walkCycle += deltaTime * speed;

    // Animate legs in walking pattern (diagonal pairs)
    legs.frontLeft.position.y = 0.3 + Math.sin(this.walkCycle) * amplitude;
    legs.backRight.position.y = 0.3 + Math.sin(this.walkCycle) * amplitude;
    legs.frontRight.position.y = 0.3 + Math.sin(this.walkCycle + Math.PI) * amplitude;
    legs.backLeft.position.y = 0.3 + Math.sin(this.walkCycle + Math.PI) * amplitude;

    // Animate tail
    tail.rotation.y = Math.sin(this.walkCycle * 0.5) * 0.3;
  }

  private resetLegs(): void {
    const legs = (this.mesh as any).legs;
    legs.frontLeft.position.y = THREE.MathUtils.lerp(legs.frontLeft.position.y, 0.3, 0.1);
    legs.frontRight.position.y = THREE.MathUtils.lerp(legs.frontRight.position.y, 0.3, 0.1);
    legs.backLeft.position.y = THREE.MathUtils.lerp(legs.backLeft.position.y, 0.3, 0.1);
    legs.backRight.position.y = THREE.MathUtils.lerp(legs.backRight.position.y, 0.3, 0.1);
  }

  public setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    this.mesh.position.copy(this.position);
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public setVelocity(x: number, y: number, z: number): void {
    this.velocity.set(x, y, z);
  }

  public getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }
}
