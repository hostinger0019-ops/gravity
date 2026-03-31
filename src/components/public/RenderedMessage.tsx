"use client";
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface RenderedMessageProps {
  content: string;
  light: boolean;
  slug?: string; // Optional: for product image fetching
}

// ─── Lightbox for full-screen image viewing ───
function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {/* Image */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="ec-lightbox-img"
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          animation: 'ec-lightbox-in 0.3s ease-out forwards',
        }}
      />
      {/* Caption */}
      {alt && alt !== 'image' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <span
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: 'rgba(212,165,116,0.15)', color: '#D4A574', border: '1px solid rgba(212,165,116,0.2)' }}
          >
            {alt}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Standalone image card (for markdown images) ───
function PremiumImageCard({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) {
  return (
    <div
      className="ec-product-card group my-3 relative overflow-hidden rounded-xl cursor-pointer"
      style={{
        backgroundColor: 'rgba(30, 41, 65, 0.7)',
        border: '1px solid rgba(212, 165, 116, 0.12)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.35)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(212,165,116,0.08)';
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.12)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Image container */}
      <div className="relative overflow-hidden" style={{ maxHeight: '280px' }}>
        <img
          src={src}
          alt={alt || 'Product'}
          loading="lazy"
          className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          style={{ display: 'block' }}
        />
        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(11,17,32,0.85) 100%)' }}
        />
        {/* Hover zoom indicator */}
        <div
          className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ backgroundColor: 'rgba(212,165,116,0.85)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#0B1120" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>
      {/* Caption bar */}
      {alt && alt !== 'image' && (
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: '#D4A574', fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {alt}
          </span>
          <svg className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="#D4A574" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Product Image component (for [PRODUCT_IMAGE:name] placeholders) ───
function ProductImage({ productName, slug }: { productName: string; slug: string }) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`/api/bots/${slug}/products/images?product=${encodeURIComponent(productName)}`);
        if (res.ok) {
          const data = await res.json();
          setImages(data.images || []);
        }
      } catch (e) {
        console.error("Failed to fetch product image:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [productName, slug]);

  if (loading) {
    return (
      <div className="my-3 rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(30, 41, 65, 0.7)', border: '1px solid rgba(212, 165, 116, 0.1)' }}>
        {/* Gold shimmer skeleton */}
        <div className="ec-shimmer" style={{ width: '100%', height: '200px' }} />
        <div className="px-4 py-3">
          <div className="ec-shimmer" style={{ width: '60%', height: '14px', borderRadius: '7px' }} />
        </div>
      </div>
    );
  }

  if (images.length === 0) return null;

  return (
    <>
      <div
        className="my-3 rounded-xl overflow-hidden ec-product-entrance"
        style={{
          backgroundColor: 'rgba(30, 41, 65, 0.7)',
          border: '1px solid rgba(212, 165, 116, 0.12)',
        }}
      >
        {/* Image gallery */}
        {images.length === 1 ? (
          <div
            className="group relative overflow-hidden cursor-pointer"
            onClick={() => setLightboxSrc(images[0])}
            style={{ maxHeight: '280px' }}
          >
            <img
              src={images[0]}
              alt={productName}
              loading="lazy"
              className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              style={{ display: 'block' }}
            />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(11,17,32,0.85) 100%)' }} />
            <div className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: 'rgba(212,165,116,0.85)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#0B1120" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="overflow-hidden" style={{ maxHeight: '280px' }}>
              <div
                className="group relative cursor-pointer"
                onClick={() => setLightboxSrc(images[activeIdx])}
              >
                <img
                  src={images[activeIdx]}
                  alt={`${productName} ${activeIdx + 1}`}
                  loading="lazy"
                  className="w-full h-auto object-cover transition-all duration-500 group-hover:scale-105"
                  style={{ display: 'block' }}
                />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(11,17,32,0.85) 100%)' }} />
              </div>
            </div>
            {/* Gallery navigation dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === activeIdx ? '20px' : '8px',
                    height: '8px',
                    backgroundColor: i === activeIdx ? '#D4A574' : 'rgba(212,165,116,0.3)',
                  }}
                />
              ))}
            </div>
            {/* Prev / Next arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveIdx((prev) => (prev - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ backgroundColor: 'rgba(11,17,32,0.7)', border: '1px solid rgba(212,165,116,0.2)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="#D4A574" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={() => setActiveIdx((prev) => (prev + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ backgroundColor: 'rgba(11,17,32,0.7)', border: '1px solid rgba(212,165,116,0.2)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="#D4A574" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
          </div>
        )}

        {/* Product title bar */}
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: '#D4A574', fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {productName}
          </span>
          {images.length > 1 && (
            <span className="text-[10px] font-medium" style={{ color: 'rgba(212,165,116,0.5)' }}>
              {activeIdx + 1}/{images.length}
            </span>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} alt={productName} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
}

// Helper to clean up and normalize content inside a $$ ... $$ math block
function fixDisplayMathBlock(innerRaw: string): string {
  let s = String(innerRaw ?? '');
  // 0) Trim leading/trailing whitespace and stray punctuation at the very edges
  s = s.trim();
  s = s.replace(/^\s*[,:;]\s*/, "");
  s = s.replace(/\s*[,:;]\s*$/, "");

  // 1) If there's an env end but no corresponding begin, inject the begin for common matrix envs
  const envs = ["bmatrix", "pmatrix", "Bmatrix", "vmatrix", "Vmatrix"] as const;
  for (const env of envs) {
    const endRe = new RegExp(String.raw`\\end\{${env}\}`);
    const beginRe = new RegExp(String.raw`\\begin\{${env}\}`);
    if (endRe.test(s) && !beginRe.test(s)) {
      s = `\\begin{${env}}\n${s}`;
    }
  }

  // 2) If it looks like an align block (contains & and \\) without explicit env, wrap with aligned
  const hasEnvBegin = /\\begin\{[a-zA-Z*]+\}/.test(s);
  const hasEnvEnd = /\\end\{[a-zA-Z*]+\}/.test(s);
  if (!hasEnvBegin && !hasEnvEnd && /&/.test(s) && /\\\\/.test(s)) {
    s = `\\begin{aligned}\n${s}\n\\end{aligned}`;
  }

  // 3) Balance braces conservatively inside the display block
  const unescapedOpen = (s.match(/(?<!\\)\{/g) || []).length;
  const unescapedClose = (s.match(/(?<!\\)\}/g) || []).length;
  if (unescapedClose > unescapedOpen) {
    // remove extra closing braces from the end
    let toRemove = unescapedClose - unescapedOpen;
    let i = s.length - 1;
    const chars = s.split("");
    while (i >= 0 && toRemove > 0) {
      if (chars[i] === '}' && (i === 0 || chars[i - 1] !== '\\')) {
        chars.splice(i, 1);
        toRemove--;
      }
      i--;
    }
    s = chars.join("");
  } else if (unescapedOpen > unescapedClose) {
    s = s + "}".repeat(unescapedOpen - unescapedClose);
  }

  // Return as a proper block-level display math with surrounding newlines so remark-math treats it as display math
  return `\n$$\n${s}\n$$\n`;
}

// Simple code block renderer without copy UI
function CodeBlock({ inline, className, children }: any) {
  const code = String(children).replace(/\n$/, '');
  const langMatch = /language-([a-z0-9]+)/i.exec(className || '');
  const language = langMatch?.[1];
  if (inline) {
    return <code className="px-1 py-0.5 rounded bg-neutral-800/60 text-[13px] font-mono">{children}</code>;
  }
  return (
    <div className="group relative my-4 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-900/70">
      <div className="flex items-center justify-between px-3 py-2 text-xs bg-neutral-800/70 border-b border-neutral-700 font-medium">
        <span className="text-neutral-300">{language || 'code'}</span>
      </div>
      <pre className="overflow-x-auto text-sm leading-relaxed p-4 font-mono"><code className={className}>{code}</code></pre>
    </div>
  );
}

function hasMath(text: string): boolean {
  // Cheap check to avoid enabling math pipeline unless necessary
  return /\$\$|\$(?!\s)|\\\(|\\\)/.test(text);
}

// Normalize various math notations into standard $inline$ or $$block$$ so remark-math catches them.
function normalizeMath(raw: string): string {
  let txt = raw;
  // 0a) Escape currency dollar signs BEFORE any math processing
  // Matches $123, $99.99, $1,000 — real currency, not LaTeX
  const currencyPlaceholders: string[] = [];
  txt = txt.replace(/\$(\d[\d,]*\.?\d*)/g, (_m, amount) => {
    const i = currencyPlaceholders.push(amount) - 1;
    return `@@CURRENCY_${i}@@`;
  });
  // 0) Protect fenced code blocks and inline code from any math normalization
  type CodeFenceEntry = { lang: string; body: string };
  const codeFencePlaceholders: CodeFenceEntry[] = [];
  txt = txt.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_m, info, body) => {
    const lang = String(info || '').trim().toLowerCase();
    const entry: CodeFenceEntry = { lang, body: String(body ?? '') };
    const i = codeFencePlaceholders.push(entry) - 1;
    return `@@CODE_FENCE_${i}@@`;
  });
  const inlineCodePlaceholders: string[] = [];
  txt = txt.replace(/`([^`]+?)`/g, (_m, inner) => {
    const i = inlineCodePlaceholders.push(String(inner ?? '')) - 1;
    return `@@INLINE_CODE_${i}@@`;
  });
  // helper to balance unescaped braces in a math snippet
  const balanceBraces = (s: string): string => {
    let open = 0, close = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      const prev = i > 0 ? s[i - 1] : '';
      if (ch === '{' && prev !== '\\') open++;
      else if (ch === '}' && prev !== '\\') close++;
    }
    if (close > open) {
      // Trim extra '}' from the end preferentially
      let toTrim = close - open;
      let out = s;
      for (let i = out.length - 1; i >= 0 && toTrim > 0; i--) {
        if (out[i] === '}' && (i === 0 || out[i - 1] !== '\\')) {
          out = out.slice(0, i) + out.slice(i + 1);
          toTrim--;
        }
      }
      return out;
    } else if (open > close) {
      return s + '}'.repeat(open - close);
    }
    return s;
  };
  // Note: fenced code blocks were masked; we will restore them at the end, converting
  // only math/latex/tex fences to display math.
  // Convert \( ... \) inline delimiters to $ ... $
  txt = txt.replace(/\\\(([\s\S]+?)\\\)/g, (_m, inner) => `$${String(inner ?? '').trim()}$`);
  // Fix common LLM mistake: \left$ ... \right$ -> \left[ ... \right]
  // Allow optional whitespace between command and '$'
  // Fix common LLM mistake intended for evaluation bar at bounds:
  // e.g., "\\left$ f(x) \\right$_0^1" should be "\\left. f(x) \\right|_0^1"
  // Convert \left$ -> \left.  and \right$ -> \right|
  txt = txt.replace(/\\left\s*\$/g, '\\left.');
  txt = txt.replace(/\\right\s*\$/g, '\\right\\|');
  // Also guard against accidental inline '$' immediately after \left or \right caused by earlier markup
  txt = txt.replace(/(\\left)\s*\$/g, '$1.');
  txt = txt.replace(/(\\right)\s*\$/g, '$1\\|');
  // Convert standalone \[ ... \] to $$ ... $$
  // Use [\s\S] instead of dot-all flag for broader TS target compatibility
  txt = txt.replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => `$$${inner.trim()}$$`);
  // NOTE: We intentionally DO NOT auto-convert bare [ ... ] to inline math, because it can
  // break patterns like "\\left[ ... \\right]" by introducing a stray '$' (leading to \\left$ errors).
  // Wrap standalone LaTeX environments not already within $$ ... $$
  // 1) Temporarily mask existing $$...$$ blocks to avoid double-wrapping
  const mathPlaceholders: string[] = [];
  txt = txt.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => {
    const i = mathPlaceholders.push(String(inner)) - 1;
    return `@@MATH_BLOCK_${i}@@`;
  });
  // 2) Wrap any remaining \begin{env}...\end{env} with $$...$$
  txt = txt.replace(/\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\1\}/g, (m) => `$$${m}$$`);
  // 3) Restore placeholders
  txt = txt.replace(/@@MATH_BLOCK_(\d+)@@/g, (_m, d) => `$$${mathPlaceholders[Number(d)]}$$`);
  // 4) Balance stray/unmatched $$ to avoid KaTeX error rendering
  const dd = [...txt.matchAll(/\$\$/g)].map(m => m.index ?? -1).filter(i => i >= 0);
  if (dd.length % 2 === 1) {
    const last = dd[dd.length - 1];
    txt = txt.slice(0, last) + txt.slice(last + 2);
  }
  // Do not blindly strip trailing '$$'. We'll rely on the odd-count balance above to remove only unmatched delimiters.
  // 5) If a closing right lacks a delimiter (e.g., "\\right " or "\\right_"), coerce to evaluation bar
  txt = txt.replace(/\\right(?![\s\S])/g, '\\right\\|');
  txt = txt.replace(/\\right(\s*[_^])/g, '\\right\\|$1');

  // 6) Balance braces inside inline $...$ segments, without touching $$...$$ or escaped \$.
  {
    const chars = Array.from(txt);
    let result = '';
    let i = 0;
    while (i < chars.length) {
      const ch = chars[i];
      const prev = i > 0 ? chars[i - 1] : '';
      if (ch === '$' && prev !== '\\') {
        // If it's a $$ block start, skip; handled elsewhere
        if (i + 1 < chars.length && chars[i + 1] === '$') {
          result += '$$';
          i += 2;
          continue;
        }
        // Start of inline math; find the next unescaped '$' not part of '$$'
        let j = i + 1;
        let found = -1;
        while (j < chars.length) {
          if (chars[j] === '$' && chars[j - 1] !== '\\') {
            // ensure not a '$$'
            if (!(j + 1 < chars.length && chars[j + 1] === '$')) {
              found = j;
              break;
            }
          }
          j++;
        }
        if (found !== -1) {
          const inner = chars.slice(i + 1, found).join('');
          const balanced = balanceBraces(inner);
          result += '$' + balanced + '$';
          i = found + 1;
          continue;
        } else {
          // No closing '$' found; treat the rest as normal text
          result += ch;
          i++;
          continue;
        }
      }
      result += ch;
      i++;
    }
    txt = result;
  }
  // Heuristics inside $$ ... $$ blocks to fix common LLM omissions
  txt = txt.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => fixDisplayMathBlock(String(inner ?? '')));
  // 7) Before restoring code placeholders, convert image links and bare image URLs to inline images
  {
    // Convert [alt](url.png) -> ![alt](url.png) only when URL looks like an image
    const imgUrl = /(https?:\/\/[^\s)]+?\.(?:png|jpe?g|webp|gif)(?:\?[^\s)]*)?)/i;
    txt = txt.replace(/\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/gi, (m, alt, url) => {
      const u = String(url);
      if (imgUrl.test(u)) {
        const a = String(alt || '').trim();
        return `![${a || 'image'}](${u})`;
      }
      return m;
    });
    // Convert bare image URLs into images, preserving surrounding whitespace
    txt = txt.replace(/(^|\s)(https?:\/\/[^\s)]+?\.(?:png|jpe?g|webp|gif)(?:\?[^\s)]*)?)(?=$|\s)/gi, (_m, pre, url) => {
      const p = String(pre || ' ');
      return `${p}![image](${String(url)})`;
    });
  }
  // 8) Restore fenced and inline code placeholders
  txt = txt.replace(/@@CODE_FENCE_(\d+)@@/g, (_m, d) => {
    const idx = Number(d);
    const entry = codeFencePlaceholders[idx] || { lang: '', body: '' };
    const lang = (entry.lang || '').toLowerCase();
    const body = entry.body;
    if (lang === 'math' || lang === 'latex' || lang === 'tex') {
      return fixDisplayMathBlock(body);
    }
    // Restore as normal fenced code block
    const header = entry.lang ? entry.lang + '\n' : '\n';
    return '```' + header + body + '```';
  });
  txt = txt.replace(/@@INLINE_CODE_(\d+)@@/g, (_m, d) => '`' + (inlineCodePlaceholders[Number(d)] || '') + '`');
  // Restore currency dollar signs
  txt = txt.replace(/@@CURRENCY_(\d+)@@/g, (_m, d) => '$' + (currencyPlaceholders[Number(d)] || ''));
  return txt;
}

// Extract [PRODUCT_IMAGE:name] placeholders and split content
function extractProductImages(content: string): { parts: Array<{ type: 'text' | 'product'; content: string }>; hasProducts: boolean } {
  const regex = /\[PRODUCT_IMAGE:([^\]]+)\]/g;
  const parts: Array<{ type: 'text' | 'product'; content: string }> = [];
  let lastIndex = 0;
  let match;
  let hasProducts = false;

  while ((match = regex.exec(content)) !== null) {
    hasProducts = true;
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    // Add the product image placeholder
    parts.push({ type: 'product', content: match[1].trim() });
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return { parts, hasProducts };
}

// ─── Product Grid component (Amazon-style 2-column grid) ───
interface GridProduct { name: string; url: string; price: string }

function ProductGrid({ products }: { products: GridProduct[] }) {
  const [lightboxSrc, setLightboxSrc] = useState<{ src: string; alt: string } | null>(null);

  return (
    <>
      <div className="my-4 ec-product-entrance">
        <div className="grid grid-cols-2 gap-3">
          {products.map((product, i) => (
            <div
              key={i}
              className="group relative rounded-xl overflow-hidden cursor-pointer"
              style={{
                backgroundColor: 'rgba(30, 41, 65, 0.6)',
                border: '1px solid rgba(212, 165, 116, 0.12)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onClick={() => setLightboxSrc({ src: product.url, alt: product.name })}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.35)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.35), 0 0 15px rgba(212,165,116,0.06)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.12)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Square image container */}
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
                <img
                  src={product.url}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Vignette overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(11,17,32,0.7) 100%)' }}
                />
                {/* Expand icon on hover */}
                <div
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundColor: 'rgba(212,165,116,0.85)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="#0B1120" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
              {/* Product title + price */}
              <div className="px-3 py-2.5">
                <p className="text-[13px] font-semibold leading-tight mb-0.5" style={{ color: '#E8E0D8' }}>
                  {product.name}
                </p>
                <p className="text-[12px] font-medium" style={{ color: '#D4A574' }}>
                  {product.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc.src}
          alt={lightboxSrc.alt}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}

// Extract [PRODUCT_GRID:json] and split content
function resolveImageUrlForGrid(url: string): string {
  if (!url) return url;
  // Convert GPU image URLs to HTTPS proxy path
  const match = url.match(/^https?:\/\/[^/]+(\/images\/.+)$/);
  if (match) return `/api/img${match[1]}`;
  if (url.startsWith('/images/')) return `/api/img${url}`;
  return url;
}

function extractProductGrid(content: string): { gridProducts: GridProduct[] | null; textContent: string } {
  const regex = /\[PRODUCT_GRID:(\[[\s\S]*?\])\]/;
  const match = regex.exec(content);
  let textContent = content;
  let gridProducts: GridProduct[] | null = null;

  if (match) {
    try {
      const parsed = JSON.parse(match[1]) as GridProduct[];
      // Resolve image URLs through HTTPS proxy
      gridProducts = parsed.map(p => ({ ...p, url: resolveImageUrlForGrid(p.url) }));
      textContent = content.slice(0, match.index) + content.slice(match.index + match[0].length);
    } catch {
      // keep textContent as-is
    }
  }

  // Strip [img1], [img2.1] etc. codes from displayed text
  textContent = textContent.replace(/\[img\d+(?:\.\d+)?\]/g, "");

  return { gridProducts, textContent: textContent.trim() };
}

export const RenderedMessage = React.memo(function RenderedMessage({ content, light, slug }: RenderedMessageProps): React.ReactElement {
  // Handle empty or undefined content
  if (!content || content.trim() === '') {
    return <span className="text-gray-400 italic">...</span>;
  }

  const normalized = useMemo(() => normalizeMath(content), [content]);
  const { gridProducts, textContent: gridTextContent } = useMemo(() => extractProductGrid(normalized), [normalized]);
  const contentForMarkdown = gridProducts ? gridTextContent : normalized;
  const { parts, hasProducts } = useMemo(() => extractProductImages(contentForMarkdown), [contentForMarkdown]);

  const remarkPlugins = useMemo(() => {
    return hasMath(contentForMarkdown)
      ? [[remarkMath as any, { singleDollarTextMath: true }], remarkGfm]
      : [remarkGfm];
  }, [contentForMarkdown]);

  const rehypePlugins = useMemo(() => {
    return hasMath(contentForMarkdown)
      ? [[rehypeKatex as any, { strict: false, throwOnError: false, errorColor: 'inherit' }]]
      : [];
  }, [contentForMarkdown]);

  // Lightbox state for inline markdown images
  const [inlineLightbox, setInlineLightbox] = useState<{ src: string; alt: string } | null>(null);

  const components = useMemo(() => ({
    code: CodeBlock,
    img: ({ node, ...props }: any) => {
      if (!props.src) return null;
      return (
        <PremiumImageCard
          src={props.src}
          alt={props.alt || 'image'}
          onClick={() => setInlineLightbox({ src: props.src, alt: props.alt || 'image' })}
        />
      );
    },
    p: ({ node, ...props }: any) => <p className="mb-3" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="mb-3 list-disc list-inside space-y-1" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="mb-3 list-decimal list-inside space-y-1" {...props} />,
    li: ({ node, ...props }: any) => <li className="ml-1" {...props} />,
    h1: ({ node, ...props }: any) => <h1 className="mt-6 mb-3 text-2xl font-bold" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="mt-6 mb-3 text-xl font-semibold" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="mt-5 mb-2 text-lg font-semibold" {...props} />,
    blockquote: ({ node, ...props }: any) => <blockquote className="pl-4 border-l-4 border-neutral-500/60 italic my-3" {...props} />,
    table: ({ node, ...props }: any) => <div className="overflow-auto my-4"><table className="w-full text-sm border-collapse" {...props} /></div>,
    th: ({ node, ...props }: any) => <th className="border border-neutral-600 px-2 py-1 bg-neutral-800" {...props} />,
    td: ({ node, ...props }: any) => <td className="border border-neutral-700 px-2 py-1" {...props} />,
    a: ({ node, ...props }: any) => <a className="text-sky-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
    hr: ({ node, ...props }: any) => <hr className="my-6 border-neutral-700" {...props} />,
  }), []);

  // If we have product images and a slug, render with product image components
  if (hasProducts && slug) {
    return (
      <>
        {gridProducts && gridProducts.length > 0 && (
          <ProductGrid products={gridProducts} />
        )}
        <div className={`markdown-body text-[15px] leading-7 ${light ? 'text-gray-900' : 'text-gray-200'}`}>
          {parts.map((part, i) => {
            if (part.type === 'product') {
              return <ProductImage key={i} productName={part.content} slug={slug} />;
            }
            return (
              <ReactMarkdown
                key={i}
                skipHtml
                remarkPlugins={remarkPlugins as any}
                rehypePlugins={rehypePlugins as any}
                components={components as any}
              >
                {part.content}
              </ReactMarkdown>
            );
          })}
        </div>
        {inlineLightbox && (
          <ImageLightbox
            src={inlineLightbox.src}
            alt={inlineLightbox.alt}
            onClose={() => setInlineLightbox(null)}
          />
        )}
        <style>{`
          @keyframes ec-lightbox-in {
            from { opacity: 0; transform: scale(0.92); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes ec-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes ec-product-entrance {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ec-shimmer {
            background: linear-gradient(90deg, rgba(30,41,65,0.5) 25%, rgba(212,165,116,0.12) 50%, rgba(30,41,65,0.5) 75%);
            background-size: 200% 100%;
            animation: ec-shimmer 1.8s ease-in-out infinite;
          }
          .ec-product-entrance {
            animation: ec-product-entrance 0.5s ease-out forwards;
          }
          .ec-product-card {
            animation: ec-product-entrance 0.5s ease-out forwards;
          }
        `}</style>
      </>
    );
  }

  // Standard rendering
  return (
    <>
      {gridProducts && gridProducts.length > 0 && (
        <ProductGrid products={gridProducts} />
      )}
      <div className={`markdown-body text-[15px] leading-7 ${light ? 'text-gray-900' : 'text-gray-200'}`}>
        <ReactMarkdown
          skipHtml
          remarkPlugins={remarkPlugins as any}
          rehypePlugins={rehypePlugins as any}
          components={components as any}
        >
          {contentForMarkdown}
        </ReactMarkdown>
      </div>
      {inlineLightbox && (
        <ImageLightbox
          src={inlineLightbox.src}
          alt={inlineLightbox.alt}
          onClose={() => setInlineLightbox(null)}
        />
      )}
      <style>{`
        @keyframes ec-lightbox-in {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes ec-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes ec-product-entrance {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ec-shimmer {
          background: linear-gradient(90deg, rgba(30,41,65,0.5) 25%, rgba(212,165,116,0.12) 50%, rgba(30,41,65,0.5) 75%);
          background-size: 200% 100%;
          animation: ec-shimmer 1.8s ease-in-out infinite;
        }
        .ec-product-entrance {
          animation: ec-product-entrance 0.5s ease-out forwards;
        }
        .ec-product-card {
          animation: ec-product-entrance 0.5s ease-out forwards;
        }
      `}</style>
    </>
  );
});
