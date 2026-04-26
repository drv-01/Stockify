import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useMarket } from '../../contexts/MarketContext';

const StockChart = ({ data, forecast }) => {
  const { selection } = useMarket();
  const currencySymbol = selection.country?.currencySymbol || '₹';

  // Bridge: last historical point gets forecast fields so lines connect seamlessly
  const lastHist = data[data.length - 1];
  const bridge = {
    date: lastHist?.Date || lastHist?.date,
    price: lastHist?.Close ?? lastHist?.price,
    predicted: lastHist?.Close ?? lastHist?.price,
    lower: lastHist?.Close ?? lastHist?.price,
    upper: lastHist?.Close ?? lastHist?.price,
  };

  const chartData = [
    ...data.map(d => ({
      date: d.Date || d.date,
      price: d.Close ?? d.price,
    })),
    bridge,
    ...forecast.map(f => ({
      date: f.date,
      predicted: f.predicted,
      lower: f.lower_bound,
      upper: f.upper_bound,
    }))
  ];

  const allValues = chartData.flatMap(d => [d.price, d.predicted, d.lower, d.upper].filter(v => v != null));
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const padding = (maxVal - minVal) * 0.05;
  const yDomain = [minVal - padding, maxVal + padding];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          {d.price != null ? (
            <p className="text-sm font-bold text-blue-400">{currencySymbol}{d.price.toFixed(2)}</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-bold text-violet-400">Predicted: {currencySymbol}{d.predicted?.toFixed(2)}</p>
              <p className="text-[10px] text-slate-500">Range: {currencySymbol}{d.lower?.toFixed(2)} – {currencySymbol}{d.upper?.toFixed(2)}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(str) => str?.split('-').slice(1).join('/')}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={yDomain}
            tickFormatter={(val) => `${currencySymbol}${Math.round(val)}`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Confidence band as area between upper and lower */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="url(#colorBand)"
            fillOpacity={1}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#0f172a"
            fillOpacity={1}
            connectNulls
          />

          {/* Historical price line */}
          <Area
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorPrice)"
            fillOpacity={1}
            connectNulls={false}
            dot={false}
          />

          {/* Forecast predicted line */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            connectNulls={false}
          />

          <ReferenceLine
            x={bridge.date}
            stroke="#475569"
            strokeDasharray="3 3"
            label={{ position: 'top', value: 'Today', fill: '#94a3b8', fontSize: 10 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
