import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';
import { createFountain } from '../../lib/fountain';
import { compress } from '../../lib/compression';

// 520 bytes is the most a version 15 QR code (77x77 modules) holds at error correction level L,
// so each droplet carries 512 bytes of data after its 8 byte header
const DROPLET_LENGTH = 520;
const FRAMES_PER_SECOND = 20;

function Export({ value }) {
  const canvas = useRef(null);

  useEffect(() => {
    let interval;
    let cancelled = false;

    // Compress first: records repeat the same keys, so this cuts the number of QR codes needed
    compress(value).then(compressed => {
      if (cancelled) return;
      const createDroplet = createFountain(compressed, DROPLET_LENGTH);

      // Draw each droplet at one pixel per QR module. CSS scales the canvas up
      // to fit the available space, so nothing needs redrawing on resize.
      const generate = () => {
        QRCode.toCanvas(canvas.current, [{ data: createDroplet(), mode: 'byte' }], { errorCorrectionLevel: 'L', scale: 1 });
        // toCanvas sets a fixed pixel size inline; clear it so the CSS sizing applies
        canvas.current.style.width  = '';
        canvas.current.style.height = '';
      };

      generate();
      interval = setInterval(generate, 1000 / FRAMES_PER_SECOND);
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [value]);

  // White background so the code stays scannable in dark mode.
  return (
    <div className="w-full aspect-square rounded-lg bg-white p-2">
      <canvas className="h-full w-full object-contain [image-rendering:pixelated]" ref={canvas} />
    </div>
  );
}

export default Export;
