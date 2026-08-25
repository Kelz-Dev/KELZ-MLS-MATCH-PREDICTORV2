import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface CameraRigProps {
  mode: 'idle' | 'match' | 'goal';
}

const lookTarget = { idle: new THREE.Vector3(0, 0, 0), match: new THREE.Vector3(0, 2, 0), goal: new THREE.Vector3(0, 3, -20) };

export default function CameraRig({ mode }: CameraRigProps) {
  const { camera } = useThree();
  const t = useRef(0);
  const goalT = useRef(0);
  const prevMode = useRef(mode);
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));
  const desired = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    t.current += dt;

    if (mode !== prevMode.current) {
      if (mode === 'goal') goalT.current = 0;
      prevMode.current = mode;
    }

    if (mode === 'idle') {
      const radius = 95;
      const angle = t.current * 0.05;
      desired.current.set(Math.sin(angle) * radius, 55, Math.cos(angle) * radius);
    } else if (mode === 'match') {
      const radius = 70;
      const angle = t.current * 0.1;
      desired.current.set(Math.sin(angle) * radius, 34, Math.cos(angle) * radius * 0.7 + 20);
    } else if (mode === 'goal') {
      goalT.current += dt;
      const swoop = Math.min(goalT.current / 1.4, 1);
      const eased = THREE.MathUtils.smootherstep(swoop, 0, 1);
      const start = new THREE.Vector3(0, 40, 90);
      const end = new THREE.Vector3(20, 10, 30);
      desired.current.copy(start).lerp(end, eased);
    }

    // Critically-damped follow for buttery transitions between modes/positions,
    // instead of hard-cutting the camera when `mode` changes.
    camera.position.x = THREE.MathUtils.damp(camera.position.x, desired.current.x, 3.2, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desired.current.y, 3.2, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desired.current.z, 3.2, dt);

    const target = lookTarget[mode];
    currentLook.current.x = THREE.MathUtils.damp(currentLook.current.x, target.x, 4, dt);
    currentLook.current.y = THREE.MathUtils.damp(currentLook.current.y, target.y, 4, dt);
    currentLook.current.z = THREE.MathUtils.damp(currentLook.current.z, target.z, 4, dt);
    camera.lookAt(currentLook.current);
  });

  return null;
}
