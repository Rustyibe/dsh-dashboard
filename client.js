/**
 * Nebula Dashboard — a Harness Web UI plugin.
 *
 * Contributes four additive surfaces under a fresh, eye-comfortable skin:
 *  - a warm-paper token layer applied through `theme.overrideTokens`, so the
 *    skin reskins the whole app and survives restarts and refreshes (the
 *    framework only persists light/dark/system, so a registered third-party
 *    theme never could);
 *  - a global status bar (`shell.bottom`) with live session/workspace counts;
 *  - a round clock pinned to the frame's top-right corner (`shell.overlay`);
 *  - a skin switcher settings row (`settings.general.item`) and a sprout brand
 *    mark (`sidebar.brand.mark`).
 *
 * All chrome uses `--dsw-alias-*` theme tokens; only artwork (soft accents)
 * carries its own hues.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-dashboard',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useMemo } = React;

    /** Locale namespace owned by this plugin. */
    const NS = 'dashboard';

    const zh = {
      'status.light': '浅色',
      'status.dark': '深色',
      'theme.fresh': '清爽护眼',
      'theme.row.title': '界面皮肤',
      'theme.row.desc': '在浅色、深色与清爽护眼皮肤之间切换，你的选择会被记住',
      'bar.sessions': '会话',
      'bar.running': '运行',
      'bar.workspaces': '工作区',
      'bar.panel': '面板',
    };

    const en = {
      'status.light': 'Light',
      'status.dark': 'Dark',
      'theme.fresh': 'Fresh',
      'theme.row.title': 'Interface skin',
      'theme.row.desc': 'Switch between light, dark, and the fresh eye-care skin — your choice is remembered',
      'bar.sessions': 'SESSIONS',
      'bar.running': 'RUNNING',
      'bar.workspaces': 'WORKSPACES',
      'bar.panel': 'PANEL',
    };

    /* ------------------------------------------------------------------ *
     * Hooks
     * ------------------------------------------------------------------ */

    /** A ticking clock value; the interval is cleared on unmount. */
    function useNow(intervalMs) {
      const [now, setNow] = useState(() => Date.now());
      useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
      }, [intervalMs]);
      return now;
    }

    /** Subscribe to an observable snapshot store with a stable source object. */
    function useSnapshot(source) {
      const [snapshot, setSnapshot] = useState(() => source.get());
      useEffect(() => {
        setSnapshot(source.get());
        return source.subscribe(() => setSnapshot(source.get()));
      }, [source]);
      return snapshot;
    }

    /* ------------------------------------------------------------------ *
     * Pure helpers
     * ------------------------------------------------------------------ */
    function pad2(value) {
      return value < 10 ? '0' + value : String(value);
    }

    /** Flatten the sessions snapshot into plain rows, newest first. */
    function collectRows(sessionSnap) {
      const byId = (sessionSnap && sessionSnap.byId) || {};
      const rows = [];
      for (const id of Object.keys(byId)) {
        const row = byId[id];
        // Subagent catalog entries carry updatedAt 0; keep durable sessions only.
        if (!row || !row.updatedAt) continue;
        rows.push(row);
      }
      rows.sort((left, right) => right.updatedAt - left.updatedAt);
      return rows;
    }
    /* ------------------------------------------------------------------ *
     * Fresh eye-care skin: token override layer + frame chrome
     * ------------------------------------------------------------------ */

    /** Skin id owned by this plugin (a layer, not a registered theme). */
    const THEME_ID = 'fresh';
    /** Override-layer source id; one layer per source, replaced on re-apply. */
    const LAYER_SOURCE = '@local/dsh-dashboard/fresh';

    /**
     * Warm-paper light token layer. The layout presenter writes these as body
     * inline variables, so they outrank the base stylesheet's `body` rules for
     * as long as the theme is active, and are removed cleanly when the user
     * switches back. Low-contrast ink on warm off-white keeps long reading
     * comfortable; the muted sage accent stays calm instead of demanding.
     */
    const FRESH_TOKENS = {
      /* surfaces: warm paper, never pure white glare */
      '--dsw-alias-bg-base': '#f7f8f5',
      '--dsw-alias-bg-layer-1': '#ffffff',
      '--dsw-alias-bg-layer-2': '#f1f4ee',
      '--dsw-alias-bg-layer-3': '#e9eee6',
      '--dsw-alias-bg-overlay': '#ffffff',
      '--dsw-alias-bg-module-platform': '#eef2ec',
      '--dsw-alias-bg-multi-select': '#eef2ec',
      '--dsw-alias-bg-skeleton': '#4a9d8f14',
      '--dsw-alias-bg-document-preview': '#f4f6f2',
      '--dsw-alias-bg-document-selection': '#4a9d8f33',
      /* masks: gentle on light surfaces */
      '--dsw-alias-bg-mask-1': '#38423d14',
      '--dsw-alias-bg-mask-2': '#38423d0d',
      '--dsw-alias-bg-mask-3': '#38423d5c',
      '--dsw-alias-bg-mask-photo': '#38423dcc',
      '--dsw-alias-bg-mask-drop': '#4a9d8f26',
      /* borders: soft sage-gray hairlines */
      '--dsw-alias-border-l1': '#e2e8e0',
      '--dsw-alias-border-l2': '#d5ddd3',
      '--dsw-alias-border-l2-darkmode-thin': '#e2e8e0',
      '--dsw-alias-border-l3': '#c6d0c4',
      '--dsw-alias-border-l4': '#b3bfb1',
      '--dsw-alias-border-inverted': '#38423d1a',
      '--dsw-alias-border-inverted2': '#38423d26',
      /* brand + links: muted sage teal */
      '--dsw-alias-brand-primary': '#4a9d8f',
      '--dsw-alias-brand-primary-new-colorprimary-new-color': '#4a9d8f',
      '--dsw-alias-brand-primary-invert': '#ffffff',
      '--dsw-alias-brand-text': '#35766c',
      '--dsw-alias-link': '#35766c',
      /* labels: soft ink, never pure black */
      '--dsw-alias-label-primary': '#38423d',
      '--dsw-alias-label-secondary': '#6d7873',
      '--dsw-alias-label-tertiary': '#8b968f',
      '--dsw-alias-label-caption': '#a3ada6',
      '--dsw-alias-label-dimmed': '#d3dad2',
      '--dsw-alias-label-primary-dimmed': '#4c564f',
      '--dsw-alias-label-primary-foreground': '#ffffff',
      '--dsw-alias-label-primary-inverted': '#ffffff',
      '--dsw-alias-label-primary-bluish': '#2c4a44',
      '--dsw-alias-label-shimmer': '#38423d33',
      '--dsw-alias-label-deep-diving': '#35766c',
      '--dsw-alias-label-deep-diving-shimmer': '#4a9d8f4d',
      '--dsw-alias-label-document-preview': '#6d7873',
      '--dsw-alias-menu-icon': '#4c564f',
      /* states: desaturated, calm */
      '--dsw-alias-state-success-primary': '#5da271',
      '--dsw-alias-state-success-secondary': '#7cc49a',
      '--dsw-alias-state-success-tertiary': '#e8f3ec',
      '--dsw-alias-state-warn-primary': '#d9a441',
      '--dsw-alias-state-warn-label': '#b5852f',
      '--dsw-alias-state-warn-secondary': '#e8c27a',
      '--dsw-alias-state-warn-tertiary': '#faf3e3',
      '--dsw-alias-state-error-primary': '#d97066',
      '--dsw-alias-state-error-secondary': '#e59a92',
      '--dsw-alias-state-idle-primary': '#c3ccc5',
      '--dsw-alias-state-business-primary': '#4a9d8f',
      '--dsw-alias-state-business-tertiary': '#e3f0ec',
      /* interactive: whisper-quiet hovers */
      '--dsw-alias-interactive-bg-hover': '#4a9d8f14',
      '--dsw-alias-interactive-bg-active': '#4a9d8f26',
      '--dsw-alias-interactive-bg-hover-solid': '#eef2ec',
      '--dsw-alias-interactive-bg-hover-accent': '#4a9d8f33',
      '--dsw-alias-interactive-bg-hover-danger': '#d9706626',
      /* buttons */
      '--dsw-alias-button-info-fill': '#4a9d8f',
      '--dsw-alias-button-info-hover': '#5db3a3',
      '--dsw-alias-button-primary-fill': '#4a9d8f',
      '--dsw-alias-button-primary-hover': '#5db3a3',
      '--dsw-alias-button-primary-dimmed': '#e3f0ec',
      '--dsw-alias-button-contrast-fill': '#38423d',
      '--dsw-alias-button-elevated-fill': '#ffffff',
      '--dsw-alias-button-floating-fill': '#ffffff',
      '--dsw-alias-button-floating-hover': '#f4f6f2',
      '--dsw-alias-button-ghost-active-fill': '#e9eee6',
      '--dsw-alias-button-ghost-active-hover': '#eef2ec',
      '--dsw-alias-button-ghost-active-border': '#b3bfb1',
      /* scrollbars */
      '--dsw-alias-scrollbar-bg-l1': '#d5ddd3',
      '--dsw-alias-scrollbar-bg-l2': '#c6d0c4',
      '--dsw-alias-scrollbar-hover-l1': '#b3bfb1',
      '--dsw-alias-scrollbar-hover-l2': '#a8b6a6',
      /* menus, tooltips, toasts */
      '--dsw-menu-surface-fill': '#fffffff2',
      '--dsw-alias-menu-group-header-fill': '#f7f8f5f0',
      '--dsw-specific-menu': '#fffffff2',
      '--dsw-alias-tooltip-bg': '#38423d',
      '--dsw-alias-tooltip-key-bg': '#ffffff26',
      '--dsw-alias-toast-bg': '#38423d',
      '--dsw-alias-toast-label': '#ffffff',
      '--dsw-specific-tip': '#eef2ec',
      /* sidebar */
      '--dsw-specific-sidebar-fill': '#f1f4ee',
      '--dsw-specific-sidebar-nav-item-active': '#e3f0ec',
      '--dsw-specific-sidebar-nav-item-hover': '#e9eee6',
      '--dsw-specific-sidebar-nav-item-active-accent': '#d3e8e2',
      /* inputs and selectors */
      '--dsw-specific-input-major': '#ffffff',
      '--dsw-specific-login-input': '#f7f8f5',
      '--dsw-specific-selector': '#eef2ec',
      /* bubbles */
      '--dsw-specific-bubble': '#e3f0ec',
      '--dsw-specific-bubble-highlight': '#c9e6de',
      /* markdown, code, turn triggers */
      '--dsw-alias-markdown-code-block': '#f4f6f2',
      '--dsw-alias-markdown-code-block-banner': '#eef2ec',
      '--dsw-alias-markdown-inline-code': '#eef2ec',
      '--dsw-alias-markdown-code-segment-selected': '#e3f0ec',
      '--dsw-alias-markdown-code-segment-unselected': '#f1f4ee',
      '--dsw-alias-markdown-tag': '#e3f0ec',
      '--dsw-alias-markdown-placeholder': '#eef2ec',
      '--dsw-alias-markdown-citation': '#e9eee6',
      '--dsw-alias-turn-trigger-bg': '#eef2ec',
      '--dsw-alias-turn-trigger-bg-hover': '#e3f0ec',
      /* diffs */
      '--dsw-alias-file-diff-added-bg': '#edf5ef',
      '--dsw-alias-file-diff-added-gutter': '#e3efe6',
      '--dsw-alias-file-diff-added-marker': '#5da271',
      '--dsw-alias-file-diff-deleted-bg': '#f9eeec',
      '--dsw-alias-file-diff-deleted-gutter': '#f5e6e3',
      '--dsw-alias-file-diff-deleted-marker': '#d97066',
      '--dsw-alias-code-diff-added': '#5da27126',
      '--dsw-alias-code-diff-deleted': '#d9706626',
      /* syntax highlighting: soft, low-saturation */
      '--shiki-foreground': '#38423d',
      '--shiki-background': '#f4f6f2',
      '--shiki-token-constant': '#35766c',
      '--shiki-token-string': '#5da271',
      '--shiki-token-comment': '#a3ada6',
      '--shiki-token-keyword': '#b06a8f',
      '--shiki-token-parameter': '#b5852f',
      '--shiki-token-function': '#6a7fb0',
      '--shiki-token-string-expression': '#5da271',
      '--shiki-token-punctuation': '#6d7873',
      '--shiki-token-link': '#35766c',
      /* misc chrome */
      '--dsw-alias-switch-thumb': '#ffffff',
      '--dsw-alias-onboarding-accent': '#4a9d8f',
      /* shape: soft rounded corners, no hard cuts */
      '--dsw-radius-xs': '6px',
      '--dsw-radius-sm': '10px',
      '--dsw-radius-md': '14px',
      '--dsw-radius-lg': '18px',
      '--dsw-radius-xl': '22px',
      '--dsw-radius-panel': '28px',
      '--dsw-elevation-stroke-color': '#e2e8e0',
      '--dsw-focus-ring-color': '#4a9d8f',
    };

    /**
     * The fresh palette as a theme-token OVERRIDE LAYER, not a registered
     * theme. The framework persists only light/dark/system, so a registered
     * third-party theme can never survive a restart; an override layer is
     * re-applied by this plugin on every activation instead, which makes the
     * skin a property of the plugin rather than of any preference. Values are
     * `{light, dark}` pairs (validateOverrides requires both); the fresh skin
     * is scheme-independent, so both modes carry the same value.
     */
    const FRESH_LAYER = Object.freeze(Object.fromEntries(
      Object.entries(FRESH_TOKENS).map(([name, value]) => [name, Object.freeze({ light: value, dark: value })]),
    ));

    /** Storage key for the skin toggle; survives restarts and refreshes. */
    const SKIN_KEY = 'dsh-dashboard:skin';
    /** Read the persisted skin choice, defaulting to the fresh skin. */
    function readSkinChoice() {
      try {
        return globalThis.localStorage && globalThis.localStorage.getItem(SKIN_KEY) === 'plain' ? 'plain' : 'fresh';
      } catch {
        return 'fresh';
      }
    }
    /** Persist the skin choice; storage failures degrade to session-only. */
    function writeSkinChoice(choice) {
      try {
        globalThis.localStorage && globalThis.localStorage.setItem(SKIN_KEY, choice);
      } catch {
        /* private mode or blocked storage: the toggle still works this session */
      }
    }

    /** Read the durable theme preference defensively. */
    function readThemePreference(theme) {
      try {
        const snap = theme.getTheme();
        return snap && typeof snap.preference === 'string' ? snap.preference : 'system';
      } catch {
        return 'system';
      }
    }

    /** Read the active theme id defensively (empty when unavailable). */
    function readThemeId(theme) {
      try {
        const snap = theme.getTheme();
        return snap && snap.active && typeof snap.active.id === 'string' ? snap.active.id : '';
      } catch {
        return '';
      }
    }

    /** Read the active central-panel id without assuming the API exists. */
    function readPanelId(layout) {
      try {
        const info = layout && layout.panelInfo;
        const snap = info && typeof info.getSnapshot === 'function' ? info.getSnapshot() : null;
        return snap && typeof snap.activePanelId === 'string' && snap.activePanelId !== '' ? snap.activePanelId : 'conversation';
      } catch {
        return 'conversation';
      }
    }

    /** Subscribe to panel selection when the layout service exposes it. */
    function usePanelId(layout) {
      const [id, setId] = useState(() => readPanelId(layout));
      useEffect(() => {
        const info = layout && layout.panelInfo;
        if (!info || typeof info.subscribe !== 'function') return;
        return info.subscribe(() => setId(readPanelId(layout)));
      }, [layout]);
      return id;
    }

    /** Full-width status bar below all three columns. */
    function GlobalStatusBar({ sessions, workspaces, layout, t }) {
      const now = useNow(1000);
      const panelId = usePanelId(layout);
      const sessionSnap = useSnapshot(useMemo(() => ({
        get: () => sessions.list.getSnapshot(),
        subscribe: (listener) => sessions.list.subscribe(listener),
      }), [sessions]));
      const workspaceSnap = useSnapshot(useMemo(() => ({
        get: () => workspaces.list.getSnapshot(),
        subscribe: (listener) => workspaces.list.subscribe(listener),
      }), [workspaces]));
      const rows = useMemo(() => collectRows(sessionSnap), [sessionSnap]);
      const running = rows.reduce((sum, row) => sum + (row.running ? 1 : 0), 0);
      const workspacesCount = ((workspaceSnap && workspaceSnap.items) || []).length;
      const date = new Date(now);
      return h('div', { className: 'dsh-bar', role: 'status', 'aria-live': 'off' },
        h('style', null, SKIN_CSS),
        h('span', { className: 'dsh-bar-brand' }, '◈ HARNESS//FRESH'),
        h('span', { className: 'dsh-bar-eq', 'aria-hidden': true }, h('i'), h('i'), h('i'), h('i'), h('i')),
        h('span', { className: 'dsh-bar-item' }, t('bar.sessions'), ' ', h('b', null, rows.length)),
        h('span', { className: 'dsh-bar-item' + (running > 0 ? ' is-live' : '') }, t('bar.running'), ' ', h('b', null, running)),
        h('span', { className: 'dsh-bar-item' }, t('bar.workspaces'), ' ', h('b', null, workspacesCount)),
        h('span', { className: 'dsh-bar-item' }, t('bar.panel'), ' ', h('b', null, panelId)),
        h('span', { className: 'dsh-bar-fill' }),
        h('span', { className: 'dsh-bar-clock' }, pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds())),
      );
    }

    /**
     * Settings row: the single skin control. `fresh` toggles the token layer
     * on; `light`/`dark` turn it off and set the framework theme (which the
     * framework persists natively). The active state follows the layer while
     * it is on, and the framework preference once it is off.
     */
    function ThemeSettingsRow({ t, theme, setTheme, subscribeTheme, skin, onSkin }) {
      const [preference, setPreference] = useState(() => readThemePreference(theme));
      const [layerOn, setLayerOn] = useState(() => skin === 'fresh');
      useEffect(() => subscribeTheme(() => setPreference(readThemePreference(theme))), [subscribeTheme, theme]);
      useEffect(() => setLayerOn(skin === 'fresh'), [skin]);
      const activeId = layerOn ? THEME_ID : (preference === 'light' || preference === 'dark' ? preference : readThemeId(theme));
      const options = [
        { id: 'light', label: t('status.light') },
        { id: 'dark', label: t('status.dark') },
        { id: THEME_ID, label: t('theme.fresh') },
      ];
      return h('div', { className: 'dsh-set-row' },
        h('style', null, SKIN_CSS),
        h('div', { className: 'dsh-set-text' },
          h('div', { className: 'dsh-set-title' }, t('theme.row.title')),
          h('div', { className: 'dsh-set-desc' }, t('theme.row.desc')),
        ),
        h('div', { className: 'dsh-set-control', role: 'group', 'aria-label': t('theme.row.title') },
          options.map((option) => h('button', {
            key: option.id,
            type: 'button',
            className: 'dsh-set-opt' + (activeId === option.id ? ' is-active' : '') + (option.id === THEME_ID ? ' is-fresh' : ''),
            'aria-pressed': activeId === option.id,
            onClick: () => {
              onSkin(option.id);
              setLayerOn(option.id === THEME_ID);
            },
          }, option.label)),
        ),
      );
    }

    /** Soft sprout emblem replacing the sidebar brand mark (size from the sidebar). */
    function FreshBrandMark({ size }) {
      const edge = size || 22;
      return h('svg', {
        width: edge, height: edge, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true, style: { display: 'block' },
      },
        h('path', { d: 'M12 21v-8.5' }),
        h('path', { d: 'M12 12.5C12 8.9 9.1 6 5.5 6 5.5 9.6 8.4 12.5 12 12.5z', fill: '#4a9d8f', fillOpacity: 0.22 }),
        h('path', { d: 'M12 10.5c0-3.6 2.9-6.5 6.5-6.5 0 3.6-2.9 6.5-6.5 6.5z', fill: '#7cc49a', fillOpacity: 0.3 }),
        h('path', { d: 'M8.5 21h7' }),
      );
    }

    /** Twelve hour ticks; the quarter marks (12/3/6/9) carry the brand accent. */
    const CLOCK_TICKS = Array.from({ length: 12 }, (_, index) => {
      const major = index % 3 === 0;
      return { major, angle: index * 30, y1: major ? 9 : 11.5, y2: major ? 17.5 : 14.5 };
    });

    /**
     * Round analog clock pinned to the frame's top-right corner. It rides the
     * click-through `shell.overlay` layer, so it floats above every column and
     * never swallows a click — the corner toggle underneath stays reachable.
     * Every hand rotates about the dial centre, so a hand at 354° and at 0°
     * draws the same line: the per-minute wrap needs no special case. The
     * second hand hard-ticks once per second (quartz feel, same cadence as the
     * status-bar clock), while minute and hour hands creep between ticks.
     * Decorative by design — the status bar keeps the readable digital time.
     */
    function RoundClock() {
      const now = useNow(1000);
      const date = new Date(now);
      const seconds = date.getSeconds();
      const minutes = date.getMinutes() + seconds / 60;
      const hours = (date.getHours() % 12) + minutes / 60;
      return h('div', { className: 'dsh-clock', 'aria-hidden': true },
        h('style', null, SKIN_CSS),
        h('div', { className: 'dsh-clock-face' },
          h('svg', { className: 'dsh-clock-svg', viewBox: '0 0 100 100' },
            CLOCK_TICKS.map((tick) => h('line', {
              key: tick.angle,
              x1: 50, y1: tick.y1, x2: 50, y2: tick.y2,
              transform: `rotate(${tick.angle} 50 50)`,
              className: 'dsh-clock-tick' + (tick.major ? ' is-major' : ''),
            })),
            h('line', { key: 'hour', className: 'dsh-clock-hand dsh-clock-hour', x1: 50, y1: 50, x2: 50, y2: 28, transform: `rotate(${hours * 30} 50 50)` }),
            h('line', { key: 'minute', className: 'dsh-clock-hand dsh-clock-minute', x1: 50, y1: 50, x2: 50, y2: 17, transform: `rotate(${minutes * 6} 50 50)` }),
            h('line', { key: 'second', className: 'dsh-clock-hand dsh-clock-second', x1: 50, y1: 57, x2: 50, y2: 13, transform: `rotate(${seconds * 6} 50 50)` }),
            h('circle', { key: 'pin', className: 'dsh-clock-pin', cx: 50, cy: 50, r: 3.6 }),
          ),
        ),
      );
    }

    /* ------------------------------------------------------------------ *
     * Styles (rendered as a React element so unmount removes them)
     * ------------------------------------------------------------------ */
    /** Global status bar, skin switcher row, and brand mark styles. */
    const SKIN_CSS = [
      '@keyframes dsh-bar-eq{0%,100%{height:22%}50%{height:100%}}',
      /* global status bar: slim, soft, sage */
      '.dsh-bar{box-sizing:border-box;width:100%;height:26px;flex:none;display:flex;align-items:center;gap:14px;padding:0 14px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,\"Liberation Mono\",monospace;font-size:10px;letter-spacing:.08em;color:var(--dsw-alias-label-secondary);background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-brand-primary) 6%,var(--dsw-alias-bg-layer-1)),var(--dsw-alias-bg-layer-1));border-top:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 25%,var(--dsw-alias-border-l1));overflow:hidden;white-space:nowrap}',
      '.dsh-bar-brand{font-weight:700;letter-spacing:.16em;color:var(--dsw-alias-brand-text)}',
      '.dsh-bar-eq{display:inline-flex;align-items:flex-end;gap:2px;height:11px;flex:none}',
      '.dsh-bar-eq i{width:2px;height:25%;border-radius:1px;background:var(--dsw-alias-brand-primary);opacity:.7;animation:dsh-bar-eq 1.6s ease-in-out infinite}',
      '.dsh-bar-eq i:nth-child(2){animation-delay:.18s}',
      '.dsh-bar-eq i:nth-child(3){animation-delay:.36s}',
      '.dsh-bar-eq i:nth-child(4){animation-delay:.54s}',
      '.dsh-bar-eq i:nth-child(5){animation-delay:.72s}',
      '.dsh-bar-item{flex:none;text-transform:uppercase;opacity:.8}',
      '.dsh-bar-item b{color:var(--dsw-alias-label-primary);font-weight:700;font-variant-numeric:tabular-nums}',
      '.dsh-bar-item.is-live{color:var(--dsw-alias-state-success-primary)}',
      '.dsh-bar-item.is-live b{color:var(--dsw-alias-state-success-primary)}',
      '.dsh-bar-fill{flex:1;min-width:8px}',
      '.dsh-bar-clock{flex:none;font-weight:700;font-variant-numeric:tabular-nums;color:var(--dsw-alias-brand-text)}',
      /* round corner clock: floats above every column, click-through */
      '.dsh-clock{position:absolute;top:44px;right:16px;z-index:1;pointer-events:none}',
      '.dsh-clock-face{box-sizing:border-box;width:54px;height:54px;border-radius:50%;corner-shape:round;background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-brand-primary) 7%,var(--dsw-alias-bg-layer-1)),var(--dsw-alias-bg-layer-1));border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 30%,var(--dsw-alias-border-l1));box-shadow:0 1px 3px color-mix(in srgb,var(--dsw-alias-label-primary) 12%,transparent)}',
      '.dsh-clock-svg{display:block;width:100%;height:100%}',
      '.dsh-clock-tick{stroke:var(--dsw-alias-label-caption);stroke-width:1.6;stroke-linecap:round}',
      '.dsh-clock-tick.is-major{stroke:var(--dsw-alias-brand-primary);stroke-width:2.8}',
      '.dsh-clock-hand{stroke:var(--dsw-alias-label-primary);stroke-width:3.4;stroke-linecap:round}',
      '.dsh-clock-hand.dsh-clock-hour{stroke-width:5}',
      '.dsh-clock-second{stroke:var(--dsw-alias-brand-primary);stroke-width:1.6}',
      '.dsh-clock-pin{fill:var(--dsw-alias-bg-layer-1);stroke:var(--dsw-alias-brand-primary);stroke-width:1.8}',
      /* settings row */
      '.dsh-set-row{width:100%;align-items:center;gap:8px;padding:16px 0;display:flex;border-bottom:.5px solid var(--dsw-alias-border-l2)}',
      '.dsh-set-text{flex-direction:column;flex:1;min-width:0;gap:4px;display:flex;padding-right:48px}',
      '.dsh-set-title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}',
      '.dsh-set-desc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}',
      '.dsh-set-control{align-items:center;gap:8px;display:inline-flex}',
      '.dsh-set-opt{appearance:none;cursor:pointer;font:inherit;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);background:0 0;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:5px 16px;transition:color .12s ease,border-color .12s ease,background .12s ease}',
      '.dsh-set-opt:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-set-opt.is-active{color:var(--dsw-alias-brand-text);border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent)}',
      '.dsh-set-opt.is-fresh{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.04em}',
      '.dsh-set-opt:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}',
      '@media (prefers-reduced-motion:reduce){.dsh-bar-eq i{animation:none!important}}',
    ].join('\n');

    /* ------------------------------------------------------------------ *
     * Plugin
     * ------------------------------------------------------------------ */

    return {
      inject: ['slots', 'locale', 'sessions', 'workspaces', 'theme', 'layout'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dashboard: dictionaries');
        const t = ctx.locale.bind(NS);
        /** Theme-change relay for the settings row's active state. */
        const subscribeTheme = (listener) => ctx.on('theme/change', listener);
        /** Theme write that never throws into a click handler. */
        const setTheme = (id) => {
          try {
            ctx.theme.setTheme(id);
          } catch (error) {
            console.error('dashboard: setTheme failed', error);
          }
        };
        /* Skin state: a token override layer owned by this activation. The
         * choice persists in storage, so the skin survives restarts and
         * refreshes without depending on the framework preference, which
         * only accepts light/dark/system. */
        let layerOff = null;
        const applyLayer = () => {
          if (layerOff !== null) return;
          try {
            layerOff = ctx.theme.overrideTokens(LAYER_SOURCE, FRESH_LAYER);
          } catch (error) {
            console.error('dashboard: fresh layer failed', error);
          }
        };
        const removeLayer = () => {
          if (layerOff === null) return;
          const off = layerOff;
          layerOff = null;
          off();
        };
        let skin = readSkinChoice();
        if (skin === 'fresh') applyLayer();
        ctx.effect(() => () => removeLayer(), 'dashboard: fresh layer lifetime');
        /** Apply a skin choice from the settings row and persist it. */
        const onSkin = (id) => {
          skin = id === THEME_ID ? 'fresh' : 'plain';
          writeSkinChoice(skin);
          if (id === THEME_ID) applyLayer();
          else {
            removeLayer();
            setTheme(id);
          }
        };
        /* Single slots elect the lowest priority; the shipped brand mark sits
         * at the default 0, so a negative priority shadows it without the
         * same-priority duplicate error. */
        ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register({
          name: 'sidebar.brand.mark',
          priority: -10,
        }, FreshBrandMark));
        ctx.slots.inject('shell.bottom', () => ctx.slots.register({
          name: 'shell.bottom',
          priority: -10,
          locale: NS,
          inject: () => ({
            sessions: ctx.sessions,
            workspaces: ctx.workspaces,
            layout: ctx.layout,
            t,
          }),
        }, GlobalStatusBar));
        /* Round corner clock: the additive `shell.overlay` seat. The layer is
         * click-through and the clock opts back out of pointer events, so the
         * corner toggle underneath stays reachable. */
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'dashboard.round-clock',
        }, RoundClock));
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
          name: 'settings.general.item',
          id: 'dashboard-skin',
          order: 30,
          locale: NS,
          inject: () => ({ t, theme: ctx.theme, setTheme, subscribeTheme, skin, onSkin }),
        }, ThemeSettingsRow));
      },
    };
  },
});
