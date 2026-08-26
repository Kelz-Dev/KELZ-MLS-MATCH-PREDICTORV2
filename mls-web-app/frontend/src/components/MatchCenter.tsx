import { useState, useEffect, useRef, Suspense } from 'react';
import axios from 'axios';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import Stadium from '../three/Stadium';
import MatchSim from '../three/MatchSim';
import CameraRig from '../three/CameraRig';
import Crest from '../teams/Crest';
import { getTeam } from '../teams/teamData';
import { teamCssVars } from '../teams/colorUtils';
import { API_BASE } from '../apiBase';

type Prediction = { home: number; draw: number; away: number };

const TOURNAMENT_SIZE = 10;
type TournamentMatchResult = 'home' | 'draw' | 'away';

export default function MatchCenter() {
  const [teams, setTeams] = useState<string[]>([]);
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [playing, setPlaying] = useState(false);
  const [cameraMode, setCameraMode] = useState<'idle' | 'match' | 'goal'>('idle');
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [matchDone, setMatchDone] = useState(false);
  const [flash, setFlash] = useState(false);
  const goalTimeout = useRef<number | null>(null);

  // Tournament mode: replays TOURNAMENT_SIZE quick matches back-to-back on
  // the same pitch, tracking a running tally shown in a corner overlay.
  const [tournamentActive, setTournamentActive] = useState(false);
  const [tournamentResults, setTournamentResults] = useState<TournamentMatchResult[]>([]);
  const [tournamentDone, setTournamentDone] = useState(false);
  const tournamentActiveRef = useRef(false);
  const nextMatchTimeout = useRef<number | null>(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/teams`)
      .then(res => setTeams(res.data.teams))
      .catch(err => console.error('Error fetching teams:', err));
  }, []);

  const handlePredict = async () => {
    if (!homeTeam || !awayTeam) return;
    if (homeTeam === awayTeam) {
      setError('Home and away teams must be different.');
      return;
    }

    setLoading(true);
    setError('');
    setPrediction(null);
    setMatchDone(false);
    setScore({ home: 0, away: 0 });
    setTournamentActive(false);
    tournamentActiveRef.current = false;
    setTournamentResults([]);
    setTournamentDone(false);
    try {
      const res = await axios.post(`${API_BASE}/api/predict_match`, {
        home_team: homeTeam,
        away_team: awayTeam,
      });
      setPrediction(res.data.prediction);
    } catch (err) {
      setError('Failed to fetch prediction. Ensure backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const kickoff = () => {
    if (!prediction) return;
    tournamentActiveRef.current = false;
    setTournamentActive(false);
    setScore({ home: 0, away: 0 });
    setMatchDone(false);
    setCameraMode('match');
    setPlaying(true);
  };

  const startTournament = () => {
    if (!prediction) return;
    if (nextMatchTimeout.current) window.clearTimeout(nextMatchTimeout.current);
    tournamentActiveRef.current = true;
    setTournamentActive(true);
    setTournamentDone(false);
    setTournamentResults([]);
    setScore({ home: 0, away: 0 });
    setMatchDone(false);
    setCameraMode('match');
    setPlaying(true);
  };

  const handleGoal = (side: 'home' | 'away') => {
    setScore(s => ({ ...s, [side]: s[side] + 1 }));
    setCameraMode('goal');
    setFlash(true);
    setTimeout(() => setFlash(false), 250);
    if (goalTimeout.current) window.clearTimeout(goalTimeout.current);
    goalTimeout.current = window.setTimeout(() => setCameraMode('match'), tournamentActiveRef.current ? 500 : 1800);
  };

  const handleFinish = () => {
    setPlaying(false);
    setCameraMode('idle');

    if (tournamentActiveRef.current) {
      setScore(current => {
        const result: TournamentMatchResult = current.home > current.away ? 'home' : current.home < current.away ? 'away' : 'draw';
        setTournamentResults(prev => {
          const next = [...prev, result];
          if (next.length >= TOURNAMENT_SIZE) {
            tournamentActiveRef.current = false;
            setTournamentActive(false);
            setTournamentDone(true);
            setMatchDone(true);
          } else {
            // Brief pause on the final score before the next kickoff.
            nextMatchTimeout.current = window.setTimeout(() => {
              setScore({ home: 0, away: 0 });
              setCameraMode('match');
              setPlaying(true);
            }, 600);
          }
          return next;
        });
        return current;
      });
    } else {
      setMatchDone(true);
    }
  };

  useEffect(() => {
    return () => {
      if (nextMatchTimeout.current) window.clearTimeout(nextMatchTimeout.current);
      if (goalTimeout.current) window.clearTimeout(goalTimeout.current);
    };
  }, []);

  const tournamentTally = tournamentResults.reduce(
    (acc, r) => {
      if (r === 'home') acc.home += 1;
      else if (r === 'away') acc.away += 1;
      else acc.draw += 1;
      return acc;
    },
    { home: 0, draw: 0, away: 0 }
  );

  const home = getTeam(homeTeam);
  const away = getTeam(awayTeam);

  return (
    <div className="page-stack">
      <div className="page-header">
        <span className="eyebrow">Live 3D Simulation</span>
        <h1>Match Center</h1>
        <p className="lede">Pick a fixture — the model's real win/draw/loss probabilities drive a live kickoff on the pitch.</p>
      </div>

    <div className="match-center">
      <div className="stadium-canvas-wrap">
        <Canvas shadows camera={{ position: [0, 55, 95], fov: 45 }} dpr={[1, 1.75]}>
          <Suspense fallback={null}>
            <color attach="background" args={['#0d0518']} />
            <fog attach="fog" args={['#0d0518', 90, 220]} />
            <Stars radius={200} depth={60} count={3000} factor={4} fade speed={0.5} />
            <Stadium />
            {homeTeam && awayTeam && (
              <MatchSim
                homeTeam={home}
                awayTeam={away}
                prediction={prediction}
                playing={playing}
                fast={tournamentActive}
                onGoal={handleGoal}
                onFinish={handleFinish}
              />
            )}
            <CameraRig mode={cameraMode} />
          </Suspense>
        </Canvas>

        {flash && <div className="goal-flash" />}

        {homeTeam && awayTeam && (
          <div
            className="scoreboard"
            style={{ borderImage: `linear-gradient(90deg, ${home.primary}, ${away.primary}) 1` }}
          >
            <div className="scoreboard-team">
              <Crest team={home} size={36} animated={playing} />
              <span>{home.abbr}</span>
            </div>
            <div className="scoreboard-score">
              {playing || matchDone ? `${score.home} - ${score.away}` : 'VS'}
            </div>
            <div className="scoreboard-team">
              <span>{away.abbr}</span>
              <Crest team={away} size={36} animated={playing} />
            </div>
          </div>
        )}

        {matchDone && !tournamentActive && (
          <div className="fulltime-badge">
            {tournamentDone ? '10-MATCH SAMPLE COMPLETE' : 'FULL TIME'}
          </div>
        )}

        {(tournamentActive || tournamentResults.length > 0) && (
          <div className="tournament-tally" style={teamCssVars(home)}>
            <div className="tournament-tally-header">
              <span className="tournament-tally-title">10-Match Sample</span>
              <span className="tournament-tally-progress">
                {tournamentDone ? 'Complete' : `Match ${Math.min(tournamentResults.length + 1, TOURNAMENT_SIZE)} / ${TOURNAMENT_SIZE}`}
              </span>
            </div>

            <div className="tournament-tally-rows">
              <div className="tournament-tally-row">
                <Crest team={home} size={20} />
                <span className="tournament-tally-name">{home.abbr}</span>
                <span className="tournament-tally-count" style={{ color: home.primary }}>{tournamentTally.home}</span>
              </div>
              <div className="tournament-tally-row">
                <span className="tournament-tally-draw-icon">=</span>
                <span className="tournament-tally-name">Draw</span>
                <span className="tournament-tally-count">{tournamentTally.draw}</span>
              </div>
              <div className="tournament-tally-row">
                <Crest team={away} size={20} />
                <span className="tournament-tally-name">{away.abbr}</span>
                <span className="tournament-tally-count" style={{ color: away.primary }}>{tournamentTally.away}</span>
              </div>
            </div>

            <div className="tournament-tally-dots">
              {Array.from({ length: TOURNAMENT_SIZE }).map((_, i) => {
                const result = tournamentResults[i];
                const dotColor = result === 'home' ? home.primary : result === 'away' ? away.primary : result === 'draw' ? 'var(--text-2)' : undefined;
                return (
                  <span
                    key={i}
                    className={`tournament-dot ${result ? 'filled' : ''}`}
                    style={dotColor ? { background: dotColor } : undefined}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card match-controls">
        <h2>Fixture Setup</h2>
        <p>Select two teams to generate a prediction, then kick off the simulation.</p>

        <div className="predictor-grid">
          <div style={homeTeam ? teamCssVars(home) : undefined}>
            <label>Home Team</label>
            <select
              className={`select-input ${homeTeam ? 'themed' : ''}`}
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
            >
              <option value="">Select Home Team</option>
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {homeTeam && (
              <div className="team-preview">
                <Crest team={home} size={48} />
                <span>{home.short}</span>
              </div>
            )}
          </div>

          <div className="vs-badge">VS</div>

          <div style={awayTeam ? teamCssVars(away) : undefined}>
            <label>Away Team</label>
            <select
              className={`select-input ${awayTeam ? 'themed' : ''}`}
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
            >
              <option value="">Select Away Team</option>
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {awayTeam && (
              <div className="team-preview">
                <Crest team={away} size={48} />
                <span>{away.short}</span>
              </div>
            )}
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="match-controls-buttons">
          <button className="btn" onClick={handlePredict} disabled={loading}>
            {loading ? 'Predicting…' : 'Get Prediction'}
          </button>
          {prediction && (
            <button className="btn btn-kickoff" onClick={kickoff} disabled={playing || tournamentActive}>
              {playing && !tournamentActive ? 'Match in progress…' : matchDone && !tournamentActive ? 'Replay Kickoff' : 'Kick Off ⚽'}
            </button>
          )}
          {prediction && (
            <button className="btn btn-ghost" onClick={startTournament} disabled={(playing && !tournamentActive) || tournamentActive}>
              {tournamentActive
                ? `Simulating ${Math.min(tournamentResults.length + 1, TOURNAMENT_SIZE)}/${TOURNAMENT_SIZE}…`
                : tournamentDone
                  ? 'Re-run 10-Match Sample'
                  : 'Simulate 10 Matches 🔁'}
            </button>
          )}
        </div>

        {prediction && (
          <div className="prediction-results" style={{ ['--home-color' as string]: home.primary, ['--away-color' as string]: away.primary }}>
            <h3>Model Probabilities</h3>
            <div className="prob-bars">
              <div className="prob-bar bar-home" style={{ width: `${prediction.home}%` }}>
                {prediction.home > 10 ? `${prediction.home}%` : ''}
              </div>
              <div className="prob-bar bar-draw" style={{ width: `${prediction.draw}%` }}>
                {prediction.draw > 10 ? `${prediction.draw}%` : ''}
              </div>
              <div className="prob-bar bar-away" style={{ width: `${prediction.away}%` }}>
                {prediction.away > 10 ? `${prediction.away}%` : ''}
              </div>
            </div>
            <div className="prob-legend">
              <span>{home.abbr} Win</span>
              <span>Draw</span>
              <span>{away.abbr} Win</span>
            </div>

            {tournamentResults.length > 0 && (
              <p className="batch-sim-hint" style={{ marginTop: '1rem' }}>
                Watch the top-left of the pitch above — the sample tally updates live as each match plays out.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
