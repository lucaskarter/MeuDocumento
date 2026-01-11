import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, ScanLine, FilePlus, Loader2, Trash2, Camera, CheckCircle, ChevronLeft, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { generatePdfFromImages } from '../services/pdfService';

interface ScanPdfModalProps {
  onClose: () => void;
  onSave: (fileData: string, title: string) => void;
}

export const ScanPdfModal: React.FC<ScanPdfModalProps> = ({ onClose, onSave }) => {
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [flash, setFlash] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera when active state changes
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      if (!isCameraActive) return;

      setIsLoadingCamera(true);
      
      try {
        // Try environment camera first (back camera), then fallback to any video input
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });
        } catch (err) {
            console.log("Environment camera failed, falling back to user camera", err);
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
        }
        
        if (!mounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Important: Explicitly play() to ensure video starts on some mobile browsers
          // Muted is also important for autoplay policies, though we requested no audio
          await videoRef.current.play().catch(e => console.error("Video play failed", e));
        }
        setIsLoadingCamera(false);

      } catch (err) {
        console.error("Camera access error:", err);
        if (mounted) {
            setCameraError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
            setIsCameraActive(false);
            setIsLoadingCamera(false);
        }
      }
    };

    if (isCameraActive) {
        initCamera();
    }

    // Cleanup function
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraActive]);

  const startCamera = () => {
    setCameraError('');
    setIsCameraActive(true);
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    // The useEffect cleanup will handle the stream stopping
  };

  const capturePhoto = () => {
    if (videoRef.current && !isLoadingCamera) {
      // Trigger flash animation
      setFlash(true);
      setTimeout(() => setFlash(false), 150);

      const canvas = document.createElement('canvas');
      // Set canvas size to match video resolution
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw video frame to canvas
        // We flip horizontally if it's user facing (mirror effect), but usually docs use environment
        // For simplicity, we capture as is.
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImages(prev => [...prev, dataUrl]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Explicitly cast to File[] to ensure TS knows these are Files (which are Blobs)
      const files = Array.from(e.target.files) as File[];
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length > 0 && title) {
      setIsGenerating(true);
      try {
        const pdfData = await generatePdfFromImages(images);
        onSave(pdfData, title);
      } catch (error) {
        console.error("Error creating PDF", error);
        alert("Erro ao criar PDF");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // --- Camera UI ---
  if (isCameraActive) {
    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in">
            {/* Camera View */}
            <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                 {isLoadingCamera && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20 bg-black">
                        <Loader2 className="w-10 h-10 animate-spin mb-3 text-brand-primary" />
                        <p className="text-sm font-medium">Iniciando câmera...</p>
                    </div>
                 )}
                 
                 <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                 />
                 
                 {/* Visual Guide Overlay */}
                 <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none flex items-center justify-center z-10">
                    <div className="w-full h-full border-2 border-white/50 relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-primary -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-primary -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-primary -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-primary -mb-1 -mr-1"></div>
                    </div>
                 </div>

                 {/* Flash Overlay */}
                 {flash && <div className="absolute inset-0 bg-white animate-pulse pointer-events-none z-20" />}
                 
                 {/* Images Counter Toast */}
                 {images.length > 0 && (
                     <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/20 z-20">
                         {images.length} {images.length === 1 ? 'página digitalizada' : 'páginas digitalizadas'}
                     </div>
                 )}
            </div>

            {/* Camera Controls */}
            <div className="h-32 bg-black flex items-center justify-between px-8 pb-6 pt-4 z-20">
                <button 
                    onClick={stopCamera}
                    className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>

                <button 
                    onClick={capturePhoto}
                    disabled={isLoadingCamera}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:bg-white/20 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="w-12 h-12 bg-white rounded-full"></div>
                </button>

                <button 
                    onClick={stopCamera}
                    className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-white hover:bg-brand-dark transition-colors"
                >
                    <CheckCircle size={24} />
                </button>
            </div>
        </div>
    );
  }

  // --- Main Modal UI ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-brand-primary" />
            Scanner PDF
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
                 <label className="text-sm font-semibold text-brand-dark">Páginas do Documento ({images.length})</label>
                 
                 {images.length > 0 && (
                     <div className="flex gap-2">
                         <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-brand-dark px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                         >
                            <Upload size={14} /> Galeria
                         </button>
                         <button 
                            type="button" 
                            onClick={startCamera}
                            className="text-xs bg-brand-primary hover:bg-brand-dark text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm"
                         >
                            <Camera size={14} /> Câmera
                         </button>
                     </div>
                 )}
            </div>
            
            {cameraError && (
                <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl border border-red-100 flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{cameraError}</span>
                </div>
            )}
            
            <div className="flex gap-4 overflow-x-auto py-2 border rounded-xl p-4 bg-gray-50 min-h-[140px]">
                {images.length === 0 ? (
                    <div className="w-full flex gap-4">
                        <div 
                            onClick={startCamera}
                            className="flex-1 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-white hover:border-brand-primary/50 hover:text-brand-primary rounded-xl transition-all border-2 border-dashed border-gray-300 bg-gray-50/50 py-6"
                        >
                            <Camera size={32} className="mb-2" />
                            <span className="text-sm font-medium">Usar Câmera</span>
                        </div>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-white hover:border-brand-primary/50 hover:text-brand-primary rounded-xl transition-all border-2 border-dashed border-gray-300 bg-gray-50/50 py-6"
                        >
                            <Upload size={32} className="mb-2" />
                            <span className="text-sm font-medium">Carregar Arquivos</span>
                        </div>
                    </div>
                ) : (
                    images.map((img, idx) => (
                        <div key={idx} className="relative flex-shrink-0 w-24 h-32 group animate-fade-in-up">
                            <img src={img} alt={`Page ${idx + 1}`} className="w-full h-full object-cover rounded-lg shadow-sm border border-gray-200" />
                            <div className="absolute top-1 right-1">
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {idx + 1}
                            </span>
                        </div>
                    ))
                )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
              multiple
            />
          </div>

          <Input 
            label="Nome do Arquivo PDF" 
            placeholder="Ex: Contrato Assinado"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={images.length === 0 || !title || isGenerating}>
              {isGenerating ? <Loader2 className="animate-spin" /> : 'Gerar PDF'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};