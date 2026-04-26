import React, { useEffect, useRef } from 'react';

// ── Ticker Tape ───────────────────────────────────────────────────────────────
export const TickerTape = ({ symbols = [] }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'tradingview-widget-container__widget';
    ref.current.appendChild(container);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;

    // Use provided symbols or fallback to a default global list
    const finalSymbols = symbols.length > 0 ? symbols : [
      { proName: 'BSE:SENSEX', displayName: 'SENSEX' },
      { proName: 'NSE:NIFTY', displayName: 'NIFTY 50' },
      { proName: 'NASDAQ:AAPL', displayName: 'APPLE' },
      { proName: 'NASDAQ:TSLA', displayName: 'TESLA' },
      { proName: 'FOREXCOM:USDINR', displayName: 'USD/INR' },
      { proName: 'COMEX:GC1!', displayName: 'GOLD' },
    ];

    script.innerHTML = JSON.stringify({
      symbols: finalSymbols,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'en',
    });
    ref.current.appendChild(script);

    return () => { if (ref.current) ref.current.innerHTML = ''; };
  }, [symbols]);

  return (
    <div className="tradingview-widget-container" ref={ref} />
  );
};

// ── Advanced Chart ────────────────────────────────────────────────────────────
export const AdvancedChart = ({ ticker = 'NSE:RELIANCE', hideTopToolbar = false, hideLegend = false, height = 500 }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'tradingview-widget-container__widget';
    container.style.height = typeof height === 'number' ? `${height}px` : height;
    ref.current.appendChild(container);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: ticker,
      interval: 'D',
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(2,6,23,0)',
      gridColor: 'rgba(30,41,59,0.5)',
      hide_top_toolbar: hideTopToolbar,
      hide_legend: hideLegend,
      allow_symbol_change: false,
      save_image: false,
      studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
    });
    ref.current.appendChild(script);

    return () => { if (ref.current) ref.current.innerHTML = ''; };
  }, [ticker, height, hideTopToolbar, hideLegend]);

  return (
    <div className="tradingview-widget-container w-full" ref={ref} style={{ height }} />
  );
};

// ── Technical Analysis Widget ─────────────────────────────────────────────────
export const TechnicalAnalysisWidget = ({ ticker = 'NSE:RELIANCE' }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'tradingview-widget-container__widget';
    ref.current.appendChild(container);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: '1D',
      width: '100%',
      isTransparent: true,
      height: 400,
      symbol: ticker,
      showIntervalTabs: true,
      displayMode: 'single',
      locale: 'en',
      colorTheme: 'dark',
    });
    ref.current.appendChild(script);

    return () => { if (ref.current) ref.current.innerHTML = ''; };
  }, [ticker]);

  return <div className="tradingview-widget-container w-full" ref={ref} />;
};
