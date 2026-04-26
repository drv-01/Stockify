import React, { useState } from 'react';
import {
  ComposedChart, LineChart, Line, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { Activity } from 'lucide-react';

const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-xs rounded-md transition-all ${active ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-500 hover:bg-slate-800'}`}
  >
    {label}
  </button>
);

const SignalBadge = ({ label, value, color }) => (
  <div className="flex flex-col items-center bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-800 min-w-0 flex-1">
    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider truncate w-full text-center">{label}</span>
    <span className={`text-xs font-bold mt-0.5 text-center ${color}`}>{value}</span>
  </div>
);

const tooltipStyle = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 };

const TechnicalIndicators = ({ indicators }) => {
  const [tab, setTab] = useState('RSI');
  if (!indicators) return null;

  const { rsi, macd, bbands, signals } = indicators;

  const rsiColor = signals.rsi === 'Overbought' ? 'text-rose-500'
    : signals.rsi === 'Oversold' ? 'text-emerald-500'
    : 'text-amber-400';

  const macdColor = signals.macd?.includes('Bullish') ? 'text-emerald-500' : 'text-rose-500';

  const bbColor = signals.bb === 'Above Upper' ? 'text-rose-500'
    : signals.bb === 'Below Lower' ? 'text-emerald-500'
    : 'text-amber-400';

  // Y-axis domain for BBands — pad 1% around the band range
  const bbMin = bbands?.length ? Math.min(...bbands.map(d => d.lower)) : 'auto';
  const bbMax = bbands?.length ? Math.max(...bbands.map(d => d.upper)) : 'auto';
  const bbPad = bbands?.length ? (bbMax - bbMin) * 0.05 : 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold">Technical Indicators</h2>
        </div>
        <div className="flex gap-2">
          {['RSI', 'MACD', 'BBANDS'].map(t => (
            <Tab key={t} label={t} active={tab === t} onClick={() => setTab(t)} />
          ))}
        </div>
      </div>

      {/* Signal badges */}
      <div className="flex gap-2 mb-4 ">
        <SignalBadge
          label="RSI (14)"
          value={`${signals.rsiValue?.toFixed(1)} · ${signals.rsi}`}
          color={rsiColor}
        />
        <SignalBadge
          label="MACD (12,26,9)"
          value={signals.macd}
          color={macdColor}
        />
        <SignalBadge
          label="BB (20,2)"
          value={signals.bb}
          color={bbColor}
        />
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          {tab === 'RSI' ? (
            <LineChart data={rsi} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                ticks={[0, 30, 50, 70, 100]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={v => [v.toFixed(2), 'RSI']}
                labelFormatter={l => l}
              />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3"
                label={{ value: 'OB 70', fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3"
                label={{ value: 'OS 30', fill: '#22c55e', fontSize: 9, position: 'insideBottomRight' }} />
              <ReferenceLine y={50} stroke="#475569" strokeDasharray="2 4" />
              <Line type="monotone" dataKey="rsi" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          ) : tab === 'MACD' ? (
            <ComposedChart data={macd} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name) => [v.toFixed(4), name]}
              />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="hist" isAnimationActive={false} radius={[1, 1, 0, 0]}>
                {macd.map((entry, i) => (
                  <Cell key={i} fill={entry.hist >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.7} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Signal" />
            </ComposedChart>
          ) : (
            <LineChart data={bbands} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[bbMin - bbPad, bbMax + bbPad]}
                tickFormatter={v => `₹${Math.round(v)}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={v => [`₹${v.toFixed(2)}`]}
              />
              <Line type="monotone" dataKey="upper" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Upper" />
              <Line type="monotone" dataKey="middle" stroke="#3b82f6" strokeWidth={2} dot={false} name="SMA20" />
              <Line type="monotone" dataKey="lower" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Lower" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 mt-2 text-[10px] uppercase font-bold tracking-widest text-slate-500">
        {tab === 'RSI' && (
          <>
            <span className="text-blue-400">— RSI</span>
            <span className="text-rose-500">-- Overbought (70)</span>
            <span className="text-emerald-500">-- Oversold (30)</span>
          </>
        )}
        {tab === 'MACD' && (
          <>
            <span className="text-blue-400">— MACD</span>
            <span className="text-orange-400">-- Signal</span>
            <span className="text-emerald-500">▌ +Hist</span>
            <span className="text-rose-500">▌ −Hist</span>
          </>
        )}
        {tab === 'BBANDS' && (
          <>
            <span className="text-rose-400">-- Upper</span>
            <span className="text-blue-400">— SMA20</span>
            <span className="text-emerald-400">-- Lower</span>
          </>
        )}
      </div>
    </div>
  );
};



export default TechnicalIndicators;
