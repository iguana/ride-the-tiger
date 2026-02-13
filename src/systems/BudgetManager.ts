export type ReviewLevel = 'good' | 'needsImprovement' | 'doesNotMeet' | 'pip' | 'fired';

const REVIEW_ORDER: ReviewLevel[] = ['good', 'needsImprovement', 'doesNotMeet', 'pip', 'fired'];

export interface AttackItem {
  emoji: string;
  name: string;
  description: string;
  minAmount?: number;
  maxAmount?: number;
}

export const FINANCE_ATTACKS: AttackItem[] = [
  { emoji: '☕', name: 'BLOCKCHAIN COFFEE MAKER', description: 'Lease: $647/month, ROI: undefined', minAmount: 400, maxAmount: 800 },
  { emoji: '🪑', name: 'ERGONOMIC STANDING DESK', description: 'Also kneels, bows, and genuflects', minAmount: 300, maxAmount: 700 },
  { emoji: '🤖', name: 'AI SUGGESTION BOX', description: 'Suggests more AI suggestion boxes', minAmount: 500, maxAmount: 900 },
  { emoji: '🧘', name: 'MINDFULNESS GONG', description: 'For standups. Doubles as conflict resolution', minAmount: 200, maxAmount: 500 },
  { emoji: '🎪', name: 'SYNERGY CONSULTANT', description: 'Optimizes the optimization of optimizers', minAmount: 600, maxAmount: 1000 },
  { emoji: '🫘', name: 'ARTISANAL POST-ITS', description: 'Organic, free-range, non-GMO sticky notes', minAmount: 150, maxAmount: 400 },
  { emoji: '☁️', name: 'CLOUD MIGRATION', description: 'Migrating the cloud migration to a new cloud', minAmount: 500, maxAmount: 900 },
  { emoji: '🎯', name: 'QUARTERLY PIVOT CAKE', description: 'Celebrating our 14th pivot this quarter', minAmount: 200, maxAmount: 500 },
  { emoji: '🏊', name: 'DEVOPS INFINITY POOL', description: 'It\'s a pool table. Shaped like infinity. In the server room', minAmount: 400, maxAmount: 800 },
  { emoji: '💎', name: 'ALIGNMENT CRYSTALS', description: 'Cross-functional chakra rebalancing stones', minAmount: 300, maxAmount: 600 },
];

export const MEETING_ATTACKS: AttackItem[] = [
  { emoji: '📅', name: 'SPRINT RETROSPECTIVE', description: 'Discussing what went wrong discussing what went wrong' },
  { emoji: '📊', name: 'QUARTERLY PLANNING', description: 'Planning the plan for the planning meeting' },
  { emoji: '🪮', name: 'BACKLOG GROOMING', description: 'Grooming the backlog of grooming sessions' },
  { emoji: '👥', name: 'MANDATORY 1:1', description: "Your manager's manager wants to 'touch base'" },
  { emoji: '📣', name: 'ALL-HANDS MEETING', description: 'CEO reads the slide deck you already read' },
  { emoji: '🔄', name: 'SYNC-UP', description: 'Syncing about the sync. Pre-sync optional' },
  { emoji: '💡', name: 'BRAINSTORM SESSION', description: 'Innovation theater. Post-its mandatory' },
  { emoji: '📈', name: 'STATUS UPDATE', description: 'Updating the status of the status updates' },
  { emoji: '🎯', name: 'OKR ALIGNMENT', description: 'Aligning the alignment of aligned objectives' },
  { emoji: '☕', name: 'COFFEE CHAT', description: 'Not optional. HR is watching' },
];

export const HR_ATTACKS: AttackItem[] = [
  { emoji: '📋', name: 'EXCESSIVE ENTHUSIASM', description: 'Smiling in meetings is now a policy violation' },
  { emoji: '🚨', name: 'UNAUTHORIZED INNOVATION', description: 'Thinking outside the box without Form 27-B' },
  { emoji: '⏰', name: 'CLOCK CRIME', description: 'Arrived 37 seconds early. Reported to timekeeping', },
  { emoji: '🍕', name: 'PIZZA PROTOCOL BREACH', description: 'Took 2 slices at the team lunch. Limit is 1.5', },
  { emoji: '👔', name: 'CASUAL FRIDAY VIOLATION', description: 'Your khakis were 3% too casual', },
  { emoji: '📎', name: 'PAPERCLIP AUDIT', description: 'Used 4 paperclips this month. Budget allows 3', },
  { emoji: '🤝', name: 'UNSANCTIONED HANDSHAKE', description: 'Greeted a colleague without CC\'ing their manager', },
  { emoji: '🪴', name: 'DESK PLANT INFRACTION', description: 'Plant exceeds maximum allowed desk vegetation height', },
  { emoji: '💬', name: 'WATERCOOLER OVERUSE', description: 'Exceeded small talk quota by 2.3 minutes', },
  { emoji: '🎧', name: 'HEADPHONE OPACITY', description: 'Headphones deemed "too noise-canceling" for open office', },
];

export class BudgetManager {
  private budget: number = 10000;
  private reviewLevel: ReviewLevel = 'good';
  private rechargeCooldown: number = 0;
  private readonly RECHARGE_COOLDOWN = 20;
  private readonly RECHARGE_AMOUNT = 2000;

  private calendarSlots: number = 0;
  private readonly MAX_CALENDAR = 8;
  private calendarDecayTimer: number = 0;
  private readonly CALENDAR_DECAY_INTERVAL = 45;

  private onExpense: ((amount: number, attack: AttackItem) => void) | null = null;
  private onReviewChange: ((level: ReviewLevel, attack: AttackItem) => void) | null = null;
  private onBudgetChange: ((budget: number) => void) | null = null;
  private onFired: ((reason: string) => void) | null = null;
  private onMeeting: ((slots: number, attack: AttackItem) => void) | null = null;
  private onCalendarChange: ((slots: number) => void) | null = null;

  public getBudget(): number {
    return this.budget;
  }

  public getReviewLevel(): ReviewLevel {
    return this.reviewLevel;
  }

  public setOnExpense(cb: (amount: number, attack: AttackItem) => void): void {
    this.onExpense = cb;
  }

  public setOnReviewChange(cb: (level: ReviewLevel, attack: AttackItem) => void): void {
    this.onReviewChange = cb;
  }

  public setOnBudgetChange(cb: (budget: number) => void): void {
    this.onBudgetChange = cb;
  }

  public setOnFired(cb: (reason: string) => void): void {
    this.onFired = cb;
  }

  public setOnMeeting(cb: (slots: number, attack: AttackItem) => void): void {
    this.onMeeting = cb;
  }

  public setOnCalendarChange(cb: (slots: number) => void): void {
    this.onCalendarChange = cb;
  }

  public stealBudget(): number {
    const attack = FINANCE_ATTACKS[Math.floor(Math.random() * FINANCE_ATTACKS.length)];
    const min = attack.minAmount ?? 200;
    const max = attack.maxAmount ?? 800;
    const amount = min + Math.floor(Math.random() * (max - min));
    this.budget -= amount;
    this.onExpense?.(amount, attack);
    this.onBudgetChange?.(this.budget);
    return amount;
  }

  public getCalendarSlots(): number {
    return this.calendarSlots;
  }

  public scheduleMeeting(): void {
    const attack = MEETING_ATTACKS[Math.floor(Math.random() * MEETING_ATTACKS.length)];
    if (this.calendarSlots < this.MAX_CALENDAR) {
      this.calendarSlots++;
      this.onMeeting?.(this.calendarSlots, attack);
      this.onCalendarChange?.(this.calendarSlots);
    } else {
      // Calendar full — escalate review instead
      this.onMeeting?.(this.calendarSlots, attack);
      this.escalateReview();
    }
  }

  public clearCalendar(): void {
    this.calendarSlots = 0;
    this.onCalendarChange?.(this.calendarSlots);
  }

  public escalateReview(): void {
    const idx = REVIEW_ORDER.indexOf(this.reviewLevel);
    if (idx < REVIEW_ORDER.length - 1) {
      this.reviewLevel = REVIEW_ORDER[idx + 1];
      const attack = HR_ATTACKS[Math.floor(Math.random() * HR_ATTACKS.length)];
      this.onReviewChange?.(this.reviewLevel, attack);
      if (this.reviewLevel === 'fired') {
        this.onFired?.('Performance review: TERMINATED');
      }
    }
  }

  public resetReview(): void {
    if (this.reviewLevel === 'good') return;
    this.reviewLevel = 'good';
    this.onReviewChange?.(this.reviewLevel, HR_ATTACKS[0]);
  }

  public checkQBR(): void {
    if (this.budget < 0) {
      this.onFired?.(`Budget deficit: $${Math.abs(this.budget).toLocaleString()}`);
    }
  }

  public tryRecharge(deltaTime: number): boolean {
    if (this.rechargeCooldown > 0) {
      this.rechargeCooldown -= deltaTime;
      return false;
    }
    this.budget += this.RECHARGE_AMOUNT;
    this.rechargeCooldown = this.RECHARGE_COOLDOWN;
    this.onBudgetChange?.(this.budget);
    return true;
  }

  public getRechargeCooldown(): number {
    return Math.max(0, this.rechargeCooldown);
  }

  public updateCooldown(deltaTime: number): void {
    if (this.rechargeCooldown > 0) {
      this.rechargeCooldown -= deltaTime;
    }
  }

  public addKillReward(): void {
    this.budget += 100;
    this.onBudgetChange?.(this.budget);
  }

  public updateCalendarDecay(deltaTime: number): void {
    if (this.calendarSlots <= 0) return;
    this.calendarDecayTimer += deltaTime;
    if (this.calendarDecayTimer >= this.CALENDAR_DECAY_INTERVAL) {
      this.calendarDecayTimer = 0;
      this.calendarSlots--;
      this.onCalendarChange?.(this.calendarSlots);
    }
  }

  public applyQBROverhead(): void {
    this.budget -= 500;
    this.onBudgetChange?.(this.budget);
  }

  public applyKillMilestone(killCount: number): void {
    if (killCount % 3 === 0) {
      // Every 3 kills: clear 1 calendar slot
      if (this.calendarSlots > 0) {
        this.calendarSlots--;
        this.onCalendarChange?.(this.calendarSlots);
      }
    }
    if (killCount % 5 === 0) {
      // Every 5 kills: step review back one level (not all the way to good)
      const idx = REVIEW_ORDER.indexOf(this.reviewLevel);
      if (idx > 0) {
        this.reviewLevel = REVIEW_ORDER[idx - 1];
        // Use first HR attack as placeholder for the callback
        this.onReviewChange?.(this.reviewLevel, HR_ATTACKS[0]);
      }
    }
    if (killCount % 10 === 0) {
      // Every 10 kills: full reset + $1000 bonus
      this.reviewLevel = 'good';
      this.calendarSlots = 0;
      this.budget += 1000;
      this.onReviewChange?.(this.reviewLevel, HR_ATTACKS[0]);
      this.onCalendarChange?.(this.calendarSlots);
      this.onBudgetChange?.(this.budget);
    }
  }

  public reset(): void {
    this.budget = 10000;
    this.reviewLevel = 'good';
    this.rechargeCooldown = 0;
    this.calendarSlots = 0;
    this.calendarDecayTimer = 0;
    this.onBudgetChange?.(this.budget);
    this.onReviewChange?.(this.reviewLevel, HR_ATTACKS[0]);
    this.onCalendarChange?.(this.calendarSlots);
  }
}
