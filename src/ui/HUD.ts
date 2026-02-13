import { Mission } from '../systems/MissionManager';
import type { ReviewLevel, AttackItem } from '../systems/BudgetManager';

const REVIEW_LABELS: Record<ReviewLevel, string> = {
  good: 'Good',
  needsImprovement: 'Needs Improvement',
  doesNotMeet: 'Does Not Meet Expectations',
  pip: 'PIP',
  fired: 'FIRED',
};

const REVIEW_COLORS: Record<ReviewLevel, string> = {
  good: '#4ade80',
  needsImprovement: '#facc15',
  doesNotMeet: '#f97316',
  pip: '#ef4444',
  fired: '#ff0000',
};

export class HUD {
  private hudElement: HTMLElement;
  private objectiveText: HTMLElement;
  private missionCompleteElement: HTMLElement;
  private progressElement: HTMLElement;
  private killCountElement: HTMLElement;
  private budgetDisplay: HTMLElement;
  private reviewDisplay: HTMLElement;
  private attackCardContainer: HTMLElement;
  private qbrWarning: HTMLElement;
  private rechargeIndicator: HTMLElement;
  private calendarDisplay: HTMLElement;
  private gameOverElement: HTMLElement;
  private gameOverReason: HTMLElement;
  private gameOverSubtitle: HTMLElement;
  private aiEventAlert: HTMLElement;
  private aiEventName: HTMLElement;
  private aiEventDesc: HTMLElement;
  private damageVignette: HTMLElement;
  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private waypointElement: HTMLElement;
  private waypointArrow: HTMLElement;
  private waypointDistance: HTMLElement;
  private difficultyDisplay: HTMLElement;

  private readonly MAX_CALENDAR = 8;
  private vignetteTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.hudElement = document.getElementById('hud')!;
    this.objectiveText = document.getElementById('objective-text')!;
    this.missionCompleteElement = document.getElementById('mission-complete')!;
    this.progressElement = document.getElementById('progress')!;
    this.killCountElement = document.getElementById('kill-count')!;
    this.budgetDisplay = document.getElementById('budget-display')!;
    this.reviewDisplay = document.getElementById('review-display')!;
    this.attackCardContainer = document.getElementById('attack-card-container')!;
    this.calendarDisplay = document.getElementById('calendar-display')!;
    this.qbrWarning = document.getElementById('qbr-warning')!;
    this.rechargeIndicator = document.getElementById('recharge-indicator')!;
    this.gameOverElement = document.getElementById('game-over')!;
    this.gameOverReason = document.getElementById('game-over-reason')!;
    this.gameOverSubtitle = document.getElementById('game-over-subtitle')!;
    this.aiEventAlert = document.getElementById('ai-event-alert')!;
    this.aiEventName = this.aiEventAlert.querySelector('.ai-event-name')!;
    this.aiEventDesc = this.aiEventAlert.querySelector('.ai-event-desc')!;
    this.damageVignette = document.getElementById('damage-vignette')!;
    this.minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    this.minimapCtx = this.minimapCanvas.getContext('2d')!;
    this.waypointElement = document.getElementById('objective-waypoint')!;
    this.waypointArrow = document.getElementById('waypoint-arrow')!;
    this.waypointDistance = document.getElementById('waypoint-distance')!;
    this.difficultyDisplay = document.getElementById('difficulty-display')!;
  }

  public show(): void {
    this.hudElement.style.display = 'block';
  }

  public hide(): void {
    this.hudElement.style.display = 'none';
  }

  public updateObjective(mission: Mission | null): void {
    if (mission) {
      this.objectiveText.textContent = mission.description;
    } else {
      this.objectiveText.textContent = 'No active objective';
    }
  }

  public updateProgress(completed: number, total: number): void {
    this.progressElement.textContent = `Departments visited: ${completed}/${total}`;
  }

  public showMissionComplete(mission: Mission): void {
    this.missionCompleteElement.style.display = 'block';
    const titleEl = this.missionCompleteElement.querySelector('h2');
    if (titleEl) {
      titleEl.textContent = `CHECKED IN!`;
    }
    const messageEl = this.missionCompleteElement.querySelector('p');
    if (messageEl) {
      messageEl.textContent = `Checked in with ${mission.name}!`;
    }

    setTimeout(() => {
      this.missionCompleteElement.style.display = 'none';
    }, 5000);
  }

  public updateKillCount(count: number): void {
    this.killCountElement.textContent = `Managers fired: ${count}`;
    this.killCountElement.style.color = '#ffffff';
    setTimeout(() => {
      this.killCountElement.style.color = '#ff6b6b';
    }, 150);
  }

  public showAllComplete(): void {
    this.missionCompleteElement.style.display = 'block';
    const titleEl = this.missionCompleteElement.querySelector('h2');
    if (titleEl) {
      titleEl.textContent = 'ALL DEPARTMENTS VISITED!';
    }
    const messageEl = this.missionCompleteElement.querySelector('p');
    if (messageEl) {
      messageEl.textContent = "You've built the flywheel!";
    }
    this.objectiveText.textContent = "All departments visited! You've built the flywheel!";
  }

  // ─── Budget/Damage HUD ─────────────────────────────────────

  public updateBudget(amount: number): void {
    this.budgetDisplay.textContent = `Budget: $${amount.toLocaleString()}`;
    if (amount < 0) {
      this.budgetDisplay.classList.add('negative');
    } else {
      this.budgetDisplay.classList.remove('negative');
    }
    // Scale pulse
    this.budgetDisplay.classList.add('pulse');
    setTimeout(() => this.budgetDisplay.classList.remove('pulse'), 150);
  }

  public updateReview(level: ReviewLevel): void {
    this.reviewDisplay.textContent = `Review: ${REVIEW_LABELS[level]}`;
    const color = REVIEW_COLORS[level];
    this.reviewDisplay.style.color = color;
    this.reviewDisplay.style.borderLeftColor = color;
  }

  public showAttackCard(attack: AttackItem, type: 'finance' | 'hr' | 'meeting', amount?: number, calendarSlots?: number): void {
    // Remove any existing card
    this.attackCardContainer.innerHTML = '';

    const card = document.createElement('div');
    card.className = `attack-card ${type}`;

    const emoji = document.createElement('span');
    emoji.className = 'card-emoji';
    emoji.textContent = attack.emoji;
    card.appendChild(emoji);

    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = attack.name;
    card.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'card-desc';
    desc.textContent = attack.description;
    card.appendChild(desc);

    const penalty = document.createElement('div');
    penalty.className = 'card-penalty';
    if (type === 'finance' && amount !== undefined) {
      penalty.textContent = `-$${amount.toLocaleString()}`;
    } else if (type === 'meeting') {
      if (calendarSlots !== undefined && calendarSlots >= this.MAX_CALENDAR) {
        penalty.textContent = 'CALENDAR FULL';
      } else {
        penalty.textContent = `Calendar: ${calendarSlots ?? 0}/${this.MAX_CALENDAR}`;
      }
    } else {
      penalty.textContent = `Review Escalated`;
    }
    card.appendChild(penalty);

    this.attackCardContainer.appendChild(card);

    // Clean up after animation completes
    setTimeout(() => {
      if (card.parentNode) card.parentNode.removeChild(card);
    }, 5800);
  }

  public updateCalendar(slots: number): void {
    this.calendarDisplay.textContent = `Calendar: ${slots}/${this.MAX_CALENDAR}`;
    // Color shift: green → yellow → orange → red as calendar fills
    const ratio = slots / this.MAX_CALENDAR;
    let color: string;
    if (ratio === 0) {
      color = '#4ade80';
    } else if (ratio < 0.5) {
      color = '#facc15';
    } else if (ratio < 0.875) {
      color = '#f97316';
    } else {
      color = '#ef4444';
    }
    this.calendarDisplay.style.color = color;
    this.calendarDisplay.style.borderLeftColor = color;
    // Pulse on change
    this.calendarDisplay.classList.add('pulse');
    setTimeout(() => this.calendarDisplay.classList.remove('pulse'), 150);
  }

  public showUnlockNotification(message: string): void {
    const el = document.createElement('div');
    el.className = 'unlock-notification';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 7000);
  }

  public showQBRWarning(visible: boolean): void {
    this.qbrWarning.style.display = visible ? 'block' : 'none';
  }

  public showRechargeIndicator(visible: boolean, cooldown?: number): void {
    this.rechargeIndicator.style.display = visible ? 'block' : 'none';
    if (visible && cooldown !== undefined && cooldown > 0) {
      this.rechargeIndicator.textContent = `Finance Dept: Recharge in ${Math.ceil(cooldown)}s`;
      this.rechargeIndicator.style.borderColor = '#888';
      this.rechargeIndicator.style.color = '#888';
    } else if (visible) {
      this.rechargeIndicator.textContent = 'Finance Dept: Budget Recharge Available';
      this.rechargeIndicator.style.borderColor = '#4ade80';
      this.rechargeIndicator.style.color = '#4ade80';
    }
  }

  public showGameOver(reason: string): void {
    const subtitles = [
      'Please return your badge and laptop to HR',
      'Your desk has already been reassigned',
      'Security will escort you out shortly',
      'Your parking spot has been reallocated',
      'Your email will be deactivated in 30 minutes',
    ];
    this.gameOverReason.textContent = reason;
    this.gameOverSubtitle.textContent = subtitles[Math.floor(Math.random() * subtitles.length)];
    this.gameOverElement.style.display = 'flex';
  }

  public hideGameOver(): void {
    this.gameOverElement.style.display = 'none';
  }

  public showAIEvent(name: string, description: string): void {
    this.aiEventName.textContent = name;
    this.aiEventDesc.textContent = `"${description}"`;
    this.aiEventAlert.style.display = 'block';
  }

  public hideAIEvent(): void {
    this.aiEventAlert.style.display = 'none';
  }

  public showAIEventComplete(name: string): void {
    this.hideAIEvent();
    const el = document.createElement('div');
    el.className = 'unlock-notification';
    el.style.borderColor = '#06b6d4';
    el.style.color = '#06b6d4';
    el.style.boxShadow = '0 0 40px rgba(6, 182, 212, 0.4)';
    el.textContent = `Checked out ${name} — back to work!`;
    document.body.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 5000);
  }

  // ─── Damage Vignette ──────────────────────────────────────

  public flashDamageVignette(type: 'finance' | 'hr' | 'meeting'): void {
    // Clear any existing flash
    if (this.vignetteTimer) clearTimeout(this.vignetteTimer);
    this.damageVignette.className = '';

    // Apply color class
    if (type === 'finance') {
      this.damageVignette.classList.add('flash-green');
    } else if (type === 'hr') {
      this.damageVignette.classList.add('flash-purple');
    } else {
      this.damageVignette.classList.add('flash-blue');
    }

    this.damageVignette.style.opacity = '1';
    this.vignetteTimer = setTimeout(() => {
      this.damageVignette.style.opacity = '0';
    }, 200);
  }

  // ─── Minimap ──────────────────────────────────────────────

  public updateMinimap(
    playerX: number, playerZ: number, playerRotation: number,
    departments: { x: number; z: number; id: string }[],
    enemies: { x: number; z: number; type: string }[]
  ): void {
    const ctx = this.minimapCtx;
    const w = 160;
    const h = 160;
    const scale = 1.2; // world units per pixel

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Draw departments as diamonds
    for (const dept of departments) {
      const dx = (dept.x - playerX) / scale;
      const dz = (dept.z - playerZ) / scale;
      // Rotate relative to player facing
      const rx = dx * Math.cos(-playerRotation) - dz * Math.sin(-playerRotation);
      const ry = dx * Math.sin(-playerRotation) + dz * Math.cos(-playerRotation);
      const sx = cx + rx;
      const sy = cy + ry;

      if (sx < -5 || sx > w + 5 || sy < -5 || sy > h + 5) continue;

      ctx.fillStyle = '#ff6b35';
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }

    // Draw enemies as small dots
    const enemyColors: Record<string, string> = {
      financeGoblin: '#4ade80',
      hrEnforcer: '#a855f7',
      manager: '#3b82f6',
      salesBro: '#3b82f6',
      itZombie: '#3b82f6',
      executive: '#ffd700',
    };
    for (const e of enemies) {
      const dx = (e.x - playerX) / scale;
      const dz = (e.z - playerZ) / scale;
      const rx = dx * Math.cos(-playerRotation) - dz * Math.sin(-playerRotation);
      const ry = dx * Math.sin(-playerRotation) + dz * Math.cos(-playerRotation);
      const sx = cx + rx;
      const sy = cy + ry;

      if (sx < 0 || sx > w || sy < 0 || sy > h) continue;

      ctx.fillStyle = enemyColors[e.type] ?? '#ff4444';
      ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
    }

    // Draw player (center triangle pointing up)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx - 4, cy + 4);
    ctx.lineTo(cx + 4, cy + 4);
    ctx.closePath();
    ctx.fill();
  }

  // ─── Objective Waypoint ───────────────────────────────────

  public updateWaypoint(
    playerX: number, playerZ: number,
    targetX: number, targetZ: number,
    cameraYaw: number
  ): void {
    const dx = targetX - playerX;
    const dz = targetZ - playerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 4) {
      this.waypointElement.style.display = 'none';
      return;
    }

    // Angle from player to target in world space
    const angleToTarget = Math.atan2(dx, dz);
    // Relative angle (how far off-center the target is)
    let relAngle = angleToTarget - cameraYaw;
    // Normalize to [-PI, PI]
    while (relAngle > Math.PI) relAngle -= 2 * Math.PI;
    while (relAngle < -Math.PI) relAngle += 2 * Math.PI;

    // Only show waypoint when target is roughly off-screen (outside ~45deg FOV)
    if (Math.abs(relAngle) < 0.4) {
      this.waypointElement.style.display = 'none';
      return;
    }

    this.waypointElement.style.display = 'block';

    // Position arrow at screen edge
    const radius = 120;
    const arrowX = Math.sin(relAngle) * radius;
    const arrowY = -Math.cos(relAngle) * Math.min(radius, 80);

    this.waypointArrow.style.transform = `translate(${arrowX}px, ${arrowY}px) rotate(${relAngle}rad)`;
    this.waypointDistance.style.transform = `translate(${arrowX}px, ${arrowY + 20}px)`;
    this.waypointDistance.textContent = `${Math.round(dist)}m`;
  }

  public hideWaypoint(): void {
    this.waypointElement.style.display = 'none';
  }

  // ─── Difficulty Display ───────────────────────────────────

  public updateDifficulty(tier: number): void {
    const labels = ['', 'INTERN', 'ASSOCIATE', 'SENIOR', 'DIRECTOR', 'VP'];
    this.difficultyDisplay.textContent = `Tier ${tier}: ${labels[tier] ?? ''}`;
    // Color escalation
    const colors = ['', '#4ade80', '#facc15', '#f97316', '#ef4444', '#ff0000'];
    const color = colors[tier] ?? '#ff6b35';
    this.difficultyDisplay.style.color = color;
    this.difficultyDisplay.style.borderLeftColor = color;
  }

  public resetBudgetHUD(): void {
    this.updateBudget(10000);
    this.updateReview('good');
    this.updateCalendar(0);
    this.hideGameOver();
    this.showQBRWarning(false);
    this.showRechargeIndicator(false);
    this.hideAIEvent();
    this.hideWaypoint();
    this.updateDifficulty(1);
    this.attackCardContainer.innerHTML = '';
    this.damageVignette.style.opacity = '0';
  }
}
