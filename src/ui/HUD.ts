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
  private gameOverElement: HTMLElement;
  private gameOverReason: HTMLElement;
  private gameOverSubtitle: HTMLElement;

  constructor() {
    this.hudElement = document.getElementById('hud')!;
    this.objectiveText = document.getElementById('objective-text')!;
    this.missionCompleteElement = document.getElementById('mission-complete')!;
    this.progressElement = document.getElementById('progress')!;
    this.killCountElement = document.getElementById('kill-count')!;
    this.budgetDisplay = document.getElementById('budget-display')!;
    this.reviewDisplay = document.getElementById('review-display')!;
    this.attackCardContainer = document.getElementById('attack-card-container')!;
    this.qbrWarning = document.getElementById('qbr-warning')!;
    this.rechargeIndicator = document.getElementById('recharge-indicator')!;
    this.gameOverElement = document.getElementById('game-over')!;
    this.gameOverReason = document.getElementById('game-over-reason')!;
    this.gameOverSubtitle = document.getElementById('game-over-subtitle')!;
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

  public showAttackCard(attack: AttackItem, type: 'finance' | 'hr', amount?: number): void {
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

  public resetBudgetHUD(): void {
    this.updateBudget(10000);
    this.updateReview('good');
    this.hideGameOver();
    this.showQBRWarning(false);
    this.showRechargeIndicator(false);
    this.attackCardContainer.innerHTML = '';
  }
}
