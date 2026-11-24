import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

// How often to look for a new version while the app stays open
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
// Reload anyway if the new version hasn't reported taking over by then
const RELOAD_FALLBACK_MS = 5 * 1000;

const listeners = new Set();
let updateReady = false;
let registration = null;

registerSW({
  // A new version has downloaded and is waiting to take over
  onNeedRefresh() {
    updateReady = true;
    listeners.forEach(listener => listener());
  },
  // Never reload a tab by itself: another tab may be partway through a form. Only the tab that
  // tapped Refresh reloads (see applyUpdate).
  onNeedReload() {},
  // The browser checks for a new version when the app is opened. Phones usually resume an app
  // without reopening it, so also check whenever it comes back on screen and every so often.
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    registration = reg;
    const check = () => {
      if (!navigator.onLine || reg.installing) return;
      reg.update().catch(() => {});
    };
    setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  },
});

// Switches to the waiting version, then reloads once it has fully taken over. If nothing is
// waiting (it already took over, e.g. from another tab), just reloads into it.
export async function applyUpdate() {
  const reg = registration ?? await navigator.serviceWorker?.getRegistration();
  const waiting = reg?.waiting;
  if (!waiting) {
    window.location.reload();
    return;
  }

  let reloaded = false;
  const reload = () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  };
  waiting.addEventListener('statechange', () => {
    if (waiting.state === 'activated') reload();
  });
  setTimeout(reload, RELOAD_FALLBACK_MS);
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

// Whether a new version is waiting
export function useUpdateReady() {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => updateReady,
  );
}
