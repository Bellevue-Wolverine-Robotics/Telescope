import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';
import { createFountain } from '../../lib/fountain';

function Export({ value }) {
  const canvas = useRef(null);

  useEffect(() => {
    const createDroplet = createFountain(value, 512);

    // Draw each droplet at one pixel per QR module. CSS scales the canvas up
    // to fit the available space, so nothing needs redrawing on resize.
    const generate = () => {
      QRCode.toCanvas(canvas.current, [{ data: createDroplet(), mode: 'byte' }], { errorCorrectionLevel: 'L', scale: 1 });
      // toCanvas sets a fixed pixel size inline; clear it so the CSS sizing applies
      canvas.current.style.width  = '';
      canvas.current.style.height = '';
    };

    generate();
    const interval = setInterval(generate, 1000 / 12);
    return () => clearInterval(interval);
  }, [value]);

  // White background so the code stays scannable in dark mode.
  return (
    <div className="w-full aspect-square rounded-lg bg-white p-2">
      <canvas className="h-full w-full object-contain [image-rendering:pixelated]" ref={canvas} />
    </div>
  );
}

export default Export;
