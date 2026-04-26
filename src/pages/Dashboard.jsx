import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, TrendingUp, BarChart3, Settings, Bell, User, ChevronUp, ChevronDown, Loader2, Newspaper, BarChart2, History } from 'lucide-react';
import {
  getMarketOverview, getStockAnalysis,
  getNifty50, getMarketStatus, getSectors,
  getIndicators, getFundamentals, getFearGreed,
  getRSSNewsByTicker, getGlobalIndices,
} from '../services/api';
import StockChart from '../components/dashboard/StockChart';
import MarketIntelligencePage from '../components/dashboard/MarketIntelligencePage';
import AIInsightPanel from '../components/dashboard/AIInsightPanel';
import SearchAutocomplete from '../components/dashboard/SearchAutocomplete';
import FearGreedGauge from '../components/dashboard/FearGreedGauge';
import TechnicalIndicators from '../components/dashboard/TechnicalIndicators';
import FinancialsPanel from '../components/dashboard/FinancialsPanel';
import SectorHeatmap from '../components/dashboard/SectorHeatmap';
import GlobalIndices from '../components/dashboard/GlobalIndices';
import { TickerTape, TechnicalAnalysisWidget, AdvancedChart } from '../components/dashboard/TradingViewWidgets';
import ForecastingPage from '../components/dashboard/ForecastingPage';
import ZoomModal from '../components/dashboard/ZoomModal';
import SettingsPage from '../components/dashboard/SettingsPage';
import { useMarket } from '../contexts/MarketContext';
import { Maximize2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';



const SidebarItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
    }`}>{icon}{label}</button>
);

const WatchlistItem = ({ name, price, change, up, onClick }) => (
  <div onClick={onClick} className="flex items-center justify-between px-4 py-2 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors">
    <div>
      <div className="text-sm font-semibold">{name}</div>
      <div className="text-xs text-slate-500">{price}</div>
    </div>
    <div className={`text-xs font-medium flex items-center gap-1 ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
      {up ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}{change}
    </div>
  </div>
);

const StatCard = ({ label, value, change, up }) => (
  <div className="glass-card p-5 hover:border-slate-700 transition-all hover:translate-y-[-2px]">
    <div className="text-sm text-slate-500 font-medium mb-1">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold">{value}</span>
      {change && <span className={`text-xs font-semibold ${up ? 'text-emerald-500' : 'text-rose-500'}`}>{change}</span>}
    </div>
  </div>
);

const NewsItem = ({ title, sentiment, link, thumbnail, source, date }) => {
  const color = sentiment === 'Bullish' ? 'text-emerald-500' : sentiment === 'Bearish' ? 'text-rose-500' : 'text-slate-400';
  const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
  return (
    <a href={link || '#'} target="_blank" rel="noopener noreferrer"
      className="flex gap-3 border-b border-slate-800 pb-3 last:border-0 last:pb-0 group no-underline">
      {thumbnail && (
        <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border border-slate-800">
          <img src={thumbnail} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 transition-colors leading-snug">{title}</div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] font-bold uppercase ${color}`}>{sentiment}</span>
          <span className="text-[10px] text-slate-500">•</span>
          <span className="text-[10px] text-slate-500 truncate">{source}</span>
          {dateStr && <><span className="text-[10px] text-slate-500">•</span><span className="text-[10px] text-slate-600">{dateStr}</span></>}
        </div>
      </div>
    </a>
  );
};

const ChartToggle = ({ mode, setMode }) => (
  <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
    <button onClick={() => setMode('custom')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'custom' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
      <BarChart2 className="w-3 h-3" /> AI Chart
    </button>
    <button onClick={() => setMode('tradingview')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'tradingview' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
      <TrendingUp className="w-3 h-3" /> TradingView
    </button>
  </div>
);

const CHAT_STORAGE_KEY = 'mi_chat_history';
const loadChatHistory = () => { try { return JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY)) || {}; } catch { return {}; } };
const saveChatHistory = (h) => localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(h));

function Dashboard() {
  const [activePage, setActivePage] = useState('dashboard');
  const [chatHistory, setChatHistory] = useState(loadChatHistory);
  const [selectedTicker, setSelectedTicker] = useState('RELIANCE');

  const handleChatMessagesChange = (ticker, msgs) => {
    setChatHistory(prev => {
      const next = { ...prev };
      if (msgs === null) { delete next[ticker]; }
      else { next[ticker] = msgs; }
      saveChatHistory(next);
      return next;
    });
  };
  const [recentSearches, setRecentSearches] = useState(['RELIANCE', 'INFY', 'TCS', 'HDFCBANK']);
  const [period, setPeriod] = useState('3mo');
  const { selection, marketStocks, stocksLoading } = useMarket();
  const { user, logout } = useAuth();

  // Reset selected ticker when market changes to the first stock in the list
  useEffect(() => {
    if (marketStocks.length > 0) {
      const firstTicker = marketStocks[0].symbol;
      if (!recentSearches.includes(firstTicker)) {
        setSelectedTicker(firstTicker);
      }
    }
  }, [selection.market?.symbol, marketStocks]);

  const handleSelectTicker = (ticker) => {
    setSelectedTicker(ticker);
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t !== ticker);
      return [ticker, ...filtered];
    });
  };
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState([]);
  const [chartMode, setChartMode] = useState('custom');

  const [nifty50, setNifty50] = useState([]);
  const [marketStatus, setMarketStatus] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [fundamentals, setFundamentals] = useState(null);
  const [fearGreed, setFearGreed] = useState([]);
  const [indicatorsLoading, setIndicatorsLoading] = useState(false);
  const [rssNews, setRssNews] = useState([]);
  const [globalIndices, setGlobalIndices] = useState([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // Helper to add unique news to notifications
  const addNewsToNotifications = useCallback((newsItems) => {
    if (!newsItems || newsItems.length === 0) return;
    setNotifications(prev => {
      const existingTitles = new Set(prev.map(n => n.title));
      const newItems = newsItems.filter(n => !existingTitles.has(n.title));
      if (newItems.length > 0) {
        setHasUnreadNotifications(true);
        return [...newItems, ...prev].slice(0, 20); // Keep last 20
      }
      return prev;
    });
  }, []);


  // One-time global fetches
  useEffect(() => {
    getMarketOverview().then(setOverview).catch(() => { });
    getNifty50().then(setNifty50).catch(() => { });
    getMarketStatus().then(setMarketStatus).catch(() => { });
    getSectors().then(setSectors).catch(() => { });
    getFearGreed().then(setFearGreed).catch(() => { });
    getGlobalIndices().then(setGlobalIndices).catch(() => { });
  }, []);

  // Per-ticker fetches
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setIndicatorsLoading(true);
      setRssNews([]);
      setFundamentals(null);

      // Start auxiliary fetches concurrently to avoid blocking
      getRSSNewsByTicker(selectedTicker)
        .then(news => {
          setRssNews(news);
          addNewsToNotifications(news);
        })
        .catch(() => { });

      Promise.all([
        getIndicators(selectedTicker).catch(() => null),
        getFundamentals(selectedTicker).catch(() => null),
      ]).then(([ind, fund]) => {
        setIndicators(ind);
        setFundamentals(fund);
      }).finally(() => {
        setIndicatorsLoading(false);
      });

      try {
        const analysisData = await getStockAnalysis(selectedTicker, period);
        setAnalysis(analysisData);
        if (analysisData?.sentiment?.news) {
          addNewsToNotifications(analysisData.sentiment.news);
        }
      } catch (err) {
        console.error('Analysis fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedTicker, period, addNewsToNotifications]);

  const sidebarStocks = marketStocks;
  const isMarketOpen = marketStatus?.marketStatus === 'Open';
  
  const currencySymbol = selection.country?.currencySymbol || '₹';
  const exchangePrefix = selection.market?.exchange?.split('/')[0] || '';
                         
  const tvSymbol = selectedTicker.includes(':') ? selectedTicker : 
                  exchangePrefix ? `${exchangePrefix}:${selectedTicker}` : selectedTicker;

  // Dynamic Ticker Tape Symbols
  const tickerTapeSymbols = React.useMemo(() => {
    if (!marketStocks || marketStocks.length === 0) return [];
    
    return [
      { proName: selection.market?.tvSymbol || 'NSE:NIFTY', displayName: selection.market?.name },
      ...marketStocks.slice(0, 8).map(s => ({
        proName: s.symbol.includes(':') ? s.symbol : `${exchangePrefix}:${s.symbol}`,
        displayName: s.symbol
      }))
    ];
  }, [marketStocks, selection.market, exchangePrefix]);

  // Merge RSS + Finnhub news, deduplicate by title
  const mergedNews = (() => {
    const finnhubNews = analysis?.sentiment?.news || [];
    const seen = new Set();
    return [...rssNews, ...finnhubNews].filter(n => {
      if (seen.has(n.title)) return false;
      seen.add(n.title);
      return true;
    }).slice(0, 8);
  })();

  // Calculate Stock-specific Fear & Greed based on RSI momentum
  const stockFearGreed = React.useMemo(() => {
    if (!indicators?.rsi || indicators.rsi.length === 0) return null;
    return indicators.rsi.slice(0, 5).map(item => {
      const val = Math.round(item.rsi);
      return {
        value: val,
        timestamp: item.date,
        label: val <= 25 ? 'Extreme Fear' : val <= 45 ? 'Fear' : val <= 55 ? 'Neutral' : val <= 75 ? 'Greed' : 'Extreme Greed'
      };
    });
  }, [indicators]);



  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* TradingView Ticker Tape */}
      <div className="border-b border-slate-800/60 bg-background/95">
        <TickerTape symbols={tickerTapeSymbols} />
      </div>

      {/* Navbar */}
      <nav className="h-16 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 bg-background/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Stockify</span>
        </div>

        <SearchAutocomplete onSelect={handleSelectTicker} />

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setHasUnreadNotifications(false);
              }}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors relative"
            >
              <Bell className={`w-5 h-5 ${hasUnreadNotifications ? 'text-blue-400 animate-pulse' : 'text-slate-300'}`} />
              {hasUnreadNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-background shadow-lg shadow-blue-500/40"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-h-[480px] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl z-[60] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-blue-400" />
                    Market Signals
                  </h3>
                  <button onClick={() => setNotifications([])} className="text-[10px] text-slate-500 hover:text-slate-300 uppercase font-bold tracking-wider">Clear All</button>
                </div>
                <div className="overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n, i) => (
                      <a 
                        key={i} 
                        href={n.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-4 border-b border-slate-800/50 hover:bg-white/5 transition-colors no-underline group"
                      >
                        <div className="text-[10px] text-blue-400 font-bold uppercase mb-1 flex items-center justify-between">
                          <span>{n.source || 'News'}</span>
                          <span className="text-slate-600 lowercase font-normal">{n.date ? new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}</span>
                        </div>
                        <div className="text-xs font-medium text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                          {n.title}
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="p-10 text-center flex flex-col items-center gap-3">
                      <Bell className="w-8 h-8 text-slate-700" />
                      <p className="text-xs text-slate-500">No new signals detected.<br/>Tracking global markets...</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 bg-slate-900/80 text-center border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 font-medium">Auto-monitoring enabled</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-bold text-white leading-tight">{user?.name || 'User'}</div>
                <div className="text-[10px] text-slate-500 leading-tight truncate max-w-[100px]">{user?.email}</div>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-all group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 hidden lg:flex flex-col p-4 overflow-y-auto sticky top-16 h-[calc(100vh-4rem)]">
          <div className="space-y-1">
            <SidebarItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} />
            <SidebarItem icon={<BarChart3 className="w-4 h-4" />} label="Market Intelligence" active={activePage === 'market-intelligence'} onClick={() => setActivePage('market-intelligence')} />
            <SidebarItem icon={<TrendingUp className="w-4 h-4" />} label="Forecasting" active={activePage === 'forecasting'} onClick={() => setActivePage('forecasting')} />

            <SidebarItem icon={<Settings className="w-4 h-4" />} label="Settings" active={activePage === 'settings'} onClick={() => setActivePage('settings')} />
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between px-4 mb-3">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                {selection.market?.name || 'Market'} ({sidebarStocks.length})
              </h3>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isMarketOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                {isMarketOpen ? 'LIVE' : 'CLOSED'}
              </span>
            </div>
            <div className="space-y-0.5 max-h-[500px] overflow-y-auto pr-1">
              {stocksLoading ? (
                <div className="px-4 py-2 space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-8 bg-slate-900 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : sidebarStocks.length > 0 ? (
                sidebarStocks.map(stock => (
                  <WatchlistItem
                    key={stock.symbol}
                    name={stock.symbol}
                    price={`${currencySymbol}${stock.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    change={`${stock.change_pct >= 0 ? '+' : ''}${stock.change_pct?.toFixed(2)}%`}
                    up={stock.change_pct >= 0}
                    onClick={() => handleSelectTicker(stock.symbol)}
                  />
                ))
              ) : (
                <div className="px-4 text-xs text-slate-600">No stocks found</div>
              )}
            </div>
          </div>
        </aside>

        {/* Market Intelligence Page */}
        {activePage === 'market-intelligence' && (
          <MarketIntelligencePage
            onBack={() => setActivePage('dashboard')}
            initialTicker={selectedTicker}
            sharedChatHistory={chatHistory}
            onChatMessagesChange={handleChatMessagesChange}
          />
        )}

        {/* Settings Page */}
        {activePage === 'settings' && (
          <SettingsPage onBack={() => setActivePage('dashboard')} />
        )}

        {/* Forecasting Page */}
        {activePage === 'forecasting' && (
          <ForecastingPage
            selectedTicker={selectedTicker}
            analysis={analysis}
            loading={loading}
            indicators={indicators}
            onHorizonChange={setPeriod}
            currentPeriod={period}
          />
        )}

        {/* Main Content */}

        <main className={`flex-1 p-6 overflow-auto ${activePage !== 'dashboard' ? 'hidden' : ''}`}>
          <div className="space-y-8">

            {/* Quick Search */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500">
                <History className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Recent</span>
              </div>
              <div className="h-4 w-px bg-slate-800"></div>
              <div className="flex gap-2 flex-wrap">
                {recentSearches.map(ticker => (
                  <button
                    key={ticker}
                    onClick={() => handleSelectTicker(ticker)}
                    className="px-3 py-1.5 bg-slate-900/40 border border-slate-800/50 rounded-full text-xs font-medium hover:bg-slate-800 hover:text-blue-400 hover:border-slate-700 transition-all text-slate-300 shadow-sm flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-blue-500 transition-colors"></span>
                    {ticker}
                  </button>
                ))}
              </div>
            </div>

            {/* Header */}
            <header className="flex justify-between items-end">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{selectedTicker} Intelligence</h1>
                  {analysis?.current && (
                    <div className="flex items-baseline gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                      <span className="text-lg font-bold">{currencySymbol}{analysis.current.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className={`text-xs font-bold ${analysis.current.change_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {analysis.current.change_pct >= 0 ? '+' : ''}{analysis.current.change_pct?.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-slate-400 mt-1">Real-time analysis · 5-day forecast · Technical indicators</p>
              </div>
              <div className="text-right hidden md:block">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Market Status</div>
                <div className={`flex items-center gap-2 font-medium ${isMarketOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
                  {marketStatus ? (isMarketOpen ? 'Market Open' : 'Market Closed') : 'Checking...'}
                </div>
              </div>
            </header>

            {/* Global Indices */}
            {/* {globalIndices.length > 0 && <GlobalIndices indices={globalIndices} />} */}

            {/* Sector Heatmap */}
            {/* {sectors.length > 0 && <SectorHeatmap sectors={sectors} />} */}

            {/* Market Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {marketStocks.slice(0, 4).map(stock => (
                <StatCard
                  key={stock.symbol}
                  label={stock.symbol}
                  value={`${currencySymbol}${stock.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  change={`${stock.change_pct >= 0 ? '+' : ''}${stock.change_pct?.toFixed(2)}%`}
                  up={stock.change_pct >= 0}
                />
              ))}
              {marketStocks.length === 0 && !stocksLoading && Array(4).fill(0).map((_, i) => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-20 mb-3"></div>
                  <div className="h-8 bg-slate-800 rounded w-32"></div>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="h-[500px] flex flex-col items-center justify-center text-slate-500 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="animate-pulse">Analyzing market data and generating forecasts...</p>
              </div>
            ) : analysis && (
              <>
                {/* Chart + AI + News */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Price Action & Market News */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-semibold">Price Action & Probabilistic Range</h2>
                          <button
                            onClick={() => setIsZoomed(true)}
                            className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-500 hover:text-blue-400 group"
                            title="Enlarge Chart"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">

                          <ChartToggle mode={chartMode} setMode={setChartMode} />
                          {chartMode === 'custom' && (
                            <div className="flex gap-2">
                              {[{ label: '1M', val: '1mo' }, { label: '3M', val: '3mo' }, { label: '6M', val: '6mo' }, { label: '1Y', val: '1y' }].map(t => (
                                <button key={t.label} onClick={() => setPeriod(t.val)}
                                  className={`px-3 py-1 text-xs rounded-md ${period === t.val ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-500 hover:bg-slate-800'}`}>
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {chartMode === 'custom' ? (
                        <>
                          <StockChart data={analysis.historical} forecast={analysis.forecast.forecast} />
                          <div className="mt-4 flex items-center gap-6 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                            <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-blue-500"></div> Historical</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-violet-500 border-t border-dashed"></div> AI Forecast</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-violet-500/10 border border-violet-500/20"></div> 95% Band</div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col xl:flex-row gap-4">
                          <div className="flex-1 min-h-[500px]">
                            <AdvancedChart key={tvSymbol} ticker={tvSymbol} />
                          </div>
                          <div className="w-full xl:w-72 flex-shrink-0 flex flex-col gap-2">
                            <div className="flex items-center gap-2 px-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">TradingView Signal</span>
                              <span className="ml-auto text-[10px] font-mono text-slate-600">{tvSymbol}</span>
                            </div>
                            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80">
                              <TechnicalAnalysisWidget key={tvSymbol} ticker={tvSymbol} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Merged RSS + Finnhub News */}
                    <div className="glass-card p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Newspaper className="w-5 h-5 text-blue-400" />
                        <h2 className="text-xl font-semibold">Market News</h2>
                        <span className="ml-auto text-[10px] text-slate-500">ET · MoneyControl · Finnhub</span>
                      </div>
                      <div className="space-y-4">
                        {mergedNews.length > 0 ? mergedNews.map((news, i) => (
                          <NewsItem key={i} {...news} />
                        )) : (
                          <div className="text-xs text-slate-600 animate-pulse">Loading news...</div>
                        )}
                      </div>
                    </div>

                    <FearGreedGauge data={stockFearGreed || fearGreed} />
                  </div>

                  {/* Right Column: AI Intelligence, Technical Indicators, TradingView Signal, Fear & Greed */}
                  <div className="flex flex-col gap-6 h-full">
                    <AIInsightPanel
                      analysis={analysis}
                      ticker={selectedTicker}
                      persistedMessages={chatHistory[selectedTicker]}
                      onMessagesChange={(msgs) => handleChatMessagesChange(selectedTicker, msgs)}
                    />

                    {indicatorsLoading ? (
                      <div className="glass-card p-6 h-[320px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 text-slate-500">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                          <span className="text-sm animate-pulse">Loading technical indicators...</span>
                        </div>
                      </div>
                    ) : (
                      <TechnicalIndicators indicators={indicators} />
                    )}

                    {/* TradingView Signal moved to Price Action section */}

                    <div className="flex-1">
                      <FinancialsPanel fundamentals={fundamentals} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Zoom Modal for Dashboard Chart */}
      <ZoomModal
        isOpen={isZoomed}
        onClose={() => setIsZoomed(false)}
        title={`${selectedTicker} - Price Action & Probabilistic Range`}
      >
        <div className="h-[600px] w-full">
          {chartMode === 'custom' ? (
            <div className="h-full flex flex-col">
              <div className="flex-1">
                <StockChart data={analysis?.historical || []} forecast={analysis?.forecast?.forecast || []} />
              </div>
              <div className="mt-6 flex items-center justify-center gap-10 text-xs uppercase font-bold tracking-widest text-slate-500 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2"><div className="w-4 h-1 bg-blue-500"></div> Historical Price</div>
                <div className="flex items-center gap-2"><div className="w-4 h-1 bg-violet-500 border-t-2 border-dashed"></div> AI Predictive Corridor</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-violet-500/10 border border-violet-500/20"></div> 95% Confidence Interval</div>
              </div>
            </div>
          ) : (
            <AdvancedChart key={`zoomed-${tvSymbol}`} ticker={tvSymbol} />
          )}
        </div>
      </ZoomModal>
    </div>
  );
}


export default Dashboard;
