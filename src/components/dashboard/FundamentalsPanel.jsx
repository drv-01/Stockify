import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const FundRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="text-xs font-semibold">{value || '—'}</span>
  </div>
);

const fmt = (val, prefix = '') => val && val !== 'None' ? `${prefix}${parseFloat(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';
const fmtCap = (val) => {
  if (!val || val === 'None') return '—';
  const n = parseFloat(val);
  if (n >= 1e12) return `₹${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `₹${(n / 1e9).toFixed(2)}B`;
  return `₹${(n / 1e6).toFixed(2)}M`;
};

const FundamentalsPanel = ({ fundamentals }) => {
  const [expanded, setExpanded] = useState(false);
  if (!fundamentals) return null;

  const { name, sector, industry, marketCap, pe, eps, dividendYield, week52High, week52Low, beta, profitMargin, description } = fundamentals;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-semibold">Fundamentals</h2>
        {sector && <span className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">{sector}</span>}
      </div>

      {name && <div className="text-sm font-medium text-slate-300 mb-3">{name}</div>}
      {industry && <div className="text-xs text-slate-500 mb-4">{industry}</div>}

      <div>
        <FundRow label="Market Cap" value={fmtCap(marketCap)} />
        <FundRow label="P/E Ratio" value={fmt(pe)} />
        <FundRow label="EPS" value={fmt(eps, '₹')} />
        <FundRow label="Dividend Yield" value={dividendYield && dividendYield !== 'None' ? `${(parseFloat(dividendYield) * 100).toFixed(2)}%` : '—'} />
        <FundRow label="52W High" value={fmt(week52High, '₹')} />
        <FundRow label="52W Low" value={fmt(week52Low, '₹')} />
        <FundRow label="Beta" value={fmt(beta)} />
        <FundRow label="Profit Margin" value={profitMargin && profitMargin !== 'None' ? `${(parseFloat(profitMargin) * 100).toFixed(2)}%` : '—'} />
      </div>

      {description && (
        <div className="mt-4">
          <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide' : 'Show'} company description
          </button>
          {expanded && <p className="mt-2 text-xs text-slate-400 leading-relaxed">{description}</p>}
        </div>
      )}
    </div>
  );
};

export default FundamentalsPanel;
