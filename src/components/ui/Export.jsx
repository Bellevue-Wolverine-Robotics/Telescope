import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';
import { createFountain } from '../../lib/fountain';

function Export(props) {
  const canvas = useRef(null);

  useEffect(() => {
    const createDroplet = createFountain(props.value, 512);
    let droplet;

    const generate = () => {
      droplet = createDroplet();
      const length = Math.min(canvas.current.parentElement.offsetHeight * 0.9, canvas.current.parentElement.offsetWidth * 0.9);
      QRCode.toCanvas(canvas.current, [{ data: droplet, mode: 'byte' }], { errorCorrectionLevel: 'L', width: length, height: length });
    };

    generate();
    const interval = setInterval(generate, 1000 / 12);

    const close = (event) => {
      if (!canvas.current.parentElement.contains(event.target)) {
        props.close();
      }
    };

    const resize = () => {
      const length = Math.min(window.innerHeight * 0.9, window.innerWidth * 0.9);
      QRCode.toCanvas(canvas.current, [{ data: droplet, mode: 'byte' }], { errorCorrectionLevel: 'L', width: length, height: length });
    };

    document.addEventListener('pointerdown', close);
    document.addEventListener('resize', resize);

    return () => {
      clearInterval(interval);
      document.removeEventListener('pointerdown', close);
      document.addEventListener('resize', resize);
    };
  });

  return (
    <div className="flex h-full w-full justify-center items-center">
      <canvas className="[image-rendering:pixelated]" ref={canvas} />
    </div>
  );
}

export default Export;