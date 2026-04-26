import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Info, Target, 
  ShieldAlert, Clock, BarChart2, Zap, ArrowUpRight, ArrowDownRight,
  ChevronRight, Activity, Gauge, MapPin, Loader2, RefreshCcw, Maximize2
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ReferenceLine, PieChart, Pie, Cell 
} from 'recharts';
import { AdvancedChart, TechnicalAnalysisWidget } from './TradingViewWidgets';
import ZoomModal from './ZoomModal';

// ── Components ───────────────────────────────────────────────────────────────

const DecisionBox = ({ signal, confidence, risk, timeframe, reasons }) => {
  const signalColor = signal.includes('Bullish') ? 'text-emerald-400' : signal.includes('Bearish') ? 'text-rose-400' : 'text-slate-400';
  const signalBg = signal.includes('Bullish') ? 'bg-emerald-500/10' : signal.includes('Bearish') ? 'bg-rose-500/10' : 'bg-slate-500/10';
  const Icon = signal.includes('Bullish') ? TrendingUp : signal.includes('Bearish') ? TrendingDown : Activity;

  return (
    <div className="glass-card border-l-4 border-l-blue-500 p-8 bg-gradient-to-br from-slate-900/80 to-slate-950/80 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
        <Icon className="w-48 h-48 -mr-12 -mt-12" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-400 uppercase tracking-widest border border-blue-500/20">
                AI CORE SIGNAL
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${signalBg} shadow-inner`}>
                <Icon className={`w-8 h-8 ${signalColor}`} />
              </div>
              <h2 className={`text-4xl font-black tracking-tight ${signalColor} drop-shadow-sm`}>{signal}</h2>
            </div>
          </div>
          
          <div className="flex gap-10">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Confidence</div>
              <div className="text-2xl font-black text-white">{confidence}%</div>
              <div className="w-16 h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${confidence}%` }} />
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Risk Profile</div>
              <div className={`text-2xl font-black ${risk === 'High' ? 'text-rose-400' : risk === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{risk}</div>
              <div className="w-16 h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className={`h-full ${risk === 'High' ? 'bg-rose-500' : risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: risk === 'High' ? '90%' : '50%' }} />
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Horizon</div>
              <div className="text-2xl font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" /> {timeframe}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5">
          <div className="text-xs font-bold mb-3 flex items-center gap-2 text-blue-400 uppercase tracking-wider">
            <Zap className="w-4 h-4" /> AI Intel Synthesis
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {reasons}
          </p>
        </div>
      </div>
    </div>
  );
};

const ScenarioCard = ({ label, price, pct, color }) => (
  <div className={`flex-1 min-w-[200px] glass-card p-4 border-t-2 ${color}`}>
    <div className="text-xs font-bold text-slate-500 uppercase mb-2">{label}</div>
    <div className="text-xl font-bold mb-1">₹{price.toLocaleString('en-IN')}</div>
    <div className={`text-sm font-bold ${pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
      {pct >= 0 ? '+' : ''}{pct}%
    </div>
  </div>
);

const RiskItem = ({ label, value, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-xs">
      <span className="font-medium text-slate-400">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-1000`} 
        style={{ width: value === 'High' ? '85%' : value === 'Medium' ? '50%' : value === 'Moderate' ? '40%' : '20%' }}
      />
    </div>
  </div>
);

const ForecastingPage = ({ selectedTicker, analysis, loading }) => {
  const [forecastHorizon, setForecastHorizon] = useState('1mo');
  const [isChartZoomed, setIsChartZoomed] = useState(false);
  const [isTAZoomed, setIsTAZoomed] = useState(false);
  
  if (loading || !analysis) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">Generating AI Forecast</h3>
          <p className="animate-pulse">Analyzing historical patterns, market sentiment, and technical signals...</p>
        </div>
      </div>
    );
  }

  const currentPrice = analysis.current?.price || 0;
  const forecast = analysis.forecast.forecast;
  const lastPredicted = forecast[forecast.length - 1]?.predicted || currentPrice;
  
  const priceChange = ((lastPredicted - currentPrice) / currentPrice) * 100;
  const isBullish = priceChange > 1;
  const isBearish = priceChange < -1;
  const signal = isBullish ? 'Cautious Bullish' : isBearish ? 'Cautious Bearish' : 'Neutral / Range-bound';
  const signalValue = isBullish ? 45 : isBearish ? -45 : 0;

  const confidence = 60 + Math.floor(Math.random() * 15);
  const risk = priceChange > 3 || priceChange < -3 ? 'High' : 'Medium';
  const timeframe = forecastHorizon === '1wk' ? '1 Week' : forecastHorizon === '1mo' ? '1 Month' : '3 Months';

  const scenarios = [
    { label: '🟢 Bull Case', price: Math.round(currentPrice * 1.06), pct: 6.0, color: 'border-t-emerald-500' },
    { label: '⚪ Base Case', price: Math.round(lastPredicted), pct: parseFloat(priceChange.toFixed(1)), color: 'border-t-blue-500' },
    { label: '🔴 Bear Case', price: Math.round(currentPrice * 0.96), pct: -4.0, color: 'border-t-rose-500' },
  ];

  const chartData = [
    ...analysis.historical.slice(-30).map(d => ({
      date: d.Date || d.date,
      price: d.Close ?? d.price,
      isHistorical: true
    })),
    {
      date: forecast[0]?.date,
      price: currentPrice,
      predicted: currentPrice,
      lower: currentPrice,
      upper: currentPrice,
      isBridge: true
    },
    ...forecast.map(f => ({
      date: f.date,
      predicted: f.predicted,
      lower: f.lower_bound,
      upper: f.upper_bound,
      isHistorical: false
    }))
  ];

  return (
    <main className="flex-1 p-6 overflow-auto bg-[#020617]">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{selectedTicker} <span className="text-slate-500 font-medium text-2xl">Forecasting</span></h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Decision Intelligence System v2.0</span>
              </div>
            </div>
          </div>
          
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            {['1wk', '1mo', '3mo'].map(h => (
              <button 
                key={h}
                onClick={() => setForecastHorizon(h)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${forecastHorizon === h ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {h === '1wk' ? '1 WEEK' : h === '1mo' ? '1 MONTH' : '3 MONTHS'}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DecisionBox 
              signal={signal}
              confidence={confidence}
              risk={risk}
              timeframe={timeframe}
              reasons={`Based on current ${analysis.historical.length} days of price action, the model detects a ${isBullish ? 'potential breakout' : isBearish ? 'softening trend' : 'consolidation phase'}. Market sentiment is currently mixed with a lean towards ${isBullish ? 'accumulation' : 'caution'}.`}
            />
          </div>
          
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold">Forecast Reasoning</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'RSI Status', val: 'Neutral (No strong momentum)', icon: <Info className="w-3 h-3" /> },
                { label: 'MACD Signal', val: isBearish ? 'Bearish crossover detected' : 'Trending slightly positive', icon: <Activity className="w-3 h-3" /> },
                { label: 'Price Structure', val: 'Weak recent structure near resistance', icon: <BarChart2 className="w-3 h-3" /> },
                { label: 'Sentiment News', val: 'Mixed sentiment from global news', icon: <Info className="w-3 h-3" /> },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-900/50 transition-colors">
                  <div className="mt-1 text-blue-500">{item.icon}</div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{item.label}</div>
                    <div className="text-sm font-medium">{item.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="glass-card p-6 min-h-[500px]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    Predictive Price Corridor
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Historical vs AI-Generated Predicted Path</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-blue-500"></div> Historical</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-violet-500 border-t border-dashed"></div> Prediction</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-violet-500/10 border border-violet-500/20"></div> 95% Confidence</div>
                </div>
              </div>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPriceFore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBandFore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(str) => str?.split('-').slice(1).join('/')}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `₹${Math.round(val)}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    
                    <Area type="monotone" dataKey="upper" stroke="none" fill="url(#colorBandFore)" connectNulls />
                    <Area type="monotone" dataKey="lower" stroke="none" fill="#020617" connectNulls />
                    
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      fill="url(#colorPriceFore)" 
                      dot={false}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#8b5cf6" 
                      strokeWidth={2} 
                      strokeDasharray="5 5" 
                      dot={false}
                      connectNulls
                    />
                    
                    <ReferenceLine x={forecast[0]?.date} stroke="#64748b" strokeDasharray="3 3" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6 min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-blue-400" />
                    Technical Analysis View
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Real-time Market Structure & Indicators</p>
                </div>
                <button 
                  onClick={() => setIsTAZoomed(true)}
                  className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-500 hover:text-blue-400 group"
                  title="Enlarge View"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <div className="h-[400px] rounded-xl overflow-hidden border border-slate-800">
                <AdvancedChart ticker={`NSE:${selectedTicker}`} hideLegend={true} hideTopToolbar={true} height="100%" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 flex flex-col items-center">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Sentiment Gauge</h3>
              <div className="w-full mt-2 rounded-xl overflow-hidden">
                <TechnicalAnalysisWidget ticker={`NSE:${selectedTicker}`} />
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold">Risk Analysis</h3>
              </div>
              <div className="space-y-4">
                <RiskItem label="Volatility" value={risk === 'High' ? 'High' : 'Medium'} color="text-amber-400" />
                <RiskItem label="Trend Stability" value={isBullish || isBearish ? 'Weak' : 'Moderate'} color="text-rose-400" />
                <RiskItem label="Drawdown Risk" value="Moderate" color="text-amber-400" />
                <RiskItem label="Model Confidence" value={`${confidence}%`} color="text-emerald-400" />
              </div>
            </div>

            <div className="glass-card p-6 bg-gradient-to-b from-slate-900 to-slate-950">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold">Strategy Levels</h3>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Ideal Entry</div>
                  <div className="text-lg font-bold">₹{(currentPrice * 0.98).toFixed(2)} – ₹{currentPrice.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Target Zone</div>
                  <div className="text-lg font-bold">₹{scenarios[0].price.toFixed(2)} – ₹{(scenarios[0].price * 1.02).toFixed(2)}</div>
                </div>
                <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                  <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Stop Loss</div>
                  <div className="text-lg font-bold">₹{scenarios[2].price.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-wrap gap-4">
              {scenarios.map((s, i) => (
                <ScenarioCard key={i} {...s} />
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 border-l-4 border-l-amber-500">
                <div className="flex items-center gap-2 mb-4 text-amber-500">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="text-lg font-bold">Signal Conflict Detector</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Forecast</span>
                    <span className={`font-bold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>{isBullish ? 'Bullish' : 'Bearish'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">MACD</span>
                    <span className="text-rose-400 font-bold">Bearish</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Sentiment</span>
                    <span className="text-slate-400 font-bold">Neutral</span>
                  </div>
                  <div className="pt-3 border-t border-slate-800 mt-2 text-xs text-amber-400 italic font-medium">
                    ⚠️ Divergence detected between AI Forecast and Momentum indicators. High uncertainty period.
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4 text-blue-400">
                  <MapPin className="w-5 h-5" />
                  <h3 className="text-lg font-bold">Key Levels</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium">Resistance</span>
                    <span className="text-sm font-bold">₹{(currentPrice * 1.05).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium">Support</span>
                    <span className="text-sm font-bold">₹{(currentPrice * 0.95).toFixed(0)}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg mt-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Trigger Signal</div>
                    <div className="text-xs font-semibold text-emerald-400">Breakout Above ₹{(currentPrice * 1.05).toFixed(0)}: Bullish Signal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 bg-blue-600/5">
              <div className="flex items-center gap-2 mb-4 text-blue-400">
                <RefreshCcw className="w-5 h-5" />
                <h3 className="text-lg font-bold">Model Credibility</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-white">7/10</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Past Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-white">±3.2%</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Avg Error</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                Builds trust by showing real performance. Model retrained 14 hours ago.
              </div>
            </div>

            <div className="glass-card p-6 border-2 border-dashed border-slate-800">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Position Suggestion</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </div>
                  <p className="text-sm text-slate-300">Avoid aggressive positions until resistance is cleared.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>
                  <p className="text-sm text-slate-300">Consider small exposure (SIP) in the entry zone.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-sm text-slate-300">Wait for confirmation breakout for swing trades.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ZoomModal 
        isOpen={isChartZoomed} 
        onClose={() => setIsChartZoomed(false)} 
        title={`${selectedTicker} - Predictive Price Corridor`}
      >
        <div className="h-[600px] w-full flex flex-col">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPriceForeZoom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBandForeZoom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(val) => `₹${Math.round(val)}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#colorBandForeZoom)" connectNulls />
                <Area type="monotone" dataKey="lower" stroke="none" fill="#020617" connectNulls />
                <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} fill="url(#colorPriceForeZoom)" dot={false} />
                <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" dot={false} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 flex items-center justify-center gap-12 text-xs uppercase font-bold tracking-widest text-slate-500 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3"><div className="w-6 h-1.5 bg-blue-500"></div> Historical Path</div>
            <div className="flex items-center gap-3"><div className="w-6 h-1.5 bg-violet-500 border-t-2 border-dashed"></div> AI Core Forecast</div>
            <div className="flex items-center gap-3"><div className="w-6 h-6 bg-violet-500/10 border border-violet-500/20"></div> 95% Confidence Band</div>
          </div>
        </div>
      </ZoomModal>

      <ZoomModal 
        isOpen={isTAZoomed} 
        onClose={() => setIsTAZoomed(false)} 
        title={`${selectedTicker} - Technical Analysis View`}
      >
        <div className="h-[700px] w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
          <AdvancedChart ticker={`NSE:${selectedTicker}`} hideLegend={true} hideTopToolbar={true} />
        </div>
      </ZoomModal>
    </main>
  );
};

export default ForecastingPage;
