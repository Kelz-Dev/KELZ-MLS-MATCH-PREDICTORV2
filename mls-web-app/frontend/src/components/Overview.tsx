import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Shield, Repeat, Users } from 'lucide-react';
import Crest from '../teams/Crest';
import { getTeam } from '../teams/teamData';
import { teamCssVars } from '../teams/colorUtils';
import CountUp from './CountUp';

interface PredictionRow {
  Team: string;
  'MLS Cup %': number;
  'Shield %': number;
}

export default function Overview() {
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/season_predictions')
      .then(res => setPredictions(res.data.data))
      .catch(err => console.error('Error fetching season predictions', err));
  }, []);

  const topCup = predictions[0];
  const topShield = [...predictions].sort((a, b) => b['Shield %'] - a['Shield %'])[0];
  const cupTeam = topCup ? getTeam(topCup.Team) : null;
  const shieldTeam = topShield ? getTeam(topShield.Team) : null;

  return (
    <div className="page-stack">
      <div className="page-header">
        <span className="eyebrow">Machine Learning · Monte Carlo Simulation</span>
        <h1>MLS Season Oracle</h1>
        <p className="lede">
          A logistic regression model trained on rolling form, home/away splits, and Elo ratings, run through
          10,000 simulated seasons to forecast the MLS Cup and Supporters' Shield race.
        </p>
      </div>

      {cupTeam && topCup && (
        <div className="spotlight-card" style={teamCssVars(cupTeam)}>
          <div className="spotlight-glow" />
          <Crest team={cupTeam} size={92} animated className="spotlight-crest" />
          <div className="spotlight-info">
            <span className="spotlight-label"><Trophy size={14} /> Current MLS Cup Favorite</span>
            <h2 className="spotlight-name">{topCup.Team}</h2>
            <div className="spotlight-stats">
              <div>
                <span className="spotlight-stat-value"><CountUp value={Number(topCup['MLS Cup %'])} decimals={1} suffix="%" /></span>
                <span className="spotlight-stat-label">Cup odds</span>
              </div>
              <div>
                <span className="spotlight-stat-value"><CountUp value={Number(topCup['Shield %'])} decimals={1} suffix="%" /></span>
                <span className="spotlight-stat-label">Shield odds</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="stat-tiles">
        <div className="stat-tile" style={cupTeam ? { ['--tile-color' as string]: cupTeam.primary } : undefined}>
          <div className="stat-tile-label"><Trophy size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Cup Favorite</div>
          <div className="stat-tile-value">{topCup ? topCup.Team : '—'}</div>
          <div className="stat-tile-sub">{topCup ? `${Number(topCup['MLS Cup %']).toFixed(1)}% title odds` : 'Loading…'}</div>
        </div>
        <div className="stat-tile" style={shieldTeam ? { ['--tile-color' as string]: shieldTeam.primary } : undefined}>
          <div className="stat-tile-label"><Shield size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Shield Favorite</div>
          <div className="stat-tile-value">{topShield ? topShield.Team : '—'}</div>
          <div className="stat-tile-sub">{topShield ? `${Number(topShield['Shield %']).toFixed(1)}% odds` : 'Loading…'}</div>
        </div>
        <div className="stat-tile" style={{ ['--tile-color' as string]: 'var(--laser-cyan)' }}>
          <div className="stat-tile-label"><Repeat size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Simulations Run</div>
          <div className="stat-tile-value">10,000</div>
          <div className="stat-tile-sub">Monte Carlo season replays</div>
        </div>
        <div className="stat-tile" style={{ ['--tile-color' as string]: 'var(--sun-gold)' }}>
          <div className="stat-tile-label"><Users size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Teams Tracked</div>
          <div className="stat-tile-value">{predictions.length || 30}</div>
          <div className="stat-tile-sub">Across East &amp; West</div>
        </div>
      </div>

      <div className="glass-card">
        <h2>Simulated Season Finishes</h2>
        <p>Probability each club lifts the MLS Cup or tops the league table with the Supporters' Shield.</p>

        <div className="table-container responsive-hide-mobile">
          <table className="data-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>MLS Cup %</th>
                <th>Shield %</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p, i) => {
                const team = getTeam(p.Team);
                return (
                  <tr key={i} className="standings-row" style={{ animationDelay: `${i * 30}ms`, ...teamCssVars(team) }}>
                    <td>
                      <div className="team-cell">
                        <Crest team={team} size={30} />
                        <strong>{p.Team}</strong>
                      </div>
                    </td>
                    <td className="stat-cell-hero"><CountUp value={Number(p['MLS Cup %'])} decimals={2} /></td>
                    <td className="stat-cell"><CountUp value={Number(p['Shield %'])} decimals={2} /></td>
                  </tr>
                );
              })}
              {predictions.length === 0 && (
                <tr className="empty-row"><td colSpan={3}>Loading predictions…</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rank-list responsive-show-mobile">
          {predictions.map((p, i) => {
            const team = getTeam(p.Team);
            return (
              <div key={i} className="rank-card standings-row" style={{ animationDelay: `${i * 30}ms`, ...teamCssVars(team) }}>
                <span className={`rank-card-pos ${i < 3 ? 'top3' : ''}`}>{i + 1}</span>
                <Crest team={team} size={34} />
                <div className="rank-card-info">
                  <strong className="rank-card-name">{p.Team}</strong>
                  <div className="rank-card-meta">
                    <span className="rank-card-played">Shield <CountUp value={Number(p['Shield %'])} decimals={1} suffix="%" /></span>
                  </div>
                </div>
                <div className="rank-card-points">
                  <span className="rank-card-points-value"><CountUp value={Number(p['MLS Cup %'])} decimals={1} /></span>
                  <span className="rank-card-points-label">CUP %</span>
                </div>
              </div>
            );
          })}
          {predictions.length === 0 && (
            <div className="empty-row" style={{ padding: '2rem 1rem', textAlign: 'center' }}>Loading predictions…</div>
          )}
        </div>
      </div>
    </div>
  );
}
