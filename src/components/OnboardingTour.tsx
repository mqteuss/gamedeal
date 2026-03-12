import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Eye, Sliders, ChevronRight } from 'lucide-react';

interface Step {
  target: string; // element ID
  title: string;
  description: string;
  icon: React.ReactNode;
  position: 'bottom' | 'top' | 'left' | 'right';
}

const steps: Step[] = [
  {
    target: 'search-input',
    title: 'Busque jogos',
    description: 'Digite o nome de qualquer jogo para encontrar as melhores ofertas.',
    icon: <Search size={20} />,
    position: 'bottom',
  },
  {
    target: 'sidebar-toggle',
    title: 'Filtre por loja e preço',
    description: 'Use os filtros na barra lateral para refinar sua busca.',
    icon: <Sliders size={20} />,
    position: 'bottom',
  },
  {
    target: 'monitored-tab',
    title: 'Monitore seus jogos',
    description: 'Clique no ícone de olho em qualquer jogo e acompanhe preços aqui.',
    icon: <Eye size={20} />,
    position: 'bottom',
  },
];

export const OnboardingTour = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const onboarded = localStorage.getItem('gdc-onboarded');
    if (!onboarded) {
      // slight delay to let DOM mount
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    
    const step = steps[currentStep];
    const el = document.getElementById(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      const pos = { top: 0, left: 0 };

      switch (step.position) {
        case 'bottom':
          pos.top = rect.bottom + 12;
          pos.left = Math.max(16, Math.min(rect.left, window.innerWidth - 340));
          break;
        case 'top':
          pos.top = rect.top - 180;
          pos.left = Math.max(16, Math.min(rect.left, window.innerWidth - 340));
          break;
        default:
          pos.top = rect.bottom + 12;
          pos.left = rect.left;
      }
      setPosition(pos);
    }
  }, [currentStep, show]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('gdc-onboarded', 'true');
  };

  if (!show) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-[90]" onClick={handleDismiss} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[95] w-[320px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-5"
          style={{ top: position.top, left: position.left }}
        >
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === currentStep ? 'w-6 bg-emerald-500' : i < currentStep ? 'w-3 bg-emerald-500/40' : 'w-3 bg-white/10'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg flex-shrink-0">
              {step.icon}
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-1">{step.title}</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">{step.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleDismiss}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Pular tour
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {currentStep < steps.length - 1 ? 'Próximo' : 'Começar!'}
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};
