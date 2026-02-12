import type { LevelDefinition } from './LevelDefinition';
import { level1 } from './level1';
import { level2 } from './level2';

export type { LevelDefinition, DepartmentDef, SpawnZoneDef, OutdoorAreaDef, WarpDoorDef, LevelTheme, EnemyType, OutdoorAreaType } from './LevelDefinition';
export { validateLevel } from './LevelDefinition';

export const LEVELS: LevelDefinition[] = [level1, level2];

export function getLevel(id: string): LevelDefinition | undefined {
  return LEVELS.find(l => l.id === id);
}

export function getLevelByIndex(index: number): LevelDefinition {
  if (index < 0 || index >= LEVELS.length) {
    throw new Error(`Level index ${index} out of range (0-${LEVELS.length - 1})`);
  }
  return LEVELS[index];
}
