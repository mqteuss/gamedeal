import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GameCard } from './components/GameCard';
import { SortDropdown } from './components/SortDropdown';
import { SkeletonCard } from './components/SkeletonCard';
import { Frown, Loader2, SearchX, Ghost } from 'lucide-react';
import { getDeals, getStores, Deal, Store as ApiStore } from './services/cheapshark';
import { GameDeal } from './types';
import { get, set } from 'idb-keyval';
import { motion, AnimatePresence } from 'motion/react';
import { GameModal } from './components/GameModal';
import { AuthModal } from './components/AuthModal';
import { FeaturedCarousel } from './components/FeaturedCarousel';
import { useAppSettings } from './contexts/AppSettingsContext';

export default function App() {
  const { viewMode } = useAppSettings();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
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
  const offersObserverRef = useRef<HTMLDivElement>(null);
  const monitoredObserverRef = useRef<HTMLDivElement>(null);

  const [monitoredGames, setMonitoredGames] = useState<GameDeal[]>([]);
  const [showMonitoredOnly, setShowMonitoredOnly] = useState(false);
  const [monitoredVisibleCount, setMonitoredVisibleCount] = useState(20);

  const [selectedGame, setSelectedGame] = useState<GameDeal | null>(null);

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

  // Reset pagination when filters change (NOT when switching tabs)
  useEffect(() => {
    setPageNumber(0);
    setDeals([]);
    setHasMore(true);
    setError(null);
  }, [debouncedSearch, selectedStores, debouncedMinPrice, debouncedMaxPrice, sortBy]);

  // Reset monitored visible count when switching to monitored tab
  useEffect(() => {
    if (showMonitoredOnly) {
      setMonitoredVisibleCount(20);
    }
  }, [showMonitoredOnly]);

  // Fetch deals — NÃO depende de showMonitoredOnly para não re-triggerar ao trocar aba
  useEffect(() => {
    if (exchangeRate === 0) return;

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
  }, [pageNumber, debouncedSearch, selectedStores, debouncedMinPrice, debouncedMaxPrice, sortBy, exchangeRate]);

  // Intersection Observer para Ofertas (infinite scroll)
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPageNumber(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (offersObserverRef.current) {
      observer.observe(offersObserverRef.current);
    }
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore]);

  // Intersection Observer para Monitorados (infinite scroll)
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setMonitoredVisibleCount(prev => prev + 20);
        }
      },
      { threshold: 0.1 }
    );

    if (monitoredObserverRef.current) {
      observer.observe(monitoredObserverRef.current);
    }
    return () => observer.disconnect();
  }, [monitoredVisibleCount, monitoredGames.length]);

  const availableStores = useMemo(() => {
    return apiStores
      .filter(s => s.isActive === 1)
      .map(s => ({ 
        id: s.storeID, 
        name: s.storeName,
        icon: `https://www.cheapshark.com${s.images.icon}`
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [apiStores]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Gesto de swipe para abrir/fechar sidebar no mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Ignora se não for um swipe horizontal bem definido (2x mais horizontal que vertical)
      if (Math.abs(deltaX) < Math.abs(deltaY) * 2) {
        touchStartRef.current = null;
        return;
      }

      const SWIPE_THRESHOLD = 80;

      // Swipe para a direita de qualquer lugar → abrir
      if (!isSidebarOpen && deltaX > SWIPE_THRESHOLD) {
        setIsSidebarOpen(true);
      }

      // Swipe para a esquerda → fechar
      if (isSidebarOpen && deltaX < -SWIPE_THRESHOLD) {
        setIsSidebarOpen(false);
      }

      touchStartRef.current = null;
    };

    // Só adiciona no mobile
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    if (mediaQuery.matches) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSidebarOpen]);

  // Memoiza a conversão dos deals para GameDeal — só recalcula quando deals/stores/rate mudam
  // NUNCA depende de showMonitoredOnly, para não re-renderizar ao trocar de aba
  const offersDeals = useMemo(() => 
    deals.map(deal => {
      const storeObj = availableStores.find(s => s.id === deal.storeID);
      const optimizedThumb = deal.thumb.replace(/capsule_sm_120/g, 'capsule_231x87');
      
      return {
        id: deal.dealID,
        gameID: deal.gameID,
        title: deal.title,
        imageUrl: optimizedThumb,
        originalPrice: parseFloat(deal.normalPrice) * exchangeRate,
        discountedPrice: parseFloat(deal.salePrice) * exchangeRate,
        discountPercentage: Math.round(parseFloat(deal.savings)),
        store: storeObj ? storeObj.name : 'Desconhecida',
        storeIcon: storeObj ? storeObj.icon : '',
        platform: 'PC',
        url: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
        metacriticScore: deal.metacriticScore,
        steamRatingPercent: deal.steamRatingPercent,
        steamRatingText: deal.steamRatingText,
        steamRatingCount: deal.steamRatingCount,
        releaseDate: deal.releaseDate,
        dealRating: deal.dealRating
      };
    })
  , [deals, availableStores, exchangeRate]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        toggleSidebar={toggleSidebar}
        showMonitoredOnly={showMonitoredOnly}
        setShowMonitoredOnly={setShowMonitoredOnly}
        monitoredCount={monitoredGames.length}
        openAuthModal={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
      />
      
      {/* O main content padding pt-32 para compensar o header maior */}
      <div className="flex pt-28 min-h-screen">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <div 
          className={`fixed inset-y-0 left-0 z-40 pt-28 w-[75vw] sm:w-[50vw] md:w-64 h-full bg-zinc-950/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-r border-white/5 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
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

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 md:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {showMonitoredOnly 
                    ? 'Jogos Monitorados' 
                    : debouncedSearch 
                      ? `Resultados para "${debouncedSearch}"` 
                      : 'Destaques'}
                </h2>
              </div>
              
              {!showMonitoredOnly && (
                <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                  <SortDropdown 
                    value={sortBy}
                    onChange={(val) => setSortBy(val as any)}
                    options={[
                      { value: "Deal Rating", label: "Relevância" },
                      { value: "Price", label: "Menor Preço" },
                      { value: "Savings", label: "Maior Desconto" },
                      { value: "Metacritic", label: "Nota Metacritic" },
                      { value: "Reviews", label: "Avaliações Steam" },
                      { value: "Recent", label: "Mais Recentes" },
                      { value: "Release", label: "Data de Lançamento" },
                      { value: "Title", label: "Ordem Alfabética" }
                    ]}
                  />
                  <span className="text-zinc-400 text-sm font-medium bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800 ml-auto sm:ml-0">
                    {deals.length} {deals.length === 1 ? 'jogo' : 'jogos'}
                  </span>
                </div>
              )}
            </div>

            {/* ----- ABA OFERTAS ----- */}
            <div className={`transition-opacity duration-200 ${showMonitoredOnly ? 'hidden' : 'block'}`}>
              {/* Carrossel de destaques */}
              {!isLoading && offersDeals.length > 0 && !debouncedSearch && (
                <FeaturedCarousel deals={offersDeals} onDealClick={setSelectedGame} />
              )}

              {isLoading && pageNumber === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={`sk-${i}`} className="hidden sm:block">
                      <SkeletonCard layout="vertical" />
                    </div>
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`sk-m-${i}`} className="block sm:hidden">
                      <SkeletonCard layout="horizontal" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                  <div className="bg-red-500/10 p-8 rounded-full mb-8 border border-red-500/20 shadow-2xl shadow-red-500/10">
                    <Frown size={56} className="text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Ops! Algo deu errado</h3>
                  <p className="text-zinc-400 max-w-md text-lg leading-relaxed">{error}</p>
                </div>
              ) : (
                <>
                  {offersDeals.length > 0 ? (
                    <div className={viewMode === 'list' 
                      ? 'flex flex-col' 
                      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    }>
                      {offersDeals.map(deal => (
                        <div key={deal.id} className={viewMode === 'list' ? 'block' : 'hidden sm:block'}>
                          <GameCard 
                            deal={deal}
                            isMonitored={monitoredGames.some(g => g.id === deal.id)}
                            onToggleMonitor={toggleMonitor}
                            onClick={() => setSelectedGame(deal)}
                            layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
                          />
                        </div>
                      ))}
                      {viewMode === 'grid' && offersDeals.map(deal => (
                        <div key={`mobile-${deal.id}`} className="block sm:hidden">
                          <GameCard 
                            deal={deal}
                            isMonitored={monitoredGames.some(g => g.id === deal.id)}
                            onToggleMonitor={toggleMonitor}
                            onClick={() => setSelectedGame(deal)}
                            layout="horizontal"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                      <div className="bg-zinc-900/50 p-8 rounded-full mb-8 border border-white/5 shadow-2xl shadow-black/50">
                        <SearchX size={56} className="text-zinc-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">Nenhum jogo encontrado</h3>
                      <p className="text-zinc-400 max-w-md text-lg leading-relaxed">
                        Não encontramos nenhuma oferta que corresponda aos seus filtros atuais. Que tal tentar uma busca diferente?
                      </p>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedStores([]);
                          setMinPrice('');
                          setMaxPrice('');
                        }}
                        className="mt-8 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                      >
                        Limpar todos os filtros
                      </button>
                    </div>
                  )}

                  {/* Infinite Scroll - Ofertas */}
                  {hasMore && offersDeals.length > 0 && (
                    <div ref={offersObserverRef} className="w-full py-12 flex justify-center items-center">
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
                  
                  {!hasMore && offersDeals.length > 0 && (
                    <div className="w-full py-12 flex justify-center">
                      <p className="text-zinc-500 font-medium">Você chegou ao fim das ofertas.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ----- ABA MONITORADOS ----- */}
            <div className={`transition-opacity duration-200 ${showMonitoredOnly ? 'block' : 'hidden'}`}>
              {monitoredGames.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {monitoredGames.slice(0, monitoredVisibleCount).map(deal => (
                      <div key={`monitored-${deal.id}`} className="hidden sm:block">
                        <GameCard 
                          deal={deal}
                          isMonitored={true}
                          onToggleMonitor={toggleMonitor}
                          onClick={() => setSelectedGame(deal)}
                          layout="vertical"
                        />
                      </div>
                    ))}
                    {monitoredGames.slice(0, monitoredVisibleCount).map(deal => (
                      <div key={`mobile-monitored-${deal.id}`} className="block sm:hidden">
                        <GameCard 
                          deal={deal}
                          isMonitored={true}
                          onToggleMonitor={toggleMonitor}
                          onClick={() => setSelectedGame(deal)}
                          layout="horizontal"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Infinite Scroll - Monitorados */}
                  {monitoredVisibleCount < monitoredGames.length && (
                    <div ref={monitoredObserverRef} className="w-full py-12 flex justify-center items-center">
                      <div className="h-8 w-full" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                  <div className="bg-zinc-900/50 p-8 rounded-full mb-8 border border-white/5 shadow-2xl shadow-black/50">
                    <Ghost size={56} className="text-zinc-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Sua lista está vazia</h3>
                  <p className="text-zinc-400 max-w-md text-lg leading-relaxed">
                    Você ainda não está monitorando nenhum jogo. Explore as ofertas e clique no ícone de olho para adicioná-las aqui.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {selectedGame && (
        <GameModal 
          game={selectedGame} 
          onClose={() => setSelectedGame(null)} 
          exchangeRate={exchangeRate}
          availableStores={availableStores}
        />
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authModalMode} 
      />
    </div>
  );
}
