import React from 'react';
import { Grid3X3 } from 'lucide-react';

const SectorHeatmap = ({ sectors }) => {
  if (!sectors || sectors.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Grid3X3 className="w-4 h-4 text-slate-400" />
        <h3 className="font-semibold text-sm">Sector Performance</h3>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {sectors.map((s, i) => {
          const pct = parseFloat(s.change_pct) || 0;
          const intensity = Math.min(Math.abs(pct) / 3, 1);
          const bg = pct >= 0
            ? `rgba(34,197,94,${0.08 + intensity * 0.25})`
            : `rgba(239,68,68,${0.08 + intensity * 0.25})`;
          const border = pct >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';
          const textColor = pct >= 0 ? '#22c55e' : '#ef4444';
          const name = s.name?.replace('Nifty ', '').replace('NIFTY ', '') || `Sector ${i + 1}`;

          return (
            <div
              key={i}
              className="rounded-lg p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 transition-transform"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <div className="text-[9px] text-slate-400 font-bold uppercase leading-tight">{name}</div>
              <div className="text-xs font-bold mt-1" style={{ color: textColor }}>
                {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectorHeatmap;
