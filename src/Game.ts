import * as THREE from 'three';
import { GameScene } from './core/Scene';
import { FirstPersonCamera } from './core/Camera';
import { Tiger } from './entities/Tiger';
import { EnemyManager } from './entities/EnemyManager';
import { CallCenter } from './environment/CallCenter';
import { MissionManager } from './systems/MissionManager';
import { SimplePhysics } from './systems/Physics';
import { PhoneShooter } from './systems/PhoneShooter';
import { HUD } from './ui/HUD';
import { AudioManager } from './systems/AudioManager';

export class Game {
  private scene: GameScene;
  private camera: FirstPersonCamera;
  private tiger: Tiger;
  private enemyManager: EnemyManager;
  private callCenter: CallCenter;
  private missionManager: MissionManager;
  private physics: SimplePhysics;
  private phoneShooter: PhoneShooter;
  private hud: HUD;
  private audio: AudioManager;

  private clock: THREE.Clock;
  private elapsedTime: number = 0;
  private isRunning: boolean = false;
  private footstepTimer: number = 0;

  private startScreen: HTMLElement;
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('game-container')!;
    this.startScreen = document.getElementById('start-screen')!;

    // Initialize core systems
    this.scene = new GameScene(this.container);
    this.camera = new FirstPersonCamera();
    this.clock = new THREE.Clock();

    // Initialize entities and environment
    this.tiger = new Tiger(this.camera);
    this.callCenter = new CallCenter();
    this.physics = new SimplePhysics();
    this.phoneShooter = new PhoneShooter(this.scene.scene);
    this.enemyManager = new EnemyManager(this.scene.scene);
    this.missionManager = new MissionManager();
    this.hud = new HUD();
    this.audio = new AudioManager();

    // Connect enemy manager to phone shooter
    this.phoneShooter.setEnemyManager(this.enemyManager);
    this.phoneShooter.setOnExplode(() => {
      this.audio.playExplode();
    });
    this.enemyManager.setOnKill((count) => {
      this.hud.updateKillCount(count);
      this.audio.playEnemyDeath();
    });

    this.setup();
  }

  private setup(): void {
    // Add environment to scene
    this.scene.add(this.callCenter.group);
    this.scene.add(this.tiger.mesh);

    // Setup physics colliders
    const colliders = this.callCenter.getColliders();
    this.physics.setColliders(colliders);
    this.phoneShooter.setColliders(colliders);
    this.enemyManager.setColliders(colliders);

    // Position tiger at center spawn
    this.tiger.setPosition(0, 0, 10);

    // Setup camera pointer lock
    this.camera.setupPointerLock(
      this.container,
      () => this.onPointerLock(),
      () => this.onPointerUnlock()
    );

    // Load departments into mission system
    const departments = this.callCenter.getDepartments();
    this.missionManager.loadDepartments(departments);

    // Setup mission callbacks
    this.missionManager.setOnMissionComplete((mission) => {
      this.hud.showMissionComplete(mission);
      this.audio.playMissionComplete();

      // Update progress
      const progress = this.missionManager.getProgress();
      this.hud.updateProgress(progress.completed, progress.total);

      // Auto-advance to next mission after delay
      setTimeout(() => {
        if (this.missionManager.advanceToNext()) {
          const next = this.missionManager.getActiveMission();
          this.hud.updateObjective(next);
        }
      }, 3500);
    });

    this.missionManager.setOnAllComplete(() => {
      setTimeout(() => {
        this.hud.showAllComplete();
      }, 3500);
    });

    // Setup start screen click handler
    this.startScreen.addEventListener('click', () => this.start());

    // Setup shooting on click
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.isRunning && this.camera.locked) {
        this.shoot();
      }
    });

    // M key toggles music
    let musicMuted = false;
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        musicMuted = !musicMuted;
        this.audio.setMusicVolume(musicMuted ? 0 : 0.3);
      }
    });

    // Start render loop (but game logic paused until started)
    this.animate();
  }

  private shoot(): void {
    const origin = this.camera.camera.position.clone();
    const direction = this.camera.getDirection();
    this.phoneShooter.shoot(origin, direction);
    this.audio.playShoot();
  }

  private start(): void {
    this.startScreen.style.display = 'none';
    this.hud.show();

    // Show initial objective and progress
    const activeMission = this.missionManager.getActiveMission();
    this.hud.updateObjective(activeMission);
    const progress = this.missionManager.getProgress();
    this.hud.updateProgress(progress.completed, progress.total);

    // Init audio on first user gesture
    this.audio.init();

    this.isRunning = true;
    this.container.requestPointerLock();
  }

  private onPointerLock(): void {
    if (this.startScreen.style.display !== 'none') {
      this.start();
    }
  }

  private onPointerUnlock(): void {
    // Game continues running, player can press ESC to pause
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    this.elapsedTime += deltaTime;

    if (this.isRunning && this.camera.locked) {
      this.update(deltaTime);
    }

    // Always update animations (gear spin, LED blink)
    this.callCenter.update(this.elapsedTime);

    this.render();
  };

  private update(deltaTime: number): void {
    // Store previous position
    const prevPosition = this.tiger.getPosition();

    // Update tiger (handles input and movement)
    this.tiger.update(deltaTime);

    // Check collision and correct position if needed
    const newPosition = this.tiger.getPosition();
    const movement = newPosition.clone().sub(prevPosition);

    const correctedMovement = this.physics.checkCollision(prevPosition, movement);

    if (!correctedMovement.equals(movement)) {
      this.tiger.setPosition(
        prevPosition.x + correctedMovement.x,
        prevPosition.y + correctedMovement.y,
        prevPosition.z + correctedMovement.z
      );
    }

    // Footstep sounds
    const vel = this.tiger.getVelocity();
    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    if (speed > 0.5) {
      const stepInterval = speed > 7 ? 0.25 : 0.38;
      this.footstepTimer += deltaTime;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        this.audio.playFootstep();
      }
    } else {
      this.footstepTimer = 0;
    }

    // Update mission progress
    this.missionManager.update(this.tiger.getPosition());

    // Update projectiles
    this.phoneShooter.update(deltaTime);

    // Update enemies
    this.enemyManager.update(deltaTime, this.tiger.getPosition());
  }

  private render(): void {
    this.scene.render(this.camera.camera);
  }
}
