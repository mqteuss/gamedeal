import React, { useEffect, useRef } from 'react';

interface PriceChartProps {
  deals: Array<{ storeID: string; price: string; retailPrice: string }>;
  cheapestEver: { price: string; date: number };
  exchangeRate: number;
  stores: { id: string; name: string; icon: string }[];
}

export const PriceChart: React.FC<PriceChartProps> = ({ deals, cheapestEver, exchangeRate, stores }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Filter to only deals with savings > 0 and known stores, limit to top 8
    const validDeals = deals
      .filter(d => parseFloat(d.price) < parseFloat(d.retailPrice))
      .filter(d => stores.find(s => s.id === d.storeID))
      .slice(0, 8);

    if (validDeals.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Data
    const retailPrice = parseFloat(validDeals[0].retailPrice) * exchangeRate;
    const cheapestEverBRL = parseFloat(cheapestEver.price) * exchangeRate;
    const prices = validDeals.map(d => parseFloat(d.price) * exchangeRate);
    const maxPrice = retailPrice;
    const minPrice = 0;

    // Layout
    const padding = { top: 30, right: 15, bottom: 50, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barWidth = Math.min(32, (chartW / validDeals.length) * 0.6);
    const gap = chartW / validDeals.length;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Format BRL
    const fmt = (v: number) => `R$ ${v.toFixed(0)}`;

    // Y axis grid lines
    const ySteps = 4;
    ctx.font = '11px system-ui, sans-serif';
    for (let i = 0; i <= ySteps; i++) {
      const val = minPrice + (maxPrice - minPrice) * (i / ySteps);
      const y = padding.top + chartH - (chartH * (val / maxPrice));
      
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.textAlign = 'right';
      ctx.fillText(fmt(val), padding.left - 8, y + 4);
    }

    // Cheapest ever reference line
    const cheapestY = padding.top + chartH - (chartH * (cheapestEverBRL / maxPrice));
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, cheapestY);
    ctx.lineTo(width - padding.right, cheapestY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Cheapest label
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'left';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(`Menor: ${fmt(cheapestEverBRL)}`, padding.left + 4, cheapestY - 6);

    // Bars
    validDeals.forEach((deal, i) => {
      const price = prices[i];
      const x = padding.left + gap * i + (gap - barWidth) / 2;
      const barH = (price / maxPrice) * chartH;
      const y = padding.top + chartH - barH;

      // Determine if this is the best current deal
      const isBest = price === Math.min(...prices);

      // Bar gradient
      const grad = ctx.createLinearGradient(x, y, x, padding.top + chartH);
      if (isBest) {
        grad.addColorStop(0, 'rgba(52, 211, 153, 0.8)');
        grad.addColorStop(1, 'rgba(52, 211, 153, 0.2)');
      } else {
        grad.addColorStop(0, 'rgba(161, 161, 170, 0.4)');
        grad.addColorStop(1, 'rgba(161, 161, 170, 0.1)');
      }
      
      // Rounded rect
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, padding.top + chartH);
      ctx.lineTo(x, padding.top + chartH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Price label on top
      ctx.fillStyle = isBest ? '#34d399' : 'rgba(255,255,255,0.5)';
      ctx.font = isBest ? 'bold 11px system-ui' : '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(fmt(price), x + barWidth / 2, y - 6);

      // Store name at bottom
      const store = stores.find(s => s.id === deal.storeID);
      if (store) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        const label = store.name.length > 8 ? store.name.slice(0, 7) + '…' : store.name;
        ctx.fillText(label, x + barWidth / 2, padding.top + chartH + 16);
      }
    });

  }, [deals, cheapestEver, exchangeRate, stores]);

  return (
    <div className="w-full">
      <canvas 
        ref={canvasRef} 
        className="w-full h-[220px]"
        style={{ display: 'block' }}
      />
    </div>
  );
};
