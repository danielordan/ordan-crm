import type { ReactNode } from 'react';

// Navy background with soft teal glows, a faint dot grid and waves (DESIGN 1.7, 1.8).
// Shared by Sign In and Sign Up; shown without the sidebar.
function AuthBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1b2a55_0%,#0f1b3d_65%)]" />
      <div className="absolute -top-40 -left-32 size-[520px] rounded-full bg-primary/25 blur-[120px]" />
      <div className="absolute -right-40 -bottom-48 size-[600px] rounded-full bg-primary/20 blur-[140px]" />
      <svg className="absolute inset-0 size-full opacity-[0.07]">
        <defs>
          <pattern id="auth-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#ffffff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-dots)" />
      </svg>
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute right-0 bottom-0 left-0 h-56 w-full"
      >
        <path
          d="M0 220 C 240 140, 480 140, 720 200 S 1200 300, 1440 180 L 1440 320 L 0 320 Z"
          fill="#00C8C8"
          opacity="0.12"
        />
        <path
          d="M0 270 C 300 210, 560 240, 820 270 S 1240 300, 1440 250 L 1440 320 L 0 320 Z"
          fill="#00C8C8"
          opacity="0.22"
        />
      </svg>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy p-8">
      <AuthBackground />
      <section className="relative flex w-full max-w-sm flex-col gap-6 rounded-card bg-surface p-8 shadow-[0_24px_64px_rgba(0,0,0,0.35)]">
        <h1 className="text-center text-h2 leading-tight font-bold text-navy">
          Ordan Cargo
          <br />
          <span className="text-primary">Future Clients</span>
        </h1>
        {children}
      </section>
    </main>
  );
}
