import React from 'react';
import { Compass, Flame, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

const COLORS = [
  { max: 25, label: 'Extreme Fear', color: '#ef4444', icon: <AlertTriangle className="w-4 h-4 text-rose-500" /> },
  { max: 45, label: 'Fear', color: '#f97316', icon: <Flame className="w-4 h-4 text-orange-500" /> },
  { max: 55, label: 'Neutral', color: '#eab308', icon: <Compass className="w-4 h-4 text-amber-500" /> },
  { max: 75, label: 'Greed', color: '#84cc16', icon: <CheckCircle className="w-4 h-4 text-lime-500" /> },
  { max: 100, label: 'Extreme Greed', color: '#22c55e', icon: <Zap className="w-4 h-4 text-emerald-500" /> },
];

const getColor = (val) => COLORS.find(c => val <= c.max) || COLORS[4];

const getDescriptiveText = (label) => {
  switch(label) {
    case 'Extreme Fear': return 'Highly bearish. Potential buying opportunity.';
    case 'Fear': return 'Cautious sentiment. Sellers currently dominate.';
    case 'Neutral': return 'Balanced market. No strong directional bias.';
    case 'Greed': return 'Optimistic sentiment. Buyers accumulating.';
    case 'Extreme Greed': return 'Market is euphoric. Potential correction ahead.';
    default: return '';
  }
};

const FearGreedGauge = ({ data }) => {
  if (!data || data.length === 0) return null;
  const latest = data[0];
  const { value, label } = latest;
  const currentStatus = getColor(value);

  const segments = [
    { start: 0, end: 25, color: '#ef4444' },
    { start: 25, end: 45, color: '#f97316' },
    { start: 45, end: 55, color: '#eab308' },
    { start: 55, end: 75, color: '#84cc16' },
    { start: 75, end: 100, color: '#22c55e' },
  ];

  const r = 70;
  const cx = 100, cy = 80;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcX = (angle) => cx + r * Math.cos(toRad(angle));
  const arcY = (angle) => cy + r * Math.sin(toRad(angle));

  const renderSegment = (startVal, endVal, color) => {
    const startAngle = -180 + (startVal / 100) * 180;
    const endAngle = -180 + (endVal / 100) * 180;
    const path = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 0 1 ${arcX(endAngle)} ${arcY(endAngle)}`;
    return <path key={startVal} d={path} fill="none" stroke={color} strokeWidth="12" strokeLinecap="butt" opacity={0.3} className="transition-opacity duration-300 hover:opacity-60 cursor-crosshair" />;
  };

  const needleAngle = -180 + (value / 100) * 180;
  const needleX = arcX(needleAngle);
  const needleY = arcY(needleAngle);

  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div
        className="absolute top-0 right-0 w-48 h-48 blur-[80px] rounded-full transition-colors duration-1000 opacity-10 group-hover:opacity-20 pointer-events-none"
        style={{ backgroundColor: currentStatus.color }}
      ></div>

      <div className="flex items-center gap-2 mb-6 relative z-10">
        <Compass className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-semibold">Fear & Greed Index</h2>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        <div className="relative flex flex-col items-center">
          <svg width="200" height="100" viewBox="0 0 200 100" className="drop-shadow-xl transition-transform duration-500 hover:scale-105">
            {segments.map(seg => renderSegment(seg.start, seg.end, seg.color))}

            <path
              d={`M ${arcX(-180)} ${arcY(-180)} A ${r} ${r} 0 ${needleAngle - (-180) > 90 ? 1 : 0} 1 ${needleX} ${needleY}`}
              fill="none" stroke={currentStatus.color} strokeWidth="12" strokeLinecap="round"
              className="drop-shadow-[0_0_12px_currentColor] transition-all duration-1000 ease-out"
            />

            <text x={cx} y={cy - 10} textAnchor="middle" fill="white" fontSize="32" fontWeight="800" className="font-sans tracking-tighter drop-shadow-md">
              {value}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill={currentStatus.color} fontSize="11" fontWeight="800" letterSpacing="1" className="uppercase drop-shadow-lg">
              {label}
            </text>
          </svg>
          <div className="mt-3 text-center px-2">
            <p className="text-[11px] font-medium text-slate-300 leading-snug">
              {getDescriptiveText(currentStatus.label)}
            </p>
          </div>
        </div>

        <div className="flex-1 w-full space-y-1.5 border-l border-slate-800/60 pl-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Recent History</span>
            <span className="text-[9px] text-slate-500 font-medium">Trend (1D)</span>
          </div>
          {data.slice(0, 4).map((d, i) => {
            const status = getColor(d.value);
            const prevDay = data[i + 1];
            const change = prevDay ? d.value - prevDay.value : null;
            const trendColor = change > 0 ? 'text-emerald-500' : change < 0 ? 'text-rose-500' : 'text-slate-500';

            return (
              <div key={i} className="flex flex-col justify-center group/row hover:bg-slate-800/40 p-2 -mx-2 rounded-lg transition-colors border border-transparent hover:border-slate-700/50 gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium w-8 group-hover/row:text-slate-300 transition-colors">
                      {new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-1.5 opacity-80 group-hover/row:opacity-100 transition-opacity">
                      {React.cloneElement(status.icon, { className: 'w-3.5 h-3.5' })}
                      <span className="text-[10px] font-bold uppercase tracking-wider drop-shadow-sm" style={{ color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {change !== null && (
                      <span className={`text-[10px] font-bold ${trendColor}`}>
                        {change > 0 ? '+' : ''}{change}
                      </span>
                    )}
                    <span className="font-bold text-xs drop-shadow-sm w-5 text-right" style={{ color: status.color }}>
                      {d.value}
                    </span>
                  </div>
                </div>
                
                <div className="w-full h-1 bg-slate-900/80 rounded-full overflow-hidden shadow-inner opacity-70 group-hover/row:opacity-100 transition-opacity">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${d.value}%`, backgroundColor: status.color, boxShadow: `0 0 6px ${status.color}` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FearGreedGauge;
