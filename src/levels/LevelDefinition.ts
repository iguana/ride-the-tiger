export type EnemyType = 'manager' | 'salesBro' | 'itZombie' | 'hrEnforcer' | 'financeGoblin' | 'executive';

export type OutdoorAreaType =
  | 'vcPatio' | 'cancunBeach' | 'parkingGarage' | 'serverFarm'
  | 'startupGraveyard' | 'foodTruckCourt' | 'helipad'
  | 'rooftopTerrace' | 'zenGarden' | 'basketballCourt' | 'foodTruckRally';

export interface DepartmentDef {
  id: string;
  name: string;
  position: [number, number, number];
  artifactColor: number;
  missionDescription: string;
}

export interface SpawnZoneDef {
  position: [number, number, number];
  types: EnemyType[];
}

export interface OutdoorAreaDef {
  type: OutdoorAreaType;
}

export interface LevelTheme {
  floorColor: number;
  wallColor: number;
  ceilingColor: number;
}

export interface WarpDoorDef {
  position: [number, number, number];
  targetLevelId: string;
  label: string;
}

export interface LevelDefinition {
  id: string;
  name: string;
  description: string;
  playerSpawn: [number, number, number];
  floorSize: number;
  wallHeight: number;
  theme: LevelTheme;
  departments: DepartmentDef[];
  spawnZones: SpawnZoneDef[];
  outdoorAreas: OutdoorAreaDef[];
  warpDoors?: WarpDoorDef[];
  completionMessage: string;
}

const VALID_ENEMY_TYPES: EnemyType[] = ['manager', 'salesBro', 'itZombie', 'hrEnforcer', 'financeGoblin', 'executive'];

export function validateLevel(level: LevelDefinition): string[] {
  const errors: string[] = [];

  if (!level.id) errors.push('Level must have an id');
  if (!level.name) errors.push('Level must have a name');
  if (!level.description) errors.push('Level must have a description');
  if (level.floorSize <= 0) errors.push('floorSize must be positive');
  if (level.wallHeight <= 0) errors.push('wallHeight must be positive');

  if (level.departments.length === 0) {
    errors.push('Level must have at least one department');
  }

  // Check for duplicate department IDs
  const deptIds = new Set<string>();
  for (const dept of level.departments) {
    if (deptIds.has(dept.id)) {
      errors.push(`Duplicate department id: ${dept.id}`);
    }
    deptIds.add(dept.id);

    if (!dept.name) errors.push(`Department ${dept.id} must have a name`);
    if (!dept.missionDescription) errors.push(`Department ${dept.id} must have a missionDescription`);
    if (dept.position.length !== 3) errors.push(`Department ${dept.id} position must have 3 elements`);
  }

  // Check spawn zones
  for (let i = 0; i < level.spawnZones.length; i++) {
    const zone = level.spawnZones[i];
    if (zone.position.length !== 3) {
      errors.push(`Spawn zone ${i} position must have 3 elements`);
    }
    if (zone.types.length === 0) {
      errors.push(`Spawn zone ${i} must have at least one enemy type`);
    }
    for (const t of zone.types) {
      if (!VALID_ENEMY_TYPES.includes(t)) {
        errors.push(`Spawn zone ${i} has invalid enemy type: ${t}`);
      }
    }
  }

  // Check player spawn
  if (level.playerSpawn.length !== 3) {
    errors.push('playerSpawn must have 3 elements');
  }

  return errors;
}
