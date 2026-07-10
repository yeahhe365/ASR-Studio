import React from 'react';

type LogoIconProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** Kept for call-site compatibility with the previous SVG API. */
  className?: string;
};

/**
 * Brand mark from the selected ASR Studio logo
 * (white rounded tile + cyan→blue spectrum bars).
 * Corner radius is baked into logo-mark.png (~28% R);
 * CSS rounded-[28%] is a fallback for crisp clipping.
 */
export const LogoIcon: React.FC<LogoIconProps> = ({
  className,
  alt = 'ASR Studio',
  draggable = false,
  ...props
}) => (
  <img
    src="/logo-mark.png"
    alt={alt}
    draggable={draggable}
    className={['rounded-[28%]', className].filter(Boolean).join(' ')}
    {...props}
  />
);
