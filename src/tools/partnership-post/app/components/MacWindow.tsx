import React from 'react';

// Mac-style browser window chrome. Colors come from the canvas theme vars
// (--canvas-card-bg / --canvas-card-bg-2 / --canvas-bg / --canvas-border / --canvas-text*),
// which resolve from the canvas-dark / canvas-light class on the canvas root.
export function MacWindow({ url = 'joinmassive.com', children }: { url?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: 'var(--canvas-card-bg)',
        border: '1px solid var(--canvas-border)',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          padding: '0 22px',
          height: 60,
          backgroundColor: 'var(--canvas-card-bg-2)',
          borderBottom: '1px solid var(--canvas-border)',
        }}
      >
        {/* Traffic-light dots — real macOS colors */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
            <span
              key={color}
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                backgroundColor: color,
              }}
            />
          ))}
        </div>

        {/* Address bar */}
        <div
          style={{
            flex: 1,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 16px',
            borderRadius: 10,
            backgroundColor: 'var(--canvas-bg)',
            border: '1px solid var(--canvas-border)',
            color: 'var(--canvas-text-dim)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 18,
            letterSpacing: '0.01em',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <span>{url}</span>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: '48px 56px',
          backgroundColor: 'var(--canvas-card-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
