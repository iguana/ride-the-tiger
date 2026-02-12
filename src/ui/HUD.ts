import { Mission } from '../systems/MissionManager';

export class HUD {
  private hudElement: HTMLElement;
  private objectiveText: HTMLElement;
  private missionCompleteElement: HTMLElement;
  private progressElement: HTMLElement;
  private killCountElement: HTMLElement;

  constructor() {
    this.hudElement = document.getElementById('hud')!;
    this.objectiveText = document.getElementById('objective-text')!;
    this.missionCompleteElement = document.getElementById('mission-complete')!;
    this.progressElement = document.getElementById('progress')!;
    this.killCountElement = document.getElementById('kill-count')!;
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
    }, 3000);
  }

  public updateKillCount(count: number): void {
    this.killCountElement.textContent = `Managers fired: ${count}`;
    // Brief flash effect on kill
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
}
