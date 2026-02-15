import { readBarcodes } from 'zxing-wasm/reader';
import { useEffect, useRef, useState } from 'react';
import { receiveFountain } from '../../lib/fountain';

function Import(props) {
  const videoRef = useRef(null);
  const overlay = useRef(null);
  const container = useRef(null);

  useEffect(() => {
    const receiveDroplet = receiveFountain();
    const video = videoRef.current;
    const cctx = overlay.current.getContext('2d');
    const canvas = new OffscreenCanvas(0, 0);
    const ctx = canvas.getContext('2d');
    let animationId;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }}).then(stream => {
      video.srcObject = stream;
      video.play();

      const scan = async () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          // Set canvas to raw video dimensions
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Set overlay to match displayed video size
          const rect = video.getBoundingClientRect();
          overlay.current.width = rect.width;
          overlay.current.height = rect.height;
          
          // Calculate scaling factors
          const scaleX = rect.width / video.videoWidth;
          const scaleY = rect.height / video.videoHeight;
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const codes = await readBarcodes(imageData, {
            tryHarder: true,
            formats: ['QRCode'],
            maxNumberOfSymbols: 1
          });

          cctx.clearRect(0, 0, overlay.current.width, overlay.current.height);

          if (codes.length > 0) {
            const result = receiveDroplet(codes[0].bytes);
            cctx.strokeStyle = '#00FF00';
            cctx.lineWidth = 2;
            cctx.beginPath();
            
            // Apply scaling to QR code coordinates
            cctx.moveTo(codes[0].position.bottomLeft.x * scaleX, codes[0].position.bottomLeft.y * scaleY);
            cctx.lineTo(codes[0].position.bottomRight.x * scaleX, codes[0].position.bottomRight.y * scaleY);
            cctx.lineTo(codes[0].position.topRight.x * scaleX, codes[0].position.topRight.y * scaleY);
            cctx.lineTo(codes[0].position.topLeft.x * scaleX, codes[0].position.topLeft.y * scaleY);
            cctx.lineTo(codes[0].position.bottomLeft.x * scaleX, codes[0].position.bottomLeft.y * scaleY);
            cctx.closePath();
            cctx.stroke();

            if (result) {
              props.close();
            }
          }
        }
        animationId = requestAnimationFrame(scan);
      };

      scan();
    });

    const close = (event) => {
      if (!container.current.contains(event.target)) {
        props.close();
      }
    };

    document.addEventListener('pointerdown', close);

    return () => {
      document.removeEventListener('pointerdown', close);
      cancelAnimationFrame(animationId);
      video.srcObject?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div className="flex justify-center items-center h-full p-5">
      <div ref={container} className="relative">
        <video 
          ref={videoRef}
          playsInline 
          className="rounded-lg w-full h-full"
        />
        <canvas 
          ref={overlay} 
          className="absolute top-0 left-0 pointer-events-none w-full h-full" 
        />
      </div>
    </div>
  );
}

export default Import;