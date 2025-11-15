
import React from 'react';

interface Point {
  x: number;
  y: number;
}

interface GraphProps {
  title: string;
  data: Point[];
  unit: string;
  invert?: boolean;
  onClick?: () => void;
  yScaleFactor?: number;
}

const Graph: React.FC<GraphProps> = ({ title, data, unit, invert = false, onClick, yScaleFactor = 1 }) => {
  const width = 400;
  const height = 250;
  // Adjusted padding to remove space for Y-axis labels
  const padding = { top: 25, right: 20, bottom: 55, left: 20 };
  const viewWidth = width + padding.left + padding.right;
  const viewHeight = height + padding.top + padding.bottom;
  
  if (data.length === 0) {
    return null;
  }

  const xMax = data[data.length - 1].x;
  const yValues = data.map(p => p.y);
  let yMax = Math.max(...yValues);
  let yMin = Math.min(...yValues);
  
  if (yMax < 0) yMax = 0;
  if (yMin > 0) yMin = 0;

  const yRange = yMax - yMin;

  const scaleX = (x: number) => padding.left + (x / xMax) * width;
  const baseScaleY = (y: number) => {
    const normalizedY = (y - yMin) / (yRange === 0 ? 1 : yRange);
    if (invert) {
        return padding.top + normalizedY * height;
    }
    return padding.top + height - normalizedY * height;
  };

  const yZero = baseScaleY(0);
  const getScaledY = (y: number) => {
      const unscaledY = baseScaleY(y);
      return yZero + (unscaledY - yZero) * yScaleFactor;
  };

  const pathData = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${getScaledY(p.y)}`).join(' ');
  const areaPathData = `${pathData} V ${yZero} L ${scaleX(data[0].x)} ${yZero} Z`;


  const formatLabel = (val: number) => {
    if (Math.abs(val) < 0.01 && val !== 0) return val.toExponential(1);
    if (Math.abs(val) > 1000) return val.toLocaleString('bg-BG', { maximumFractionDigits: 0 });
    return val.toLocaleString('bg-BG', { maximumFractionDigits: 2 });
  };
  
  const maxAbsYPoint = data.reduce((max, p) => Math.abs(p.y) > Math.abs(max.y) ? p : max, data[0]);
  const maxPointX = scaleX(maxAbsYPoint.x);
  const maxPointY = getScaledY(maxAbsYPoint.y);
  const labelYOffset = maxPointY < padding.top + height / 2 ? 22 : -12;

  return (
    <div 
      className={`bg-slate-900/50 rounded-lg p-3 flex flex-col items-center transition-all duration-200 graph-container-wrapper ${onClick ? 'cursor-pointer hover:bg-slate-800/80 hover:ring-1 hover:ring-cyan-500/50' : ''}`}
      onClick={onClick}
    >
      <h3 className="text-sm font-semibold text-cyan-400 mb-2">{title} ({unit})</h3>
      <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} className="w-full h-auto">
        {/* Y-Axis Line and labels removed */}
        
        {/* X-Axis (at y=0) */}
        <line x1={padding.left} y1={yZero} x2={padding.left + width} y2={yZero} stroke="#64748b" strokeWidth="1" />

        {/* X-Axis Labels */}
        <text x={padding.left} y={padding.top + height + 20} textAnchor="start" fontSize="12" fill="#94a3b8">0</text>
        <text x={padding.left + width} y={padding.top + height + 20} textAnchor="end" fontSize="12" fill="#94a3b8">{formatLabel(xMax)}</text>
        <text x={(padding.left + width/2)} y={padding.top + height + 38} textAnchor="middle" fontSize="12" fill="#94a3b8">Дължина (m)</text>
        
        {/* Area fill */}
        <path d={areaPathData} fill="url(#gradient)" stroke="none" />
        
        {/* Line */}
        <path d={pathData} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

        {/* Max point marker */}
        <circle cx={maxPointX} cy={maxPointY} r="4" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5" />
        <text
          x={maxPointX}
          y={maxPointY + labelYOffset}
          textAnchor="middle"
          fontSize="12"
          fill="#f59e0b"
          fontWeight="bold"
          className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
        >
          {formatLabel(maxAbsYPoint.y)}
        </text>
        
        <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/>
            </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default Graph;
