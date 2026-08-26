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
  /** Filename-safe slug used to look up a real crest image at /crests/{logoSlug}.png,
   *  if one exists. Falls back to the procedural badge when the file is missing. */
  logoSlug: string;
}

// Real MLS club color palettes (primary / secondary / accent), abbreviations
// and crest shape used to drive the procedural badge generator.
export const TEAMS: TeamIdentity[] = [
  { name: 'Atlanta United', short: 'Atlanta', abbr: 'ATL', conference: 'East', primary: '#80000a', secondary: '#000000', accent: '#a5a5a8', shape: 'shield', logoSlug: 'atlanta-united' },
  { name: 'CF Montréal', short: 'Montréal', abbr: 'MTL', conference: 'East', primary: '#0033a0', secondary: '#000000', accent: '#66ccff', shape: 'shield', logoSlug: 'cf-montreal' },
  { name: 'Charlotte FC', short: 'Charlotte', abbr: 'CLT', conference: 'East', primary: '#1a85c8', secondary: '#000000', accent: '#ffffff', shape: 'hex', logoSlug: 'charlotte-fc' },
  { name: 'Chicago Fire', short: 'Chicago', abbr: 'CHI', conference: 'East', primary: '#a1201e', secondary: '#0a2240', accent: '#f3982a', shape: 'shield', logoSlug: 'chicago-fire' },
  { name: 'Columbus Crew', short: 'Columbus', abbr: 'CLB', conference: 'East', primary: '#fdc02f', secondary: '#000000', accent: '#7d5c25', shape: 'circle', logoSlug: 'columbus-crew' },
  { name: 'DC United', short: 'DC United', abbr: 'DC', conference: 'East', primary: '#000000', secondary: '#e11d2f', accent: '#a5a5a8', shape: 'shield', logoSlug: 'dc-united' },
  { name: 'FC Cincinnati', short: 'Cincinnati', abbr: 'CIN', conference: 'East', primary: '#003087', secondary: '#f15d22', accent: '#ffffff', shape: 'shield', logoSlug: 'fc-cincinnati' },
  { name: 'Inter Miami CF', short: 'Miami', abbr: 'MIA', conference: 'East', primary: '#f7b5cd', secondary: '#000000', accent: '#231f20', shape: 'hex', logoSlug: 'inter-miami' },
  { name: 'Nashville SC', short: 'Nashville', abbr: 'NSH', conference: 'East', primary: '#ece83a', secondary: '#1e2128', accent: '#c0c1c3', shape: 'shield', logoSlug: 'nashville-sc' },
  { name: 'New England Revolution', short: 'New England', abbr: 'NE', conference: 'East', primary: '#0a2240', secondary: '#e0393e', accent: '#a5acaf', shape: 'shield', logoSlug: 'new-england-revolution' },
  { name: 'New York City FC', short: 'NYCFC', abbr: 'NYC', conference: 'East', primary: '#6cabdd', secondary: '#001e62', accent: '#f26522', shape: 'circle', logoSlug: 'nycfc' },
  { name: 'New York Red Bulls', short: 'Red Bulls', abbr: 'NYRB', conference: 'East', primary: '#ed1a3b', secondary: '#001b5e', accent: '#f2f0e6', shape: 'diamond', logoSlug: 'ny-red-bulls' },
  { name: 'Orlando City SC', short: 'Orlando', abbr: 'ORL', conference: 'East', primary: '#61259e', secondary: '#f2b21e', accent: '#ffffff', shape: 'shield', logoSlug: 'orlando-city' },
  { name: 'Philadelphia Union', short: 'Philadelphia', abbr: 'PHI', conference: 'East', primary: '#071b2c', secondary: '#b19b69', accent: '#e2001a', shape: 'shield', logoSlug: 'philadelphia-union' },
  { name: 'Toronto FC', short: 'Toronto', abbr: 'TOR', conference: 'East', primary: '#b81137', secondary: '#1d2b3d', accent: '#ffffff', shape: 'diamond', logoSlug: 'toronto-fc' },

  { name: 'Austin FC', short: 'Austin', abbr: 'ATX', conference: 'West', primary: '#00b140', secondary: '#000000', accent: '#a4d65e', shape: 'hex', logoSlug: 'austin-fc' },
  { name: 'Colorado Rapids', short: 'Colorado', abbr: 'COL', conference: 'West', primary: '#960a3d', secondary: '#8a8d8f', accent: '#00305b', shape: 'shield', logoSlug: 'colorado-rapids' },
  { name: 'FC Dallas', short: 'Dallas', abbr: 'DAL', conference: 'West', primary: '#c30240', secondary: '#0a2240', accent: '#ffffff', shape: 'shield', logoSlug: 'fc-dallas' },
  { name: 'Houston Dynamo', short: 'Houston', abbr: 'HOU', conference: 'West', primary: '#f68712', secondary: '#000000', accent: '#f68712', shape: 'shield', logoSlug: 'houston-dynamo' },
  { name: 'LA Galaxy', short: 'LA Galaxy', abbr: 'LA', conference: 'West', primary: '#00245d', secondary: '#c9a227', accent: '#ffffff', shape: 'circle', logoSlug: 'la-galaxy' },
  { name: 'Los Angeles FC', short: 'LAFC', abbr: 'LAFC', conference: 'West', primary: '#000000', secondary: '#c39e6d', accent: '#e01a4f', shape: 'diamond', logoSlug: 'lafc' },
  { name: 'Minnesota United', short: 'Minnesota', abbr: 'MIN', conference: 'West', primary: '#8fd0ea', secondary: '#000000', accent: '#65cfea', shape: 'hex', logoSlug: 'minnesota-united' },
  { name: 'Portland Timbers', short: 'Portland', abbr: 'POR', conference: 'West', primary: '#004812', secondary: '#e0b31e', accent: '#ffffff', shape: 'shield', logoSlug: 'portland-timbers' },
  { name: 'Real Salt Lake', short: 'Salt Lake', abbr: 'RSL', conference: 'West', primary: '#b30838', secondary: '#022145', accent: '#ffc72c', shape: 'shield', logoSlug: 'real-salt-lake' },
  { name: 'San Diego FC', short: 'San Diego', abbr: 'SD', conference: 'West', primary: '#000000', secondary: '#7cc0e8', accent: '#ffffff', shape: 'hex', logoSlug: 'san-diego-fc' },
  { name: 'San Jose Earthquakes', short: 'San Jose', abbr: 'SJ', conference: 'West', primary: '#000000', secondary: '#005daa', accent: '#0074c8', shape: 'shield', logoSlug: 'san-jose-earthquakes' },
  { name: 'Seattle Sounders FC', short: 'Seattle', abbr: 'SEA', conference: 'West', primary: '#5d9732', secondary: '#0033a0', accent: '#00b1e1', shape: 'shield', logoSlug: 'seattle-sounders' },
  { name: 'Sporting Kansas City', short: 'Kansas City', abbr: 'SKC', conference: 'West', primary: '#93b1d7', secondary: '#002855', accent: '#93b1d7', shape: 'shield', logoSlug: 'sporting-kc' },
  { name: 'St.Louis City', short: 'St. Louis', abbr: 'STL', conference: 'West', primary: '#d2263c', secondary: '#001e62', accent: '#fdb827', shape: 'diamond', logoSlug: 'st-louis-city' },
  { name: 'Vancouver Whitecaps', short: 'Vancouver', abbr: 'VAN', conference: 'West', primary: '#00245e', secondary: '#9dc4e0', accent: '#ffffff', shape: 'circle', logoSlug: 'vancouver-whitecaps' },
];

const byName = new Map(TEAMS.map(t => [t.name, t]));

const FALLBACK: TeamIdentity = {
  name: 'Unknown', short: 'Unknown', abbr: '???', conference: 'East',
  primary: '#3b82f6', secondary: '#1f2937', accent: '#ffffff', shape: 'circle', logoSlug: '',
};

export function getTeam(name: string): TeamIdentity {
  return byName.get(name) ?? { ...FALLBACK, name, short: name, abbr: name.slice(0, 3).toUpperCase() };
}
