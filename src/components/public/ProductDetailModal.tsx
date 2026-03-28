'use client';
import React, { useState, useEffect, useCallback } from 'react';

export interface ProductDetail {
  name: string;
  url: string;        // main image
  price?: string;
  product_id?: number;
  rating?: number;
  stock_status?: string;
  description?: string;
  category?: string;
  brand?: string;
  product_url?: string;
  image_urls?: string[];
}

interface ProductDetailModalProps {
  product: ProductDetail | null;
  onClose: () => void;
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const [activeImg, setActiveImg] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  // All images: main + variants
  const allImages = product
    ? [product.url, ...(product.image_urls || [])].filter(Boolean)
    : [];

  // Reset state on product change
  useEffect(() => {
    setActiveImg(0);
    setImgLoaded(false);
    setDescExpanded(false);
  }, [product]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && allImages.length > 1) setActiveImg(i => (i - 1 + allImages.length) % allImages.length);
      if (e.key === 'ArrowRight' && allImages.length > 1) setActiveImg(i => (i + 1) % allImages.length);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, allImages.length]);

  // Prevent body scroll
  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [product]);

  if (!product) return null;

  const stockLabel = product.stock_status === 'in_stock' ? 'In Stock' : product.stock_status === 'out_of_stock' ? 'Out of Stock' : product.stock_status?.replace(/_/g, ' ') || 'Unknown';
  const stockColor = product.stock_status === 'in_stock' ? '#4ade80' : '#f87171';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', animation: 'pdm-fade-in 0.25s ease-out' }}
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, rgba(20,28,50,0.97) 0%, rgba(11,17,32,0.99) 100%)',
          border: '1px solid rgba(212,165,116,0.15)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 40px rgba(212,165,116,0.06)',
          animation: 'pdm-slide-up 0.3s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Hero Image Section ── */}
        <div className="relative w-full overflow-hidden flex items-center justify-center" style={{ minHeight: '200px', background: 'radial-gradient(ellipse at center, rgba(212,165,116,0.05) 0%, rgba(11,17,32,0.4) 100%)' }}>
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          )}
          <img
            src={allImages[activeImg] || product.url}
            alt={product.name}
            className="h-auto object-contain transition-opacity duration-300 block"
            style={{ maxHeight: '320px', maxWidth: '80%', opacity: imgLoaded ? 1 : 0, padding: '12px' }}
            onLoad={() => setImgLoaded(true)}
          />
          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ background: 'linear-gradient(transparent, rgba(20,28,50,0.97))' }} />

          {/* Image navigation */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => { setImgLoaded(false); setActiveImg(i => (i - 1 + allImages.length) % allImages.length); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ backgroundColor: 'rgba(11,17,32,0.7)', border: '1px solid rgba(212,165,116,0.2)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#D4A574" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => { setImgLoaded(false); setActiveImg(i => (i + 1) % allImages.length); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ backgroundColor: 'rgba(11,17,32,0.7)', border: '1px solid rgba(212,165,116,0.2)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#D4A574" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {allImages.map((_, i) => (
                  <button key={i} onClick={() => { setImgLoaded(false); setActiveImg(i); }}
                    className="rounded-full transition-all duration-300"
                    style={{ width: i === activeImg ? '18px' : '7px', height: '7px', backgroundColor: i === activeImg ? '#D4A574' : 'rgba(212,165,116,0.3)' }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className="px-5 pb-5 pt-2">
          {/* Category badge */}
          {product.category && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ backgroundColor: 'rgba(212,165,116,0.12)', color: '#D4A574', border: '1px solid rgba(212,165,116,0.15)' }}>
              {product.category}
            </span>
          )}

          {/* Title */}
          <h2 className="text-lg font-bold leading-tight mb-2" style={{ color: '#F0E8DF', fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {product.name}
          </h2>

          {/* Price + Rating row */}
          <div className="flex items-center gap-3 mb-3">
            {product.price && (
              <span className="text-xl font-bold" style={{ color: '#4ade80' }}>
                {product.price}
              </span>
            )}
            {product.rating != null && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} className="w-4 h-4" viewBox="0 0 20 20" fill={star <= Math.round(product.rating!) ? '#FBBF24' : 'rgba(255,255,255,0.15)'}>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {product.rating}/5
                </span>
              </div>
            )}
          </div>

          {/* Stock status */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stockColor }} />
            <span className="text-xs font-medium" style={{ color: stockColor }}>
              {stockLabel}
            </span>
          </div>

          {/* Divider */}
          <div className="w-full h-px mb-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,165,116,0.2), transparent)' }} />

          {/* Brand */}
          {product.brand && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Brand:</span>
              <span className="text-xs font-semibold" style={{ color: '#D4A574' }}>{product.brand}</span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-4">
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {descExpanded || product.description.length <= 150
                  ? product.description
                  : product.description.slice(0, 150) + '...'}
              </p>
              {product.description.length > 150 && (
                <button
                  onClick={() => setDescExpanded(v => !v)}
                  className="text-xs font-medium mt-1 transition-colors hover:underline"
                  style={{ color: '#D4A574' }}
                >
                  {descExpanded ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            {product.product_url && (
              <a
                href={product.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #D4A574, #B8895A)',
                  color: '#0B1120',
                  boxShadow: '0 4px 15px rgba(212,165,116,0.25)',
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Product
              </a>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pdm-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pdm-slide-up {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
