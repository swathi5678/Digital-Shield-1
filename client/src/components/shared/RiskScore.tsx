import { useEffect, useRef } from 'react';

interface RiskScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function RiskScore({ score, size = 'md' }: RiskScoreProps) {
  const svgRef = useRef<SVGCircleElement>(null);
  const displayScore = Math.min(Math.max(score, 0), 100);

  const sizeMap = {
    sm: { radius: 30, cx: 50, cy: 50, textSize: '16' },
    md: { radius: 50, cx: 50, cy: 50, textSize: '24' },
    lg: { radius: 42, cx: 50, cy: 50, textSize: '24' }
  };

  const config = sizeMap[size];
  const circumference = 2 * Math.PI * config.radius;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.style.strokeDashoffset = String(circumference);
      setTimeout(() => {
        if (svgRef.current) {
          svgRef.current.style.strokeDashoffset = String(offset);
        }
      }, 100);
    }
  }, [displayScore, circumference, offset]);

  const getColor = (): string => {
    if (displayScore < 30) return '#22C55E';
    if (displayScore < 60) return '#EAB308';
    if (displayScore < 80) return '#F97316';
    return '#EF4444';
  };

  const viewBoxSize = size === 'sm' ? '100' : size === 'md' ? '100' : '100';

  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        className="text-white"
        width={size === 'lg' ? 200 : size === 'md' ? 140 : 80}
        height={size === 'lg' ? 200 : size === 'md' ? 140 : 80}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        <circle
          cx={config.cx}
          cy={config.cy}
          r={config.radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="4"
        />
        <circle
          ref={svgRef}
          cx={config.cx}
          cy={config.cy}
          r={config.radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <text
          x={config.cx}
          y={config.cy}
          textAnchor="middle"
          dy="0.3em"
          fontSize={config.textSize}
          fill="currentColor"
          fontWeight="bold"
        >
          {displayScore}
        </text>
      </svg>
      <p className="text-xs text-gray-400 mt-2 text-center">
        {displayScore < 30 ? 'Low Risk' : displayScore < 60 ? 'Medium Risk' : displayScore < 80 ? 'High Risk' : 'Critical Risk'}
      </p>
    </div>
  );
}
