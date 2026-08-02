type P = { className?: string };

export const AppleLogo = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M16.4 12.7c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9s-1.9-.9-3.1-.8c-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.2 1.7 2.4 3 2.4 1.2 0 1.6-.8 3.1-.8s1.9.8 3.1.7c1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.6-1-2.6-3.8zM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.5z" />
  </svg>
);

export const SearchIcon = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
  </svg>
);

export const SettingsIcon = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6" strokeLinecap="round" />
  </svg>
);

export const UserIcon = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5" strokeLinecap="round" />
  </svg>
);

export const PlayIcon = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);

const MusicNote = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M20 3.5 9 6v9.6a3.2 3.2 0 1 0 2 2.9V9.1l7-1.6v6.1a3.2 3.2 0 1 0 2 2.9V3.5z" />
  </svg>
);

const Joystick = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <circle cx="12" cy="6.5" r="3" />
    <path d="M12 10.5 2.5 15 12 19.5 21.5 15z" opacity=".9" />
  </svg>
);

const Compass = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M15.6 8.4 10.8 10.8 8.4 15.6l4.8-2.4z" fill="currentColor" />
  </svg>
);

const YouTubeGlyph = ({ className }: P) => (
  <svg viewBox="0 0 48 24" fill="currentColor" className={className} aria-hidden>
    <rect x="0" y="1.5" width="30" height="21" rx="6" />
    <path d="M12 7.5v9l8-4.5z" fill="#fff" />
  </svg>
);

const SpotifyGlyph = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden>
    <circle cx="12" cy="12" r="9.3" strokeWidth="1.4" />
    <path d="M7 9.6c3.2-.8 6.6-.5 9.4 1M7.6 12.6c2.7-.7 5.5-.4 7.9.9M8.2 15.4c2.1-.5 4.3-.3 6.2.7" strokeLinecap="round" />
  </svg>
);

const AppStoreGlyph = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
    <path d="M6 17.5 12 6l6 11.5M8.6 13.6h6.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NetflixBadge = ({ className }: P) => (
  <span className={`rounded bg-black/80 px-2 py-0.5 text-[10px] font-black tracking-[0.14em] text-red-500 ${className ?? ""}`}>
    NETFLIX
  </span>
);

export function GlyphFor({ badge, className = "h-6 w-6" }: { badge: string; className?: string }) {
  switch (badge) {
    case "apple":
    case "appletv":
      return (
        <span className={`inline-flex items-center gap-1 ${badge === "apple" ? "text-white" : ""}`}>
          <AppleLogo className={className} />
          <span className="text-lg font-medium leading-none">tv+</span>
        </span>
      );
    case "netflix":
      return <NetflixBadge />;
    case "youtube":
      return <YouTubeGlyph className={className} />;
    case "music":
      return <MusicNote className={className} />;
    case "arcade":
      return <Joystick className={className} />;
    case "safari":
      return <Compass className={className} />;
    case "spotify":
      return <SpotifyGlyph className={className} />;
    case "appstore":
      return <AppStoreGlyph className={className} />;
    default:
      return null;
  }
}
