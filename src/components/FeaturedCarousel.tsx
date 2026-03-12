import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { GameDeal } from '../types';

interface FeaturedCarouselProps {
  deals: GameDeal[];
  onDealClick: (deal: GameDeal) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ deals, onDealClick }) => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Top 6 deals by deal rating
  const featured = deals
    .filter(d => d.dealRating && parseFloat(d.dealRating) >= 7.0)
    .sort((a, b) => parseFloat(b.dealRating || '0') - parseFloat(a.dealRating || '0'))
    .slice(0, 6);

  const total = featured.length;

  const goNext = useCallback(() => {
    if (total === 0) return;
    setCurrent(prev => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    if (total === 0) return;
    setCurrent(prev => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay
  useEffect(() => {
    if (isHovered || total <= 1) return;
    intervalRef.current = setInterval(goNext, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [goNext, isHovered, total]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50) goPrev();
    else if (deltaX < -50) goNext();
  };

  if (featured.length === 0) return null;

  const deal = featured[current];
  const imageUrl = deal.imageUrl.includes('store_item_assets') 
    ? deal.imageUrl 
    : deal.imageUrl.replace(/capsule_231x87/g, 'header');

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  return (
    <div 
      className="relative w-full rounded-xl overflow-hidden mb-6 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background image with smooth cross-fade */}
      <div className="relative w-full h-48 sm:h-56 md:h-64 bg-black/30">
        {featured.map((d, i) => {
          const imgSrc = d.imageUrl.includes('store_item_assets') 
            ? d.imageUrl 
            : d.imageUrl.replace(/capsule_231x87/g, 'header');
          return (
            <img
              key={d.id}
              src={imgSrc}
              alt={d.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                i === current ? 'opacity-60' : 'opacity-0'
              }`}
              referrerPolicy="no-referrer"
              loading={i === current ? 'eager' : 'lazy'}
            />
          );
        })}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 to-transparent" />
      </div>

      {/* Content */}
      <div 
        className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 cursor-pointer"
        onClick={() => onDealClick(deal)}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-sm flex items-center gap-1 border border-orange-400/20">
            <Flame size={10} />
            Destaque
          </span>
          {deal.dealRating && (
            <span className="text-[10px] sm:text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-sm border border-emerald-400/20 font-bold">
              ★ {deal.dealRating}
            </span>
          )}
        </div>

        <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 leading-tight line-clamp-1">
          {deal.title}
        </h3>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {deal.storeIcon && <img src={deal.storeIcon} alt={deal.store} className="w-4 h-4 rounded-sm" />}
            <span className="text-xs sm:text-sm text-zinc-400">{deal.store}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-zinc-500 line-through">{formatPrice(deal.originalPrice)}</span>
            <span className="text-sm sm:text-lg font-bold text-[#a3d955]">{formatPrice(deal.discountedPrice)}</span>
            <span className="text-xs sm:text-sm font-bold text-[#a3d955] bg-[#4c6b22]/80 px-1.5 py-0.5 rounded-sm">
              -{deal.discountPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Navigation arrows — hidden on mobile */}
      {total > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white/70 hover:text-white rounded-full transition-all opacity-0 group-hover:opacity-100 hidden sm:block"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white/70 hover:text-white rounded-full transition-all opacity-0 group-hover:opacity-100 hidden sm:block"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-2 right-4 sm:right-6 flex items-center gap-1.5">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`rounded-full transition-all duration-300 ${
                i === current 
                  ? 'w-5 h-1.5 bg-white' 
                  : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
