import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Loader2, ChevronLeft, Trash2, MessageSquare, Plus } from 'lucide-react';
import { getStockAnalysis } from '../../services/api';
import AIInsightPanel from './AIInsightPanel';
import SearchAutocomplete from './SearchAutocomplete';

const MarketIntelligencePage = ({ onBack, initialTicker = 'RELIANCE', sharedChatHistory, onChatMessagesChange }) => {
  const [activeTicker, setActiveTicker] = useState(initialTicker);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const tickerList = Object.keys(sharedChatHistory);

  const fetchAnalysis = useCallback(async (ticker) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const data = await getStockAnalysis(ticker, '3mo');
      setAnalysis(data);
      // Init empty history entry if ticker is new
      if (!sharedChatHistory[ticker]) {
        onChatMessagesChange(ticker, []);
      }
    } catch {
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [sharedChatHistory, onChatMessagesChange]);

  useEffect(() => { fetchAnalysis(activeTicker); }, [activeTicker, fetchAnalysis]);

  const handleNewChat = (ticker) => onChatMessagesChange(ticker, []);

  const handleDeleteChat = (ticker) => {
    onChatMessagesChange(ticker, null); // null signals deletion — handled below
    if (activeTicker === ticker) {
      const remaining = tickerList.filter(t => t !== ticker);
      if (remaining.length > 0) setActiveTicker(remaining[0]);
    }
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Chat History Sidebar */}
      <aside className="w-60 border-r border-slate-800 flex flex-col bg-background/60 flex-shrink-0">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold">Market Intelligence</span>
          </div>
          <SearchAutocomplete onSelect={setActiveTicker} wrapperClassName="relative w-full" />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {tickerList.length === 0 && (
            <p className="text-xs text-slate-600 px-2 py-3">Search a ticker to start a chat.</p>
          )}
          {tickerList.map(ticker => (
            <div
              key={ticker}
              onClick={() => setActiveTicker(ticker)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                activeTicker === ticker ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-sm font-medium flex-1 truncate">{ticker}</span>
              <span className="text-[10px] text-slate-600 group-hover:hidden">
                {sharedChatHistory[ticker]?.length > 0 ? `${sharedChatHistory[ticker].length} msg` : 'new'}
              </span>
              <div className="hidden group-hover:flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleNewChat(ticker); }}
                  className="p-0.5 hover:text-blue-400 transition-colors"
                  title="Clear chat"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteChat(ticker); }}
                  className="p-0.5 hover:text-rose-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onBack}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="animate-pulse text-sm">Loading analysis for {activeTicker}...</p>
          </div>
        ) : analysis ? (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-2xl font-bold">{activeTicker}</h1>
              {analysis.current && (
                <div className="flex items-baseline gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                  <span className="text-base font-bold">₹{analysis.current.price?.toFixed(2)}</span>
                  <span className={`text-xs font-bold ${analysis.current.change_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {analysis.current.change_pct >= 0 ? '+' : ''}{analysis.current.change_pct?.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            <AIInsightPanel
              analysis={analysis}
              ticker={activeTicker}
              persistedMessages={sharedChatHistory[activeTicker] ?? []}
              onMessagesChange={(msgs) => onChatMessagesChange(activeTicker, msgs)}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 text-sm">
            Select a ticker to begin analysis.
          </div>
        )}
      </main>
    </div>
  );
};

export default MarketIntelligencePage;
