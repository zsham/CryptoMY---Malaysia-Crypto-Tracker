import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  RefreshCw, 
  Activity, 
  Globe, 
  Cpu,
  Info,
  ChevronRight,
  MessageSquare,
  Send,
  Zap,
  ShieldAlert,
  BrainCircuit,
  BarChart3,
  LayoutDashboard,
  Settings,
  Bell
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  YAxis, 
  Tooltip,
  AreaChart,
  Area
} from 'recharts';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { Coin, GlobalData } from './types/crypto';
import { getMarketAnalysis, getCoinDeepDive, askAnalyst } from './services/gemini';

const REFRESH_INTERVAL = 60000;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function App() {
  const [view, setView] = useState<'dashboard' | 'markets' | 'global' | 'alerts' | 'settings'>('dashboard');
  const [coins, setCoins] = useState<Coin[]>([]);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [marketAnalysis, setMarketAnalysis] = useState<string>('');
  const [coinDeepDive, setCoinDeepDive] = useState<string>('');
  const [analyzingMarket, setAnalyzingMarket] = useState(false);
  const [analyzingCoin, setAnalyzingCoin] = useState(false);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [coinsRes, globalRes] = await Promise.all([
        fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=myr&order=market_cap_desc&per_page=50&page=1&sparkline=true'),
        fetch('https://api.coingecko.com/api/v3/global')
      ]);

      const coinsData = await coinsRes.json();
      const globalData = await globalRes.json();

      setCoins(coinsData);
      setGlobalData(globalData.data);
      
      if (!selectedCoin && coinsData.length > 0) {
        handleSelectCoin(coinsData[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSelectCoin = async (coin: Coin) => {
    setSelectedCoin(coin);
    setAnalyzingCoin(true);
    setCoinDeepDive('');
    try {
      const dive = await getCoinDeepDive(coin);
      setCoinDeepDive(dive);
    } finally {
      setAnalyzingCoin(false);
    }
  };

  const handleMarketAnalyze = async () => {
    if (coins.length === 0) return;
    setAnalyzingMarket(true);
    const result = await getMarketAnalysis(coins);
    setMarketAnalysis(result);
    setAnalyzingMarket(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await askAnalyst(userMsg, coins);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } finally {
      setIsTyping(false);
    }
  };

  const filteredCoins = useMemo(() => {
    return coins.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.symbol.toLowerCase().includes(search.toLowerCase())
    );
  }, [coins, search]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 6 : 2
    }).format(value);
  };

  const formatCompact = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <BrainCircuit className="w-16 h-16 text-yellow-500 animate-pulse" />
            <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-yellow-500/50 mb-2">System Initialization</p>
            <p className="font-serif italic text-white/40 text-sm">Synchronizing Global Intelligence Core...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Market List */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-yellow-500" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/50">Market Overview</h2>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/30">
                  <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
                  Auto-syncing every 60s
                </div>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                  <div className="col-span-1 col-header">#</div>
                  <div className="col-span-4 col-header">Asset</div>
                  <div className="col-span-3 col-header text-right">Price</div>
                  <div className="col-span-2 col-header text-right">24h Change</div>
                  <div className="col-span-2 col-header text-right">Market Cap</div>
                </div>

                <div className="divide-y divide-white/5">
                  {filteredCoins.slice(0, 10).map((coin) => (
                    <div 
                      key={coin.id}
                      onClick={() => handleSelectCoin(coin)}
                      className={cn(
                        "grid grid-cols-12 px-6 py-5 data-row cursor-pointer items-center group",
                        selectedCoin?.id === coin.id && "bg-yellow-500/[0.03] border-l-2 border-l-yellow-500"
                      )}
                    >
                      <div className="col-span-1 data-value text-xs text-white/30 group-hover:text-white/60">
                        {coin.market_cap_rank}
                      </div>
                      <div className="col-span-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5 p-1.5 flex items-center justify-center">
                          <img src={coin.image} alt={coin.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{coin.name}</p>
                            {Math.abs(coin.price_change_percentage_24h) > 5 && (
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" title="High Volatility" />
                            )}
                          </div>
                          <p className="text-[10px] uppercase font-bold text-white/30 tracking-wider">{coin.symbol}</p>
                        </div>
                      </div>
                      <div className="col-span-3 text-right data-value font-medium">
                        {formatCurrency(coin.current_price)}
                      </div>
                      <div className={cn(
                        "col-span-2 text-right data-value flex items-center justify-end gap-1.5 font-semibold",
                        coin.price_change_percentage_24h >= 0 ? "text-yellow-400" : "text-rose-400"
                      )}>
                        {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                      </div>
                      <div className="col-span-2 text-right data-value text-xs text-white/40">
                        {formatCompact(coin.market_cap)}
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setView('markets')}
                  className="w-full py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/20 hover:text-yellow-500 hover:bg-white/[0.02] transition-all border-t border-white/5"
                >
                  View All Markets
                </button>
              </div>
            </div>

            {/* Right Column: Intelligence & Details */}
            <div className="lg:col-span-4 space-y-8">
              {/* Asset Detail Card */}
              {selectedCoin && (
                <div className="glass-panel rounded-2xl p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 p-2">
                        <img src={selectedCoin.image} alt={selectedCoin.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{selectedCoin.name}</h2>
                        <p className="text-[10px] uppercase font-bold text-white/30 tracking-[0.2em]">{selectedCoin.symbol} / MYR</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="data-value text-xl font-bold">{formatCurrency(selectedCoin.current_price)}</p>
                      <div className={cn(
                        "text-[10px] data-value font-bold px-2 py-0.5 rounded inline-block mt-1",
                        selectedCoin.price_change_percentage_24h >= 0 ? "bg-yellow-500/10 text-yellow-400" : "bg-rose-500/10 text-rose-400"
                      )}>
                        {selectedCoin.price_change_percentage_24h >= 0 ? '+' : ''}{selectedCoin.price_change_percentage_24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Mini Chart */}
                  <div className="h-40 w-full relative group">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedCoin.sparkline_in_7d.price.map((p, i) => ({ price: p, time: i }))}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={selectedCoin.price_change_percentage_24h >= 0 ? "#FACC15" : "#F43F5E"} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={selectedCoin.price_change_percentage_24h >= 0 ? "#FACC15" : "#F43F5E"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke={selectedCoin.price_change_percentage_24h >= 0 ? "#FACC15" : "#F43F5E"} 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                        />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-2 shadow-2xl">
                                  <p className="text-[10px] data-value text-white/60 mb-1">Price Point</p>
                                  <p className="text-xs data-value font-bold">{formatCurrency(payload[0].value as number)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* AI Deep Dive */}
                  <div className="bg-white/[0.03] rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                      <BrainCircuit className="w-4 h-4 text-yellow-500" />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Intelligence Assessment</span>
                    </div>
                    {analyzingCoin ? (
                      <div className="flex items-center gap-3 py-4">
                        <RefreshCw className="w-4 h-4 animate-spin text-yellow-500/50" />
                        <span className="text-xs italic text-white/30">Processing fundamental data...</span>
                      </div>
                    ) : (
                      <div className="markdown-body opacity-90 text-xs">
                        <Markdown>{coinDeepDive}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Market Briefing */}
              <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-yellow-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-serif italic">Market Briefing</h3>
                  </div>
                  <button 
                    onClick={handleMarketAnalyze}
                    disabled={analyzingMarket}
                    className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all disabled:opacity-30"
                  >
                    <RefreshCw className={cn("w-4 h-4", analyzingMarket && "animate-spin")} />
                  </button>
                </div>
                
                <div className="min-h-[120px]">
                  {marketAnalysis ? (
                    <div className="markdown-body text-xs">
                      <Markdown>{marketAnalysis}</Markdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-10 text-center opacity-30">
                      <Info className="w-8 h-8 mb-3" />
                      <p className="text-xs max-w-[200px] leading-relaxed">Request a sophisticated market briefing powered by Gemini Search Grounding.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'markets':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif italic">All Markets</h2>
              <div className="text-[10px] text-white/30 uppercase tracking-widest">Showing Top 50 Assets</div>
            </div>
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="col-span-1 col-header">#</div>
                <div className="col-span-3 col-header">Asset</div>
                <div className="col-span-2 col-header text-right">Price</div>
                <div className="col-span-2 col-header text-right">24h Change</div>
                <div className="col-span-2 col-header text-right">Volume (24h)</div>
                <div className="col-span-2 col-header text-right">Market Cap</div>
              </div>
              <div className="divide-y divide-white/5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {filteredCoins.map((coin) => (
                  <div key={coin.id} className="grid grid-cols-12 px-6 py-5 data-row items-center group">
                    <div className="col-span-1 data-value text-xs text-white/30">{coin.market_cap_rank}</div>
                    <div className="col-span-3 flex items-center gap-4">
                      <img src={coin.image} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-semibold text-sm">{coin.name}</p>
                        <p className="text-[10px] uppercase font-bold text-white/30">{coin.symbol}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-right data-value font-medium">{formatCurrency(coin.current_price)}</div>
                    <div className={cn(
                      "col-span-2 text-right data-value font-semibold",
                      coin.price_change_percentage_24h >= 0 ? "text-yellow-400" : "text-rose-400"
                    )}>
                      {coin.price_change_percentage_24h.toFixed(2)}%
                    </div>
                    <div className="col-span-2 text-right data-value text-xs text-white/40">{formatCompact(coin.total_volume)}</div>
                    <div className="col-span-2 text-right data-value text-xs text-white/40">{formatCompact(coin.market_cap)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'global':
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-serif italic">Global Market Intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <p className="col-header">Total Market Cap</p>
                <p className="text-3xl font-bold data-value">RM{globalData ? formatCompact(globalData.total_market_cap.myr) : '---'}</p>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 w-[65%]" />
                </div>
              </div>
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <p className="col-header">24h Trading Volume</p>
                <p className="text-3xl font-bold data-value">RM{globalData ? formatCompact(globalData.total_volume.myr) : '---'}</p>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 w-[42%]" />
                </div>
              </div>
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <p className="col-header">BTC Dominance</p>
                <p className="text-3xl font-bold data-value">{globalData ? globalData.market_cap_percentage.btc.toFixed(1) : '---'}%</p>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 w-[58%]" />
                </div>
              </div>
            </div>
            <div className="glass-panel p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-8">
                <Globe className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-semibold">Market Dominance Distribution</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {globalData && Object.entries(globalData.market_cap_percentage).slice(0, 12).map(([symbol, percentage]) => (
                  <div key={symbol} className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{symbol}</p>
                    <p className="text-lg font-bold data-value">{percentage.toFixed(2)}%</p>
                    <div className="h-0.5 w-full bg-white/5 rounded-full">
                      <div className="h-full bg-yellow-500/50" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'alerts':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif italic">Intelligence Alerts</h2>
            <div className="space-y-4">
              {coins.filter(c => Math.abs(c.price_change_percentage_24h) > 5).map(coin => (
                <div key={coin.id} className="glass-panel p-6 rounded-2xl border-l-4 border-l-amber-500 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">High Volatility Detected: {coin.name}</p>
                      <p className="text-xs text-white/40">{coin.symbol.toUpperCase()} moved {coin.price_change_percentage_24h.toFixed(2)}% in the last 24h.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { handleSelectCoin(coin); setView('dashboard'); }}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] uppercase font-bold tracking-widest transition-all"
                  >
                    Analyze Asset
                  </button>
                </div>
              ))}
              <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-yellow-500 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="font-bold text-sm">AI Market Sentiment: Neutral-Bullish</p>
                  <p className="text-xs text-white/40">Intelligence core suggests consolidation before potential upward movement in MYR pairs.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="max-w-2xl space-y-8">
            <h2 className="text-2xl font-serif italic">Terminal Settings</h2>
            <div className="glass-panel p-8 rounded-2xl space-y-8">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">Data Preferences</h3>
                <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <div>
                    <p className="text-sm font-semibold">Auto-Refresh Interval</p>
                    <p className="text-[10px] text-white/30">Frequency of market data synchronization</p>
                  </div>
                  <select className="bg-[#050505] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-yellow-500">
                    <option>30 Seconds</option>
                    <option selected>60 Seconds</option>
                    <option>5 Minutes</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <div>
                    <p className="text-sm font-semibold">Base Currency</p>
                    <p className="text-[10px] text-white/30">Primary fiat pair for all valuations</p>
                  </div>
                  <div className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg text-xs font-bold">MYR (Ringgit)</div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">AI Configuration</h3>
                <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <div>
                    <p className="text-sm font-semibold">Search Grounding</p>
                    <p className="text-[10px] text-white/30">Enable real-time web context for AI analysis</p>
                  </div>
                  <div className="w-10 h-5 bg-yellow-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-yellow-500/30">
      {/* Sidebar Navigation (Slim) */}
      <nav className="fixed left-0 top-0 bottom-0 w-16 border-r border-white/5 bg-[#0A0A0A] hidden md:flex flex-col items-center py-8 gap-8 z-50">
        <div 
          onClick={() => setView('dashboard')}
          className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20 cursor-pointer hover:scale-110 transition-transform"
        >
          <Zap className="w-6 h-6 text-black fill-current" />
        </div>
        <div className="flex flex-col gap-6 mt-8">
          <LayoutDashboard 
            onClick={() => setView('dashboard')}
            className={cn("w-5 h-5 cursor-pointer transition-colors", view === 'dashboard' ? "text-yellow-500" : "text-white/30 hover:text-white/60")} 
          />
          <BarChart3 
            onClick={() => setView('markets')}
            className={cn("w-5 h-5 cursor-pointer transition-colors", view === 'markets' ? "text-yellow-500" : "text-white/30 hover:text-white/60")} 
          />
          <Globe 
            onClick={() => setView('global')}
            className={cn("w-5 h-5 cursor-pointer transition-colors", view === 'global' ? "text-yellow-500" : "text-white/30 hover:text-white/60")} 
          />
          <Bell 
            onClick={() => setView('alerts')}
            className={cn("w-5 h-5 cursor-pointer transition-colors", view === 'alerts' ? "text-yellow-500" : "text-white/30 hover:text-white/60")} 
          />
        </div>
        <div className="mt-auto">
          <Settings 
            onClick={() => setView('settings')}
            className={cn("w-5 h-5 cursor-pointer transition-colors", view === 'settings' ? "text-yellow-500" : "text-white/30 hover:text-white/60")} 
          />
        </div>
      </nav>

      <main className="md:pl-16 min-h-screen">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-serif italic tracking-tight">CryptoMY <span className="text-yellow-500 not-italic font-sans text-[10px] uppercase tracking-[0.2em] ml-2 font-bold opacity-80">Pro Terminal</span></h1>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex gap-8">
              <div className="text-right">
                <p className="col-header">Global Cap</p>
                <p className="data-value text-sm">RM{globalData ? formatCompact(globalData.total_market_cap.myr) : '---'}</p>
              </div>
              <div className="text-right">
                <p className="col-header">24h Vol</p>
                <p className="data-value text-sm">RM{globalData ? formatCompact(globalData.total_volume.myr) : '---'}</p>
              </div>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-yellow-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search Markets..."
                className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm w-48 md:w-64 focus:outline-none focus:border-yellow-500/50 focus:bg-white/10 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-[1600px] mx-auto">
          {renderView()}
        </div>
      </main>

      {/* Floating Chat Analyst */}
      <div className={cn(
        "fixed bottom-8 right-8 w-80 md:w-[400px] glass-panel shadow-2xl transition-all duration-500 z-50 flex flex-col rounded-2xl overflow-hidden",
        chatOpen ? "h-[600px] translate-y-0" : "h-14 translate-y-0"
      )}>
        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className="h-14 px-6 flex items-center justify-between bg-yellow-500 text-black w-full font-bold"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 fill-current" />
            <span className="text-sm uppercase tracking-widest">AI Analyst Terminal</span>
          </div>
          <ChevronRight className={cn("w-5 h-5 transition-transform duration-300", chatOpen ? "rotate-90" : "-rotate-90")} />
        </button>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0A0A0A]">
          {chatMessages.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <BrainCircuit className="w-8 h-8 text-yellow-500/40" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white/60">Intelligence Core Ready</p>
                <p className="text-xs text-white/30 max-w-[220px] mx-auto leading-relaxed">Ask about market trends, regulatory updates in Malaysia, or technical analysis for specific assets.</p>
              </div>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={cn(
              "flex flex-col max-w-[90%]",
              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}>
              <div className={cn(
                "p-4 rounded-2xl text-xs leading-relaxed shadow-lg",
                msg.role === 'user' 
                  ? "bg-yellow-500 text-black font-medium rounded-tr-none" 
                  : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none"
              )}>
                {msg.role === 'assistant' ? <div className="markdown-body"><Markdown>{msg.content}</Markdown></div> : msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-3 text-[10px] text-yellow-500/50 font-bold uppercase tracking-widest">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Analyst is processing...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-[#0F0F0F] border-t border-white/5 flex gap-3">
          <input 
            type="text" 
            placeholder="Query the analyst..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-yellow-500/50 focus:bg-white/10 transition-all"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!chatInput.trim() || isTyping}
            className="w-12 h-12 rounded-xl bg-yellow-500 text-black flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      <footer className="md:pl-16 p-10 border-t border-white/5 bg-[#0A0A0A]">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_#FACC15]" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/30">Intelligence Core Operational / Kuala Lumpur</span>
          </div>
          <div className="flex gap-8">
            <span className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white/40 cursor-pointer transition-colors">Terms of Service</span>
            <span className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white/40 cursor-pointer transition-colors">Privacy Protocol</span>
            <span className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white/40 cursor-pointer transition-colors">© 2024 CryptoMY Pro</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
