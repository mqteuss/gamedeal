import React from 'react';

interface SidebarProps {
  availableStores: { id: string, name: string }[];
  selectedStores: string[];
  setSelectedStores: React.Dispatch<React.SetStateAction<string[]>>;
  minPrice: string;
  setMinPrice: React.Dispatch<React.SetStateAction<string>>;
  maxPrice: string;
  setMaxPrice: React.Dispatch<React.SetStateAction<string>>;
  minDiscount: number;
  setMinDiscount: React.Dispatch<React.SetStateAction<number>>;
  minMetacritic: number;
  setMinMetacritic: React.Dispatch<React.SetStateAction<number>>;
  minSteamRating: number;
  setMinSteamRating: React.Dispatch<React.SetStateAction<number>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  availableStores,
  selectedStores,
  setSelectedStores,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  minDiscount,
  setMinDiscount,
  minMetacritic,
  setMinMetacritic,
  minSteamRating,
  setMinSteamRating,
}) => {
  
  const toggleStore = (storeId: string) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const discountOptions = [0, 25, 50, 75, 90];
  const metacriticOptions = [0, 50, 70, 80, 90];
  const steamOptions = [0, 70, 80, 90, 95];

  return (
    <aside className="w-full md:w-64 bg-transparent p-6 flex flex-col gap-8 h-full overflow-y-auto">
      {/* Preço */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Preço (R$)</h3>
        <div className="flex items-center gap-3 bg-zinc-800/80 p-1.5 rounded-xl">
          <input
            type="number"
            placeholder="Mín"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full bg-transparent border-none rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:bg-zinc-700/80 transition-colors text-center"
            min="0"
          />
          <span className="text-zinc-400 font-medium">-</span>
          <input
            type="number"
            placeholder="Máx"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full bg-transparent border-none rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:bg-zinc-700/80 transition-colors text-center"
            min="0"
          />
        </div>
      </div>

      {/* Desconto Mínimo */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Desconto Mínimo</h3>
        <div className="flex flex-wrap gap-2">
          {discountOptions.map(val => (
            <button
              key={`d-${val}`}
              onClick={() => setMinDiscount(minDiscount === val ? 0 : val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                minDiscount === val && val > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : val === 0 && minDiscount === 0
                    ? 'bg-white/5 text-zinc-300 border border-white/10'
                    : 'bg-white/5 text-zinc-400 border border-white/5 hover:border-white/10 hover:text-zinc-300'
              }`}
            >
              {val === 0 ? 'Todos' : `>${val}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Metacritic */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Metacritic</h3>
        <div className="flex flex-wrap gap-2">
          {metacriticOptions.map(val => (
            <button
              key={`m-${val}`}
              onClick={() => setMinMetacritic(minMetacritic === val ? 0 : val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                minMetacritic === val && val > 0
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : val === 0 && minMetacritic === 0
                    ? 'bg-white/5 text-zinc-300 border border-white/10'
                    : 'bg-white/5 text-zinc-400 border border-white/5 hover:border-white/10 hover:text-zinc-300'
              }`}
            >
              {val === 0 ? 'Todos' : `>${val}`}
            </button>
          ))}
        </div>
      </div>

      {/* Steam Rating */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Steam Rating</h3>
        <div className="flex flex-wrap gap-2">
          {steamOptions.map(val => (
            <button
              key={`s-${val}`}
              onClick={() => setMinSteamRating(minSteamRating === val ? 0 : val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                minSteamRating === val && val > 0
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : val === 0 && minSteamRating === 0
                    ? 'bg-white/5 text-zinc-300 border border-white/10'
                    : 'bg-white/5 text-zinc-400 border border-white/5 hover:border-white/10 hover:text-zinc-300'
              }`}
            >
              {val === 0 ? 'Todos' : `>${val}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Lojas */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Lojas Disponíveis</h3>
        <div className="flex flex-col gap-1">
          {availableStores.map(store => (
            <div 
              key={store.id} 
              onClick={() => toggleStore(store.id)}
              className="flex items-center gap-3 cursor-pointer group py-2"
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                selectedStores.includes(store.id) 
                  ? 'bg-emerald-500 border-emerald-500' 
                  : 'border-zinc-600 group-hover:border-zinc-400 bg-zinc-800'
              }`}>
                {selectedStores.includes(store.id) && (
                  <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${selectedStores.includes(store.id) ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                {store.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
