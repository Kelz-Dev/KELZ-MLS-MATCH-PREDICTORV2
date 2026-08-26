export type Outcome = 'H' | 'D' | 'A';

export interface Scoreline {
  outcome: Outcome;
  home: number;
  away: number;
}

function sample(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

// Rolls the match outcome (H/D/A) from the model's probabilities, then picks
// a believable final score for that outcome — weighted toward realistic MLS
// scorelines (1-0 and 2-1 are common, 4-0 blowouts are rare) instead of a
// flat "everyone wins 1-0" result.
export function rollScoreline(home: number, draw: number, _away: number): Scoreline {
  const r = Math.random() * 100;
  let outcome: Outcome;
  if (r < home) outcome = 'H';
  else if (r < home + draw) outcome = 'D';
  else outcome = 'A';

  if (outcome === 'D') {
    // 0-0, 1-1, 2-2 — weighted toward 1-1
    const draws: [number, number][] = [[0, 0], [1, 1], [2, 2]];
    const idx = sample([0.3, 0.55, 0.15]);
    const [h, a] = draws[idx];
    return { outcome, home: h, away: a };
  }

  // Margin of victory, weighted toward narrow wins
  const margins: [number, number][] = [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 1]];
  const idx = sample([0.34, 0.22, 0.24, 0.09, 0.08, 0.03]);
  const [winner, loser] = margins[idx];

  return outcome === 'H'
    ? { outcome, home: winner, away: loser }
    : { outcome, home: loser, away: winner };
}

// Fast, non-animated batch of N match rolls for the sample-size stats panel.
export function simulateBatch(home: number, draw: number, away: number, n: number) {
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  for (let i = 0; i < n; i++) {
    const s = rollScoreline(home, draw, away);
    if (s.outcome === 'H') homeWins++;
    else if (s.outcome === 'D') draws++;
    else awayWins++;
  }
  return { homeWins, draws, awayWins, n };
}
