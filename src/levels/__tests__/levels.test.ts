import { describe, it, expect } from 'vitest';
import { LEVELS, getLevel, getLevelByIndex, validateLevel } from '../index';
import { level1 } from '../level1';
import { level2 } from '../level2';
import type { EnemyType } from '../LevelDefinition';

const VALID_ENEMY_TYPES: EnemyType[] = ['manager', 'salesBro', 'itZombie', 'hrEnforcer', 'financeGoblin', 'executive'];

describe('Level validation', () => {
  for (const level of LEVELS) {
    describe(`${level.name} (${level.id})`, () => {
      it('passes validateLevel with no errors', () => {
        const errors = validateLevel(level);
        expect(errors).toEqual([]);
      });

      it('has required top-level fields', () => {
        expect(level.id).toBeTruthy();
        expect(level.name).toBeTruthy();
        expect(level.description).toBeTruthy();
        expect(level.floorSize).toBeGreaterThan(0);
        expect(level.wallHeight).toBeGreaterThan(0);
        expect(level.playerSpawn).toHaveLength(3);
        expect(level.completionMessage).toBeTruthy();
      });

      it('has valid theme colors', () => {
        expect(level.theme.floorColor).toBeGreaterThanOrEqual(0);
        expect(level.theme.wallColor).toBeGreaterThanOrEqual(0);
        expect(level.theme.ceilingColor).toBeGreaterThanOrEqual(0);
      });

      it('has at least one department', () => {
        expect(level.departments.length).toBeGreaterThan(0);
      });

      it('has no duplicate department IDs', () => {
        const ids = level.departments.map(d => d.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });

      it('all departments have mission descriptions', () => {
        for (const dept of level.departments) {
          expect(dept.missionDescription, `${dept.id} missing missionDescription`).toBeTruthy();
        }
      });

      it('all departments have valid positions (3 elements)', () => {
        for (const dept of level.departments) {
          expect(dept.position, `${dept.id} position`).toHaveLength(3);
        }
      });

      it('all departments have names', () => {
        for (const dept of level.departments) {
          expect(dept.name, `${dept.id} missing name`).toBeTruthy();
        }
      });

      it('has at least one spawn zone', () => {
        expect(level.spawnZones.length).toBeGreaterThan(0);
      });

      it('all spawn zones have valid enemy types', () => {
        for (let i = 0; i < level.spawnZones.length; i++) {
          const zone = level.spawnZones[i];
          expect(zone.types.length, `spawn zone ${i} has no types`).toBeGreaterThan(0);
          for (const t of zone.types) {
            expect(VALID_ENEMY_TYPES, `spawn zone ${i} invalid type: ${t}`).toContain(t);
          }
        }
      });

      it('all spawn zones have valid positions', () => {
        for (let i = 0; i < level.spawnZones.length; i++) {
          expect(level.spawnZones[i].position, `spawn zone ${i} position`).toHaveLength(3);
        }
      });

      it('has at least one outdoor area', () => {
        expect(level.outdoorAreas.length).toBeGreaterThan(0);
      });

      it('all outdoor areas have valid types', () => {
        for (const area of level.outdoorAreas) {
          expect(area.type).toBeTruthy();
        }
      });
    });
  }
});

describe('Level registry', () => {
  it('LEVELS contains both levels', () => {
    expect(LEVELS).toHaveLength(2);
    expect(LEVELS[0].id).toBe('level1');
    expect(LEVELS[1].id).toBe('level2');
  });

  it('getLevel returns correct level by id', () => {
    expect(getLevel('level1')).toBe(level1);
    expect(getLevel('level2')).toBe(level2);
  });

  it('getLevel returns undefined for unknown id', () => {
    expect(getLevel('nonexistent')).toBeUndefined();
  });

  it('getLevelByIndex returns correct level', () => {
    expect(getLevelByIndex(0)).toBe(level1);
    expect(getLevelByIndex(1)).toBe(level2);
  });

  it('getLevelByIndex throws for out-of-range index', () => {
    expect(() => getLevelByIndex(-1)).toThrow();
    expect(() => getLevelByIndex(2)).toThrow();
  });
});

describe('Level 1 data integrity', () => {
  it('has 24 departments matching original hardcoded data', () => {
    expect(level1.departments).toHaveLength(24);
  });

  it('has floor size 120', () => {
    expect(level1.floorSize).toBe(120);
  });

  it('has player spawn at [0, 0, 10]', () => {
    expect(level1.playerSpawn).toEqual([0, 0, 10]);
  });

  it('has 7 outdoor areas', () => {
    expect(level1.outdoorAreas).toHaveLength(7);
  });

  it('has 30 spawn zones', () => {
    expect(level1.spawnZones).toHaveLength(30);
  });

  it('preserves department IDs from original', () => {
    const expectedIds = [
      'legal', 'engineering', 'product', 'oocto',
      'security', 'data', 'warroom', 'executive',
      'it', 'breakroom', 'gtm',
      'marketing', 'delivery', 'people', 'revops',
      'support', 'finance',
      'vc', 'cancun', 'parking', 'serverfarm', 'graveyard', 'foodtrucks', 'helipad',
    ];
    const actualIds = level1.departments.map(d => d.id);
    expect(actualIds).toEqual(expectedIds);
  });
});

describe('Warp doors', () => {
  for (const level of LEVELS) {
    describe(`${level.name} (${level.id})`, () => {
      it('warp doors reference valid target level IDs', () => {
        for (const door of level.warpDoors ?? []) {
          expect(getLevel(door.targetLevelId), `warp door target "${door.targetLevelId}" not found`).toBeDefined();
        }
      });

      it('warp doors have valid positions (3 elements)', () => {
        for (const door of level.warpDoors ?? []) {
          expect(door.position).toHaveLength(3);
        }
      });

      it('warp doors have labels', () => {
        for (const door of level.warpDoors ?? []) {
          expect(door.label).toBeTruthy();
        }
      });
    });
  }

  it('level1 has a warp door to level2', () => {
    const doors = level1.warpDoors ?? [];
    expect(doors.some(d => d.targetLevelId === 'level2')).toBe(true);
  });

  it('level2 has a warp door to level1', () => {
    const doors = level2.warpDoors ?? [];
    expect(doors.some(d => d.targetLevelId === 'level1')).toBe(true);
  });
});

describe('Level 2 data integrity', () => {
  it('has 16 departments', () => {
    expect(level2.departments).toHaveLength(16);
  });

  it('has floor size 100', () => {
    expect(level2.floorSize).toBe(100);
  });

  it('has 4 outdoor areas', () => {
    expect(level2.outdoorAreas).toHaveLength(4);
  });

  it('has different theme from level 1', () => {
    expect(level2.theme.floorColor).not.toBe(level1.theme.floorColor);
  });

  it('has startup-themed department IDs', () => {
    const ids = level2.departments.map(d => d.id);
    expect(ids).toContain('pitchroom');
    expect(ids).toContain('kombucha');
    expect(ids).toContain('crypto');
    expect(ids).toContain('pingpong');
  });
});
