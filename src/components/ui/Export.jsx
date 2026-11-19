import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';
import { createFountain } from '../../lib/fountain';

function Export({ value, close }) {
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

    const handlePointerDown = (event) => {
      if (!canvas.current.parentElement.contains(event.target)) {
        close();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      clearInterval(interval);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [value, close]);

  return (
    <div className="h-full w-full p-4">
      <canvas className="h-full w-full object-contain [image-rendering:pixelated]" ref={canvas} />
    </div>
  );
}

export default Export;
