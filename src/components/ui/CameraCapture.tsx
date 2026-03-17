'use client';
import { useState, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Upload, X } from 'lucide-react';
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
    <div className="flex flex-col gap-3">
      {/* Viewport */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center">
        {capturing && (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}
        {preview && !capturing && (
          <img src={preview} alt="Captured" className="w-full h-full object-cover" />
        )}
        {!capturing && !preview && (
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Camera className="w-8 h-8" />
            </div>
            <p className="text-sm">Camera or upload</p>
          </div>
        )}
        {preview && (
          <button
            onClick={retake}
            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        {!capturing && !preview && (
          <button type="button" onClick={startCamera} className="btn-secondary text-xs px-4 py-2">
            <Camera className="w-3.5 h-3.5" /> Start Camera
          </button>
        )}
        {capturing && (
          <>
            <button type="button" onClick={snap} className="btn-primary text-xs px-4 py-2">
              <span className="w-2 h-2 bg-white rounded-full" /> Capture
            </button>
            <button type="button" onClick={stopCamera} className="btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
          </>
        )}
        {preview && (
          <button type="button" onClick={retake} className="btn-secondary text-xs px-4 py-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retake
          </button>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-secondary text-xs px-4 py-2"
        >
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}
