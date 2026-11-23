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
