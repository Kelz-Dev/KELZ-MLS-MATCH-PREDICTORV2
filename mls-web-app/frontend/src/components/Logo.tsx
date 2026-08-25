export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2a1240" />
          <stop offset="100%" stopColor="#0d0518" />
        </linearGradient>
        <linearGradient id="logoOrb" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff6fa8" />
          <stop offset="50%" stopColor="#ff3d81" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="logoArc" x1="4" y1="30" x2="36" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffc531" />
          <stop offset="100%" stopColor="#22e6d6" />
        </linearGradient>
        <radialGradient id="logoShine" cx="35%" cy="28%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#logoBg)" stroke="rgba(255,255,255,0.1)" />

      {/* orbit arc — trajectory / prediction path */}
      <path
        d="M8 27 C 12 15, 28 11, 33 16"
        stroke="url(#logoArc)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="33" cy="16" r="2.1" fill="#22e6d6" />

      {/* oracle orb */}
      <circle cx="17" cy="23" r="10" fill="url(#logoOrb)" />
      <circle cx="17" cy="23" r="10" fill="url(#logoShine)" />
      <circle cx="17" cy="23" r="10" stroke="#0d0518" strokeOpacity="0.25" strokeWidth="0.6" />

      {/* pitch seam lines across the orb, tilted like a broadcast crest */}
      <path d="M9 23 H25" stroke="#0d0518" strokeOpacity="0.35" strokeWidth="1" />
      <circle cx="17" cy="23" r="3.4" stroke="#0d0518" strokeOpacity="0.35" strokeWidth="1" fill="none" />
    </svg>
  );
}
