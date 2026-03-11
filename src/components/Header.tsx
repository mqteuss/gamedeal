import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Gamepad2, Menu, Sun, Moon, LayoutGrid, List } from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  showMonitoredOnly: boolean;
  setShowMonitoredOnly: (val: boolean) => void;
  monitoredCount: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  toggleSidebar,
  showMonitoredOnly,
  setShowMonitoredOnly,
  monitoredCount
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { theme, toggleTheme, viewMode, toggleViewMode } = useAppSettings();

  // Refs para medir posição real dos botões de tab
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const ofertasRef = useRef<HTMLButtonElement>(null);
  const monitoradosRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Salvar scroll position por aba
  const scrollPositions = useRef({ ofertas: 0, monitorados: 0 });

  const updateIndicator = useCallback(() => {
    const container = tabsContainerRef.current;
    const activeBtn = showMonitoredOnly ? monitoradosRef.current : ofertasRef.current;
    if (container && activeBtn) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [showMonitoredOnly]);

  useEffect(() => { updateIndicator(); }, [updateIndicator, monitoredCount]);
  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  const handleTabSwitch = (toMonitored: boolean) => {
    if (showMonitoredOnly) {
      scrollPositions.current.monitorados = window.scrollY;
    } else {
      scrollPositions.current.ofertas = window.scrollY;
    }
    setShowMonitoredOnly(toMonitored);
    requestAnimationFrame(() => {
      const targetScroll = toMonitored 
        ? scrollPositions.current.monitorados 
        : scrollPositions.current.ofertas;
      window.scrollTo(0, targetScroll);
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 60 && currentScrollY > lastScrollY.current + 10) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY < 10) {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Header principal */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="w-full bg-zinc-950/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20">
          <div className="h-16 flex items-center justify-between px-4 md:px-6">
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
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl leading-5 bg-zinc-800/80 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-zinc-700/90 sm:text-sm transition-all"
                  placeholder="Buscar jogos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View mode toggle — hidden on mobile */}
              <button
                onClick={toggleViewMode}
                className="hidden sm:flex p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title={viewMode === 'grid' ? 'Mudar para lista' : 'Mudar para grade'}
              >
                {viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div className="hidden md:flex items-center gap-2 ml-2">
                <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Login
                </button>
                <button className="bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold py-2 px-4 rounded-lg transition-colors">
                  Criar Conta
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de tabs */}
      <div 
        className={`fixed left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-white/10 transition-all duration-300 ${
          isVisible ? 'top-16' : 'top-0'
        }`}
      >
        <div className="flex items-center justify-center w-full px-4">
          <div className="relative flex items-center gap-8" ref={tabsContainerRef}>
            <button
              ref={ofertasRef}
              onClick={() => handleTabSwitch(false)}
              className={`relative py-3 px-2 text-sm font-medium transition-colors ${
                !showMonitoredOnly ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Ofertas
            </button>

            <button
              ref={monitoradosRef}
              onClick={() => handleTabSwitch(true)}
              className={`relative py-3 px-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                showMonitoredOnly ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Monitorados
              {monitoredCount > 0 && (
                <span className="text-xs text-zinc-500">
                  ({monitoredCount})
                </span>
              )}
            </button>

            {/* Indicador ativo */}
            <div
              className="absolute bottom-0 h-0.5 bg-white rounded-t-full transition-all duration-300 ease-out"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
