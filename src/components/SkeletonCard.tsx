import React from 'react';

interface SkeletonCardProps {
  layout?: 'horizontal' | 'vertical';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ layout = 'horizontal' }) => {
  if (layout === 'vertical') {
    return (
      <div className="bg-zinc-900/40 border border-white/5 rounded-md overflow-hidden flex flex-col animate-pulse">
        {/* Image skeleton */}
        <div className="w-full aspect-[460/215] bg-zinc-800/60 skeleton-shimmer" />
        
        {/* Content */}
        <div className="p-3 flex flex-col flex-1">
          {/* Title */}
          <div className="h-5 bg-zinc-800/60 rounded w-3/4 mb-2 skeleton-shimmer" />
          <div className="h-4 bg-zinc-800/40 rounded w-1/2 mb-3 skeleton-shimmer" />
          
          {/* Tags */}
          <div className="flex gap-1.5 mb-3">
            <div className="h-5 w-12 bg-zinc-800/40 rounded-sm skeleton-shimmer" />
            <div className="h-5 w-16 bg-zinc-800/40 rounded-sm skeleton-shimmer" />
          </div>
          
          {/* Ratings */}
          <div className="flex gap-3 mb-4 mt-auto">
            <div className="h-4 w-10 bg-zinc-800/30 rounded skeleton-shimmer" />
            <div className="h-4 w-12 bg-zinc-800/30 rounded skeleton-shimmer" />
          </div>
          
          {/* Bottom row */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="h-7 w-7 bg-zinc-800/40 rounded-sm skeleton-shimmer" />
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end gap-1">
                <div className="h-3 w-14 bg-zinc-800/30 rounded skeleton-shimmer" />
                <div className="h-4 w-16 bg-zinc-800/40 rounded skeleton-shimmer" />
              </div>
              <div className="h-9 w-20 bg-zinc-800/50 rounded skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Horizontal layout (mobile)
  return (
    <div className="flex items-stretch bg-zinc-900/40 overflow-hidden border-b border-white/5 min-h-[6rem] sm:min-h-[7rem] animate-pulse">
      {/* Image */}
      <div className="w-32 sm:w-48 flex-shrink-0 bg-zinc-800/60 skeleton-shimmer" />
      
      {/* Content */}
      <div className="flex flex-1 p-2 sm:p-3 overflow-hidden gap-2">
        {/* Left */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="h-4 bg-zinc-800/60 rounded w-4/5 mb-2 skeleton-shimmer" />
          <div className="h-3 bg-zinc-800/40 rounded w-3/5 mb-3 skeleton-shimmer" />
          
          <div className="flex gap-1.5 mt-auto">
            <div className="h-5 w-10 bg-zinc-800/40 rounded-sm skeleton-shimmer" />
            <div className="h-5 w-16 bg-zinc-800/40 rounded-sm skeleton-shimmer" />
          </div>
        </div>
        
        {/* Right */}
        <div className="flex flex-col items-end justify-between flex-shrink-0 ml-1 sm:ml-2">
          <div className="h-6 w-14 bg-zinc-800/50 rounded-sm skeleton-shimmer" />
          <div className="flex flex-col items-end gap-1 mt-2">
            <div className="h-3 w-12 bg-zinc-800/30 rounded skeleton-shimmer" />
            <div className="h-5 w-16 bg-zinc-800/40 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};
