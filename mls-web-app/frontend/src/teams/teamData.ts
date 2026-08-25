export type Conference = 'East' | 'West';

export interface TeamIdentity {
  name: string;
  short: string;
  abbr: string;
  conference: Conference;
  primary: string;
  secondary: string;
  accent: string;
  shape: 'shield' | 'circle' | 'diamond' | 'hex';
}

// Real MLS club color palettes (primary / secondary / accent), abbreviations
// and crest shape used to drive the procedural badge generator.
export const TEAMS: TeamIdentity[] = [
  { name: 'Atlanta United', short: 'Atlanta', abbr: 'ATL', conference: 'East', primary: '#80000a', secondary: '#000000', accent: '#a5a5a8', shape: 'shield' },
  { name: 'CF Montréal', short: 'Montréal', abbr: 'MTL', conference: 'East', primary: '#0033a0', secondary: '#000000', accent: '#66ccff', shape: 'shield' },
  { name: 'Charlotte FC', short: 'Charlotte', abbr: 'CLT', conference: 'East', primary: '#1a85c8', secondary: '#000000', accent: '#ffffff', shape: 'hex' },
  { name: 'Chicago Fire', short: 'Chicago', abbr: 'CHI', conference: 'East', primary: '#a1201e', secondary: '#0a2240', accent: '#f3982a', shape: 'shield' },
  { name: 'Columbus Crew', short: 'Columbus', abbr: 'CLB', conference: 'East', primary: '#fdc02f', secondary: '#000000', accent: '#7d5c25', shape: 'circle' },
  { name: 'DC United', short: 'DC United', abbr: 'DC', conference: 'East', primary: '#000000', secondary: '#e11d2f', accent: '#a5a5a8', shape: 'shield' },
  { name: 'FC Cincinnati', short: 'Cincinnati', abbr: 'CIN', conference: 'East', primary: '#003087', secondary: '#f15d22', accent: '#ffffff', shape: 'shield' },
  { name: 'Inter Miami CF', short: 'Miami', abbr: 'MIA', conference: 'East', primary: '#f7b5cd', secondary: '#000000', accent: '#231f20', shape: 'hex' },
  { name: 'Nashville SC', short: 'Nashville', abbr: 'NSH', conference: 'East', primary: '#ece83a', secondary: '#1e2128', accent: '#c0c1c3', shape: 'shield' },
  { name: 'New England Revolution', short: 'New England', abbr: 'NE', conference: 'East', primary: '#0a2240', secondary: '#e0393e', accent: '#a5acaf', shape: 'shield' },
  { name: 'New York City FC', short: 'NYCFC', abbr: 'NYC', conference: 'East', primary: '#6cabdd', secondary: '#001e62', accent: '#f26522', shape: 'circle' },
  { name: 'New York Red Bulls', short: 'Red Bulls', abbr: 'NYRB', conference: 'East', primary: '#ed1a3b', secondary: '#001b5e', accent: '#f2f0e6', shape: 'diamond' },
  { name: 'Orlando City SC', short: 'Orlando', abbr: 'ORL', conference: 'East', primary: '#61259e', secondary: '#f2b21e', accent: '#ffffff', shape: 'shield' },
  { name: 'Philadelphia Union', short: 'Philadelphia', abbr: 'PHI', conference: 'East', primary: '#071b2c', secondary: '#b19b69', accent: '#e2001a', shape: 'shield' },
  { name: 'Toronto FC', short: 'Toronto', abbr: 'TOR', conference: 'East', primary: '#b81137', secondary: '#1d2b3d', accent: '#ffffff', shape: 'diamond' },

  { name: 'Austin FC', short: 'Austin', abbr: 'ATX', conference: 'West', primary: '#00b140', secondary: '#000000', accent: '#a4d65e', shape: 'hex' },
  { name: 'Colorado Rapids', short: 'Colorado', abbr: 'COL', conference: 'West', primary: '#960a3d', secondary: '#8a8d8f', accent: '#00305b', shape: 'shield' },
  { name: 'FC Dallas', short: 'Dallas', abbr: 'DAL', conference: 'West', primary: '#c30240', secondary: '#0a2240', accent: '#ffffff', shape: 'shield' },
  { name: 'Houston Dynamo', short: 'Houston', abbr: 'HOU', conference: 'West', primary: '#f68712', secondary: '#000000', accent: '#f68712', shape: 'shield' },
  { name: 'LA Galaxy', short: 'LA Galaxy', abbr: 'LA', conference: 'West', primary: '#00245d', secondary: '#c9a227', accent: '#ffffff', shape: 'circle' },
  { name: 'Los Angeles FC', short: 'LAFC', abbr: 'LAFC', conference: 'West', primary: '#000000', secondary: '#c39e6d', accent: '#e01a4f', shape: 'diamond' },
  { name: 'Minnesota United', short: 'Minnesota', abbr: 'MIN', conference: 'West', primary: '#8fd0ea', secondary: '#000000', accent: '#65cfea', shape: 'hex' },
  { name: 'Portland Timbers', short: 'Portland', abbr: 'POR', conference: 'West', primary: '#004812', secondary: '#e0b31e', accent: '#ffffff', shape: 'shield' },
  { name: 'Real Salt Lake', short: 'Salt Lake', abbr: 'RSL', conference: 'West', primary: '#b30838', secondary: '#022145', accent: '#ffc72c', shape: 'shield' },
  { name: 'San Diego FC', short: 'San Diego', abbr: 'SD', conference: 'West', primary: '#000000', secondary: '#7cc0e8', accent: '#ffffff', shape: 'hex' },
  { name: 'San Jose Earthquakes', short: 'San Jose', abbr: 'SJ', conference: 'West', primary: '#000000', secondary: '#005daa', accent: '#0074c8', shape: 'shield' },
  { name: 'Seattle Sounders FC', short: 'Seattle', abbr: 'SEA', conference: 'West', primary: '#5d9732', secondary: '#0033a0', accent: '#00b1e1', shape: 'shield' },
  { name: 'Sporting Kansas City', short: 'Kansas City', abbr: 'SKC', conference: 'West', primary: '#93b1d7', secondary: '#002855', accent: '#93b1d7', shape: 'shield' },
  { name: 'St.Louis City', short: 'St. Louis', abbr: 'STL', conference: 'West', primary: '#d2263c', secondary: '#001e62', accent: '#fdb827', shape: 'diamond' },
  { name: 'Vancouver Whitecaps', short: 'Vancouver', abbr: 'VAN', conference: 'West', primary: '#00245e', secondary: '#9dc4e0', accent: '#ffffff', shape: 'circle' },
];

const byName = new Map(TEAMS.map(t => [t.name, t]));

const FALLBACK: TeamIdentity = {
  name: 'Unknown', short: 'Unknown', abbr: '???', conference: 'East',
  primary: '#3b82f6', secondary: '#1f2937', accent: '#ffffff', shape: 'circle',
};

export function getTeam(name: string): TeamIdentity {
  return byName.get(name) ?? { ...FALLBACK, name, short: name, abbr: name.slice(0, 3).toUpperCase() };
}
