import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <rect x="8" y="3" width="8" height="12" rx="4" fill="currentColor" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 16.5a5 5 0 0 0 5-5V10m-5 6.5a5 5 0 0 1-5-5V10m5 6.5v3.25M8.75 19.75h6.5M4.5 10.5v3M19.5 10.5v3"
      stroke="currentColor"
      strokeWidth={2}
      opacity={0.88}
    />
    <path
      strokeLinecap="round"
      d="M10.35 6.4v5.1M13.65 6.4v5.1"
      stroke="var(--color-content-100, currentColor)"
      strokeWidth={1.35}
      opacity={0.34}
    />
  </svg>
);
