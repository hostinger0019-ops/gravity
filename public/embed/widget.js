(() => {
  try {
    if (window.__AI_CODING_TUTOR_WIDGET__) return;
    window.__AI_CODING_TUTOR_WIDGET__ = true;
    const script = document.currentScript;
    if (!script) return;

    // Helper to get dataset with both data-foo-bar and dataset.fooBar
    const ds = script.dataset || {};
    const mode = (ds.mode || 'float').toLowerCase(); // 'float' | 'inline'
    const slug = ds.slug || '';
    const theme = (ds.theme || 'auto').toLowerCase(); // 'light' | 'dark' | 'auto'
    const brandColor = ds.brandColor || ds['brandcolor'] || '#6366F1';
    const position = (ds.position || 'bottom-right').toLowerCase(); // 'bottom-right' | 'bottom-left'
    const open = String(ds.open || 'false').toLowerCase() === 'true';
    const containerSelector = ds.container || null; // for inline mode
    const base = ds.base || (new URL(script.src)).origin; // allow override via data-base
    const icon = ds.icon || '💬';
    const avatarUrl = ds.avatar || '';
    const hideBranding = String(ds.hideBranding || ds['hidebranding'] || 'false').toLowerCase() === 'true';
    const size = (ds.size || 'default').toLowerCase(); // 'compact' | 'default' | 'large'

    if (!slug) {
      console.warn('[widget] Missing data-slug attribute');
      return;
    }

    // Size presets
    const sizePresets = {
      compact: { w: 360, h: 500 },
      default: { w: 400, h: 600 },
      large: { w: 440, h: 700 },
    };
    const { w: panelW, h: panelH } = sizePresets[size] || sizePresets.default;

    // Build iframe URL for the public chatbot page
    const params = new URLSearchParams();
    params.set('embed', '1');
    if (theme) params.set('theme', theme);
    if (brandColor) params.set('brand', brandColor);
    const iframeSrc = `${base}/c/${encodeURIComponent(slug)}?${params.toString()}`;

    function makeInline() {
      const container = containerSelector ? document.querySelector(containerSelector) : null;
      if (!container) {
        console.warn('[widget] Inline mode requires valid data-container selector');
        return;
      }
      const iframe = document.createElement('iframe');
      iframe.src = iframeSrc;
      iframe.setAttribute('title', 'AI Chatbot');
      iframe.allow = 'microphone; camera; clipboard-read; clipboard-write;';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '16px';
      iframe.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
      container.appendChild(iframe);
    }

    function makeFloating() {
      // Shadow DOM to isolate styles
      const host = document.createElement('div');
      host.id = 'ai-chatbot-widget-host';
      document.body.appendChild(host);
      const root = host.attachShadow({ mode: 'open' });

      const isRight = position.includes('right');

      const style = document.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; }

        .launcher {
          position: fixed;
          ${isRight ? 'right: 20px;' : 'left: 20px;'}
          bottom: 20px;
          width: 60px;
          height: 60px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: ${brandColor};
          box-shadow: 0 4px 20px rgba(0,0,0,0.2), 0 0 0 0 ${brandColor}40;
          cursor: pointer;
          user-select: none;
          font-size: 24px;
          z-index: 2147483000;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: none;
          outline: none;
        }
        .launcher:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 28px rgba(0,0,0,0.25), 0 0 0 4px ${brandColor}20;
        }
        .launcher.open {
          transform: scale(0.9) rotate(90deg);
        }
        .launcher-avatar {
          width: 60px;
          height: 60px;
          border-radius: 9999px;
          object-fit: cover;
          border: 3px solid ${brandColor};
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .panel {
          position: fixed;
          ${isRight ? 'right: 20px;' : 'left: 20px;'}
          bottom: 92px;
          width: ${panelW}px;
          height: ${panelH}px;
          max-height: calc(100dvh - 120px);
          max-width: calc(100vw - 32px);
          background: transparent;
          border: none;
          z-index: 2147483000;
          border-radius: 20px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(16px) scale(0.96);
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .panel.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .frame {
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 20px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.08);
        }

        /* Notification dot */
        .dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ef4444;
          border: 2.5px solid white;
          animation: dotPulse 2s ease infinite;
        }
        .dot.hidden { display: none; }

        @keyframes dotPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        @media (max-width: 480px) {
          .panel {
            width: calc(100vw - 16px);
            height: calc(100dvh - 90px);
            right: 8px;
            left: 8px;
            bottom: 80px;
            border-radius: 16px;
          }
          .frame { border-radius: 16px; }
          .launcher { width: 54px; height: 54px; font-size: 22px; }
          .launcher-avatar { width: 54px; height: 54px; }
        }
      `;
      root.appendChild(style);

      // Panel
      const panel = document.createElement('div');
      panel.className = 'panel' + (open ? ' open' : '');

      const iframe = document.createElement('iframe');
      iframe.className = 'frame';
      iframe.src = iframeSrc;
      iframe.setAttribute('title', 'AI Chatbot');
      iframe.allow = 'microphone; camera; clipboard-read; clipboard-write;';
      panel.appendChild(iframe);

      // Launcher button
      const launcher = document.createElement('button');
      launcher.className = 'launcher' + (open ? ' open' : '');
      launcher.setAttribute('aria-label', 'Open chat');
      launcher.style.position = 'relative';

      // Use avatar image or icon emoji
      if (avatarUrl) {
        const img = document.createElement('img');
        img.src = avatarUrl;
        img.className = 'launcher-avatar';
        img.alt = 'Chat';
        launcher.style.background = 'transparent';
        launcher.style.boxShadow = 'none';
        launcher.style.width = 'auto';
        launcher.style.height = 'auto';
        launcher.appendChild(img);
      } else {
        launcher.innerText = icon;
      }

      // Notification dot
      const dot = document.createElement('span');
      dot.className = 'dot' + (open ? ' hidden' : '');
      launcher.appendChild(dot);

      let isOpen = open;
      launcher.addEventListener('click', () => {
        isOpen = !isOpen;
        panel.classList.toggle('open', isOpen);
        launcher.classList.toggle('open', isOpen);
        dot.classList.add('hidden');
      });

      root.appendChild(panel);
      root.appendChild(launcher);
    }

    if (mode === 'inline') {
      makeInline();
    } else {
      makeFloating();
    }
  } catch (e) {
    console.error('[widget] failed to initialize', e);
  }
})();
