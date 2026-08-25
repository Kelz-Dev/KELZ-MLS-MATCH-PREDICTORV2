import { useEffect, useState } from 'react';
import axios from 'axios';
import Crest from '../teams/Crest';
import { getTeam } from '../teams/teamData';
import { teamCssVars } from '../teams/colorUtils';
import CountUp from './CountUp';
import { API_BASE } from '../apiBase';

interface StandingRow {
  team: string;
  points: number;
  played: number;
  conference: string;
}

export default function Standings() {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'All' | 'East' | 'West'>('All');

  useEffect(() => {
    axios.get(`${API_BASE}/api/standings`)
      .then(res => {
        setStandings(res.data.data || []);
        setMessage(res.data.message || '');
      })
      .catch(err => console.error('Error fetching standings', err));
  }, []);

  const filteredStandings = standings.filter(s => filter === 'All' || s.conference === filter);

  return (
    <div className="page-stack">
      <div className="page-header">
        <span className="eyebrow">Real-Time Data</span>
        <h1>League Standings</h1>
        <p className="lede">Current MLS table, pulled live and split by conference.</p>
      </div>

      <div className="glass-card">
        <span className="live-pill"><span className="live-dot" />LIVE</span>
        {message && <p className="status-text" style={{ marginTop: '-0.75rem' }}>{message}</p>}

        <div className="filter-container">
          <button className={`filter-btn ${filter === 'All' ? 'active' : ''}`} onClick={() => setFilter('All')}>
            All Teams
          </button>
          <button className={`filter-btn ${filter === 'East' ? 'active' : ''}`} onClick={() => setFilter('East')}>
            Eastern Conference
          </button>
          <button className={`filter-btn ${filter === 'West' ? 'active' : ''}`} onClick={() => setFilter('West')}>
            Western Conference
          </button>
        </div>

        {/* Table layout — tablet and up */}
        <div className="table-container responsive-hide-mobile">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Team</th>
                <th>Conference</th>
                <th>Played</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {filteredStandings.map((s, i) => {
                const team = getTeam(s.team);
                return (
                  <tr
                    key={i}
                    className="standings-row"
                    style={{ animationDelay: `${i * 30}ms`, ...teamCssVars(team) }}
                  >
                    <td className={`rank-cell ${i < 3 ? 'top3' : ''}`}>{i + 1}</td>
                    <td>
                      <div className="team-cell">
                        <Crest team={team} size={30} />
                        <strong>{s.team}</strong>
                      </div>
                    </td>
                    <td>
                      <span className={`conf-badge conf-${s.conference?.toLowerCase() || 'unknown'}`}>
                        {s.conference || 'Unknown'}
                      </span>
                    </td>
                    <td className="stat-cell">{s.played}</td>
                    <td className="stat-cell-hero"><CountUp value={s.points} /></td>
                  </tr>
                );
              })}
              {filteredStandings.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={5}>
                    {standings.length === 0 ? 'Loading live standings…' : 'No teams found for this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card list layout — mobile only, no horizontal scrolling */}
        <div className="rank-list responsive-show-mobile">
          {filteredStandings.map((s, i) => {
            const team = getTeam(s.team);
            return (
              <div
                key={i}
                className="rank-card standings-row"
                style={{ animationDelay: `${i * 30}ms`, ...teamCssVars(team) }}
              >
                <span className={`rank-card-pos ${i < 3 ? 'top3' : ''}`}>{i + 1}</span>
                <Crest team={team} size={34} />
                <div className="rank-card-info">
                  <strong className="rank-card-name">{s.team}</strong>
                  <div className="rank-card-meta">
                    <span className={`conf-badge conf-${s.conference?.toLowerCase() || 'unknown'}`}>
                      {s.conference || 'Unknown'}
                    </span>
                    <span className="rank-card-played">{s.played} GP</span>
                  </div>
                </div>
                <div className="rank-card-points">
                  <span className="rank-card-points-value"><CountUp value={s.points} /></span>
                  <span className="rank-card-points-label">PTS</span>
                </div>
              </div>
            );
          })}
          {filteredStandings.length === 0 && (
            <div className="empty-row" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              {standings.length === 0 ? 'Loading live standings…' : 'No teams found for this filter.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
