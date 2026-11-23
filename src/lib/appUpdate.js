import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

// How often to look for a new version while the app stays open
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

const listeners = new Set();
let updateReady = false;
let updateRequested = false;

const updateServiceWorker = registerSW({
  // A new version has downloaded and is waiting to take over
  onNeedRefresh() {
    updateReady = true;
    listeners.forEach(listener => listener());
  },
  // The new version has taken over. Only the tab that tapped Update reloads, so another open tab
  // that's partway through a form isn't reloaded under it.
  onNeedReload() {
    if (updateRequested) window.location.reload();
  },
  // The browser checks for a new version when the app is opened. Phones usually resume an app
  // without reopening it, so also check whenever it comes back on screen and every so often.
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    const check = () => {
      if (!navigator.onLine || registration.installing) return;
      registration.update().catch(() => {});
    };
    setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  },
});

// Switches to the waiting version and reloads into it
export function applyUpdate() {
  updateRequested = true;
  updateServiceWorker();
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
