"use client";

import { useFormContext } from "react-hook-form";
import { useMemo, useState, useEffect } from "react";

export function IntegrationsForm() {
  const form = useFormContext<any>();
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = form.watch('slug') as string | undefined;
  const brand = form.watch('brand_color') as string | undefined;
  const theme = form.watch('theme_template') as string | undefined;
  const avatarUrl = form.watch('avatar_url') as string | undefined;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Embed settings stored in form → integrations.embed.*
  const mode = form.watch('integrations.embed.mode') || 'float';
  const position = form.watch('integrations.embed.position') || 'bottom-right';
  const widgetSize = form.watch('integrations.embed.size') || 'default';
  const bubbleIcon = form.watch('integrations.embed.icon') || '💬';
  const showPoweredBy = form.watch('integrations.embed.show_branding') ?? true;
  const autoOpen = form.watch('integrations.embed.auto_open') ?? false;
  const uiType = form.watch('integrations.embed.ui_type') || 'full';

  const sizeMap: Record<string, { w: number; h: number }> = { default: { w: 400, h: 600 }, compact: { w: 360, h: 500 }, large: { w: 440, h: 700 } };

  const embedCode = useMemo(() => {
    const attrs = [
      `data-slug="${slug || ''}"`,
      `data-mode="${mode}"`,
      theme ? `data-theme="${theme}"` : null,
      brand ? `data-brand-color="${brand}"` : null,
      position !== 'bottom-right' ? `data-position="${position}"` : null,
      autoOpen ? `data-open="true"` : null,
      avatarUrl ? `data-avatar="${avatarUrl}"` : null,
      bubbleIcon !== '💬' ? `data-icon="${bubbleIcon}"` : null,
      !showPoweredBy ? `data-hide-branding="true"` : null,
      widgetSize !== 'default' ? `data-size="${widgetSize}"` : null,
      uiType !== 'full' ? `data-ui="${uiType}"` : null,
      `defer`
    ].filter(Boolean).join('\n    ');
    const src = `${origin}/embed/widget.js`;
    if (mode === 'inline') {
      const { h } = sizeMap[widgetSize] || sizeMap.default;
      return `<div id="my-chatbot" style="width:100%;height:${h}px"></div>\n<script src="${src}"\n    ${attrs}\n    data-container="#my-chatbot"></script>`;
    }
    return `<script src="${src}"\n    ${attrs}></script>`;
  }, [slug, brand, theme, mode, origin, position, autoOpen, avatarUrl, bubbleIcon, showPoweredBy, widgetSize]);

  const previewUrl = useMemo(() => {
    if (!slug) return '';
    const p = new URLSearchParams();
    p.set('embed', '1');
    if (brand) p.set('brand', brand);
    if (uiType) p.set('ui', uiType);
    if (theme) p.set('theme', theme);
    return `${origin}/c/${slug}?${p.toString()}`;
  }, [slug, origin, brand, uiType, theme]);

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const iconOptions = ['💬', '🤖', '💡', '❓', '🎯', '⚡', '🔮', '💎'];

  return (
    <div className="space-y-6">
      {/* Third-party Integrations */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Connections</h3>
        <div className="space-y-2">
          {[
            { key: "google_drive", label: "Google Drive", icon: "📁", desc: "Sync knowledge from Drive" },
            { key: "slack", label: "Slack", icon: "💼", desc: "Get notified on new leads" },
            { key: "notion", label: "Notion", icon: "📝", desc: "Import pages as knowledge" },
          ].map((i) => (
            <label key={i.key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors cursor-pointer bg-gray-800/30">
              <input type="checkbox" {...form.register(`integrations.${i.key}`)} className="accent-indigo-500 w-4 h-4" />
              <span className="text-lg">{i.icon}</span>
              <div>
                <span className="text-sm text-gray-200 font-medium">{i.label}</span>
                <p className="text-[11px] text-gray-500">{i.desc}</p>
              </div>
              <span className="ml-auto text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">Soon</span>
            </label>
          ))}
        </div>
      </div>

      {/* ═══ Embed Widget Section ═══ */}
      <div className="border border-gray-700/50 rounded-xl overflow-hidden">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-b border-gray-700/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Embed Widget</h3>
              <p className="text-gray-400 text-[11px]">Add your chatbot to any website with one line of code</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5 bg-gray-900/30">
          {/* Chat Style */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">Chat Style</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Basic Support */}
              <button
                type="button"
                onClick={() => form.setValue('integrations.embed.ui_type', 'basic', { shouldDirty: true })}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  uiType === 'basic'
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                {uiType === 'basic' && <span className="absolute top-2 right-2 text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-medium">Active</span>}
                <div className="text-2xl mb-2">💬</div>
                <div className="text-sm font-semibold text-white">Basic Support</div>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Clean & compact. Branded header, quick replies, streaming chat. Best for customer support widgets.</p>
              </button>
              {/* Full Premium */}
              <button
                type="button"
                onClick={() => form.setValue('integrations.embed.ui_type', 'full', { shouldDirty: true })}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  uiType === 'full'
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                {uiType === 'full' && <span className="absolute top-2 right-2 text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-medium">Active</span>}
                <div className="text-2xl mb-2">🚀</div>
                <div className="text-sm font-semibold text-white">Full Premium</div>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Voice support, photo display, math rendering, conversation history. Best for advanced AI assistants.</p>
              </button>
            </div>
          </div>

          {/* Row 1: Mode + Position */}
          <div className="grid grid-cols-2 gap-4">
            {/* Widget Mode */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-2 block">Widget Mode</label>
              <div className="flex gap-1.5">
                {(['float', 'inline'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => form.setValue('integrations.embed.mode', m, { shouldDirty: true })}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      mode === m
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {m === 'float' ? '🔵 Floating' : '📐 Inline'}
                  </button>
                ))}
              </div>
            </div>

            {/* Position (only for floating) */}
            {mode === 'float' && (
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Position</label>
                <div className="flex gap-1.5">
                  {(['bottom-right', 'bottom-left'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => form.setValue('integrations.embed.position', p, { shouldDirty: true })}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        position === p
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {p === 'bottom-right' ? '↘ Right' : '↙ Left'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size (for inline) */}
            {mode === 'inline' && (
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Widget Size</label>
                <div className="flex gap-1.5">
                  {(['compact', 'default', 'large'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => form.setValue('integrations.embed.size', s, { shouldDirty: true })}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                        widgetSize === s
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Bubble Icon + Size (floating) */}
          {mode === 'float' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Bubble Icon */}
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Bubble Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {iconOptions.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => form.setValue('integrations.embed.icon', ic, { shouldDirty: true })}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                        bubbleIcon === ic
                          ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20 scale-110'
                          : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Widget Size */}
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Panel Size</label>
                <div className="flex gap-1.5">
                  {(['compact', 'default', 'large'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => form.setValue('integrations.embed.size', s, { shouldDirty: true })}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                        widgetSize === s
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Row 3: Toggles */}
          <div className="grid grid-cols-2 gap-4">
            {/* Auto-open */}
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-700/50 bg-gray-800/30 cursor-pointer hover:border-gray-600 transition-colors">
              <div>
                <span className="text-sm text-gray-200">Auto-open</span>
                <p className="text-[10px] text-gray-500">Open widget on page load</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={!!autoOpen}
                  onChange={(e) => form.setValue('integrations.embed.auto_open', e.target.checked, { shouldDirty: true })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-700 rounded-full peer-checked:bg-indigo-600 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow" />
              </div>
            </label>

            {/* Powered by */}
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-700/50 bg-gray-800/30 cursor-pointer hover:border-gray-600 transition-colors">
              <div>
                <span className="text-sm text-gray-200">Branding</span>
                <p className="text-[10px] text-gray-500">"Powered by Agent Forja"</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={!!showPoweredBy}
                  onChange={(e) => form.setValue('integrations.embed.show_branding', e.target.checked, { shouldDirty: true })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-700 rounded-full peer-checked:bg-indigo-600 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow" />
              </div>
            </label>
          </div>

          {/* Brand Color — interactive */}
          <div className="p-3 rounded-lg border border-gray-700/50 bg-gray-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-200 font-medium">Brand Color</span>
              {avatarUrl && (
                <div className="flex items-center gap-2">
                  <img src={avatarUrl} alt="avatar" className="w-6 h-6 rounded-lg border border-gray-600 object-cover" />
                  <span className="text-[10px] text-gray-500">Logo ✓</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer">
                <div className="w-10 h-10 rounded-xl border-2 border-gray-500 hover:border-gray-300 transition-colors shadow-lg" style={{ background: brand || '#6366F1' }} />
                <input
                  type="color"
                  value={brand || '#6366F1'}
                  onChange={(e) => form.setValue('brand_color', e.target.value, { shouldDirty: true })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['#3B82F6','#8B5CF6','#EC4899','#EF4444','#F59E0B','#10B981','#06B6D4','#6366F1','#F97316','#000000'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => form.setValue('brand_color', c, { shouldDirty: true })}
                    className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                      brand === c ? 'border-white scale-110 shadow-lg' : 'border-gray-700 hover:border-gray-500'
                    }`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
            <div className="text-[10px] text-gray-500 font-mono">{brand || '#6366F1'}</div>
          </div>

          {/* ═══ Embed Code ═══ */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">Embed Code</label>
            <div className="relative">
              <textarea
                readOnly
                className="w-full h-28 text-xs font-mono p-3 border border-gray-700 rounded-lg bg-gray-950 text-green-400 resize-none focus:outline-none focus:border-indigo-500"
                value={embedCode}
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`absolute top-2 right-2 text-[10px] px-2.5 py-1 rounded-md font-medium transition-all ${
                  copied
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`flex-1 text-xs px-4 py-2.5 rounded-lg font-medium transition-all ${
                showPreview
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              {showPreview ? '✕ Hide Preview' : '👁 Preview Widget'}
            </button>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-4 py-2.5 rounded-lg bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-all font-medium"
            >
              ↗ Open in Tab
            </a>
          </div>

          {/* Preview */}
          {showPreview && slug && (
            <div className="border border-gray-700 rounded-xl overflow-hidden">
              <div className="bg-gray-800/80 px-4 py-2.5 flex items-center justify-between border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[11px] text-gray-400 ml-2">
                    {mode === 'float' ? 'Floating Widget' : 'Inline Widget'} Preview
                  </span>
                </div>
                <button type="button" onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
              </div>
              <div style={{ height: mode === 'inline' ? `${(sizeMap[widgetSize] || sizeMap.default).h}px` : '600px' }}>
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="Chatbot Embed Preview"
                  allow="microphone"
                />
              </div>
            </div>
          )}
          {showPreview && !slug && (
            <div className="p-4 border border-yellow-600/30 rounded-xl bg-yellow-500/5 text-yellow-400 text-sm text-center">
              ⚠ Save the chatbot with a slug first to preview the embed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
