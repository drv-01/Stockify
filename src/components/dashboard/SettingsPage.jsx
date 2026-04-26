import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Globe, Search, ChevronRight, CheckCircle2,
  RefreshCw, ArrowLeft, Building2, TrendingUp,
  Layers, Loader2, Sparkles, X, Star
} from 'lucide-react';
import { useMarket } from '../../contexts/MarketContext';
import { getMarketsForCountry } from '../../services/api';

// ── Region Metadata ───────────────────────────────────────────────────────────
const REGION_LABELS = {
  IN: 'South Asia', US: 'North America', CA: 'North America', MX: 'North America',
  UK: 'Europe', DE: 'Europe', FR: 'Europe', IT: 'Europe', ES: 'Europe',
  NL: 'Europe', SE: 'Europe', NO: 'Europe', DK: 'Europe', CH: 'Europe',
  PL: 'Europe', PT: 'Europe', GR: 'Europe',
  JP: 'Asia Pacific', KR: 'Asia Pacific', AU: 'Asia Pacific', NZ: 'Asia Pacific',
  SG: 'Asia Pacific', TW: 'Asia Pacific', TH: 'Asia Pacific', MY: 'Asia Pacific',
  ID: 'Asia Pacific', PH: 'Asia Pacific', VN: 'Asia Pacific', BD: 'South Asia',
  PK: 'South Asia',
  CN: 'East Asia', HK: 'East Asia',
  BR: 'Latin America', AR: 'Latin America', CL: 'Latin America', CO: 'Latin America',
  SA: 'Middle East', AE: 'Middle East', IL: 'Middle East', TR: 'Middle East',
  ZA: 'Africa', NG: 'Africa', EG: 'Africa', KE: 'Africa',
  RU: 'Eastern Europe',
};

const REGION_COLORS = {
  'South Asia': 'from-orange-500/20 to-amber-500/10 border-orange-500/30',
  'North America': 'from-blue-500/20 to-sky-500/10 border-blue-500/30',
  'Europe': 'from-indigo-500/20 to-violet-500/10 border-indigo-500/30',
  'Asia Pacific': 'from-rose-500/20 to-pink-500/10 border-rose-500/30',
  'East Asia': 'from-red-500/20 to-rose-500/10 border-red-500/30',
  'Latin America': 'from-emerald-500/20 to-green-500/10 border-emerald-500/30',
  'Middle East': 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30',
  'Africa': 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30',
  'Eastern Europe': 'from-slate-500/20 to-slate-400/10 border-slate-500/30',
};

const POPULAR_MARKETS = [
  { countryCode: 'US', marketSymbol: 'SPX', name: 'S&P 500', flag: '🇺🇸' },
  { countryCode: 'IN', marketSymbol: 'NIFTY50', name: 'NIFTY 50', flag: '🇮🇳' },
  { countryCode: 'UK', marketSymbol: 'FTSE100', name: 'FTSE 100', flag: '🇬🇧' },
  { countryCode: 'JP', marketSymbol: 'NI225', name: 'Nikkei 225', flag: '🇯🇵' },
];

// ── Shared Components ────────────────────────────────────────────────────────

const Flag = ({ flag, className }) => {
  if (!flag) return <Globe className={className} />;
  const isUrl = flag.startsWith('http') || flag.startsWith('data:') || flag.includes('.');
  if (isUrl) {
    return (
      <div className={`rounded-sm overflow-hidden border border-slate-800/50 shadow-sm ${className}`}>
        <img src={flag} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  return <span className={className}>{flag}</span>;
};

const Step = ({ num, label, active, done }) => (
  <div className="flex items-center gap-2">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all
      ${done ? 'bg-blue-600 border-blue-600 text-white' :
        active ? 'bg-blue-600/20 border-blue-500 text-blue-400' :
          'bg-slate-800 border-slate-700 text-slate-500'}`}>
      {done ? <CheckCircle2 className="w-4 h-4" /> : num}
    </div>
    <span className={`text-sm font-medium transition-colors ${active ? 'text-slate-200' : done ? 'text-blue-400' : 'text-slate-500'}`}>
      {label}
    </span>
  </div>
);

const StepDivider = ({ done }) => (
  <div className={`flex-1 h-px transition-colors ${done ? 'bg-blue-600' : 'bg-slate-800'}`} />
);

const MarketCard = ({ market, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-xl p-4 border transition-all group
      ${selected
        ? 'bg-blue-600/15 border-blue-500/60 ring-2 ring-blue-500 shadow-lg shadow-blue-500/10'
        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
      }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className={`w-4 h-4 flex-shrink-0 ${selected ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
          <span className="text-sm font-semibold text-slate-100 truncate">{market.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-3 h-3 text-slate-600" />
          <span className="text-[11px] text-slate-500">{market.exchange}</span>
          <span className="text-[11px] text-slate-600">·</span>
          <span className="text-[11px] font-mono text-slate-600">{market.symbol}</span>
        </div>
      </div>
      {selected && <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />}
    </div>
  </button>
);

// ── Main Page Component ───────────────────────────────────────────────────────

export default function SettingsPage({ onBack }) {
  const { selection, countries, countriesLoading, applySelection } = useMarket();

  const [draftCountry, setDraftCountry] = useState(selection.country);
  const [draftMarket, setDraftMarket] = useState(selection.market);

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [marketsForDraft, setMarketsForDraft] = useState([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!draftCountry?.code) return;
    setMarketsLoading(true);
    getMarketsForCountry(draftCountry.code)
      .then(data => setMarketsForDraft(data?.markets || []))
      .catch(() => setMarketsForDraft([]))
      .finally(() => setMarketsLoading(false));
  }, [draftCountry?.code]);

  const filteredCountries = useMemo(() => {
    const q = search.toLowerCase();
    if (!Array.isArray(countries)) return [];
    if (!q) return countries;
    return countries.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (REGION_LABELS[c.code] || '').toLowerCase().includes(q)
    );
  }, [countries, search]);

  const grouped = useMemo(() => {
    const map = {};
    if (!Array.isArray(filteredCountries)) return map;
    filteredCountries.forEach(c => {
      const r = REGION_LABELS[c.code] || 'Other';
      if (!map[r]) map[r] = [];
      map[r].push(c);
    });
    return map;
  }, [filteredCountries]);

  const handleQuickSelect = useCallback(async (item) => {
    const country = countries.find(c => c.code === item.countryCode);
    if (!country) return;
    
    setMarketsLoading(true);
    setDraftCountry(country);
    try {
      const data = await getMarketsForCountry(item.countryCode);
      const market = data.markets.find(m => m.symbol === item.marketSymbol);
      if (market) {
        setDraftMarket(market);
        setStep(2);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMarketsLoading(false);
    }
  }, [countries]);

  const handleApply = () => {
    if (!draftCountry || !draftMarket) return;
    applySelection(draftCountry, draftMarket);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onBack();
    }, 1200);
  };

  const regionOrder = [
    'South Asia', 'North America', 'Europe', 'Asia Pacific', 'East Asia',
    'Latin America', 'Middle East', 'Africa', 'Eastern Europe', 'Other',
  ];

  const isChanged = draftCountry?.code !== selection.country?.code || draftMarket?.symbol !== selection.market?.symbol;
  const canApply = draftCountry && draftMarket && isChanged;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-slate-800 px-8 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Market Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">Global Intelligence Config</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-full px-3 py-1.5 shadow-inner">
          <Flag flag={selection.country?.flag} className="w-4 h-3 text-sm" />
          <span className="text-xs font-semibold text-slate-300">{selection.market?.name}</span>
        </div>
      </div>

      <div className="px-8 py-6 max-w-5xl mx-auto w-full">
        {/* Popular Markets */}
        {step === 1 && !search && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Popular Markets</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {POPULAR_MARKETS.map(item => (
                <button
                  key={item.marketSymbol}
                  onClick={() => handleQuickSelect(item)}
                  className="flex items-center gap-3 p-3 bg-slate-900/40 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-all text-left group hover:translate-y-[-2px]"
                >
                  <span className="text-lg leading-none">{item.flag}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate group-hover:text-blue-400">{item.name}</div>
                    <div className="text-[10px] text-slate-600 font-medium">Quick Connect</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step Progress */}
        <div className="flex items-center gap-3 mb-10">
          <Step num={1} label="Choose Country" active={step === 1} done={step > 1} />
          <StepDivider done={step > 1} />
          <Step num={2} label="Select Index" active={step === 2} done={saved} />
          <StepDivider done={saved} />
          <Step num={3} label="Finish" active={false} done={saved} />
        </div>

        {/* STEP 1: Country Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country, region or currency..."
                className="w-full pl-10 pr-4 py-3.5 bg-slate-900/70 border border-slate-800 rounded-2xl text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all border-b-2 focus:border-blue-500/50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {countriesLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm font-medium animate-pulse tracking-wide">Syncing Global Markets...</span>
              </div>
            ) : (
              <div className="space-y-8">
                {regionOrder.map(region => {
                  const list = grouped[region];
                  if (!list || list.length === 0) return null;
                  return (
                    <div key={region} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex items-center gap-2 mb-4">
                        <Layers className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">{region}</span>
                        <div className="h-px flex-1 bg-slate-900 ml-2 opacity-50"></div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
                        {list.map(c => (
                          <button
                            key={c.code}
                            onClick={() => { setDraftCountry(c); setStep(2); setSearch(''); }}
                            className={`relative w-full text-left rounded-xl p-3 border transition-all group
                              bg-gradient-to-br ${REGION_COLORS[REGION_LABELS[c.code] || 'Other'] || 'from-slate-600/20 to-slate-500/10 border-slate-600/30'}
                              ${draftCountry?.code === c.code
                                ? 'ring-2 ring-blue-500 border-blue-500/60 shadow-lg shadow-blue-500/10'
                                : 'hover:scale-[1.02] hover:shadow-md'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Flag flag={c.flag} className="w-8 h-5 text-sm" />
                              {draftCountry?.code === c.code && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                            </div>
                            <div className="text-xs font-bold text-slate-200 leading-tight truncate">{c.name}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider">{c.currencySymbol} · {c.code}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Market Selection */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => { setStep(1); setSearch(''); }}
              className="flex items-center gap-3 text-sm text-slate-400 hover:text-blue-400 transition-all group px-4 py-2 bg-slate-900/30 rounded-full border border-slate-800 hover:border-blue-500/30"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <Flag flag={draftCountry?.flag} className="w-5 h-3.5 text-lg" />
              <span className="font-bold">{draftCountry?.name}</span>
              <span className="text-slate-600">| Change Country</span>
            </button>

            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  Select Market Index
                </h2>
                <p className="text-sm text-slate-400">Choose the primary index you want to monitor for {draftCountry?.name}.</p>
              </div>

              {marketsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {marketsForDraft.map(market => (
                    <MarketCard
                      key={market.symbol}
                      market={market}
                      selected={draftMarket?.symbol === market.symbol}
                      onClick={() => setDraftMarket(market)}
                    />
                  ))}
                </div>
              )}

              {draftMarket && (
                <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">System Ready</div>
                      <div className="text-xs text-slate-500">Configured for {draftMarket.name}</div>
                    </div>
                  </div>

                  <button
                    onClick={handleApply}
                    disabled={!canApply || saved}
                    className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl text-sm font-black transition-all
                      ${saved
                        ? 'bg-emerald-600 text-white'
                        : canApply
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                      }`}
                  >
                    {saved ? (
                      <><CheckCircle2 className="w-5 h-5" /> Settings Saved</>
                    ) : (
                      <><RefreshCw className="w-5 h-5" /> Apply Global Selection</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
