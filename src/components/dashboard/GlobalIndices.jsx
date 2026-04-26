import React from 'react';
import { Globe, ChevronUp, ChevronDown } from 'lucide-react';

const FLAG = {
  'S&P 500':    '🇺🇸',
  'NASDAQ':     '🇺🇸',
  'FTSE 100':   '🇬🇧',
  'Nikkei 225': '🇯🇵',
  'Hang Seng':  '🇭🇰',
  'NIFTY 50':   '🇮🇳',
};

const GlobalIndices = ({ indices }) => {
  if (!indices || indices.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-4 h-4 text-blue-400" />
        <h3 className="font-semibold text-sm">Global Markets</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {indices.map((idx) => {
          const up = idx.change_pct >= 0;
          return (
            <div key={idx.symbol} className="flex flex-col gap-1 bg-slate-900/60 rounded-lg p-3 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-base">{FLAG[idx.name] || '🌐'}</span>
                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {up ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {Math.abs(idx.change_pct)?.toFixed(2)}%
                </span>
              </div>
              <div className="text-xs font-bold text-slate-200 leading-tight">{idx.name}</div>
              <div className="text-sm font-bold">{idx.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GlobalIndices;
