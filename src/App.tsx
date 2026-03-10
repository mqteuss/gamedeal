import { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GameCard } from './components/GameCard';
import { Frown, Loader2, ArrowDownUp, Eye } from 'lucide-react';
import { getDeals, getStores, Deal, Store as ApiStore } from './services/cheapshark';
import { GameDeal } from './types';
import { get, set } from 'idb-keyval';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'Deal Rating' | 'Title' | 'Savings' | 'Price' | 'Metacritic' | 'Reviews' | 'Release' | 'Recent'>('Deal Rating');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedMinPrice, setDebouncedMinPrice] = useState('');
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState('');

  const [deals, setDeals] = useState<Deal[]>([]);
  const [apiStores, setApiStores] = useState<ApiStore[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pageNumber, setPageNumber] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [monitoredGames, setMonitoredGames] = useState<GameDeal[]>([]);
  const [showMonitoredOnly, setShowMonitoredOnly] = useState(false);

  // Load monitored games from IndexedDB
  useEffect(() => {
    const loadMonitoredGames = async () => {
      try {
        const storedGames = await get<GameDeal[]>('monitored-games');
        if (storedGames) {
          setMonitoredGames(storedGames);
        }
      } catch (err) {
        console.error('Failed to load monitored games:', err);
      }
    };
    loadMonitoredGames();
  }, []);

  // Save monitored games to IndexedDB
  useEffect(() => {
    const saveMonitoredGames = async () => {
      try {
        await set('monitored-games', monitoredGames);
      } catch (err) {
        console.error('Failed to save monitored games:', err);
      }
    };
    // Only save if we have loaded them (or it's empty, which is fine)
    saveMonitoredGames();
  }, [monitoredGames]);

  const toggleMonitor = (deal: GameDeal) => {
    setMonitoredGames(prev => {
      const isMonitored = prev.some(g => g.id === deal.id);
      if (isMonitored) {
        return prev.filter(g => g.id !== deal.id);
      } else {
        return [...prev, deal];
      }
    });
  };

  // Fetch stores and exchange rate on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [fetchedStores, rateRes] = await Promise.all([
          getStores(),
          fetch('https://economia.awesomeapi.com.br/last/USD-BRL').catch(() => null)
        ]);
        
        setApiStores(fetchedStores);

        if (rateRes && rateRes.ok) {
          const rateData = await rateRes.json();
          setExchangeRate(parseFloat(rateData.USDBRL.ask));
        } else {
          setExchangeRate(5.0);
        }
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
        setExchangeRate(5.0);
      }
    };

    fetchInitialData();
  }, []);

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, minPrice, maxPrice]);

  // Reset pagination when filters change
  useEffect(() => {
    if (showMonitoredOnly) return;
    setPageNumber(0);
    setDeals([]);
    setHasMore(true);
    setError(null);
  }, [debouncedSearch, selectedStores, debouncedMinPrice, debouncedMaxPrice, sortBy, showMonitoredOnly]);

  // Fetch deals
  useEffect(() => {
    if (exchangeRate === 0 || showMonitoredOnly) {
      if (showMonitoredOnly) {
        setIsLoading(false);
        setIsLoadingMore(false);
        setHasMore(false);
      }
      return;
    }

    const fetchDeals = async () => {
      try {
        if (pageNumber === 0) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const params: any = { onSale: true, pageSize: 60, pageNumber, sortBy };
        
        if (debouncedSearch) params.title = debouncedSearch;
        if (selectedStores.length > 0) params.storeID = selectedStores.join(',');
        
        if (debouncedMinPrice) {
          params.lowerPrice = Math.max(0, parseFloat(debouncedMinPrice) / exchangeRate);
        }
        if (debouncedMaxPrice) {
          params.upperPrice = parseFloat(debouncedMaxPrice) / exchangeRate;
        }

        const nextDeals = await getDeals(params);
        
        setDeals(prev => {
          if (pageNumber === 0) return nextDeals;
          const existingIds = new Set(prev.map(d => d.dealID));
          const newDeals = nextDeals.filter(d => !existingIds.has(d.dealID));
          return [...prev, ...newDeals];
        });
        
        setHasMore(nextDeals.length === 60);
      } catch (err) {
        if (pageNumber === 0) {
          setError('Falha ao carregar as ofertas. Tente novamente mais tarde.');
        }
        console.error('Failed to load deals:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };

    fetchDeals();
  }, [pageNumber, debouncedSearch, selectedStores, debouncedMinPrice, debouncedMaxPrice, sortBy, exchangeRate, showMonitoredOnly]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore && !showMonitoredOnly) {
          setPageNumber(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, showMonitoredOnly]);

  const availableStores = useMemo(() => {
    return apiStores
      .filter(s => s.isActive === 1)
      .map(s => ({ id: s.storeID, name: s.storeName }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [apiStores]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const displayedDeals = showMonitoredOnly 
    ? monitoredGames 
    : deals.map(deal => {
        const storeObj = availableStores.find(s => s.id === deal.storeID);
        
        // Otimização: Troca a miniatura de baixa resolução (120x45) por uma de melhor qualidade (231x87)
        const optimizedThumb = deal.thumb.replace(/capsule_sm_120/g, 'capsule_231x87');
        
        return {
          id: deal.dealID,
          title: deal.title,
          imageUrl: optimizedThumb,
          originalPrice: parseFloat(deal.normalPrice) * exchangeRate,
          discountedPrice: parseFloat(deal.salePrice) * exchangeRate,
          discountPercentage: Math.round(parseFloat(deal.savings)),
          store: storeObj ? storeObj.name : 'Desconhecida',
          platform: 'PC',
          url: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
          metacriticScore: deal.metacriticScore,
          steamRatingPercent: deal.steamRatingPercent,
          steamRatingText: deal.steamRatingText
        };
      });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        toggleSidebar={toggleSidebar}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Invisible edge drag area to open sidebar */}
        {!isSidebarOpen && (
          <motion.div 
            className="fixed inset-y-0 left-0 w-4 z-30 md:hidden"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0}
            onDragEnd={(e, info) => {
              if (info.offset.x > 50) {
                setIsSidebarOpen(true);
              }
            }}
          />
        )}

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div 
          className="fixed inset-y-0 left-0 z-40 md:relative md:z-auto pt-16 md:pt-0 w-[65vw] sm:w-[50vw] md:w-auto h-full bg-zinc-900/80 backdrop-blur-md border-r border-white/5"
          initial={false}
          animate={{ x: isSidebarOpen ? 0 : '-100%' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={(e, info) => {
            if (info.offset.x < -50) {
              setIsSidebarOpen(false);
            }
          }}
          style={{ x: isSidebarOpen ? 0 : '-100%' }}
        >
          {/* Reset transform for desktop */}
          <div className="hidden md:block h-full">
            <Sidebar 
              availableStores={availableStores}
              selectedStores={selectedStores}
              setSelectedStores={setSelectedStores}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
            />
          </div>
          {/* Mobile content */}
          <div className="md:hidden h-full">
            <Sidebar 
              availableStores={availableStores}
              selectedStores={selectedStores}
              setSelectedStores={setSelectedStores}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
            />
          </div>
        </motion.div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {showMonitoredOnly 
                    ? 'Monitorados' 
                    : searchQuery 
                      ? `Resultados para "${searchQuery}"` 
                      : 'Destaques'}
                </h2>
                <button
                  onClick={() => setShowMonitoredOnly(!showMonitoredOnly)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    showMonitoredOnly 
                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <Eye size={16} />
                  <span className="hidden sm:inline">{showMonitoredOnly ? 'Ver Todas' : 'Ver Monitorados'}</span>
                  <span className="sm:hidden">{showMonitoredOnly ? 'Todas' : 'Monitorados'}</span>
                </button>
              </div>
              
              {!showMonitoredOnly && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                    <ArrowDownUp size={16} className="text-zinc-400" />
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent text-sm text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value="Deal Rating">Relevância</option>
                      <option value="Price">Menor Preço</option>
                      <option value="Savings">Maior Desconto</option>
                      <option value="Metacritic">Nota Metacritic</option>
                      <option value="Reviews">Avaliações Steam</option>
                      <option value="Recent">Mais Recentes</option>
                      <option value="Release">Data de Lançamento</option>
                      <option value="Title">Ordem Alfabética</option>
                    </select>
                  </div>
                  <span className="text-zinc-400 text-sm font-medium bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 hidden sm:block">
                    {deals.length} {deals.length === 1 ? 'jogo' : 'jogos'}
                  </span>
                </div>
              )}
            </div>

            {isLoading && pageNumber === 0 && !showMonitoredOnly ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <p className="text-zinc-400">Buscando as melhores ofertas...</p>
              </div>
            ) : error && !showMonitoredOnly ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-red-500/10 p-6 rounded-full mb-6 border border-red-500/20">
                  <Frown size={48} className="text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Ops! Algo deu errado</h3>
                <p className="text-zinc-400 max-w-md">{error}</p>
              </div>
            ) : (
              <>
                {displayedDeals.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 sm:gap-2">
                    {displayedDeals.map(deal => (
                      <GameCard 
                        key={deal.id} 
                        deal={deal}
                        isMonitored={monitoredGames.some(g => g.id === deal.id)}
                        onToggleMonitor={toggleMonitor}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-zinc-900 p-6 rounded-full mb-6 border border-zinc-800">
                      {showMonitoredOnly ? <Eye size={48} className="text-zinc-600" /> : <Frown size={48} className="text-zinc-600" />}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {showMonitoredOnly ? 'Nenhum jogo monitorado' : 'Nenhum jogo encontrado'}
                    </h3>
                    <p className="text-zinc-400 max-w-md">
                      {showMonitoredOnly 
                        ? 'Você ainda não está monitorando nenhum jogo. Clique no ícone de olho em qualquer oferta para adicioná-la aqui.' 
                        : 'Não encontramos nenhuma oferta que corresponda aos seus filtros atuais. Tente remover alguns filtros ou buscar por outro termo.'}
                    </p>
                    {!showMonitoredOnly && (
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedStores([]);
                          setMinPrice('');
                          setMaxPrice('');
                        }}
                        className="mt-6 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                      >
                        Limpar todos os filtros
                      </button>
                    )}
                  </div>
                )}

                {/* Infinite Scroll Observer Target */}
                {hasMore && displayedDeals.length > 0 && !showMonitoredOnly && (
                  <div ref={observerTarget} className="w-full py-12 flex justify-center items-center">
                    {isLoadingMore ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        <span className="text-sm text-zinc-500">Carregando mais ofertas...</span>
                      </div>
                    ) : (
                      <div className="h-8 w-full" />
                    )}
                  </div>
                )}
                
                {!hasMore && displayedDeals.length > 0 && !showMonitoredOnly && (
                  <div className="w-full py-12 flex justify-center">
                    <p className="text-zinc-500 font-medium">Você chegou ao fim das ofertas.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
