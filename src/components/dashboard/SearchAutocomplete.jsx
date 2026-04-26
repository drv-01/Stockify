import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchTickers } from '../../services/api';

const SearchAutocomplete = ({ onSelect, wrapperClassName }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchTickers(val);
        setResults(data);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 400);
  };

  const handleSelect = (symbol) => {
    const clean = symbol.replace('.BSE', '').replace('.NSE', '');
    setQuery(clean);
    setOpen(false);
    onSelect(clean);
  };

  return (
    <div ref={wrapperRef} className={wrapperClassName ?? 'relative flex-1 max-w-xl mx-8'}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
      <input
        type="text"
        placeholder="Search stocks (e.g. RELIANCE, TCS, INFY)..."
        className="w-full bg-slate-900/50 border border-slate-800 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        value={query}
        onChange={handleChange}
        onKeyDown={(e) => e.key === 'Enter' && query && handleSelect(query.toUpperCase())}
      />
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          {results.map((r) => (
            <button
              key={r.symbol}
              onClick={() => handleSelect(r.symbol)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800 transition-colors text-left"
            >
              <div>
                <div className="text-sm font-semibold">{r.symbol}</div>
                <div className="text-xs text-slate-500 truncate max-w-[260px]">{r.name}</div>
              </div>
              <span className="text-[10px] text-slate-600 font-medium uppercase">{r.region}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
