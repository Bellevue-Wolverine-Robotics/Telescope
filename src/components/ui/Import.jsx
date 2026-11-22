import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';
import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import { useEffect, useRef, useState } from 'react';
import { receiveFountain } from '../../lib/fountain';
import { decompress } from '../../lib/compression';

// Load the QR decoder from the app's own files instead of the default CDN, so the service worker
// caches it and QR import works offline
prepareZXingModule({
  overrides: {
    locateFile: (path, prefix) => (path.endsWith('.wasm') ? zxingWasmUrl : prefix + path),
  },
});

// Reads an export's QR codes with the camera. Calls onImport(text, transfer) once the export is
// fully received, where transfer is { bytes, seconds } for the transfer rate summary.
function Import({ onImport }) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const [progress, setProgress] = useState(0); // fraction of the export received, 0 to 1

  // Keep the latest onImport in a ref, so the scanner calls the current one without
  // restarting the camera each time the parent re-renders with a new function
  const onImportRef = useRef(onImport);
  useEffect(() => { onImportRef.current = onImport; });

  useEffect(() => {
    const receiveDroplet = receiveFountain();
    const video = videoRef.current;
    const overlay = overlayRef.current;
    const overlayCtx = overlay.getContext('2d');
    const canvas = new OffscreenCanvas(0, 0);
    // Pixels are read back on every frame; this keeps the canvas in CPU memory so that's fast
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    // Scan only when the camera delivers a new frame. requestAnimationFrame runs at the display's
    // refresh rate, faster than the camera, so it would rescan frames it had already seen.
    const watchFrames = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
    let frameRequest;
    let stopped = false;      // set on close; the camera may still be starting
    let imported = false;     // the decoder keeps returning the result; only import it once
    let firstReadTime = null; // for the transfer rate

    const scheduleScan = () => {
      if (stopped) return;
      frameRequest = watchFrames ? video.requestVideoFrameCallback(scan) : requestAnimationFrame(scan);
    };

    const scan = async () => {
      if (stopped) return;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return scheduleScan();

      // Match the canvas to the raw video size and the overlay to the displayed size.
      // Only on change: resizing a canvas reallocates and clears it.
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const rect = video.getBoundingClientRect();
      if (overlay.width !== Math.trunc(rect.width) || overlay.height !== Math.trunc(rect.height)) {
        overlay.width = rect.width;
        overlay.height = rect.height;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const [code] = await readBarcodes(ctx.getImageData(0, 0, canvas.width, canvas.height), {
        // The exported codes are large, sharp and on a bright screen, so skip the slower,
        // more thorough search; a code missed on one frame is caught on the next
        tryHarder: false,
        formats: ['QRCode'],
        maxNumberOfSymbols: 1,
      });
      if (stopped) return;

      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

      // Skip QR codes too short to be a droplet (e.g. an unrelated QR code in view)
      if (code && code.bytes.length > 8) {
        firstReadTime ??= performance.now();
        const result = receiveDroplet(code.bytes);
        const { rank, total } = receiveDroplet.progress();
        setProgress(total ? rank / total : 1);

        // Outline the code, scaled from video pixels to the displayed size
        const { topLeft, topRight, bottomRight, bottomLeft } = code.position;
        const scaleX = rect.width / video.videoWidth;
        const scaleY = rect.height / video.videoHeight;
        overlayCtx.strokeStyle = '#00FF00';
        overlayCtx.lineWidth = 2;
        overlayCtx.beginPath();
        for (const { x, y } of [topLeft, topRight, bottomRight, bottomLeft]) overlayCtx.lineTo(x * scaleX, y * scaleY);
        overlayCtx.closePath();
        overlayCtx.stroke();

        if (result && !imported) {
          imported = true;
          // Time from the first read to the read that completed the export
          const seconds = (performance.now() - firstReadTime) / 1000;
          // Exports from before compression are plain JSON; anything that fails to
          // decompress is passed on as is, so the import reports it as invalid
          const isPlainJSON = result.startsWith('[') || result.startsWith('{');
          (isPlainJSON ? Promise.resolve(result) : decompress(result))
            .catch(() => result)
            .then(text => {
              if (stopped) return;
              // The rate is reported for the uncompressed data, i.e. how fast records actually arrive
              onImportRef.current(text, { bytes: new TextEncoder().encode(text).length, seconds });
            });
        }
      }

      scheduleScan();
    };

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => {
      // Closed before the camera started: turn it straight back off.
      if (stopped) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      video.srcObject = stream;
      // play() rejects harmlessly if the modal closes while it's starting.
      video.play().catch(() => {});
      scan();
    });

    return () => {
      stopped = true;
      if (watchFrames) video.cancelVideoFrameCallback(frameRequest);
      else cancelAnimationFrame(frameRequest);
      video.srcObject?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <video ref={videoRef} playsInline className="rounded-lg w-full bg-black" />
        <canvas ref={overlayRef} className="absolute top-0 left-0 pointer-events-none w-full h-full" />
      </div>
      <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

export default Import;
