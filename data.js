// Mock database for LifeBridge AI Emergency Assistant

const emergencyContacts = {
  general: [
    { name: "Emergency Response Hotline", phone: "911 / 112", icon: "phone" },
    { name: "Disaster Management Authority", phone: "1-800-555-0199", icon: "shield" },
    { name: "Red Cross Emergency Help", phone: "1-800-741-7400", icon: "heart" },
    { name: "Coast Guard Search & Rescue", phone: "1-800-555-0210", icon: "anchor" }
  ]
};

const survivalChecklists = {
  flood: [
    { id: "fl1", text: "Move valuable items to higher floors/shelves", done: false },
    { id: "fl2", text: "Turn off main electricity, gas, and water valves", done: false },
    { id: "fl3", text: "Pack a waterproof go-bag (documents, medicine, chargers)", done: false },
    { id: "fl4", text: "Identify the nearest designated high-ground shelter", done: false },
    { id: "fl5", text: "Boil or treat all drinking water to avoid contamination", done: false }
  ],
  cyclone: [
    { id: "cy1", text: "Secure loose outdoor items (patio furniture, trash bins)", done: false },
    { id: "cy2", text: "Board up windows or install storm shutters", done: false },
    { id: "cy3", text: "Stock up on non-perishable food and bottled water (3+ days)", done: false },
    { id: "cy4", text: "Keep battery-powered radio and flashlights handy", done: false },
    { id: "cy5", text: "Stay indoors in the strongest, central room of the house", done: false }
  ],
  earthquake: [
    { id: "ea1", text: "Identify safe spots in each room (under sturdy tables)", done: false },
    { id: "ea2", text: "Secure heavy furniture (bookshelves, TVs) to walls", done: false },
    { id: "ea3", text: "Keep sturdy shoes and a flashlight near your bed", done: false },
    { id: "ea4", text: "Locate gas and water shutoff valves and know how to close them", done: false },
    { id: "ea5", text: "Practice 'Drop, Cover, and Hold On' drill", done: false }
  ],
  medical: [
    { id: "me1", text: "Assemble first aid kit (bandages, antiseptics, gauze, tape)", done: false },
    { id: "me2", text: "List critical medical histories and prescription details", done: false },
    { id: "me3", text: "Keep a 7-day supply of essential medications", done: false },
    { id: "me4", text: "Keep thermal emergency blankets to treat shock", done: false }
  ]
};

// Map nodes with coordinates (X%, Y%) for vector drawing
const defaultLocations = {
  shelters: [
    { id: "sh-1", name: "Central High School Shelter", x: 25, y: 30, capacity: 500, filled: 210, status: "Open", pets: true, medical: true, address: "102 School Rd, North Sector" },
    { id: "sh-2", name: "Arena Community Center", x: 75, y: 20, capacity: 800, filled: 680, status: "Open", pets: true, medical: false, address: "404 Stadium Way, East Sector" },
    { id: "sh-3", name: "Grace Church Safe Haven", x: 45, y: 75, capacity: 200, filled: 195, status: "Full", pets: false, medical: true, address: "777 Chapel St, South Sector" },
    { id: "sh-4", name: "Metro Exhibition Hall", x: 80, y: 70, capacity: 1200, filled: 0, status: "Closed", pets: true, medical: true, address: "900 Expo Blvd, Southeast Sector" }
  ],
  hospitals: [
    { id: "hp-1", name: "Metro General Hospital", x: 50, y: 45, capacity: 350, occupancy: "Critical (95%)", phone: "555-0100", status: "Active", address: "100 Medical Plaza, Central" },
    { id: "hp-2", name: "St. Jude Clinic", x: 15, y: 65, capacity: 100, occupancy: "Normal (55%)", phone: "555-0122", status: "Active", address: "42 Clinic Dr, West Sector" },
    { id: "hp-3", name: "East Side Emergency Care", x: 85, y: 40, capacity: 150, occupancy: "High (82%)", phone: "555-0155", status: "Active", address: "818 Eastern Pkwy, East Sector" }
  ],
  roads: [
    { id: "rd-1", name: "Highway 10 (North)", x: 25, y: 15, status: "Safe", notes: "Clear, normal traffic flow" },
    { id: "rd-2", name: "Bridge Over River (Central)", x: 50, y: 55, status: "Safe", notes: "Water levels normal, open" },
    { id: "rd-3", name: "Valley Underpass (South)", x: 45, y: 85, status: "Hazardous", notes: "Minor debris, slow transit" },
    { id: "rd-4", name: "Coastal Highway 1 (East)", x: 90, y: 50, status: "Safe", notes: "Clear, sea winds increasing" },
    { id: "rd-5", name: "Mountain Pass 5 (West)", x: 10, y: 45, status: "Blocked", notes: "Small rockfall, crews working" }
  ]
};

// Simulation scenario shifts
const scenarios = {
  clear: {
    title: "Normal State",
    alerts: [
      { id: "a-1", type: "info", title: "Weather Update", desc: "Sunny intervals with light breezes. All systems running normally." },
      { id: "a-2", type: "info", title: "System Ready", desc: "LifeBridge AI monitoring local weather feeds and sensor telemetry." }
    ],
    shelters: defaultLocations.shelters,
    hospitals: defaultLocations.hospitals,
    roads: defaultLocations.roads
  },
  flood: {
    title: "Severe Flash Flooding",
    alerts: [
      { id: "a-flood-1", type: "danger", title: "Flash Flood Warning", desc: "River Basin exceeded critical level. Immediate evacuation of low-lying sectors advised." },
      { id: "a-flood-2", type: "warning", title: "Bridge Closed", desc: "Central Bridge closed due to rising waters. Use bypass roads." },
      { id: "a-flood-3", type: "info", title: "Shelter Activated", desc: "Metro Exhibition Hall is now open to receive evacuees." }
    ],
    shelters: [
      { id: "sh-1", name: "Central High School Shelter", x: 25, y: 30, capacity: 500, filled: 480, status: "Nearly Full", pets: true, medical: true, address: "102 School Rd (High Ground)" },
      { id: "sh-2", name: "Arena Community Center", x: 75, y: 20, capacity: 800, filled: 780, status: "Nearly Full", pets: true, medical: false, address: "404 Stadium Way" },
      { id: "sh-3", name: "Grace Church Safe Haven", x: 45, y: 75, capacity: 200, filled: 200, status: "Full", pets: false, medical: true, address: "777 Chapel St - FLOOD WARNING" },
      { id: "sh-4", name: "Metro Exhibition Hall", x: 80, y: 70, capacity: 1200, filled: 340, status: "Open", pets: true, medical: true, address: "900 Expo Blvd (High Ground, Main Evac Center)" }
    ],
    hospitals: [
      { id: "hp-1", name: "Metro General Hospital", x: 50, y: 45, capacity: 350, occupancy: "Emergency Evacuating Basement (100%)", phone: "555-0100", status: "Critical Support Only", address: "100 Medical Plaza" },
      { id: "hp-2", name: "St. Jude Clinic", x: 15, y: 65, capacity: 100, occupancy: "Normal (60%)", phone: "555-0122", status: "Active", address: "42 Clinic Dr" },
      { id: "hp-3", name: "East Side Emergency Care", x: 85, y: 40, capacity: 150, occupancy: "High (90%)", phone: "555-0155", status: "Active", address: "818 Eastern Pkwy" }
    ],
    roads: [
      { id: "rd-1", name: "Highway 10 (North)", x: 25, y: 15, status: "Safe", notes: "High ground route open, traffic heavy" },
      { id: "rd-2", name: "Bridge Over River (Central)", x: 50, y: 55, status: "Blocked", notes: "FLOODED: Overflown river. Do not attempt crossing!" },
      { id: "rd-3", name: "Valley Underpass (South)", x: 45, y: 85, status: "Blocked", notes: "FLOODED: 5 feet of standing water" },
      { id: "rd-4", name: "Coastal Highway 1 (East)", x: 90, y: 50, status: "Safe", notes: "Open, water pools on shoulder" },
      { id: "rd-5", name: "Mountain Pass 5 (West)", x: 10, y: 45, status: "Blocked", notes: "Landslide blockage near km 12" }
    ]
  },
  cyclone: {
    title: "Category 4 Cyclone 'Ember'",
    alerts: [
      { id: "a-cyc-1", type: "danger", title: "Cyclone Red Alert", desc: "Eye landfall expected in 1 hour. Storm surge of 12-15ft warning for East/Southeast coastal boundaries." },
      { id: "a-cyc-2", type: "warning", title: "Evacuation Order", desc: "Mandatory evacuation of Coastal Sector. Shelters sh-1 and sh-4 are safe inland strongholds." },
      { id: "a-cyc-3", type: "danger", title: "Power Outages", desc: "Widespread grid outages in Eastern Sector. Cellular towers operating on battery backups." }
    ],
    shelters: [
      { id: "sh-1", name: "Central High School Shelter", x: 25, y: 30, capacity: 500, filled: 320, status: "Open", pets: true, medical: true, address: "102 School Rd (Storm-Hardened)" },
      { id: "sh-2", name: "Arena Community Center", x: 75, y: 20, capacity: 800, filled: 120, status: "EVACUATING: Structures vulnerable to high winds", pets: false, medical: false, address: "404 Stadium Way" },
      { id: "sh-3", name: "Grace Church Safe Haven", x: 45, y: 75, capacity: 200, filled: 180, status: "Open", pets: false, medical: true, address: "777 Chapel St" },
      { id: "sh-4", name: "Metro Exhibition Hall", x: 80, y: 70, capacity: 1200, filled: 1100, status: "Full", pets: true, medical: true, address: "900 Expo Blvd (Reinforced Bunker)" }
    ],
    hospitals: [
      { id: "hp-1", name: "Metro General Hospital", x: 50, y: 45, capacity: 350, occupancy: "Operating on Generators (90%)", phone: "555-0100", status: "Active (Critical Needs Only)", address: "100 Medical Plaza" },
      { id: "hp-2", name: "St. Jude Clinic", x: 15, y: 65, capacity: 100, occupancy: "Normal (45%)", phone: "555-0122", status: "Active", address: "42 Clinic Dr" },
      { id: "hp-3", name: "East Side Emergency Care", x: 85, y: 40, capacity: 150, occupancy: "EVACUATED due to high surge risk", phone: "555-0155", status: "Closed", address: "818 Eastern Pkwy" }
    ],
    roads: [
      { id: "rd-1", name: "Highway 10 (North)", x: 25, y: 15, status: "Safe", notes: "Open, extreme crosswinds (60mph). Exercise extreme caution" },
      { id: "rd-2", name: "Bridge Over River (Central)", x: 50, y: 55, status: "Safe", notes: "Open, high winds" },
      { id: "rd-3", name: "Valley Underpass (South)", x: 45, y: 85, status: "Safe", notes: "Open, light debris" },
      { id: "rd-4", name: "Coastal Highway 1 (East)", x: 90, y: 50, status: "Blocked", notes: "CLOSED: Heavy storm surge flooding and fallen utility poles" },
      { id: "rd-5", name: "Mountain Pass 5 (West)", x: 10, y: 45, status: "Hazardous", notes: "Fallen trees, active high-wind warnings" }
    ]
  },
  earthquake: {
    title: "Magnitude 6.8 Earthquake",
    alerts: [
      { id: "a-eq-1", type: "danger", title: "Earthquake Aftershocks", desc: "Multiple M4+ aftershocks registered. Stay clear of cracked masonry structures." },
      { id: "a-eq-2", type: "danger", title: "Structural Bridge Alert", desc: "Central Bridge collapsed. Road safety inspection under way." },
      { id: "a-eq-3", type: "warning", title: "Gas Leak Warnings", desc: "Reports of gas leaks in Southern Sector. Avoid open flames." }
    ],
    shelters: [
      { id: "sh-1", name: "Central High School Shelter", x: 25, y: 30, capacity: 500, filled: 280, status: "Open (Structurally Checked)", pets: true, medical: true, address: "102 School Rd" },
      { id: "sh-2", name: "Arena Community Center", x: 75, y: 20, capacity: 800, filled: 450, status: "Open (Structurally Checked)", pets: true, medical: false, address: "404 Stadium Way" },
      { id: "sh-3", name: "Grace Church Safe Haven", x: 45, y: 75, capacity: 200, filled: 0, status: "Closed: Structural cracks reported. Evacuating.", pets: false, medical: false, address: "777 Chapel St" },
      { id: "sh-4", name: "Metro Exhibition Hall", x: 80, y: 70, capacity: 1200, filled: 850, status: "Open", pets: true, medical: true, address: "900 Expo Blvd" }
    ],
    hospitals: [
      { id: "hp-1", name: "Metro General Hospital", x: 50, y: 45, capacity: 350, occupancy: "Overloaded (110%)", phone: "555-0100", status: "Active (Triage Tents Set Up)", address: "100 Medical Plaza" },
      { id: "hp-2", name: "St. Jude Clinic", x: 15, y: 65, capacity: 100, occupancy: "High (85%)", phone: "555-0122", status: "Active", address: "42 Clinic Dr" },
      { id: "hp-3", name: "East Side Emergency Care", x: 85, y: 40, capacity: 150, occupancy: "High (90%)", phone: "555-0155", status: "Active", address: "818 Eastern Pkwy" }
    ],
    roads: [
      { id: "rd-1", name: "Highway 10 (North)", x: 25, y: 15, status: "Hazardous", notes: "Cracks in pavement, pass with caution" },
      { id: "rd-2", name: "Bridge Over River (Central)", x: 50, y: 55, status: "Blocked", notes: "COLLAPSED: Bridge span down. Avoid area entirely!" },
      { id: "rd-3", name: "Valley Underpass (South)", x: 45, y: 85, status: "Blocked", notes: "Debris & collapsed powerlines blocking lanes" },
      { id: "rd-4", name: "Coastal Highway 1 (East)", x: 90, y: 50, status: "Safe", notes: "Structurally sound, open" },
      { id: "rd-5", name: "Mountain Pass 5 (West)", x: 10, y: 45, status: "Blocked", notes: "Major rockslide blocking road" }
    ]
  }
};

// Initial triage requests
let initialRequests = [
  { id: "req-1", name: "Thomas Miller", sector: "South Sector", type: "Rescue", desc: "Basement flood rising. Elderly person trapped.", severity: "danger", status: "Dispatched", time: "5 mins ago" },
  { id: "req-2", name: "Grace Clinic", sector: "East Sector", type: "Supplies", desc: "Need critical oxygen tank replenishments.", severity: "warning", status: "Processing", time: "12 mins ago" },
  { id: "req-3", name: "Sarah Jenkins", sector: "Central Plaza", type: "Medical", desc: "Sprained ankle, cut on forehead from flying debris.", severity: "info", status: "Queued", time: "18 mins ago" }
];

// Initial Peer-to-Peer Community Posts
let initialCommunityOffers = [
  { id: "co-1", author: "Marcus Vance", contact: "555-0188", offer: "4x4 Offroad SUV with towing gear. Can transport supplies or people through mud/debris.", category: "Transport", verified: true },
  { id: "co-2", author: "Shelter Hope (NGO)", contact: "555-0245", offer: "Providing dry rations (rice, lentils, water bottles) for collection.", category: "Food/Water", verified: false },
  { id: "co-3", author: "Dr. Elena Rostova", contact: "555-0111", offer: "Licensed physician available for remote phone consults or triage guidance.", category: "Medical Help", verified: true }
];

window.emergencyData = {
  contacts: emergencyContacts,
  survivalChecklists,
  defaultLocations,
  scenarios,
  initialRequests,
  initialCommunityOffers
};
