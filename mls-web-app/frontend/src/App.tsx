import { useRef, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Home, Activity, GitCommit, Award } from 'lucide-react';
import Overview from './components/Overview';
import Standings from './components/Standings';
import MatchCenter from './components/MatchCenter';
import SeasonSimulation from './components/SeasonSimulation';
import Logo from './components/Logo';
import './index.css';

function useIsMobile(breakpoint = 760) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= breakpoint);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
}

function RotatingSphere({ position, color, speed }: { position: [number, number, number]; color: string; speed: number }) {
  const meshRef = useRef<any>(null);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.08 * speed;
      meshRef.current.rotation.y += delta * 0.12 * speed;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <icosahedronGeometry args={[2, 1]} />
      <meshStandardMaterial color={color} wireframe transparent opacity={0.16} />
    </mesh>
  );
}

function Scene() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ff3d81" />
        <pointLight position={[-10, -6, 4]} intensity={0.8} color="#3b8eff" />
        <Stars radius={100} depth={50} count={4000} factor={4} saturation={0} fade speed={0.6} />
        <RotatingSphere position={[0, 0, -5]} color="#ff3d81" speed={1} />
        <RotatingSphere position={[4, 2, -9]} color="#3b8eff" speed={0.6} />
        <RotatingSphere position={[-4, -2, -8]} color="#a855f7" speed={0.8} />
      </Canvas>
    </div>
  );
}

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: Home, end: true },
  { to: '/standings', label: 'Standings', icon: Activity, end: false },
  { to: '/predict', label: 'Match Center', icon: GitCommit, end: false },
  { to: '/playoffs', label: 'Playoffs', icon: Award, end: false },
];

function App() {
  const isMobile = useIsMobile();

  return (
    <Router>
      <div className="app-container">
        <div className="app-backdrop" />
        {!isMobile && <Scene />}

        <nav className="glass-nav">
          <div className="nav-brand">
            <span className="nav-brand-mark"><Logo size={36} /></span>
            <span className="nav-brand-name">MLS ORACLE</span>
          </div>
          <div className="nav-links">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon size={16} strokeWidth={2.5} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="content-container">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/predict" element={<MatchCenter />} />
            <Route path="/playoffs" element={<SeasonSimulation />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
