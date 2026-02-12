import type { LevelDefinition } from './LevelDefinition';

export const level1: LevelDefinition = {
  id: 'level1',
  name: 'The Call Center',
  description: 'Navigate the soul-crushing corporate call center. Complete missions across every department to escape.',
  playerSpawn: [0, 0, 10],
  floorSize: 120,
  wallHeight: 6,
  theme: {
    floorColor: 0x4a5568,
    wallColor: 0xe2e8f0,
    ceilingColor: 0xf5f5f5,
  },
  departments: [
    // North wing
    { id: 'legal', name: 'Legal', position: [-40, 0, -45], artifactColor: 0x6b7280, missionDescription: 'Mitigate all outstanding liability vectors' },
    { id: 'engineering', name: 'Engineering', position: [-13, 0, -45], artifactColor: 0xffd700, missionDescription: 'Accelerate the velocity of innovation' },
    { id: 'product', name: 'Product', position: [13, 0, -45], artifactColor: 0x3182ce, missionDescription: 'Align the roadmap with customer value streams' },
    { id: 'oocto', name: 'Office of the CTO', position: [40, 0, -45], artifactColor: 0xffd700, missionDescription: 'Synergize the technical vision' },

    // Upper middle
    { id: 'security', name: 'Security', position: [-40, 0, -20], artifactColor: 0xdc2626, missionDescription: 'Harden the zero-trust perimeter' },
    { id: 'data', name: 'Data Science', position: [-13, 0, -20], artifactColor: 0x7c3aed, missionDescription: 'Leverage predictive analytics for actionable insights' },
    { id: 'warroom', name: 'The War Room', position: [13, 0, -20], artifactColor: 0xb91c1c, missionDescription: 'Facilitate cross-functional strategic alignment' },
    { id: 'executive', name: 'Executive Suite', position: [40, 0, -20], artifactColor: 0x1e3a5f, missionDescription: 'Interface with C-suite stakeholders' },

    // Center row
    { id: 'it', name: 'IT', position: [-40, 0, 5], artifactColor: 0x2d3748, missionDescription: 'Optimize the digital infrastructure paradigm' },
    { id: 'breakroom', name: 'Break Room', position: [0, 0, -5], artifactColor: 0xf59e0b, missionDescription: 'Recharge your human capital batteries' },
    { id: 'gtm', name: 'Go To Market', position: [40, 0, 5], artifactColor: 0xff6b35, missionDescription: 'Maximize pipeline conversion velocity' },

    // Lower middle
    { id: 'marketing', name: 'Marketing', position: [-40, 0, 30], artifactColor: 0xe91e63, missionDescription: 'Amplify brand awareness touchpoints' },
    { id: 'delivery', name: 'Delivery', position: [-13, 0, 30], artifactColor: 0x8b6914, missionDescription: 'Ship value to stakeholders on cadence' },
    { id: 'people', name: 'People', position: [13, 0, 30], artifactColor: 0xe53e3e, missionDescription: 'Foster cross-functional talent synergies' },
    { id: 'revops', name: 'Revenue Ops', position: [40, 0, 30], artifactColor: 0x38a169, missionDescription: 'Operationalize the revenue flywheel' },

    // South wing
    { id: 'support', name: 'Support', position: [-25, 0, 50], artifactColor: 0x718096, missionDescription: 'Deliver proactive customer success outcomes' },
    { id: 'finance', name: 'Finance', position: [25, 0, 50], artifactColor: 0x059669, missionDescription: 'Optimize the burn rate to runway ratio' },

    // Outside areas
    { id: 'vc', name: 'Venture Capital', position: [0, 0, -75], artifactColor: 0x2ecc71, missionDescription: 'Secure the next funding tranche' },
    { id: 'cancun', name: 'Cancun', position: [0, 0, 135], artifactColor: 0x00bcd4, missionDescription: '\u00a1Viva Los Replicantes!' },
    { id: 'parking', name: 'Parking Garage', position: [82, 0, 0], artifactColor: 0x6b7280, missionDescription: 'Optimize the organizational mobility fleet' },
    { id: 'serverfarm', name: 'Server Farm', position: [115, 0, 0], artifactColor: 0x22d3ee, missionDescription: 'Ensure five nines of uptime availability' },
    { id: 'graveyard', name: 'Startup Graveyard', position: [-82, 0, 0], artifactColor: 0x6b21a8, missionDescription: 'Pay respects to disrupted business models' },
    { id: 'foodtrucks', name: 'Food Truck Court', position: [-82, 0, 30], artifactColor: 0xf97316, missionDescription: 'Refuel the human capital engine' },
    { id: 'helipad', name: 'Executive Helipad', position: [0, 0, -105], artifactColor: 0x0ea5e9, missionDescription: 'Secure the golden parachute extraction' },
  ],
  spawnZones: [
    // North wing — engineering/product/CTO
    { position: [-13, 0, -45], types: ['itZombie', 'itZombie', 'manager'] },
    { position: [13, 0, -45],  types: ['manager', 'itZombie'] },
    { position: [40, 0, -45],  types: ['executive', 'manager'] },
    { position: [-40, 0, -45], types: ['hrEnforcer', 'hrEnforcer', 'manager'] },

    // Upper middle — security/data/warroom/exec
    { position: [-40, 0, -20], types: ['itZombie', 'manager'] },
    { position: [-13, 0, -20], types: ['itZombie', 'itZombie'] },
    { position: [13, 0, -20],  types: ['executive', 'executive', 'manager'] },
    { position: [40, 0, -20],  types: ['executive', 'executive'] },

    // Center — IT/breakroom/GTM
    { position: [-40, 0, 5],   types: ['itZombie', 'itZombie', 'itZombie'] },
    { position: [0, 0, -5],    types: ['manager', 'salesBro'] },
    { position: [40, 0, 5],    types: ['salesBro', 'salesBro', 'manager'] },

    // Lower middle — marketing/delivery/people/revops
    { position: [-40, 0, 30],  types: ['salesBro', 'salesBro', 'manager'] },
    { position: [-13, 0, 30],  types: ['manager', 'manager'] },
    { position: [13, 0, 30],   types: ['hrEnforcer', 'hrEnforcer', 'manager'] },
    { position: [40, 0, 30],   types: ['financeGoblin', 'financeGoblin', 'manager'] },

    // South wing — support/finance
    { position: [-25, 0, 50],  types: ['hrEnforcer', 'hrEnforcer'] },
    { position: [25, 0, 50],   types: ['financeGoblin', 'financeGoblin'] },

    // Outside — VC
    { position: [0, 0, -75],   types: ['financeGoblin', 'financeGoblin', 'executive'] },

    // Hallway roamers
    { position: [0, 0, -30],   types: ['manager', 'salesBro'] },
    { position: [0, 0, 15],    types: ['manager', 'hrEnforcer'] },
    { position: [-25, 0, 10],  types: ['itZombie', 'manager'] },
    { position: [25, 0, 10],   types: ['salesBro', 'manager'] },

    // East outdoor — Parking Garage + Server Farm
    { position: [75, 0, 0],    types: ['manager', 'salesBro', 'manager'] },
    { position: [85, 0, -5],   types: ['salesBro', 'manager'] },
    { position: [110, 0, 0],   types: ['itZombie', 'itZombie', 'itZombie'] },

    // West outdoor — Startup Graveyard + Food Trucks
    { position: [-80, 0, 0],   types: ['financeGoblin', 'executive', 'financeGoblin'] },
    { position: [-80, 0, -10], types: ['executive', 'financeGoblin'] },
    { position: [-80, 0, 30],  types: ['salesBro', 'manager', 'salesBro'] },

    // North outdoor — Executive Helipad
    { position: [0, 0, -105],  types: ['executive', 'executive', 'executive'] },
    { position: [-5, 0, -95],  types: ['executive', 'financeGoblin'] },
  ],
  outdoorAreas: [
    { type: 'vcPatio' },
    { type: 'cancunBeach' },
    { type: 'parkingGarage' },
    { type: 'serverFarm' },
    { type: 'startupGraveyard' },
    { type: 'foodTruckCourt' },
    { type: 'helipad' },
  ],
  warpDoors: [
    { position: [15, 0, 10], targetLevelId: 'level2', label: 'THE STARTUP ACCELERATOR' },
  ],
  completionMessage: 'You have conquered the Call Center! The corporate machine bows before you.',
};
