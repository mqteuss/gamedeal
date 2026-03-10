import React from 'react';
import { GameDeal } from '../types';
import { Tag, Star, ThumbsUp, Eye, EyeOff } from 'lucide-react';

interface GameCardProps {
  deal: GameDeal;
  isMonitored?: boolean;
  onToggleMonitor?: (deal: GameDeal) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ deal, isMonitored = false, onToggleMonitor }) => {
  return (
    <a 
      href={deal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-stretch bg-zinc-900/40 hover:bg-zinc-800/60 overflow-hidden border-b border-white/5 transition-colors relative min-h-[6rem] sm:min-h-[7rem]"
    >
      {/* Image Section */}
      <div className="w-32 sm:w-48 flex-shrink-0 relative bg-black/20">
        <img 
          src={deal.imageUrl} 
          alt={deal.title} 
          className="w-full h-full object-contain absolute inset-0 p-1"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
        {onToggleMonitor && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleMonitor(deal);
            }}
            className={`absolute top-1 left-1 p-1.5 rounded-sm backdrop-blur-md transition-colors z-10 ${
              isMonitored 
                ? 'bg-indigo-500/80 text-white hover:bg-indigo-600' 
                : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
            }`}
            aria-label={isMonitored ? "Parar de monitorar" : "Monitorar jogo"}
            title={isMonitored ? "Parar de monitorar" : "Monitorar jogo"}
          >
            {isMonitored ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
      </div>
      
      {/* Content Section */}
      <div className="flex flex-1 p-2 sm:p-3 overflow-hidden gap-2">
        {/* Left: Title and Tags */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <h3 className="text-sm sm:text-base font-medium text-zinc-200 line-clamp-2 group-hover:text-white transition-colors mb-2">
            {deal.title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-1.5 mt-auto">
            <span className="text-[10px] sm:text-xs text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded-sm">
              {deal.platform}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
              {deal.store}
            </span>
            {deal.metacriticScore && deal.metacriticScore !== '0' && (
              <span className="text-[10px] sm:text-xs text-yellow-500/90 bg-yellow-500/10 px-1.5 py-0.5 rounded-sm flex items-center gap-1" title="Metacritic Score">
                <Star size={10} className="fill-yellow-500/90" />
                {deal.metacriticScore}
              </span>
            )}
            {deal.steamRatingPercent && deal.steamRatingPercent !== '0' && (
              <span className="text-[10px] sm:text-xs text-blue-400/90 bg-blue-400/10 px-1.5 py-0.5 rounded-sm flex items-center gap-1" title={`Steam Rating: ${deal.steamRatingText}`}>
                <ThumbsUp size={10} />
                {deal.steamRatingPercent}%
              </span>
            )}
          </div>
        </div>
        
        {/* Right: Price Info */}
        <div className="flex flex-col items-end justify-between flex-shrink-0 ml-1 sm:ml-2">
          <div className="bg-[#4c6b22] text-[#a3d955] text-xs sm:text-sm font-bold px-1.5 py-1 rounded-sm">
            -{deal.discountPercentage}%
          </div>
          
          <div className="flex flex-col items-end mt-2">
            <span className="text-[10px] sm:text-xs text-zinc-500 line-through leading-none mb-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.originalPrice)}
            </span>
            <span className="text-sm sm:text-base font-medium text-[#a3d955] leading-none">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.discountedPrice)}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
};
