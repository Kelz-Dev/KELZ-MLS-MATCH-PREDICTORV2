import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const COLORS = ['#f5c518', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#ffffff'];

export default function Confetti({ active }: { active: boolean }) {
  const count = 220;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 60, 30 + Math.random() * 20, (Math.random() - 0.5) * 40),
      vel: new THREE.Vector3((Math.random() - 0.5) * 2, -(2 + Math.random() * 3), (Math.random() - 0.5) * 2),
      rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      spin: (Math.random() - 0.5) * 6,
      color: new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)]),
    }));
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (active) elapsed.current += delta;
    else elapsed.current = 0;

    data.forEach((p, i) => {
      if (active) {
        p.pos.addScaledVector(p.vel, delta);
        p.rot.x += p.spin * delta;
        p.rot.z += p.spin * delta * 0.6;
        if (p.pos.y < -2) {
          p.pos.y = 30 + Math.random() * 10;
          p.pos.x = (Math.random() - 0.5) * 60;
          p.pos.z = (Math.random() - 0.5) * 40;
        }
      }
      dummy.position.copy(p.pos);
      dummy.rotation.copy(p.rot);
      dummy.scale.setScalar(active ? 1 : 0.0001);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, p.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.6, 0.3]} />
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  );
}
