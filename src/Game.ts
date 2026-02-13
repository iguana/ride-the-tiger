import * as THREE from 'three';
import { GameScene } from './core/Scene';
import { FirstPersonCamera } from './core/Camera';
import { Tiger } from './entities/Tiger';
import { EnemyManager } from './entities/EnemyManager';
import { CallCenter } from './environment/CallCenter';
import { MissionManager } from './systems/MissionManager';
import { SimplePhysics } from './systems/Physics';
import { PhoneShooter } from './systems/PhoneShooter';
import { BudgetManager } from './systems/BudgetManager';
import { HUD } from './ui/HUD';
import { AudioManager } from './systems/AudioManager';
import { AICompanion } from './entities/AICompanion';
import { getLevelByIndex, getLevel, type LevelDefinition } from './levels';

export class Game {
  private scene: GameScene;
  private camera: FirstPersonCamera;
  private tiger: Tiger;
  private enemyManager: EnemyManager;
  private callCenter: CallCenter;
  private missionManager: MissionManager;
  private physics: SimplePhysics;
  private phoneShooter: PhoneShooter;
  private budgetManager: BudgetManager;
  private hud: HUD;
  private audio: AudioManager;
  private companion: AICompanion;
  private level: LevelDefinition;

  private clock: THREE.Clock;
  private elapsedTime: number = 0;
  private isRunning: boolean = false;
  private gameOver: boolean = false;
  private footstepTimer: number = 0;

  // Pre-allocated scratch vectors to avoid per-frame allocation
  private readonly _prevPos = new THREE.Vector3();
  private readonly _movement = new THREE.Vector3();
  private readonly _warpDelta = new THREE.Vector3();
  private readonly _financeDelta = new THREE.Vector3();

  private warpDoors: { position: THREE.Vector3; targetLevelId: string }[] = [];
  private warpCooldown: number = 0;

  // QBR system
  private qbrTimer: number = 0;
  private readonly QBR_INTERVAL = 60;
  private readonly QBR_WARNING_TIME = 5;
  private readonly QBR_SPEED = 5;
  private qbrActive: boolean = false;
  private qbrPlane: THREE.Mesh | null = null;
  private qbrPlaneZ: number = 0;
  private qbrStartZ: number = -130;
  private qbrEndZ: number = 160;
  private qbrWarningShown: boolean = false;
  private qbrHitPlayer: boolean = false;

  // AI model event system
  private aiEventTimer: number = 0;
  private readonly AI_EVENT_INTERVAL = 90;
  private aiEventActive: boolean = false;
  private aiEventModelName: string = '';
  private readonly CTO_POSITION = new THREE.Vector3(40, 0, -45);
  private readonly CTO_RANGE = 4;
  private readonly _ctoDelta = new THREE.Vector3();
  private static readonly AI_MODELS = [
    { name: 'Claude 5.0 Opus', description: 'It can write its own JIRA tickets now' },
    { name: 'GPT-7 Turbo', description: "This one definitely won't hallucinate" },
    { name: 'Gemini Ultra 3.0', description: 'Google says this changes everything. Again' },
    { name: 'LLaMA 5 Uncensored', description: 'Your GPU is already crying' },
    { name: 'Mistral XXL', description: 'The French model that speaks Assembly' },
    { name: 'Grok 4.20', description: "Elon says it's the best. No bias" },
    { name: 'DeepSeek R2', description: 'Thinks for 47 minutes before answering' },
    { name: 'Anthropic Haiku 6.0', description: 'Writes poetry about your code reviews' },
    { name: 'Perplexity Sovereign', description: 'It Googles stuff but with confidence' },
    { name: 'Cohere Command X', description: 'Enterprise-ready. Whatever that means' },
  ];

  // Difficulty tier timer
  private difficultyTimer: number = 0;
  private readonly DIFFICULTY_INTERVAL = 90;

  // Finance recharge zone
  private readonly FINANCE_POSITION = new THREE.Vector3(25, 0, 50);
  private readonly FINANCE_RECHARGE_RANGE = 5;

  private startScreen: HTMLElement;
  private container: HTMLElement;
  private gameOverElement: HTMLElement;

  constructor() {
    this.container = document.getElementById('game-container')!;
    this.startScreen = document.getElementById('start-screen')!;
    this.gameOverElement = document.getElementById('game-over')!;

    // Initialize core systems
    this.scene = new GameScene(this.container);
    this.camera = new FirstPersonCamera();
    this.clock = new THREE.Clock();

    // Load level (default to level 1)
    this.level = getLevelByIndex(0);

    // Initialize entities and environment
    this.tiger = new Tiger(this.camera);
    this.callCenter = new CallCenter(this.level);
    this.physics = new SimplePhysics();
    this.phoneShooter = new PhoneShooter(this.scene.scene);
    this.enemyManager = new EnemyManager(this.scene.scene);
    this.missionManager = new MissionManager();
    this.budgetManager = new BudgetManager();
    this.hud = new HUD();
    this.audio = new AudioManager();
    this.companion = new AICompanion();
    this.companion.attach(this.tiger.mesh);

    // Connect enemy manager to phone shooter
    this.phoneShooter.setEnemyManager(this.enemyManager);
    this.phoneShooter.setOnExplode(() => {
      this.audio.playExplode();
    });
    this.enemyManager.setOnKill((count) => {
      this.hud.updateKillCount(count);
      this.audio.playEnemyDeath();
      this.budgetManager.addKillReward();
      this.budgetManager.applyKillMilestone(count);
    });

    // Wire enemy damage -> budget manager + feedback
    this.enemyManager.setOnPlayerDamage((type) => {
      if (this.gameOver) return;
      this.audio.playDamageHit();
      this.camera.applyShake(0.15);
      if (type === 'financeGoblin') {
        this.budgetManager.stealBudget();
        this.audio.playBudgetSteal();
        this.hud.flashDamageVignette('finance');
      } else if (type === 'hrEnforcer') {
        this.budgetManager.escalateReview();
        this.audio.playReview();
        this.hud.flashDamageVignette('hr');
      } else {
        // manager, salesBro, itZombie, executive → schedule meeting
        this.budgetManager.scheduleMeeting();
        this.audio.playMeeting();
        this.hud.flashDamageVignette('meeting');
      }
    });

    // Wire budget manager callbacks -> HUD
    this.budgetManager.setOnExpense((amount, attack) => {
      this.hud.showAttackCard(attack, 'finance', amount);
    });
    this.budgetManager.setOnBudgetChange((budget) => {
      this.hud.updateBudget(budget);
    });
    this.budgetManager.setOnReviewChange((level, attack) => {
      this.hud.updateReview(level);
      this.hud.showAttackCard(attack, 'hr');
    });
    this.budgetManager.setOnMeeting((slots, attack) => {
      this.hud.showAttackCard(attack, 'meeting', undefined, slots);
    });
    this.budgetManager.setOnCalendarChange((slots) => {
      this.hud.updateCalendar(slots);
    });
    this.budgetManager.setOnFired((reason) => {
      this.triggerGameOver(reason);
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

    // Load spawn zones from level definition
    this.enemyManager.setSpawnZones(this.level.spawnZones);

    // Position tiger at level-defined spawn
    this.tiger.setPosition(...this.level.playerSpawn);

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

      // Visiting People (HR) resets review status
      if (mission.id === 'people') {
        this.budgetManager.resetReview();
      }

      // Unlock AI companion after 2 objectives
      if (progress.completed === 2 && !this.companion.mesh.visible) {
        this.companion.setVisible(true);
        this.hud.showUnlockNotification('THE AI HAS JOINED YOU');
      }

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
      if (e.button === 0 && this.isRunning && this.camera.locked && !this.gameOver) {
        this.shoot();
      }
    });

    // Game over click-to-restart
    this.gameOverElement.addEventListener('click', () => {
      if (this.gameOver) {
        this.restart();
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

    // Cache warp door positions
    this.warpDoors = this.callCenter.getWarpDoors();

    // Start render loop (but game logic paused until started)
    this.animate();
  }

  private shoot(): void {
    const origin = this.camera.camera.position.clone();
    const direction = this.camera.getDirection();
    this.phoneShooter.shoot(origin, direction);
    this.audio.playShoot();
    this.camera.applyRecoil();
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
    this.audio.playAmbient();

    // Init difficulty display
    this.hud.updateDifficulty(1);

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

  private triggerGameOver(reason: string): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.audio.playFired();
    this.audio.stopAmbient();
    this.camera.applyShake(0.4);
    this.hud.showGameOver(reason);
    document.exitPointerLock();
  }

  private restart(): void {
    this.gameOver = false;
    this.hud.hideGameOver();
    this.hud.resetBudgetHUD();
    this.budgetManager.reset();

    // Clean up QBR plane if active
    if (this.qbrPlane) {
      this.scene.scene.remove(this.qbrPlane);
      (this.qbrPlane.material as THREE.Material).dispose();
      this.qbrPlane.geometry.dispose();
      this.qbrPlane = null;
    }
    this.qbrActive = false;
    this.qbrTimer = 0;
    this.qbrWarningShown = false;
    this.qbrHitPlayer = false;

    // Reset AI event
    this.aiEventTimer = 0;
    this.aiEventActive = false;

    // Reset difficulty
    this.difficultyTimer = 0;
    this.enemyManager.setDifficultyTier(1);
    this.hud.updateDifficulty(1);

    // Restart ambient audio
    this.audio.playAmbient();

    // Teardown and rebuild level
    this.scene.scene.remove(this.callCenter.group);
    this.enemyManager.clear();
    this.phoneShooter.clear();

    this.callCenter = new CallCenter(this.level);
    this.scene.add(this.callCenter.group);

    const colliders = this.callCenter.getColliders();
    this.physics.setColliders(colliders);
    this.phoneShooter.setColliders(colliders);
    this.enemyManager.setColliders(colliders);

    this.enemyManager.setSpawnZones(this.level.spawnZones);
    const departments = this.callCenter.getDepartments();
    this.missionManager.loadDepartments(departments);

    const activeMission = this.missionManager.getActiveMission();
    this.hud.updateObjective(activeMission);
    const progress = this.missionManager.getProgress();
    this.hud.updateProgress(progress.completed, progress.total);
    this.hud.updateKillCount(0);

    this.tiger.setPosition(...this.level.playerSpawn);
    this.warpDoors = this.callCenter.getWarpDoors();
    this.warpCooldown = 1.0;
    this.elapsedTime = 0;

    // Reset companion
    this.companion.setVisible(false);

    this.container.requestPointerLock();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    this.elapsedTime += deltaTime;

    if (this.isRunning && this.camera.locked && !this.gameOver) {
      this.update(deltaTime);
    }

    // Always update animations (gear spin, LED blink)
    this.callCenter.update(this.elapsedTime);

    this.render();
  };

  private update(deltaTime: number): void {
    // Store previous position (copy since getPosition returns the live reference)
    this._prevPos.copy(this.tiger.getPosition());

    // Update tiger (handles input and movement)
    this.tiger.update(deltaTime);

    // Check collision and correct position if needed
    const newPosition = this.tiger.getPosition();
    this._movement.copy(newPosition).sub(this._prevPos);

    const correctedMovement = this.physics.checkCollision(this._prevPos, this._movement);

    if (!correctedMovement.equals(this._movement)) {
      this.tiger.setPosition(
        this._prevPos.x + correctedMovement.x,
        this._prevPos.y + correctedMovement.y,
        this._prevPos.z + correctedMovement.z
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

    // Update budget cooldowns + calendar auto-decay
    this.budgetManager.updateCooldown(deltaTime);
    this.budgetManager.updateCalendarDecay(deltaTime);

    // Camera effects (shake + recoil)
    this.camera.updateEffects(deltaTime);

    // Difficulty ramp
    this.updateDifficulty(deltaTime);

    // Update AI companion animations
    this.companion.update(deltaTime);

    // Finance recharge zone
    this.updateFinanceRecharge(deltaTime);

    // QBR system
    this.updateQBR(deltaTime);

    // AI model event system
    this.updateAIEvent(deltaTime);

    // Minimap
    this.updateMinimap();

    // Objective waypoint
    this.updateWaypoint();

    // Check warp door proximity
    if (this.warpCooldown > 0) {
      this.warpCooldown -= deltaTime;
    } else {
      const playerPos = this.tiger.getPosition();
      for (const door of this.warpDoors) {
        this._warpDelta.copy(playerPos).sub(door.position);
        this._warpDelta.y = 0;
        if (this._warpDelta.length() < 3) {
          this.loadLevel(door.targetLevelId);
          break;
        }
      }
    }
  }

  private updateFinanceRecharge(deltaTime: number): void {
    const playerPos = this.tiger.getPosition();
    this._financeDelta.copy(playerPos).sub(this.FINANCE_POSITION);
    this._financeDelta.y = 0;
    const dist = this._financeDelta.length();

    if (dist < this.FINANCE_RECHARGE_RANGE) {
      const cooldown = this.budgetManager.getRechargeCooldown();
      if (cooldown <= 0) {
        if (this.budgetManager.tryRecharge(deltaTime)) {
          this.audio.playRecharge();
          this.hud.showRechargeIndicator(true);
          // Hide after brief display
          setTimeout(() => {
            this.hud.showRechargeIndicator(false);
          }, 2000);
        }
      } else {
        this.hud.showRechargeIndicator(true, cooldown);
      }
    } else {
      this.hud.showRechargeIndicator(false);
    }
  }

  private updateQBR(deltaTime: number): void {
    if (this.qbrActive) {
      // Move QBR plane slowly across the level
      this.qbrPlaneZ += this.QBR_SPEED * deltaTime;

      if (this.qbrPlane) {
        this.qbrPlane.position.z = this.qbrPlaneZ;
      }

      // Apply charts to enemies as wave passes
      this.enemyManager.applyQBRWave(this.qbrPlaneZ);

      // Check if wave reaches player
      const playerZ = this.tiger.getPosition().z;
      if (!this.qbrHitPlayer && this.qbrPlaneZ >= playerZ) {
        this.qbrHitPlayer = true;
        this.audio.playQBR();
        this.camera.applyShake(0.25);
        this.budgetManager.applyQBROverhead();
        this.budgetManager.checkQBR();
      }

      // End QBR when plane exits level
      if (this.qbrPlaneZ > this.qbrEndZ) {
        this.endQBR();
      }
    } else {
      this.qbrTimer += deltaTime;

      // Warning phase
      if (this.qbrTimer >= this.QBR_INTERVAL - this.QBR_WARNING_TIME && !this.qbrWarningShown) {
        this.qbrWarningShown = true;
        this.hud.showQBRWarning(true);
        this.audio.playQBRStart();
      }

      // Start QBR
      if (this.qbrTimer >= this.QBR_INTERVAL) {
        this.startQBR();
      }
    }
  }

  private startQBR(): void {
    this.qbrActive = true;
    this.qbrTimer = 0;
    this.qbrWarningShown = false;
    this.qbrHitPlayer = false;
    this.qbrPlaneZ = this.qbrStartZ;
    this.hud.showQBRWarning(false);

    // Create translucent golden plane
    const geometry = new THREE.PlaneGeometry(300, 20);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    this.qbrPlane = new THREE.Mesh(geometry, material);
    this.qbrPlane.position.set(0, 5, this.qbrStartZ);
    this.qbrPlane.rotation.y = Math.PI / 2;
    this.scene.scene.add(this.qbrPlane);
  }

  private endQBR(): void {
    this.qbrActive = false;
    if (this.qbrPlane) {
      this.scene.scene.remove(this.qbrPlane);
      (this.qbrPlane.material as THREE.Material).dispose();
      this.qbrPlane.geometry.dispose();
      this.qbrPlane = null;
    }
  }

  private updateAIEvent(deltaTime: number): void {
    if (this.aiEventActive) {
      // Check player proximity to CTO office
      const playerPos = this.tiger.getPosition();
      this._ctoDelta.copy(playerPos).sub(this.CTO_POSITION);
      this._ctoDelta.y = 0;
      if (this._ctoDelta.length() < this.CTO_RANGE) {
        this.aiEventActive = false;
        this.aiEventTimer = 0;
        this.hud.showAIEventComplete(this.aiEventModelName);
        this.audio.playMissionComplete();
      }
    } else {
      this.aiEventTimer += deltaTime;
      if (this.aiEventTimer >= this.AI_EVENT_INTERVAL) {
        // Trigger new AI event
        const model = Game.AI_MODELS[Math.floor(Math.random() * Game.AI_MODELS.length)];
        this.aiEventModelName = model.name;
        this.aiEventActive = true;
        this.aiEventTimer = 0;
        this.hud.showAIEvent(model.name, model.description);
        this.audio.playAIEvent();
      }
    }
  }

  private updateDifficulty(deltaTime: number): void {
    this.difficultyTimer += deltaTime;
    if (this.difficultyTimer >= this.DIFFICULTY_INTERVAL) {
      this.difficultyTimer = 0;
      const currentTier = this.enemyManager.getDifficultyTier();
      if (currentTier < 5) {
        const newTier = currentTier + 1;
        this.enemyManager.setDifficultyTier(newTier);
        this.hud.updateDifficulty(newTier);
      }
    }
  }

  private updateMinimap(): void {
    const playerPos = this.tiger.getPosition();
    const forward = this.camera.getForward();
    const rotation = Math.atan2(forward.x, forward.z);

    // Gather department positions from mission manager
    const missions = this.missionManager.getMissions();
    const departments = missions.map(m => ({
      x: m.targetPosition.x,
      z: m.targetPosition.z,
      id: m.id,
    }));

    const enemies = this.enemyManager.getEnemyPositions();

    this.hud.updateMinimap(playerPos.x, playerPos.z, rotation, departments, enemies);
  }

  private updateWaypoint(): void {
    const mission = this.missionManager.getActiveMission();
    if (!mission) {
      this.hud.hideWaypoint();
      return;
    }

    const playerPos = this.tiger.getPosition();
    const forward = this.camera.getForward();
    const yaw = Math.atan2(forward.x, forward.z);

    this.hud.updateWaypoint(
      playerPos.x, playerPos.z,
      mission.targetPosition.x, mission.targetPosition.z,
      yaw
    );
  }

  private loadLevel(levelId: string): void {
    const newLevel = getLevel(levelId);
    if (!newLevel) return;

    // Teardown current level
    this.scene.scene.remove(this.callCenter.group);
    this.enemyManager.clear();
    this.phoneShooter.clear();

    // Clean up QBR
    this.endQBR();
    this.qbrTimer = 0;
    this.qbrWarningShown = false;

    // Build new level
    this.level = newLevel;
    this.callCenter = new CallCenter(this.level);
    this.scene.add(this.callCenter.group);

    // Re-register colliders
    const colliders = this.callCenter.getColliders();
    this.physics.setColliders(colliders);
    this.phoneShooter.setColliders(colliders);
    this.enemyManager.setColliders(colliders);

    // Load spawn zones and departments
    this.enemyManager.setSpawnZones(this.level.spawnZones);
    const departments = this.callCenter.getDepartments();
    this.missionManager.loadDepartments(departments);

    // Reset mission UI
    const activeMission = this.missionManager.getActiveMission();
    this.hud.updateObjective(activeMission);
    const progress = this.missionManager.getProgress();
    this.hud.updateProgress(progress.completed, progress.total);
    this.hud.updateKillCount(0);

    // Reposition player at new spawn
    this.tiger.setPosition(...this.level.playerSpawn);

    // Cache new warp doors
    this.warpDoors = this.callCenter.getWarpDoors();
    this.warpCooldown = 1.0;
  }

  private render(): void {
    this.scene.render(this.camera.camera);
  }
}
