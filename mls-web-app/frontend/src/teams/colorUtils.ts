import type { CSSProperties } from 'react';

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Picks black or white text for readable contrast against a given background color.
export function contrastText(hex: string): string {
  return relativeLuminance(hex) > 0.42 ? '#0a0a0a' : '#ffffff';
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Applies a team's palette to a DOM element's inline CSS custom properties so
// any descendant can theme off `var(--team-primary)` etc without prop drilling.
export function teamCssVars(team: { primary: string; secondary: string; accent: string }) {
  return {
    '--team-primary': team.primary,
    '--team-secondary': team.secondary,
    '--team-accent': team.accent,
    '--team-primary-text': contrastText(team.primary),
    '--team-glow': rgba(team.primary, 0.35),
    '--team-tint': rgba(team.primary, 0.12),
  } as CSSProperties;
}
