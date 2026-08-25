import { useMemo, useRef, type ReactElement } from 'react';
import * as THREE from 'three';

function Pitch() {
  const lineColor = '#eafff2';

  const lines = useMemo(() => {
    const group: ReactElement[] = [];
    const w = 68 * 1.05;
    const h = 105 * 1.05;
    const y = 0.02;

    const lineMat = <meshBasicMaterial color={lineColor} transparent opacity={0.9} />;

    // outer boundary
    group.push(
      <lineSegments key="boundary" position={[0, y, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(w, h)]} />
        <lineBasicMaterial color={lineColor} transparent opacity={0.9} />
      </lineSegments>
    );

    // halfway line
    group.push(
      <mesh key="halfway" position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, 0.15]} />
        {lineMat}
      </mesh>
    );

    // center circle
    group.push(
      <mesh key="circle" position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.1, 9.25, 64]} />
        {lineMat}
      </mesh>
    );
    group.push(
      <mesh key="spot" position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        {lineMat}
      </mesh>
    );

    // penalty boxes (top & bottom)
    for (const dir of [1, -1]) {
      const boxZ = dir * (h / 2 - 16.5);
      group.push(
        <lineSegments key={`box18-${dir}`} position={[0, y, boxZ]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(40.3, 16.5)]} />
          <lineBasicMaterial color={lineColor} transparent opacity={0.9} />
        </lineSegments>
      );
      const box6Z = dir * (h / 2 - 5.5);
      group.push(
        <lineSegments key={`box6-${dir}`} position={[0, y, box6Z]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(18.3, 5.5)]} />
          <lineBasicMaterial color={lineColor} transparent opacity={0.9} />
        </lineSegments>
      );
      group.push(
        <mesh key={`pk-${dir}`} position={[0, y, dir * (h / 2 - 11)]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 16]} />
          {lineMat}
        </mesh>
      );
      // penalty arc
      group.push(
        <mesh key={`arc-${dir}`} position={[0, y, dir * (h / 2 - 16.5)]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[9.1, 9.25, 32, 1, dir > 0 ? Math.PI * 0.78 : Math.PI * 1.78, Math.PI * 0.44]} />
          {lineMat}
        </mesh>
      );
    }

    return group;
  }, []);

  // mowed stripe pattern with subtle sheen variance
  const stripes = useMemo(() => {
    const arr = [];
    const stripeCount = 16;
    const w = 68 * 1.05;
    const h = 105 * 1.05;
    const stripeH = h / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      arr.push(
        <mesh key={i} position={[0, 0, -h / 2 + stripeH * i + stripeH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, stripeH]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#1f7a3d' : '#1c6f38'} roughness={0.92} metalness={0.02} />
        </mesh>
      );
    }
    return arr;
  }, []);

  return (
    <group>
      {stripes}
      {lines}
    </group>
  );
}

// A tiered bowl: three raked seating decks made from angled ring segments,
// each with a faint horizontal seat-row texture via stacked thin rings.
function Stands() {
  const decks = useMemo(() => {
    const arr: ReactElement[] = [];
    const deckConfigs = [
      { rInner: 46, rOuter: 62, yBase: 0, tilt: 0.28, color: '#171b26' },
      { rInner: 63, rOuter: 78, yBase: 9, tilt: 0.34, color: '#1c2130' },
      { rInner: 79, rOuter: 92, yBase: 20, tilt: 0.4, color: '#20263a' },
    ];

    deckConfigs.forEach((cfg, di) => {
      // main raked bowl ring (a flattened torus-like disc, tilted up and out)
      arr.push(
        <mesh key={`deck-${di}`} position={[0, cfg.yBase, 0]} rotation={[-Math.PI / 2 + cfg.tilt, 0, 0]} receiveShadow>
          <ringGeometry args={[cfg.rInner, cfg.rOuter, 64, 6]} />
          <meshStandardMaterial color={cfg.color} roughness={0.9} metalness={0.05} side={THREE.DoubleSide} />
        </mesh>
      );
      // seat-row rings (thin, lighter, for texture read from a distance)
      const rowCount = 7;
      for (let r = 0; r < rowCount; r++) {
        const t = r / (rowCount - 1);
        const rad = THREE.MathUtils.lerp(cfg.rInner + 1, cfg.rOuter - 1, t);
        arr.push(
          <mesh key={`row-${di}-${r}`} position={[0, cfg.yBase + 0.05, 0]} rotation={[-Math.PI / 2 + cfg.tilt, 0, 0]}>
            <ringGeometry args={[rad, rad + 0.35, 64]} />
            <meshBasicMaterial color={r % 2 === 0 ? '#3a4258' : '#2a3042'} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        );
      }
      // outer facade wall beneath the deck
      arr.push(
        <mesh key={`wall-${di}`} position={[0, cfg.yBase - 3.2, 0]}>
          <cylinderGeometry args={[cfg.rOuter, cfg.rOuter + 1.5, 6.4, 48, 1, true]} />
          <meshStandardMaterial color="#0d0f16" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      );
    });

    return arr;
  }, []);

  return <group>{decks}</group>;
}

// Sparse instanced crowd — small emissive-ish blobs scattered across the lower
// deck to read as "people" from broadcast camera distance without per-person cost.
function Crowd() {
  const count = 900;

  const colors = useMemo(
    () => ['#e8d9c5', '#c9a876', '#8a6d4f', '#3b3b3b', '#d94f4f', '#3b6fd9', '#e0c93b'].map(c => new THREE.Color(c)),
    []
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // populate once via layout effect pattern (ref callback)
  const setupRef = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh || (mesh as any).__populated) return;
    (mesh as any).__populated = true;
    let idx = 0;
    const rings = [
      { rInner: 47, rOuter: 61, yBase: 1.2, tilt: 0.28, n: 420 },
      { rInner: 64, rOuter: 77, yBase: 10.2, tilt: 0.34, n: 320 },
      { rInner: 80, rOuter: 91, yBase: 21.2, tilt: 0.4, n: 160 },
    ];
    for (const ring of rings) {
      for (let i = 0; i < ring.n && idx < count; i++, idx++) {
        const angle = Math.random() * Math.PI * 2;
        const rad = THREE.MathUtils.lerp(ring.rInner, ring.rOuter, Math.random());
        const x = Math.cos(angle) * rad;
        const z = Math.sin(angle) * rad;
        const heightFrac = (rad - ring.rInner) / (ring.rOuter - ring.rInner);
        const y = ring.yBase + heightFrac * (ring.rOuter - ring.rInner) * Math.tan(ring.tilt);
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(0.55 + Math.random() * 0.35);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
        mesh.setColorAt(idx, colors[Math.floor(Math.random() * colors.length)]);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.count = idx;
  };

  return (
    <instancedMesh ref={setupRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <capsuleGeometry args={[0.28, 0.5, 2, 4]} />
      <meshStandardMaterial roughness={0.9} />
    </instancedMesh>
  );
}

function Floodlights() {
  const positions: [number, number, number][] = [
    [-46, 0, -60],
    [46, 0, -60],
    [-46, 0, 60],
    [46, 0, 60],
  ];

  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 20, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.9, 40, 8]} />
            <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 41, 0]}>
            <boxGeometry args={[8, 4, 1.5]} />
            <meshStandardMaterial color="#111" metalness={0.4} roughness={0.5} />
          </mesh>
          <pointLight position={[0, 41, 1]} intensity={950} distance={230} color="#eaf2ff" decay={1.5} />
          <mesh position={[0, 41, 1.2]}>
            <boxGeometry args={[7, 3, 0.2]} />
            <meshStandardMaterial color="#eaf2ff" emissive="#aac4ff" emissiveIntensity={3} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Concert-style colored rim lights around the bowl — adds hot pink / cyan / purple
// accents to an otherwise all-white-floodlit stadium, matching the app's vibrant palette.
function AccentLights() {
  const rig: [number, number, number, string, number][] = [
    [-70, 14, 0, '#ff3d81', 260],
    [70, 14, 0, '#3b8eff', 260],
    [0, 16, -70, '#a855f7', 240],
    [0, 16, 70, '#22e6d6', 240],
  ];

  return (
    <>
      {rig.map(([x, y, z, color, distance], i) => (
        <pointLight key={i} position={[x, y, z]} color={color} intensity={220} distance={distance} decay={2} />
      ))}
    </>
  );
}

export default function Stadium() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      <Pitch />
      <Stands />
      <Crowd />
      <Floodlights />
      <AccentLights />

      {/* ground skirt beyond stands */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[110, 48]} />
        <meshStandardMaterial color="#0a0d12" roughness={1} />
      </mesh>

      <ambientLight intensity={0.32} />
      <hemisphereLight args={['#6a4bb8', '#0d0518', 0.4]} />
    </group>
  );
}
