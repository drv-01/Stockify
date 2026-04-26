import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const getMarketOverview = () => axios.get(`${API_BASE_URL}/stocks/overview`).then(r => r.data);
export const getStockAnalysis = (ticker, period = '3mo') => axios.get(`${API_BASE_URL}/analysis/${ticker}?period=${period}`).then(r => r.data);
export const getStockHistory = (ticker, period = '1mo') => axios.get(`${API_BASE_URL}/stocks/${ticker}?period=${period}`).then(r => r.data);

// NSE
export const getNifty50 = () => axios.get(`${API_BASE_URL}/nifty50`).then(r => r.data);
export const getMarketStatus = () => axios.get(`${API_BASE_URL}/market-status`).then(r => r.data);
export const getSectors = () => axios.get(`${API_BASE_URL}/sectors`).then(r => r.data);

// Alpha Vantage
export const getIndicators = (ticker) => axios.get(`${API_BASE_URL}/indicators/${ticker}`).then(r => r.data);
export const getFundamentals = (ticker) => axios.get(`${API_BASE_URL}/fundamentals/${ticker}`).then(r => r.data);
export const searchTickers = (q) => axios.get(`${API_BASE_URL}/search?q=${q}`).then(r => r.data);

// Fear & Greed
export const getFearGreed = () => axios.get(`${API_BASE_URL}/fear-greed`).then(r => r.data);

// RSS News
export const getRSSNews = () => axios.get(`${API_BASE_URL}/news/rss`).then(r => r.data);
export const getRSSNewsByTicker = (ticker) => axios.get(`${API_BASE_URL}/news/rss/${ticker}`).then(r => r.data);

// Global Indices
export const getGlobalIndices = () => axios.get(`${API_BASE_URL}/global-indices`).then(r => r.data);

// AI Chat
export const sendChatMessage = (ticker, messages, context) =>
  axios.post(`${API_BASE_URL}/chat/${ticker}`, { messages, context }).then(r => r.data);

// Global Market Selection
export const getCountriesWithMarkets = () =>
  axios.get(`${API_BASE_URL}/countries-with-markets`).then(r => r.data);

export const getMarketsForCountry = (countryCode) =>
  axios.get(`${API_BASE_URL}/markets?country=${countryCode}`).then(r => r.data);

export const getStocksByMarket = (marketSymbol) =>
  axios.get(`${API_BASE_URL}/stocks-by-market?market=${marketSymbol}`).then(r => r.data);
