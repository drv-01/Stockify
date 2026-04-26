import React from 'react';
import { Landmark, TrendingUp, DollarSign, Activity, BarChart2, Award } from 'lucide-react';
import { useMarket } from '../../contexts/MarketContext';

const FinancialCard = ({ title, value, icon, subtitle }) => (
  <div className="bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-all group aspect-square flex flex-col items-center justify-center gap-1 p-3">
    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="text-[11px] font-semibold text-slate-400 text-center leading-tight">{title}</div>
    <div className="text-sm font-bold text-slate-100 text-center leading-tight">{value}</div>
    <div className="text-[9px] text-slate-500 text-center leading-tight">{subtitle}</div>
  </div>
);

const FinancialsPanel = ({ fundamentals }) => {
  const { selection } = useMarket();
  const currencySymbol = selection.country?.currencySymbol || '₹';

  if (!fundamentals) {
    return (
      <div className="glass-card p-6 h-[200px] flex items-center justify-center text-slate-500">
        Loading financials...
      </div>
    );
  }

  const formatCurrency = (val) => {
    if (!val || val === 'None') return '—';
    const n = parseFloat(val);
    if (isNaN(n)) return val;
    if (Math.abs(n) >= 1e12) return `${currencySymbol}${(n / 1e12).toFixed(2)}T`;
    if (Math.abs(n) >= 1e9) return `${currencySymbol}${(n / 1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `${currencySymbol}${(n / 1e6).toFixed(2)}M`;
    return `${currencySymbol}${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const { revenue, profit, eps, debt, pe, roe } = fundamentals;

  const fmtPE = (v) => v && v !== 'None' ? `${parseFloat(v).toFixed(1)}x` : '—';
  const fmtROE = (v) => v && v !== 'None' ? `${(parseFloat(v) * 100).toFixed(1)}%` : '—';

  return (
    <div className="glass-card p-6 ">
      <div className="flex items-center gap-2 mb-4">
        <Landmark className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-semibold">Financials</h2>
      </div>
      
      <div className="grid grid-cols-3 gap-3 gap-y-1.5 flex-1">
        <FinancialCard 
          title="Revenue" 
          value={formatCurrency(revenue)} 
          subtitle="Total Sales (TTM)"
          icon={<Activity className="w-4 h-4 text-emerald-400" />} 
        />
        <FinancialCard 
          title="Profit" 
          value={formatCurrency(profit)} 
          subtitle="Net Income"
          icon={<TrendingUp className="w-4 h-4 text-blue-400" />} 
        />
        <FinancialCard 
          title="Debt" 
          value={formatCurrency(debt) === '—' ? 'N/A' : formatCurrency(debt)} 
          subtitle="Total owed"
          icon={<Landmark className="w-4 h-4 text-rose-400" />} 
        />
        <FinancialCard 
          title="EPS" 
          value={eps && eps !== 'None' ? `${currencySymbol}${parseFloat(eps).toFixed(2)}` : '—'} 
          subtitle="Earnings Per Share"
          icon={<DollarSign className="w-4 h-4 text-amber-400" />} 
        />
        <FinancialCard 
          title="P/E Ratio" 
          value={fmtPE(pe)} 
          subtitle="Price / EPS"
          icon={<BarChart2 className="w-4 h-4 text-violet-400" />} 
        />
        <FinancialCard 
          title="ROE" 
          value={fmtROE(roe)} 
          subtitle="Return on Equity"
          icon={<Award className="w-4 h-4 text-cyan-400" />} 
        />
      </div>
    </div>
  );
};

export default FinancialsPanel;
