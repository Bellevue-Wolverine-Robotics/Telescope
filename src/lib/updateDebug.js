// TEMPORARY: a log of service worker update events, shown in Settings, to find out why Safari
// shows the update banner when the app is already on the latest version. Remove before merging.
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'updateDebugLog';
const MAX_ENTRIES = 60;

const listeners = new Set();
let entries = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* not kept across reloads */ }
  listeners.forEach(listener => listener());
}

export function debugLog(text) {
  const time = new Date().toTimeString().slice(0, 8);
  entries = [...entries, `${time} ${text}`].slice(-MAX_ENTRIES);
  save();
}

export function clearDebugLog() {
  entries = [];
  save();
}

// Labels each worker object seen by this page (W1, W2, ...) so the log shows when two slots hold
// the same worker. Labels restart on every page load.
const ids = new WeakMap();
let nextId = 1;
function label(worker) {
  if (!worker) return '-';
  if (!ids.has(worker)) ids.set(worker, `W${nextId++}`);
  return `${ids.get(worker)}(${worker.state})`;
}

// What the browser reports for each slot, e.g. "active=W1(activated) waiting=W2(installed) ..."
export function describeWorkers(reg) {
  if (!reg) return 'no registration';
  return [
    `controller=${label(navigator.serviceWorker.controller)}`,
    `active=${label(reg.active)}`,
    `waiting=${label(reg.waiting)}`,
    `installing=${label(reg.installing)}`,
  ].join(' ');
}

export function useDebugLog() {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => entries,
  );
}

// Fetches sw.js straight from the server and logs a short hash of its contents and a few headers,
// to see whether the bytes really change between update checks (e.g. altered by a proxy).
export async function logServiceWorkerFile(when) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}sw.js`, { cache: 'no-store' });
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = [...new Uint8Array(digest).slice(0, 4)].map(b => b.toString(16).padStart(2, '0')).join('');
    const headers = ['last-modified', 'etag', 'cf-cache-status', 'content-encoding']
      .map(name => response.headers.get(name) && `${name}=${response.headers.get(name)}`)
      .filter(Boolean)
      .join(' ');
    debugLog(`${when}: sw.js ${bytes.byteLength} bytes, hash ${hash} ${headers}`);
  } catch (e) {
    debugLog(`${when}: couldn't read sw.js (${e.message})`);
  }
}

// Downloads each file the service worker stores for offline use, the way its install does, and logs
// how each one went, to find a download that fails or never finishes.
export async function logOfflineFiles() {
  try {
    const sw = await (await fetch(`${import.meta.env.BASE_URL}sw.js`, { cache: 'no-store' })).text();
    const urls = [...sw.matchAll(/url:"([^"]+)"/g)].map(m => m[1]);
    debugLog(`offline files: ${urls.length} to check`);
    for (const url of urls) {
      const start = performance.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}${url}`, { cache: 'reload', signal: controller.signal });
        const size = (await response.arrayBuffer()).byteLength;
        debugLog(`  ${url}: ${response.status}, ${size} bytes, ${Math.round(performance.now() - start)} ms`);
      } catch (e) {
        debugLog(`  ${url}: FAILED after ${Math.round(performance.now() - start)} ms (${e.name})`);
      } finally {
        clearTimeout(timeout);
      }
    }
  } catch (e) {
    debugLog(`offline files: couldn't check (${e.message})`);
  }
}
