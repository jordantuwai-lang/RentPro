'use client';

export function SaveIndicator({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (state === 'idle') return null;
  const config = {
    saving: { color: '#64748b', text: 'Saving...' },
    saved:  { color: '#01ae42', text: '✓ Saved' },
    error:  { color: '#ef4444', text: '⚠ Save failed' },
  }[state];
  return <span style={{ fontSize: '12px', fontWeight: 500, color: config.color }}>{config.text}</span>;
}
