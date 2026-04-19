'use client';

interface CountdownTimerProps {
  total: number;
  remaining: number;
  size?: number;
}

export default function CountdownTimer({ total, remaining, size = 56 }: CountdownTimerProps) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / total;
  const dashOffset = circumference * (1 - progress);

  const isUrgent = remaining <= 10;
  const strokeColor = isUrgent ? '#EF4444' : 'var(--hm-brand-500)';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-1000 linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${isUrgent ? 'text-[var(--hm-error-500)]' : 'text-white'}`}>
          {remaining}
        </span>
      </div>
    </div>
  );
}
