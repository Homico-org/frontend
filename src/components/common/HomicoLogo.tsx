import type { SVGProps } from 'react';

type Variant = 'primary' | 'ink' | 'outline' | 'reverse';

interface HomicoLogoProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number;
  variant?: Variant;
}

export default function HomicoLogo({
  size = 28,
  variant = 'primary',
  className,
  ...rest
}: HomicoLogoProps) {
  const VERMILLION = '#EF4E24';
  const WHITE = '#FFFFFF';
  const FG = 'var(--hm-fg-primary)';

  const { container, diamond, diamondStroke, containerStroke } = (() => {
    switch (variant) {
      case 'ink':
        return { container: FG, diamond: FG };
      case 'outline':
        return { container: 'none', diamond: 'none', containerStroke: FG, diamondStroke: FG };
      case 'reverse':
        return { container: WHITE, diamond: VERMILLION };
      case 'primary':
      default:
        return { container: FG, diamond: VERMILLION };
    }
  })();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Homico"
      className={className}
      {...rest}
    >
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="8"
        fill={container}
        stroke={containerStroke}
        strokeWidth={containerStroke ? 3 : undefined}
      />
      <rect
        x="50"
        y="20"
        width="42"
        height="42"
        rx="2"
        transform="rotate(45 50 41)"
        fill={diamond}
        stroke={diamondStroke}
        strokeWidth={diamondStroke ? 3 : undefined}
      />
    </svg>
  );
}
