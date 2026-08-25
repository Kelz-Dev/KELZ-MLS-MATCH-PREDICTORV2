import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import axios from 'axios';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Trophy from '../three/Trophy';
import Confetti from '../three/Confetti';
import Crest from '../teams/Crest';
import { getTeam } from '../teams/teamData';
import type { Conference } from '../teams/teamData';
import { teamCssVars } from '../teams/colorUtils';
import { API_BASE } from '../apiBase';

interface Seed {
  seed: number;
  team: string;
  points: number;
  elo: number;
  cupOdds: number;
  shieldOdds: number;
}

interface BracketMatch {
  round: number;
  slotIndex: number;
  a: Seed | null;
  b: Seed | null;
  winner: Seed | null;
  resolving: boolean;
}

function eloWinProb(a: number, b: number, homeAdvantage = 0) {
  return 1 / (1 + Math.pow(10, -((a + homeAdvantage - b) / 400)));
}

function buildInitialRound(seeds: Seed[]): BracketMatch[] {
  // 1v8, 4v5, 3v6, 2v7 style reseeding bracket (top seed plays lowest remaining)
  const order = [
    [0, 7], [3, 4], [2, 5], [1, 6],
  ];
  return order.map(([i, j], idx) => ({
    round: 0,
    slotIndex: idx,
    a: seeds[i] ?? null,
    b: seeds[j] ?? null,
    winner: null,
    resolving: false,
  }));
}

const ROUND_NAMES = ['Quarterfinal', 'Semifinal', 'Conference Final'];

function ConferenceBracket({
  conference,
  seeds,
  onChampion,
  active,
}: {
  conference: Conference;
  seeds: Seed[];
  onChampion: (team: Seed) => void;
  active: boolean;
}) {
  const [rounds, setRounds] = useState<BracketMatch[][]>(() => (seeds.length >= 8 ? [buildInitialRound(seeds)] : []));
  const [mobileRound, setMobileRound] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const championReported = useRef(false);
  const onChampionRef = useRef(onChampion);
  onChampionRef.current = onChampion;

  useEffect(() => {
    if (!active || seeds.length < 8) return;
    championReported.current = false;
    setRounds([buildInitialRound(seeds)]);
    setMobileRound(0);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, seeds]);

  // Auto-advance the mobile stepper to follow the newest round as it's added,
  // but only if the viewer was already on the latest round — if they've
  // stepped back to review an earlier one, leave them there.
  const prevRoundCount = useRef(rounds.length);
  useEffect(() => {
    if (rounds.length > prevRoundCount.current) {
      setMobileRound(r => (r === prevRoundCount.current - 1 ? rounds.length - 1 : r));
    }
    prevRoundCount.current = rounds.length;
  }, [rounds.length]);

  // Guards against scheduling a duplicate "advance round" timeout when this
  // effect re-fires (e.g. React StrictMode's double-invoke, or a parent
  // re-render) before the previously scheduled timeout has actually run and
  // changed `rounds` — without this, two timeouts could both append a next
  // round from the same `winners` snapshot, corrupting the bracket.
  const advancePending = useRef(false);

  useEffect(() => {
    if (!active || rounds.length === 0) return;
    const currentRound = rounds[rounds.length - 1];
    const unresolved = currentRound.find(m => m.a && m.b && !m.winner);
    if (unresolved) {
      if (timeoutRef.current) return;
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        setRounds(prev => {
          const next = prev.map(r => r.map(m => ({ ...m })));
          const round = next[next.length - 1];
          const match = round.find(m => m.slotIndex === unresolved.slotIndex && !m.winner);
          if (match && match.a && match.b) {
            const pA = eloWinProb(match.a.elo, match.b.elo, 40);
            match.winner = Math.random() < pA ? match.a : match.b;
          }
          return next;
        });
      }, 900);
      return;
    }

    // all matches in current round resolved -> build next round or finish
    const winners = currentRound.map(m => m.winner).filter(Boolean) as Seed[];
    if (winners.length === 1) {
      if (!championReported.current) {
        championReported.current = true;
        onChampionRef.current(winners[0]);
      }
      return;
    }
    if (winners.length > 1 && rounds.length < 3 && !advancePending.current) {
      advancePending.current = true;
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        advancePending.current = false;
        setRounds(prev => {
          // Already advanced past this round (e.g. a duplicate timeout slipped
          // through) — don't append another one.
          if (prev.length !== rounds.length) return prev;
          const nextMatches: BracketMatch[] = [];
          for (let i = 0; i < winners.length; i += 2) {
            nextMatches.push({
              round: prev.length,
              slotIndex: i / 2,
              a: winners[i] ?? null,
              b: winners[i + 1] ?? null,
              winner: null,
              resolving: false,
            });
          }
          return [...prev, nextMatches];
        });
      }, 700);
    }
  }, [rounds, active]);

  if (seeds.length < 8) {
    return <p style={{ opacity: 0.6 }}>Not enough seeded teams for {conference}.</p>;
  }

  const renderMatch = (match: BracketMatch, mIdx: number) => (
    <div className="bracket-match" key={mIdx}>
      {[match.a, match.b].map((team, tIdx) => {
        const identity = team ? getTeam(team.team) : null;
        return (
          <div
            key={tIdx}
            className={`bracket-team ${match.winner && team && match.winner.team === team.team ? 'winner' : ''} ${match.winner && team && match.winner.team !== team.team ? 'loser' : ''}`}
            style={identity ? teamCssVars(identity) : undefined}
          >
            {identity && team ? (
              <>
                <Crest team={identity} size={22} />
                <span className="bracket-seed">#{team.seed}</span>
                <span className="bracket-team-name">{identity.short}</span>
              </>
            ) : (
              <span className="bracket-team-name" style={{ opacity: 0.4 }}>TBD</span>
            )}
          </div>
        );
      })}
    </div>
  );

  const clampedMobileRound = Math.min(mobileRound, rounds.length - 1);
  const currentMobileRound = rounds[clampedMobileRound];

  return (
    <div className="bracket-conference">
      <h3 className={`bracket-conf-title conf-${conference.toLowerCase()}-title`}>{conference}ern Conference</h3>

      {/* Desktop/tablet: all rounds side by side, horizontally scrollable if needed */}
      <div className="bracket-rounds responsive-hide-mobile">
        {rounds.map((round, rIdx) => (
          <div className="bracket-round" key={rIdx}>
            <span className="bracket-round-label">{ROUND_NAMES[rIdx] ?? 'Final'}</span>
            {round.map((match, mIdx) => renderMatch(match, mIdx))}
          </div>
        ))}
      </div>

      {/* Mobile: one round at a time with a stepper, no horizontal scrolling */}
      <div className="bracket-stepper responsive-show-mobile">
        <div className="bracket-stepper-header">
          <button
            className="bracket-stepper-btn"
            onClick={() => setMobileRound(r => Math.max(0, r - 1))}
            disabled={clampedMobileRound === 0}
            aria-label="Previous round"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="bracket-round-label bracket-stepper-label">
            {ROUND_NAMES[clampedMobileRound] ?? 'Final'}
          </span>
          <button
            className="bracket-stepper-btn"
            onClick={() => setMobileRound(r => Math.min(rounds.length - 1, r + 1))}
            disabled={clampedMobileRound >= rounds.length - 1}
            aria-label="Next round"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="bracket-stepper-dots">
          {rounds.map((_, rIdx) => (
            <button
              key={rIdx}
              className={`bracket-stepper-dot ${rIdx === clampedMobileRound ? 'active' : ''}`}
              onClick={() => setMobileRound(rIdx)}
              aria-label={`Go to ${ROUND_NAMES[rIdx] ?? 'Final'}`}
            />
          ))}
        </div>
        <div className="bracket-round">
          {currentMobileRound?.map((match, mIdx) => renderMatch(match, mIdx))}
        </div>
      </div>
    </div>
  );
}

export default function SeasonSimulation() {
  const [conferences, setConferences] = useState<Record<Conference, Seed[]> | null>(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [champions, setChampions] = useState<Partial<Record<Conference, Seed>>>({});
  const [cupWinner, setCupWinner] = useState<Seed | null>(null);
  const [revealTrophy, setRevealTrophy] = useState(false);
  const [mobileConf, setMobileConf] = useState<Conference>('East');
  const finalTimeout = useRef<number | null>(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/bracket`)
      .then(res => setConferences(res.data.conferences))
      .catch(() => setError('Failed to load bracket seeding. Ensure backend is running.'));
  }, []);

  const startSimulation = () => {
    setChampions({});
    setCupWinner(null);
    setRevealTrophy(false);
    setRunning(true);
  };

  const handleEastChampion = useCallback((team: Seed) => {
    setChampions(prev => (prev.East ? prev : { ...prev, East: team }));
  }, []);

  const handleWestChampion = useCallback((team: Seed) => {
    setChampions(prev => (prev.West ? prev : { ...prev, West: team }));
  }, []);

  useEffect(() => {
    if (champions.East && champions.West && !cupWinner) {
      finalTimeout.current = window.setTimeout(() => {
        const a = champions.East!;
        const b = champions.West!;
        const pA = eloWinProb(a.elo, b.elo, 0);
        const winner = Math.random() < pA ? a : b;
        setCupWinner(winner);
        setTimeout(() => setRevealTrophy(true), 400);
      }, 1200);
    }
    return () => {
      if (finalTimeout.current) window.clearTimeout(finalTimeout.current);
    };
  }, [champions, cupWinner]);

  const shieldWinner = conferences
    ? [...conferences.East, ...conferences.West].sort((a, b) => b.shieldOdds - a.shieldOdds)[0]
    : null;

  return (
    <div className="page-stack">
      <div className="page-header">
        <span className="eyebrow">Elo-Driven Bracket</span>
        <h1>Playoff Simulation</h1>
        <p className="lede">Top 8 seeds per conference battle through a live bracket, decided by real Elo win probabilities, down to an MLS Cup champion.</p>
      </div>

    <div className="season-sim">
      <div className="stadium-canvas-wrap trophy-canvas-wrap">
        <Canvas camera={{ position: [0, 12, 26], fov: 42 }} dpr={[1, 1.75]}>
          <Suspense fallback={null}>
            <color attach="background" args={['#050208']} />
            <fog attach="fog" args={['#050208', 30, 90]} />
            <Stars radius={150} depth={50} count={4000} factor={4} fade speed={0.6} />
            <ambientLight intensity={0.35} />
            <pointLight position={[0, 20, 10]} intensity={60} color="#ffe9a8" />
            <Trophy reveal={revealTrophy} />
            <Confetti active={revealTrophy} />
          </Suspense>
        </Canvas>

        {cupWinner && (
          <div className="champion-banner" style={teamCssVars(getTeam(cupWinner.team))}>
            <Crest team={getTeam(cupWinner.team)} size={72} animated />
            <div>
              <div className="champion-label">MLS Cup Champion</div>
              <div className="champion-name">{cupWinner.team}</div>
            </div>
          </div>
        )}

        {!cupWinner && shieldWinner && (
          <div className="shield-hint">
            <span>Supporters' Shield favorite</span>
            <strong>{shieldWinner.team}</strong>
            <span>{shieldWinner.shieldOdds}% odds</span>
          </div>
        )}
      </div>

      <div className="glass-card">
        <h2>Run the Bracket</h2>
        <p>Seeded from current standings, this animates a full playoff run: Quarterfinals → Semifinals → Conference Finals → MLS Cup.</p>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" onClick={startSimulation} disabled={running && !cupWinner}>
          {cupWinner ? 'Re-run Playoffs' : running ? 'Simulating…' : 'Simulate Playoffs'}
        </button>
      </div>

      {conferences && (
        <>
          {/* Mobile: one conference visible at a time via tabs. Both stay
              mounted underneath so their simulations keep running and the
              MLS Cup final can still resolve regardless of which tab is
              active — CSS just hides the inactive one. */}
          <div className="conf-tabs responsive-show-mobile">
            <button
              className={`conf-tab conf-tab-east ${mobileConf === 'East' ? 'active' : ''}`}
              onClick={() => setMobileConf('East')}
            >
              Eastern
              {champions.East && <span className="conf-tab-check">✓</span>}
            </button>
            <button
              className={`conf-tab conf-tab-west ${mobileConf === 'West' ? 'active' : ''}`}
              onClick={() => setMobileConf('West')}
            >
              Western
              {champions.West && <span className="conf-tab-check">✓</span>}
            </button>
          </div>

          <div className="bracket-wrap">
            <div className={mobileConf === 'West' ? 'responsive-show-desktop-only' : ''}>
              <ConferenceBracket conference="East" seeds={conferences.East} onChampion={handleEastChampion} active={running} />
            </div>
            <div className={mobileConf === 'East' ? 'responsive-show-desktop-only' : ''}>
              <ConferenceBracket conference="West" seeds={conferences.West} onChampion={handleWestChampion} active={running} />
            </div>
          </div>
        </>
      )}
    </div>
    </div>
  );
}
