import type { TeamIdentity } from './teamData';

interface CrestProps {
  team: TeamIdentity;
  size?: number;
  animated?: boolean;
  className?: string;
}

const SHAPES: Record<TeamIdentity['shape'], string> = {
  shield: 'M50 4 L92 18 L92 52 C92 78 74 94 50 100 C26 94 8 78 8 52 L8 18 Z',
  circle: 'M50 4 A46 46 0 1 1 49.99 4 Z',
  diamond: 'M50 2 L98 50 L50 98 L2 50 Z',
  hex: 'M50 3 L93 26.5 L93 73.5 L50 97 L7 73.5 L7 26.5 Z',
};

export default function Crest({ team, size = 64, animated = false, className }: CrestProps) {
  const gradId = `grad-${team.abbr}`;
  const clipId = `clip-${team.abbr}`;
  const glowId = `glow-${team.abbr}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={animated ? { filter: `drop-shadow(0 0 ${size * 0.12}px ${team.primary}66)` } : undefined}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={team.primary} />
          <stop offset="100%" stopColor={team.secondary} />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={SHAPES[team.shape]} />
        </clipPath>
        <radialGradient id={glowId} cx="30%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="100" height="100" fill={`url(#${gradId})`} />
        {/* diagonal accent band */}
        <rect x="-20" y="60" width="140" height="18" fill={team.accent} opacity="0.85" transform="rotate(-18 50 50)" />
        <rect x="0" y="0" width="100" height="100" fill={`url(#${glowId})`} />
      </g>

      <path
        d={SHAPES[team.shape]}
        fill="none"
        stroke={team.accent}
        strokeWidth="2.5"
        opacity="0.9"
      >
        {animated && (
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2.4s" repeatCount="indefinite" />
        )}
      </path>

      <text
        x="50"
        y="60"
        textAnchor="middle"
        fontSize="30"
        fontWeight="800"
        fontFamily="Inter, sans-serif"
        fill="#ffffff"
        stroke="#00000055"
        strokeWidth="0.5"
        letterSpacing="-1"
      >
        {team.abbr.length > 3 ? team.abbr.slice(0, 3) : team.abbr}
      </text>
    </svg>
  );
}
