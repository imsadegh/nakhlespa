export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{ backgroundColor: 'var(--bg-base)' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 160% 140% at -10% -10%, var(--orb-a) 0%, color-mix(in srgb, var(--orb-a) 45%, transparent) 55%, transparent 100%), ' +
            'radial-gradient(ellipse 145% 120% at 110% 35%, var(--orb-c) 0%, color-mix(in srgb, var(--orb-c) 40%, transparent) 55%, transparent 100%), ' +
            'radial-gradient(ellipse 130% 135% at 85% 110%, var(--orb-b) 0%, color-mix(in srgb, var(--orb-b) 30%, transparent) 55%, transparent 100%)',
          opacity: 0.2,
        }}
      />
    </div>
  )
}
