import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { TeamIdentity } from '../teams/teamData';
import { rollScoreline } from './scoreline';

interface MatchSimProps {
  homeTeam: TeamIdentity;
  awayTeam: TeamIdentity;
  prediction: { home: number; draw: number; away: number } | null;
  playing: boolean;
  /** Highlight-reel pace for tournament mode — compresses buildup, shot, and
   *  goal-celebration timing (~5x) so a full match takes a few seconds
   *  instead of 20-40s, while still visibly playing out on the pitch. */
  fast?: boolean;
  onGoal?: (side: 'home' | 'away') => void;
  onFinish?: () => void;
}

const SKIN_TONES = ['#e8b88a', '#c68a5e', '#8d5a3c', '#5c3a26'];

const PITCH_W = 68 * 1.05;
const PITCH_H = 105 * 1.05;

// Base formation offsets (4-3-3-ish), relative to own half, x in [-1,1], z depth toward own goal
const FORMATION: [number, number][] = [
  [0, 0.92], // GK
  [-0.65, 0.68], [-0.22, 0.72], [0.22, 0.72], [0.65, 0.68], // back 4
  [-0.45, 0.42], [0, 0.45], [0.45, 0.42], // midfield 3
  [-0.55, 0.15], [0, 0.1], [0.55, 0.15], // front 3
];

function makeFormationBase(side: 1 | -1) {
  return FORMATION.map(([x, z]) => new THREE.Vector3(x * (PITCH_W / 2 - 3), 0, side * z * (PITCH_H / 2 - 2)));
}

interface PlayerHandle {
  group: THREE.Group | null;
}

function Player({
  innerRef,
  color,
  accent,
  isGK,
  skinTone,
}: {
  innerRef: (el: THREE.Group | null) => void;
  color: string;
  accent: string;
  isGK: boolean;
  skinTone: string;
}) {
  const jerseyColor = isGK ? '#f4d03f' : color;
  const shortsColor = isGK ? '#1a1a1a' : accent;

  return (
    <group ref={innerRef}>
      {/* shadow blob */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.3} />
      </mesh>

      {/* legs */}
      <mesh position={[-0.16, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.75, 3, 6]} />
        <meshStandardMaterial color="#e4c9a0" roughness={0.8} />
      </mesh>
      <mesh position={[0.16, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.75, 3, 6]} />
        <meshStandardMaterial color="#e4c9a0" roughness={0.8} />
      </mesh>

      {/* shorts */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <capsuleGeometry args={[0.36, 0.28, 3, 8]} />
        <meshStandardMaterial color={shortsColor} roughness={0.65} />
      </mesh>

      {/* torso / jersey */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.62, 4, 8]} />
        <meshStandardMaterial color={jerseyColor} roughness={0.55} />
      </mesh>
      {/* jersey side stripe (accent trim) */}
      <mesh position={[0, 1.42, 0.31]} castShadow>
        <boxGeometry args={[0.08, 0.66, 0.06]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>

      {/* arms */}
      <mesh position={[-0.42, 1.4, 0]} rotation={[0, 0, 0.18]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 3, 6]} />
        <meshStandardMaterial color={jerseyColor} roughness={0.55} />
      </mesh>
      <mesh position={[0.42, 1.4, 0]} rotation={[0, 0, -0.18]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 3, 6]} />
        <meshStandardMaterial color={jerseyColor} roughness={0.55} />
      </mesh>

      {/* head */}
      <mesh position={[0, 2.02, 0]} castShadow>
        <sphereGeometry args={[0.24, 14, 14]} />
        <meshStandardMaterial color={skinTone} roughness={0.7} />
      </mesh>
    </group>
  );
}

// Permanent color-coded marker behind each goal so a viewer can tell which
// end belongs to which team from any camera angle, independent of jersey
// color recognition — a flat ring tinted in the team's primary color plus
// a soft ground glow.
function TeamSideMarker({ color, side }: { color: string; side: 1 | -1 }) {
  const z = side * (PITCH_H / 2 + 3);
  return (
    <group position={[0, 0.03, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.6, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      <pointLight position={[0, 3, 0]} color={color} intensity={40} distance={22} decay={2} />
    </group>
  );
}

type Phase = 'idle' | 'buildup' | 'shot' | 'goal' | 'reset';

export default function MatchSim({ homeTeam, awayTeam, prediction, playing, fast = false, onGoal, onFinish }: MatchSimProps) {
  const speed = fast ? 5 : 1;
  const buildupDuration = 3.2 / speed;
  const shotDuration = 0.9 / speed;
  const goalCelebrationDuration = 1.6 / speed;
  const resetDuration = 0.6 / speed;

  const homeBase = useMemo(() => makeFormationBase(1), []);
  const awayBase = useMemo(() => makeFormationBase(-1), []);

  const ballRef = useRef<THREE.Mesh>(null);
  const homeRefs = useRef<PlayerHandle[]>(homeBase.map(() => ({ group: null })));
  const awayRefs = useRef<PlayerHandle[]>(awayBase.map(() => ({ group: null })));

  // scratch vectors reused every frame to avoid GC churn
  const scratchA = useMemo(() => new THREE.Vector3(), []);
  const scratchB = useMemo(() => new THREE.Vector3(), []);

  const clock = useRef(0);
  const phase = useRef<Phase>('idle');
  const target = useRef(new THREE.Vector3(0, 0, 0));
  // Full queue of goal-scorers for this match (e.g. ['home','home','away'] for
  // a 2-1 win) instead of a single outcome — lets the animated kickoff play
  // out a believable scoreline rather than always stopping after one goal.
  const goalQueue = useRef<('home' | 'away')[]>([]);
  const goalIndex = useRef(0);
  // How many attacking sequences to actually play (goals + a couple of
  // near-misses so a 0-0 draw isn't a completely empty animation).
  const possessionsTotal = useRef(0);
  const possessionIndex = useRef(0);
  const finished = useRef(false);
  const willScore = useRef(false);
  const attackingHomeRef = useRef(true);

  useEffect(() => {
    if (playing && prediction) {
      clock.current = 0;
      phase.current = 'buildup';
      finished.current = false;
      goalIndex.current = 0;
      possessionIndex.current = 0;

      const scoreline = rollScoreline(prediction.home, prediction.draw, prediction.away);
      const queue: ('home' | 'away')[] = [];
      for (let i = 0; i < scoreline.home; i++) queue.push('home');
      for (let i = 0; i < scoreline.away; i++) queue.push('away');
      // Shuffle so goals don't always play out "all home goals then all away"
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
      goalQueue.current = queue;
      // Every match plays at least 2 attacking sequences so a 0-0 draw still
      // shows a couple of near-misses instead of an instantly-finished sim.
      possessionsTotal.current = Math.max(queue.length, 2);
    } else {
      phase.current = 'idle';
    }
  }, [playing, prediction]);

  const applyFormation = (
    refs: PlayerHandle[],
    base: THREE.Vector3[],
    pull: THREE.Vector3,
    lerpAmt: number
  ) => {
    for (let i = 0; i < refs.length; i++) {
      const g = refs[i].group;
      if (!g) continue;
      scratchA.copy(base[i]).add(pull);
      g.position.lerp(scratchA, lerpAmt);
    }
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;

    if (phase.current === 'idle') {
      // gentle idle drift / breathing formation
      const t = state.clock.elapsedTime;
      for (let i = 0; i < homeRefs.current.length; i++) {
        const g = homeRefs.current[i].group;
        if (!g) continue;
        scratchA.copy(homeBase[i]).add(scratchB.set(Math.sin(t * 0.5 + i) * 0.6, 0, Math.cos(t * 0.4 + i) * 0.4));
        g.position.lerp(scratchA, 0.05);
      }
      for (let i = 0; i < awayRefs.current.length; i++) {
        const g = awayRefs.current[i].group;
        if (!g) continue;
        scratchA.copy(awayBase[i]).add(scratchB.set(Math.sin(t * 0.5 + i + 3) * 0.6, 0, Math.cos(t * 0.4 + i + 3) * 0.4));
        g.position.lerp(scratchA, 0.05);
      }
      if (ballRef.current) {
        ballRef.current.position.lerp(scratchA.set(Math.sin(t * 0.3) * 3, 0.35, Math.cos(t * 0.3) * 2), 0.04);
      }
      return;
    }

    const t = clock.current;

    // Whether this possession will score is decided once, at the start of
    // 'buildup', by whether there's a goal left in the queue for the side
    // taking this possession — not by a fresh coinflip each time.
    if (phase.current === 'buildup') {
      if (t <= dt) {
        // First frame of this possession: assign attacking side + outcome.
        const nextGoal = goalIndex.current < goalQueue.current.length ? goalQueue.current[goalIndex.current] : null;
        if (nextGoal) {
          attackingHomeRef.current = nextGoal === 'home';
          willScore.current = true;
        } else {
          // Filler near-miss possession: alternate sides for visual variety.
          attackingHomeRef.current = possessionIndex.current % 2 === 0;
          willScore.current = false;
        }
      }

      const attackingHome = attackingHomeRef.current;
      const progress = Math.min(t / buildupDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      const goalZ = attackingHome ? -(PITCH_H / 2 - 8) : (PITCH_H / 2 - 8);
      const ballX = Math.sin(eased * Math.PI * 2) * 8 * (1 - eased * 0.5);
      const ballZ = THREE.MathUtils.lerp(0, goalZ, eased);
      if (ballRef.current) {
        ballRef.current.position.lerp(
          scratchA.set(ballX, 0.35 + Math.sin(eased * Math.PI) * 1.2, ballZ),
          0.35
        );
      }

      const homePull = attackingHome ? scratchB.set(ballX * 0.3, 0, ballZ * 0.4) : scratchB.set(0, 0, 0);
      applyFormation(homeRefs.current, homeBase, homePull.clone(), 0.08);
      const awayPull = !attackingHome ? scratchB.set(ballX * 0.3, 0, ballZ * 0.4) : scratchB.set(0, 0, 0);
      applyFormation(awayRefs.current, awayBase, awayPull.clone(), 0.08);

      if (progress >= 1) {
        phase.current = 'shot';
        clock.current = 0;
        target.current = willScore.current
          ? new THREE.Vector3((Math.random() - 0.5) * 5, 1.2, attackingHome ? -(PITCH_H / 2 + 2) : (PITCH_H / 2 + 2))
          : new THREE.Vector3((Math.random() - 0.5) * 3, 2.8, attackingHome ? -(PITCH_H / 2 - 14) : (PITCH_H / 2 - 14));
      }
      return;
    }

    if (phase.current === 'shot') {
      const progress = Math.min(t / shotDuration, 1);
      const eased = progress * progress * (3 - 2 * progress); // smoothstep
      const goalZ = attackingHomeRef.current ? -(PITCH_H / 2 - 8) : (PITCH_H / 2 - 8);
      scratchA.set(0, 0.35, goalZ).lerp(target.current, eased);
      scratchA.y = 0.35 + Math.sin(eased * Math.PI) * 1.5;
      if (ballRef.current) ballRef.current.position.copy(scratchA);

      if (progress >= 1) {
        if (willScore.current) {
          phase.current = 'goal';
          clock.current = 0;
          const side: 'home' | 'away' = attackingHomeRef.current ? 'home' : 'away';
          goalIndex.current += 1;
          onGoal?.(side);
        } else {
          phase.current = 'reset';
          clock.current = 0;
        }
      }
      return;
    }

    if (phase.current === 'goal') {
      if (t > goalCelebrationDuration) {
        phase.current = 'reset';
        clock.current = 0;
      }
      return;
    }

    if (phase.current === 'reset') {
      applyFormation(homeRefs.current, homeBase, scratchB.set(0, 0, 0), 0.12);
      applyFormation(awayRefs.current, awayBase, scratchB.set(0, 0, 0), 0.12);
      if (t > resetDuration) {
        possessionIndex.current += 1;
        const allGoalsPlayed = goalIndex.current >= goalQueue.current.length;
        const enoughPossessions = possessionIndex.current >= possessionsTotal.current;
        if (allGoalsPlayed && enoughPossessions && !finished.current) {
          finished.current = true;
          onFinish?.();
          phase.current = 'idle';
        } else {
          phase.current = 'buildup';
          clock.current = 0;
        }
      }
      return;
    }
  });

  return (
    <group>
      {homeBase.map((p, i) => (
        <Player
          key={`h-${i}`}
          innerRef={(el) => { homeRefs.current[i].group = el; if (el) el.position.copy(p); }}
          color={homeTeam.primary}
          accent={homeTeam.secondary}
          isGK={i === 0}
          skinTone={SKIN_TONES[i % SKIN_TONES.length]}
        />
      ))}
      {awayBase.map((p, i) => (
        <Player
          key={`a-${i}`}
          innerRef={(el) => { awayRefs.current[i].group = el; if (el) el.position.copy(p); }}
          color={awayTeam.primary}
          accent={awayTeam.secondary}
          isGK={i === 0}
          skinTone={SKIN_TONES[(i + 2) % SKIN_TONES.length]}
        />
      ))}
      <mesh ref={ballRef} position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#f5f5f0" roughness={0.4} />
      </mesh>

      <TeamSideMarker color={homeTeam.primary} side={1} />
      <TeamSideMarker color={awayTeam.primary} side={-1} />

      {/* goals */}
      {[1, -1].map(side => (
        <group key={side} position={[0, 0, side * (PITCH_H / 2 - 8)]}>
          <mesh position={[0, 1.2, side * 6]}>
            <boxGeometry args={[7.32, 2.44, 0.15]} />
            <meshStandardMaterial color="white" wireframe />
          </mesh>
        </group>
      ))}
    </group>
  );
}
