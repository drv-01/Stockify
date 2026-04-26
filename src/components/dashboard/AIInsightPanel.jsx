import React, { useRef, useEffect } from 'react';
import { ShieldCheck, Zap, MessageSquareQuote, TrendingUp, TrendingDown, Minus, Send, Loader2, Bot, User } from 'lucide-react';
import { useState } from 'react';
import { sendChatMessage } from '../../services/api';

const AIInsightPanel = ({ analysis, ticker, persistedMessages, onMessagesChange }) => {
  const { forecast, sentiment, summary } = analysis;

  const recent = analysis.historical?.slice(-5) || [];
  const currentPrice = analysis.current?.price ?? recent[recent.length - 1]?.Close;
  const weekAgoPrice = recent[0]?.Close;
  const weekChange = weekAgoPrice && currentPrice
    ? (((currentPrice - weekAgoPrice) / weekAgoPrice) * 100).toFixed(2)
    : 'N/A';
  const forecastEnd = forecast.forecast?.[forecast.forecast.length - 1];
  const forecastChange = forecastEnd && currentPrice
    ? (((forecastEnd.predicted - currentPrice) / currentPrice) * 100).toFixed(2)
    : 'N/A';

  const stockContext = {
    currentPrice: currentPrice?.toFixed(2),
    weekChange,
    trend: forecast.trend,
    confidence: forecast.confidence,
    forecastChange,
    forecastLow: forecastEnd?.lower_bound?.toFixed(2),
    forecastHigh: forecastEnd?.upper_bound?.toFixed(2),
    sentiment: sentiment.overall,
    recentCloses: recent.map(d => `₹${d.Close?.toFixed(2)}`).join(', '),
  };

  const aiInsightMsg = { role: 'assistant', content: analysis.aiInsights || 'AI analysis is being generated...' };

  // persistedMessages stores only user/assistant conversation (no aiInsight).
  // We always prepend aiInsightMsg at render time so it's never duplicated in storage.
  const storedMsgs = persistedMessages ?? [];
  const messages = [aiInsightMsg, ...storedMsgs];

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    // newStored = everything after the aiInsightMsg
    const newStored = [...storedMsgs, userMsg];
    onMessagesChange(newStored);
    setInput('');
    setLoading(true);

    try {
      const { reply } = await sendChatMessage(ticker, [aiInsightMsg, ...newStored], stockContext);
      onMessagesChange([...newStored, { role: 'assistant', content: reply }]);
    } catch {
      onMessagesChange([...newStored, { role: 'assistant', content: 'Sorry, I could not reach the AI service. Please try again.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'Uptrend') return <TrendingUp className="w-5 h-5 text-emerald-500" />;
    if (trend === 'Downtrend') return <TrendingDown className="w-5 h-5 text-rose-500" />;
    return <Minus className="w-5 h-5 text-slate-400" />;
  };

  const getRiskColor = (level) => {
    if (level === 'Low') return 'text-emerald-500';
    if (level === 'High') return 'text-rose-500';
    return 'text-amber-500';
  };

  const suggestedQuestions = [
    'What are the key support levels?',
    'Should I buy, hold or sell?',
    'What risks should I watch?',
  ];

  return (
    <div className="space-y-6">
      {/* Forecast Engine Card */}
      <div className="glass-card p-5 border-l-4 border-l-violet-500">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-violet-400" />
          <h3 className="font-semibold">AI Forecast Engine</h3>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Projected Trend</div>
            <div className="text-xl font-bold flex items-center gap-2 mt-1">
              {forecast.trend}
              {getTrendIcon(forecast.trend)}
            </div>
            {forecast.change_pct != null && (
              <div className={`text-xs font-semibold mt-1 ${forecast.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {forecast.change_pct >= 0 ? '+' : ''}{forecast.change_pct}% over 5 days
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Confidence</div>
            <div className="text-xl font-bold text-violet-400">{forecast.confidence}%</div>
          </div>
        </div>
      </div>

      {/* Groq AI Chat */}
      <div className="glass-card p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquareQuote className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold">AI Intelligence</h3>
          <span className="ml-auto text-[10px] text-slate-600 font-mono">{ticker}</span>
        </div>

        {/* Risk / Action row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Risk Profile</div>
            <div className={`text-sm font-bold flex items-center gap-1 ${getRiskColor(summary.risk_level)}`}>
              <ShieldCheck className="w-4 h-4" />
              {summary.risk_level} Risk
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Action</div>
            <div className="text-sm font-bold text-blue-400 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              {summary.recommendation}
            </div>
          </div>
        </div>

        {/* Message history */}
        <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1 mb-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                msg.role === 'user' ? 'bg-blue-600' : 'bg-violet-600/40 border border-violet-500/30'
              }`}>
                {msg.role === 'user'
                  ? <User className="w-3.5 h-3.5 text-white" />
                  : <Bot className="w-3.5 h-3.5 text-violet-300" />
                }
              </div>
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-blue-600/20 border border-blue-500/20 text-slate-200 rounded-tr-none'
                  : 'bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 flex-row">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-violet-600/40 border border-violet-500/30">
                <Bot className="w-3.5 h-3.5 text-violet-300" />
              </div>
              <div className="px-3 py-2 rounded-xl rounded-tl-none bg-slate-800/60 border border-slate-700/50 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions — only when no conversation yet */}
        {storedMsgs.length === 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); inputRef.current?.focus(); }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/40 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask anything about ${ticker}...`}
            rows={1}
            className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            style={{ minHeight: '38px', maxHeight: '96px' }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-4 h-4 text-white" />
            }
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
};

export default AIInsightPanel;
