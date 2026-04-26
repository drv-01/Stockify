import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCountriesWithMarkets, getMarketsForCountry, getStocksByMarket } from '../services/api';

const STORAGE_KEY = 'stockify_market_selection';

const DEFAULT_SELECTION = {
  country: { name: 'India', code: 'IN', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹' },
  market: { name: 'NIFTY 50', symbol: 'NIFTY50', exchange: 'NSE' },
};

function loadPersistedSelection() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SELECTION;
  } catch {
    return DEFAULT_SELECTION;
  }
}

function persistSelection(selection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  } catch { /* ignore */ }
}

// ── Context ───────────────────────────────────────────────────────────────────
const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const [selection, setSelection] = useState(loadPersistedSelection);
  const [countries, setCountries] = useState([]);
  const [availableMarkets, setAvailableMarkets] = useState([]);
  const [marketStocks, setMarketStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(false);

  // Fetch countries once on mount
  useEffect(() => {
    setCountriesLoading(true);
    getCountriesWithMarkets()
      .then(setCountries)
      .catch(() => setCountries([]))
      .finally(() => setCountriesLoading(false));
  }, []);

  // Whenever country changes, fetch its markets
  useEffect(() => {
    if (!selection.country?.code) return;
    getMarketsForCountry(selection.country.code)
      .then(data => setAvailableMarkets(data?.markets || []))
      .catch(() => setAvailableMarkets([]));
  }, [selection.country?.code]);

  // Whenever market changes, fetch its live stocks
  const fetchMarketStocks = useCallback(async (marketSymbol) => {
    if (!marketSymbol) return;
    setStocksLoading(true);
    try {
      const data = await getStocksByMarket(marketSymbol);
      setMarketStocks(data?.stocks || []);
    } catch {
      setMarketStocks([]);
    } finally {
      setStocksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selection.market?.symbol) {
      fetchMarketStocks(selection.market.symbol);
    }
  }, [selection.market?.symbol, fetchMarketStocks]);

  // Apply a new country+market selection and persist
  const applySelection = useCallback((country, market) => {
    const next = { country, market };
    setSelection(next);
    persistSelection(next);
  }, []);

  const refreshMarketStocks = useCallback(() => {
    if (selection.market?.symbol) fetchMarketStocks(selection.market.symbol);
  }, [selection.market?.symbol, fetchMarketStocks]);

  return (
    <MarketContext.Provider value={{
      selection,
      countries,
      availableMarkets,
      marketStocks,
      stocksLoading,
      countriesLoading,
      applySelection,
      refreshMarketStocks,
    }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used inside MarketProvider');
  return ctx;
}
