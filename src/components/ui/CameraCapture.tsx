'use client';
import { useState, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Upload, X, ZapIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onCapture: (blob: Blob) => void;
  onClear: () => void;
}

export function CameraCapture({ onCapture, onClear }: Props) {
  const [stream, setStream]       = useState<MediaStream | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(s);
      setCapturing(true);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = s; }
      }, 50);
    } catch {
      toast.error('Camera access denied — please upload a photo instead');
    }
  };

  const snap = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      stopCamera();
      setPreview(URL.createObjectURL(blob));
      onCapture(blob);
    }, 'image/jpeg', 0.92);
  }, [onCapture]);

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCapturing(false);
  };

  const retake = () => {
    setPreview(null);
    onClear();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    setPreview(URL.createObjectURL(file));
    onCapture(file);
  };

  return (
    <div className="flex flex-col gap-2">

      {/* ── Live camera feed ── */}
      {capturing && (
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {/* Snap button overlaid on video */}
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={snap}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-gray-900 font-semibold text-sm shadow-lg hover:bg-gray-100 active:scale-95 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-crimson-600" />
              Capture
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Preview ── */}
      {preview && !capturing && (
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
          <img src={preview} alt="Captured" className="w-full h-full object-cover" />
          <button
            onClick={retake}
            className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/40 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
            ✓ Photo ready
          </div>
        </div>
      )}

      {/* ── Action buttons (idle state — no ugly gray box) ── */}
      {!capturing && !preview && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-medium text-sm transition-all"
          >
            <Camera className="w-4 h-4 text-gray-500" />
            Take Photo
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-medium text-sm transition-all"
          >
            <Upload className="w-4 h-4 text-gray-500" />
            Upload
          </button>
        </div>
      )}

      {/* ── Retake button after capture ── */}
      {preview && !capturing && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={retake}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium text-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retake
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium text-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload instead
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}