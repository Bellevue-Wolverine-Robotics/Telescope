import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { debugLog, describeWorkers, logServiceWorkerFile } from './updateDebug';

// How often to look for a new version while the app stays open
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
// Reload anyway if the new version hasn't reported taking over by then
const RELOAD_FALLBACK_MS = 5 * 1000;

const listeners = new Set();
let updateReady = false;
let registration = null;

debugLog(`page loaded, build ${__BUILD_NUMBER__}`);

registerSW({
  // A new version has downloaded and is waiting to take over
  async onNeedRefresh() {
    debugLog(`banner shown: ${describeWorkers(registration ?? await navigator.serviceWorker.getRegistration())}`);
    updateReady = true;
    listeners.forEach(listener => listener());
  },
  // Never reload a tab by itself: another tab may be partway through a form. Only the tab that
  // tapped Update reloads (see applyUpdate).
  onNeedReload() {},
  // The browser checks for a new version when the app is opened. Phones usually resume an app
  // without reopening it, so also check whenever it comes back on screen and every so often.
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    registration = reg;
    debugLog(`registered: ${describeWorkers(reg)}`);
    logServiceWorkerFile('at load');
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      debugLog(`update found: ${describeWorkers(reg)}`);
      logServiceWorkerFile('update found');
      worker?.addEventListener('statechange', () => debugLog(`new worker is ${worker.state}: ${describeWorkers(reg)}`));
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => debugLog(`controller changed: ${describeWorkers(reg)}`));

    const check = () => {
      if (!navigator.onLine || reg.installing) return;
      debugLog('checking for update');
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
  debugLog(`Update tapped: ${describeWorkers(reg)}`);
  if (!waiting) {
    debugLog('nothing waiting, reloading');
    window.location.reload();
    return;
  }

  let reloaded = false;
  const reload = reason => {
    if (reloaded) return;
    reloaded = true;
    debugLog(`reloading (${reason})`);
    window.location.reload();
  };
  waiting.addEventListener('statechange', () => {
    if (waiting.state === 'activated') reload('new worker activated');
  });
  setTimeout(() => reload('5s fallback'), RELOAD_FALLBACK_MS);
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
