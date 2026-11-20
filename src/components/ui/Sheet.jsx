import { useEffect, useRef, useState } from 'react';

const CLOSE_DISTANCE = 100; // px dragged down that closes the sheet
const FLICK_SPEED    = 0.5; // px/ms: a quick flick down also closes it
const SLIDE_MS       = 150;

// Panel that slides up from the bottom. Close it by dragging the handle or
// header down, tapping the dimmed background, pressing Escape, or tapping the
// handle (a "Close" button for screen readers and keyboards).
// Only the handle/header area drags, so scrolling the content doesn't close it.
function Sheet({ header, full = false, onClose, children }) {
  const [offset, setOffset]     = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing]   = useState(false);
  // The sheet follows the pointer, so releasing a drag lands on the handle and
  // the browser fires a click on it. This makes the handle ignore that click.
  const wasDrag = useRef(false);

  function dismiss() {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, SLIDE_MS);
  }

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Track the drag on the window, so it keeps following the pointer after it
  // leaves the handle/header area. No pointer capture, so a tap still reaches
  // the handle button.
  function onPointerDown(e) {
    const startY = e.clientY;
    const start  = Date.now();
    let moved = false;
    wasDrag.current = false;

    function move(ev) {
      const dy = Math.max(0, ev.clientY - startY);
      if (!moved && dy > 4) { moved = true; setDragging(true); }
      if (moved) setOffset(dy);
    }

    function end(ev) {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      if (!moved) return;
      wasDrag.current = true;
      const dy    = Math.max(0, ev.clientY - startY);
      const speed = dy / Math.max(1, Date.now() - start);
      setDragging(false);
      if (dy > CLOSE_DISTANCE || (dy > 20 && speed > FLICK_SPEED)) dismiss();
      else setOffset(0);
    }

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  const transform = closing ? 'translateY(calc(100% + 1rem))' : `translateY(${offset}px)`;

  return (
    <div className={`overlay items-end ${closing ? 'overlay-out' : ''}`} onPointerDown={dismiss}>
      <div
        className={`sheet ${full ? 'sheet-full' : ''}`}
        style={{ transform, transition: dragging ? 'none' : `transform ${SLIDE_MS}ms ease-out` }}
        onPointerDown={e => e.stopPropagation()}
      >
        <div
          className="sheet-drag"
          onPointerDown={onPointerDown}
        >
          <button type="button" aria-label="Close" onClick={() => { if (!wasDrag.current) dismiss(); }} className="sheet-handle">
            <span />
          </button>
          {header}
        </div>
        {children}
      </div>
    </div>
  );
}

export default Sheet;
