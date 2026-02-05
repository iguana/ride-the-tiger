import * as THREE from 'three';
import { Department } from '../environment/CallCenter';

export interface Mission {
  id: string;
  name: string;
  description: string;
  type: 'reach_zone';
  targetPosition: THREE.Vector3;
  targetRadius: number;
  isComplete: boolean;
}

export class MissionManager {
  private missions: Mission[] = [];
  private activeMissionIndex: number = 0;
  private onMissionComplete: ((mission: Mission) => void) | null = null;
  private onAllComplete: (() => void) | null = null;

  constructor() {}

  public loadDepartments(departments: Department[]): void {
    this.missions = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.missionDescription ?? `Check in with ${dept.name}`,
      type: 'reach_zone' as const,
      targetPosition: dept.position.clone(),
      targetRadius: 2.5,
      isComplete: false,
    }));
    this.activeMissionIndex = 0;
  }

  public startMission(missionId: string): boolean {
    const idx = this.missions.findIndex(m => m.id === missionId);
    if (idx !== -1 && !this.missions[idx].isComplete) {
      this.activeMissionIndex = idx;
      return true;
    }
    return false;
  }

  public getActiveMission(): Mission | null {
    if (this.activeMissionIndex < this.missions.length) {
      const m = this.missions[this.activeMissionIndex];
      return m.isComplete ? null : m;
    }
    return null;
  }

  public update(playerPosition: THREE.Vector3): void {
    const mission = this.getActiveMission();
    if (!mission) return;

    const distance = playerPosition.distanceTo(mission.targetPosition);
    if (distance <= mission.targetRadius) {
      this.completeMission();
    }
  }

  private completeMission(): void {
    const mission = this.missions[this.activeMissionIndex];
    if (!mission || mission.isComplete) return;

    mission.isComplete = true;

    if (this.onMissionComplete) {
      this.onMissionComplete(mission);
    }

    // Check if all complete
    const allDone = this.missions.every(m => m.isComplete);
    if (allDone && this.onAllComplete) {
      this.onAllComplete();
    }
  }

  public advanceToNext(): boolean {
    // Find next incomplete mission
    for (let i = 0; i < this.missions.length; i++) {
      if (!this.missions[i].isComplete) {
        this.activeMissionIndex = i;
        return true;
      }
    }
    return false;
  }

  public setOnMissionComplete(callback: (mission: Mission) => void): void {
    this.onMissionComplete = callback;
  }

  public setOnAllComplete(callback: () => void): void {
    this.onAllComplete = callback;
  }

  public getProgress(): { completed: number; total: number } {
    const completed = this.missions.filter(m => m.isComplete).length;
    return { completed, total: this.missions.length };
  }

  public getMissions(): Mission[] {
    return [...this.missions];
  }

  public getNextMission(): Mission | null {
    return this.missions.find(m => !m.isComplete) ?? null;
  }
}
