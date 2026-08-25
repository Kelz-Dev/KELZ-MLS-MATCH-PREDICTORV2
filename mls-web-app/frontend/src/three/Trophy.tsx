import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export default function Trophy({ reveal }: { reveal: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = reveal ? 1 : 0;
    scaleRef.current = THREE.MathUtils.damp(scaleRef.current, targetScale, 4, delta);
    groupRef.current.scale.setScalar(scaleRef.current);
    groupRef.current.rotation.y += delta * 0.6;
    groupRef.current.position.y = 8 + Math.sin(state.clock.elapsedTime * 1.2) * 0.4;
  });

  return (
    <group ref={groupRef} position={[0, 8, 0]}>
      <mesh position={[0, -1.6, 0]}>
        <cylinderGeometry args={[1.4, 1.6, 0.5, 24]} />
        <meshStandardMaterial color="#1b1f2a" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 0.9, 16]} />
        <meshStandardMaterial color="#f5c518" metalness={1} roughness={0.15} emissive="#a8790a" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <sphereGeometry args={[1.1, 24, 24]} />
        <meshStandardMaterial color="#f5c518" metalness={1} roughness={0.15} emissive="#a8790a" emissiveIntensity={0.35} />
      </mesh>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * 1.3, 0.1, 0]} rotation={[0, 0, side * -0.6]}>
          <torusGeometry args={[0.7, 0.14, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#f5c518" metalness={1} roughness={0.15} emissive="#a8790a" emissiveIntensity={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.55, 20, 20]} />
        <meshStandardMaterial color="#fff7db" metalness={0.9} roughness={0.1} emissive="#f5c518" emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0, 0.5, 0]} intensity={40} distance={20} color="#f5c518" />
      <pointLight position={[-4, -2, 3]} intensity={30} distance={16} color="#ff3d81" />
      <pointLight position={[4, -2, 3]} intensity={30} distance={16} color="#3b8eff" />
    </group>
  );
}
