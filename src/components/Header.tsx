import React, { useState, useEffect, useRef } from 'react';
import { Search, Gamepad2, Menu, Loader2 } from 'lucide-react';
import { getGameSuggestions, GameSuggestion } from '../services/cheapshark';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery, toggleSidebar }) => {
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }
      
      setIsLoadingSuggestions(true);
      try {
        const results = await getGameSuggestions(searchQuery, 5);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const handleSuggestionClick = (title: string) => {
    setSearchQuery(title);
    setShowSuggestions(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 pointer-events-none">
      <div className="w-full h-full bg-zinc-950/70 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-6 pointer-events-auto shadow-lg shadow-black/20">
        <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
          aria-label="Toggle filters"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex items-center gap-2 text-emerald-400">
          <Gamepad2 size={28} />
          <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
            Game<span className="text-emerald-400">Deal</span>Central
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-4">
        <div className="relative group" ref={wrapperRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2.5 border-none rounded-xl leading-5 bg-zinc-800/80 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-zinc-700/90 sm:text-sm transition-all shadow-inner shadow-black/40"
            placeholder="Buscar jogos..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {isLoadingSuggestions && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
            </div>
          )}
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
              <ul className="max-h-80 overflow-y-auto py-1">
                {suggestions.map((suggestion) => (
                  <li key={suggestion.gameID}>
                    <button
                      onClick={() => handleSuggestionClick(suggestion.external)}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-700/50 flex items-center gap-3 transition-colors"
                    >
                      {suggestion.thumb && (
                        <img 
                          src={suggestion.thumb} 
                          alt={suggestion.external} 
                          className="w-10 h-10 object-cover rounded bg-zinc-900"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{suggestion.external}</p>
                        <p className="text-xs text-emerald-400">A partir de ${suggestion.cheapest}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="hidden sm:flex items-center gap-4">
        <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
          Login
        </button>
        <button className="bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold py-2 px-4 rounded-lg transition-colors">
          Criar Conta
        </button>
      </div>
      </div>
    </header>
  );
};
