import type { LevelDefinition } from './LevelDefinition';

export const level2: LevelDefinition = {
  id: 'level2',
  name: 'The Startup Accelerator',
  description: 'Infiltrate a trendy tech startup incubator. Disrupt the disruptors across every co-working space.',
  playerSpawn: [0, 0, 10],
  floorSize: 100,
  wallHeight: 6,
  theme: {
    floorColor: 0x5c6b73,
    wallColor: 0xf0ebe3,
    ceilingColor: 0xfafafa,
  },
  departments: [
    // North wing
    { id: 'pitchroom', name: 'Pitch Room', position: [-30, 0, -35], artifactColor: 0xff6b6b, missionDescription: 'Perfect your disruptive value proposition' },
    { id: 'incubator', name: 'Incubator Lab', position: [0, 0, -35], artifactColor: 0x4ecdc4, missionDescription: 'Iterate on your minimum viable product' },
    { id: 'demoday', name: 'Demo Day Stage', position: [30, 0, -35], artifactColor: 0xffe66d, missionDescription: 'Crush your 3-minute investor pitch' },

    // Upper middle
    { id: 'coworking', name: 'Co-Working Space', position: [-30, 0, -10], artifactColor: 0xa8dadc, missionDescription: 'Hot-desk your way to product-market fit' },
    { id: 'kombucha', name: 'Kombucha Bar', position: [0, 0, -10], artifactColor: 0x95d5b2, missionDescription: 'Hydrate with probiotic thought leadership' },
    { id: 'meditation', name: 'Meditation Pod', position: [30, 0, -10], artifactColor: 0xdda0dd, missionDescription: 'Mindfully optimize your burn rate' },

    // Lower middle
    { id: 'crypto', name: 'Crypto Corner', position: [-30, 0, 15], artifactColor: 0xf7931a, missionDescription: 'Decentralize the innovation blockchain' },
    { id: 'growth', name: 'Growth Hacking', position: [0, 0, 15], artifactColor: 0x00c853, missionDescription: 'Hack the viral coefficient loop' },
    { id: 'devrel', name: 'DevRel Lounge', position: [30, 0, 15], artifactColor: 0x7c4dff, missionDescription: 'Evangelize the developer ecosystem' },

    // South wing
    { id: 'pingpong', name: 'Ping Pong Room', position: [-30, 0, 35], artifactColor: 0xff5722, missionDescription: 'Table-stake your competitive advantage' },
    { id: 'founders', name: "Founder's Den", position: [0, 0, 35], artifactColor: 0x212121, missionDescription: 'Hustle harder than the hustle' },
    { id: 'angels', name: 'Angel Investors', position: [30, 0, 35], artifactColor: 0xffd700, missionDescription: 'Secure your pre-seed runway' },

    // Far north
    { id: 'boardroom', name: 'Board Room', position: [-20, 0, -55], artifactColor: 0x1a237e, missionDescription: 'Survive the quarterly board review' },
    { id: 'hackathon', name: 'Hackathon Arena', position: [20, 0, -55], artifactColor: 0x00e676, missionDescription: 'Ship or die in 48 hours' },

    // Far south
    { id: 'launchpad', name: 'Launch Pad', position: [-20, 0, 55], artifactColor: 0xe53935, missionDescription: 'Blast off to Series A' },
    { id: 'pivot', name: 'Pivot Point', position: [20, 0, 55], artifactColor: 0xffab00, missionDescription: 'Pivot until something sticks' },
  ],
  spawnZones: [
    // North wing — pitch/incubator/demo
    { position: [-30, 0, -35], types: ['salesBro', 'salesBro', 'manager'] },
    { position: [0, 0, -35],   types: ['itZombie', 'manager', 'itZombie'] },
    { position: [30, 0, -35],  types: ['salesBro', 'executive', 'manager'] },

    // Upper middle — coworking/kombucha/meditation
    { position: [-30, 0, -10], types: ['manager', 'salesBro', 'salesBro'] },
    { position: [0, 0, -10],   types: ['hrEnforcer', 'manager'] },
    { position: [30, 0, -10],  types: ['hrEnforcer', 'hrEnforcer'] },

    // Lower middle — crypto/growth/devrel
    { position: [-30, 0, 15],  types: ['financeGoblin', 'financeGoblin', 'executive'] },
    { position: [0, 0, 15],    types: ['salesBro', 'salesBro', 'salesBro'] },
    { position: [30, 0, 15],   types: ['itZombie', 'salesBro', 'manager'] },

    // South wing — pingpong/founders/angels
    { position: [-30, 0, 35],  types: ['salesBro', 'manager'] },
    { position: [0, 0, 35],    types: ['executive', 'executive', 'manager'] },
    { position: [30, 0, 35],   types: ['financeGoblin', 'executive', 'financeGoblin'] },

    // Far wings
    { position: [-20, 0, -55], types: ['executive', 'executive'] },
    { position: [20, 0, -55],  types: ['itZombie', 'itZombie', 'itZombie'] },
    { position: [-20, 0, 55],  types: ['salesBro', 'manager', 'salesBro'] },
    { position: [20, 0, 55],   types: ['manager', 'salesBro'] },

    // Hallway roamers
    { position: [0, 0, -25],   types: ['manager', 'salesBro'] },
    { position: [0, 0, 25],    types: ['salesBro', 'hrEnforcer'] },
    { position: [-20, 0, 0],   types: ['salesBro', 'manager'] },
    { position: [20, 0, 0],    types: ['manager', 'executive'] },
  ],
  outdoorAreas: [
    { type: 'rooftopTerrace' },
    { type: 'zenGarden' },
    { type: 'basketballCourt' },
    { type: 'foodTruckRally' },
  ],
  warpDoors: [
    { position: [15, 0, 10], targetLevelId: 'level1', label: 'THE CALL CENTER' },
  ],
  completionMessage: 'You have disrupted the Startup Accelerator! Your Series A is fully funded.',
};
