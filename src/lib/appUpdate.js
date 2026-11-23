import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

// How often to look for a new version while the app stays open
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
// Set just before reloading into a new version, so the page that loads next knows it was updating
const UPDATING_KEY = 'updateAttempts';
// How many times to retry finishing an update before falling back to showing the banner
const MAX_ATTEMPTS = 2;
// Reload anyway if the new version hasn't reported taking over by then
const RELOAD_FALLBACK_MS = 5 * 1000;

const listeners = new Set();
let updateReady = false;
let registration = null;

function readAttempts() {
  try {
    const attempts = Number(sessionStorage.getItem(UPDATING_KEY)) || 0;
    sessionStorage.removeItem(UPDATING_KEY);
    return attempts;
  } catch {
    return 0;
  }
}

// Non-zero when this page was loaded by tapping Update. Only counts for the check made as the
// page loads, so a later, unrelated update still shows the banner.
let attemptsAtLoad = readAttempts();

registerSW({
  // A new version has downloaded and is waiting to take over
  onNeedRefresh() {
    // Safari can reload the page before the new version has fully taken over, so it comes back
    // still waiting. Finish the update that was just asked for instead of asking again.
    if (attemptsAtLoad > 0 && attemptsAtLoad < MAX_ATTEMPTS) {
      switchToWaitingVersion(attemptsAtLoad);
      return;
    }
    updateReady = true;
    listeners.forEach(listener => listener());
  },
  // Never reload a tab by itself: another tab may be partway through a form. Only the tab that
  // tapped Update reloads (see applyUpdate).
  onNeedReload() {},
  // The browser checks for a new version when the app is opened. Phones usually resume an app
  // without reopening it, so also check whenever it comes back on screen and every so often.
  onRegisteredSW(_url, reg) {
    // A version left waiting is reported before this runs, so the page-load check is over
    setTimeout(() => { attemptsAtLoad = 0; });
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
export function applyUpdate() {
  return switchToWaitingVersion(0);
}

async function switchToWaitingVersion(previousAttempts) {
  try {
    sessionStorage.setItem(UPDATING_KEY, String(previousAttempts + 1));
  } catch { /* storage unavailable: the update still works, just without the Safari retry */ }

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
