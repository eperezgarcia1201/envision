type CompanyLogoProps = {
  size?: number;
  variant?: "light" | "dark";
  withWordmark?: boolean;
};

export function CompanyLogo({ size = 34, variant = "light", withWordmark = true }: CompanyLogoProps) {
  const ink = variant === "light" ? "#ffffff" : "#0f2658";
  const accent = "#d6ac63";
  const bgStart = "#f2d8aa";
  const bgEnd = "#d4a55f";

  return (
    <span className="company-logo-wrap" style={{ color: ink }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        role="img"
        aria-label="Envision Maintenence logo"
      >
        <defs>
          <linearGradient id="em-logo-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bgStart} />
            <stop offset="100%" stopColor={bgEnd} />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="19" fill="url(#em-logo-bg)" stroke={accent} strokeWidth="1" />
        <path
          d="M11 25V14h3.4l2.3 4.1 2.3-4.1h3.3v11h-2.8v-6.3l-2.2 3.9h-1.3l-2.2-3.9V25H11z"
          fill="#132b59"
        />
        <path d="M24.8 14h4.5c1.8 0 3.2 1.4 3.2 3.2 0 1.3-.7 2.4-1.9 2.9L33 25h-3.4l-2-4h-.9v4h-2.9V14zm2.9 2.5v2.2h1.4c.7 0 1.2-.5 1.2-1.1 0-.6-.5-1.1-1.2-1.1h-1.4z" fill="#132b59" />
      </svg>
      {withWordmark ? (
        <span className="company-logo-wordmark">
          Envision <strong>Maintenence</strong>
        </span>
      ) : null}
    </span>
  );
}
