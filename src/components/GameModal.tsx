import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Loader2, TrendingDown, History, Star, ThumbsUp, Calendar } from 'lucide-react';
import { GameDeal } from '../types';
import { getGameDetails, GameDetails } from '../services/cheapshark';

interface GameModalProps {
  game: GameDeal;
  onClose: () => void;
  exchangeRate: number;
  availableStores: { id: string; name: string; icon: string }[];
}

export const GameModal: React.FC<GameModalProps> = ({ game, onClose, exchangeRate, availableStores }) => {
  const [details, setDetails] = useState<GameDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollYRef = useRef(0);

  // Bloqueia scroll do body — usa requestAnimationFrame para não competir com a animação
  useEffect(() => {
    scrollYRef.current = window.scrollY;

    // Agenda o lock pro próximo frame, evitando layout thrashing na abertura
    const raf = requestAnimationFrame(() => {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    });

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollYRef.current);
    };
  }, []);

  // Fetch adiado — espera a animação de abertura terminar antes de buscar dados
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const data = await getGameDetails(game.gameID);
        setDetails(data);
      } catch (err) {
        setError('Não foi possível carregar os detalhes do jogo.');
      } finally {
        setIsLoading(false);
      }
    }, 250); // aguarda ~250ms para a animação suavizar

    return () => clearTimeout(timer);
  }, [game.gameID]);

  const formatPrice = useCallback((priceUSD: string) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(priceUSD) * exchangeRate);
  }, [exchangeRate]);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
  }, []);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Backdrop — sem blur para performance */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute inset-0 bg-black/80"
          onClick={onClose}
          style={{ touchAction: 'none', willChange: 'opacity' }}
        />
        
        {/* Modal — usa só translate e opacity (GPU-accelerated) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative w-full max-w-3xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Header Image */}
          <div className="relative h-48 sm:h-64 w-full bg-black/50 flex-shrink-0">
            <img 
              src={game.imageUrl.replace(/capsule_231x87/g, 'header')} 
              alt={game.title} 
              className="w-full h-full object-cover opacity-60"
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="absolute bottom-0 left-0 p-6 w-full">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">{game.title}</h2>
              
              <div className="flex flex-wrap items-center gap-3">
                {game.metacriticScore && game.metacriticScore !== '0' && (
                  <span className="text-sm text-yellow-500/90 bg-yellow-500/10 px-2 py-1 rounded-md flex items-center gap-1.5 font-medium border border-yellow-500/20">
                    <Star size={14} className="fill-yellow-500/90" />
                    {game.metacriticScore} Metacritic
                  </span>
                )}
                {game.steamRatingPercent && game.steamRatingPercent !== '0' && (
                  <span className="text-sm text-blue-400/90 bg-blue-400/10 px-2 py-1 rounded-md flex items-center gap-1.5 font-medium border border-blue-400/20">
                    <ThumbsUp size={14} />
                    {game.steamRatingPercent}% ({game.steamRatingText})
                  </span>
                )}
                {game.releaseDate && (
                  <span className="text-sm text-zinc-300 bg-white/5 px-2 py-1 rounded-md flex items-center gap-1.5 font-medium border border-white/10">
                    <Calendar size={14} />
                    {new Date(game.releaseDate * 1000).getFullYear()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                <p className="text-zinc-400">Buscando histórico de preços...</p>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-red-400">{error}</p>
              </div>
            ) : details ? (
              <div className="space-y-8">
                {/* Cheapest Price Ever */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/20 p-2.5 rounded-lg">
                      <History className="text-emerald-400" size={24} />
                    </div>
                    <div>
                      <h4 className="text-emerald-400 font-semibold mb-0.5">Menor Preço Histórico</h4>
                      <p className="text-sm text-zinc-400">Registrado em {formatDate(details.cheapestPriceEver.date)}</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {formatPrice(details.cheapestPriceEver.price)}
                  </div>
                </div>

                {/* Current Deals */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingDown className="text-zinc-400" size={20} />
                    Ofertas Atuais
                  </h3>
                  
                  <div className="grid gap-3">
                    {details.deals.map((deal) => {
                      const store = availableStores.find(s => s.id === deal.storeID);
                      if (!store) return null;
                      
                      const savings = Math.round(parseFloat(deal.savings));
                      // Marca como melhor oferta o deal com menor preço
                      const cheapestPrice = Math.min(...details.deals.map(d => parseFloat(d.price)));
                      const isBestDeal = parseFloat(deal.price) === cheapestPrice;

                      return (
                        <a
                          key={deal.dealID}
                          href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                            isBestDeal 
                              ? 'bg-zinc-800/80 border-emerald-500/30 hover:bg-zinc-800 hover:border-emerald-500/50' 
                              : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800/80 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <img src={store.icon} alt={store.name} className="w-8 h-8 rounded-md" />
                            <div>
                              <h4 className="font-medium text-zinc-200">{store.name}</h4>
                              {isBestDeal && (
                                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-sm">
                                  Melhor Oferta
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {savings > 0 && (
                              <div className="hidden sm:flex flex-col items-end">
                                <span className="text-xs text-zinc-500 line-through">
                                  {formatPrice(deal.retailPrice)}
                                </span>
                                <span className="text-xs font-bold text-[#a3d955]">
                                  -{savings}%
                                </span>
                              </div>
                            )}
                            <div className="text-lg font-bold text-white w-24 text-right">
                              {formatPrice(deal.price)}
                            </div>
                            <ExternalLink size={16} className="text-zinc-500 hidden sm:block" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
