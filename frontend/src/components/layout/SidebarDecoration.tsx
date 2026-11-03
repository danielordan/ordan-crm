// Abstract rounded teal shapes at the bottom of the sidebar (DESIGN 2.11)
export function SidebarDecoration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 200"
      preserveAspectRatio="xMinYMax slice"
      className="pointer-events-none absolute right-0 bottom-0 left-0 h-48 w-full"
    >
      <path
        d="M-20 200 C 10 120, 70 70, 120 110 S 200 200, 260 150 L 260 200 Z"
        fill="#00C8C8"
        opacity="0.18"
      />
      <path
        d="M-20 200 C 20 150, 60 110, 90 140 S 140 200, 200 190 L 200 200 Z"
        fill="#00C8C8"
        opacity="0.35"
      />
      <path d="M-30 90 C 10 60, 50 90, 40 140 S 0 210, -30 200 Z" fill="#00C8C8" opacity="0.55" />
    </svg>
  );
}
