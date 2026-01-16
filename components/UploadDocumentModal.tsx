import React, { useState, useRef } from 'react';
import { X, Upload, FileImage, Sparkles, Loader2, StickyNote, FileText, CalendarClock } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { analyzeDocumentImage } from '../services/geminiService';

interface UploadDocumentModalProps {
  onClose: () => void;
  onUpload: (fileData: string, title: string, description: string, tags: string[], dueDate?: number) => void;
}

type TabMode = 'file' | 'text';

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({ onClose, onUpload }) => {
  const [mode, setMode] = useState<TabMode>('file');
  
  // File Mode State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  
  // Shared State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateStr, setDueDateStr] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!preview) return;
    
    setIsAnalyzing(true);
    const result = await analyzeDocumentImage(preview);
    setTitle(result.suggestedTitle);
    setDescription(result.summary);
    setIsAnalyzing(false);
    setAnalysisDone(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert date string (YYYY-MM-DD) to timestamp if present
    let dueDateTimestamp: number | undefined;
    if (dueDateStr) {
      // Create date at noon to avoid timezone rolling it back a day upon conversion
      dueDateTimestamp = new Date(dueDateStr + 'T12:00:00').getTime();
    }

    if (mode === 'file') {
        if (preview && title) {
            onUpload(preview, title, description, [], dueDateTimestamp);
        }
    } else {
        if (title) {
            onUpload('', title, description, ['text-note'], dueDateTimestamp);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
            {mode === 'file' ? <Upload className="w-6 h-6 text-brand-primary" /> : <StickyNote className="w-6 h-6 text-brand-primary" />}
            {mode === 'file' ? 'Anexar Documento' : 'Criar Anotação'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
                type="button"
                onClick={() => setMode('file')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'file' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <FileImage size={16} /> Arquivo / Foto
            </button>
            <button
                type="button"
                onClick={() => setMode('text')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'text' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <StickyNote size={16} /> Apenas Texto
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {mode === 'file' && (
              <>
                {/* File Drop Area */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-3 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${preview ? 'border-brand-primary bg-brand-light/20' : 'border-gray-300 hover:border-brand-primary hover:bg-gray-50'}`}
                >
                    {preview ? (
                    <div className="relative w-full h-48">
                        <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                        <p className="text-white font-medium">Trocar Imagem</p>
                        </div>
                    </div>
                    ) : (
                    <>
                        <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mb-4">
                        <FileImage className="w-8 h-8 text-brand-primary" />
                        </div>
                        <p className="text-brand-dark font-medium text-center">Clique para selecionar ou arraste o arquivo</p>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG ou JPEG</p>
                    </>
                    )}
                    <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                    />
                </div>

                {/* AI Analysis Button */}
                {preview && !analysisDone && (
                    <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-cyan text-white rounded-xl font-medium shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                    {isAnalyzing ? (
                        <>
                        <Loader2 className="animate-spin w-5 h-5" /> Analisando com IA...
                        </>
                    ) : (
                        <>
                        <Sparkles className="w-5 h-5" /> Preencher com Inteligência Artificial
                        </>
                    )}
                    </button>
                )}
              </>
          )}

          <div className="space-y-4">
            <Input 
              label={mode === 'text' ? "Título do Registro" : "Título do Documento"}
              placeholder={mode === 'text' ? "Ex: Senha do Wi-Fi" : "Ex: Conta de Luz - Maio"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            {/* Date Input */}
            <div className="flex flex-col gap-1 w-full">
               <label className="text-sm font-semibold text-brand-dark flex items-center gap-1">
                  <CalendarClock size={16} /> Data de Vencimento (Opcional)
               </label>
               <input 
                 type="date"
                 className="px-4 py-3 rounded-xl border-2 border-brand-light focus:border-brand-primary focus:ring-2 focus:ring-brand-light outline-none transition-all bg-white/80 text-brand-dark placeholder:text-gray-400 w-full cursor-text"
                 value={dueDateStr}
                 onChange={(e) => setDueDateStr(e.target.value)}
               />
               <span className="text-xs text-gray-400">Nós avisaremos quando estiver perto de vencer.</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-brand-dark">
                  {mode === 'text' ? 'Conteúdo / Detalhes' : 'Descrição (Opcional)'}
              </label>
              <textarea 
                className={`px-4 py-3 rounded-xl border-2 border-brand-light focus:border-brand-primary focus:ring-2 focus:ring-brand-light outline-none transition-all bg-white/80 resize-none text-brand-dark placeholder:text-gray-400 ${mode === 'text' ? 'h-40' : 'h-24'}`}
                placeholder={mode === 'text' ? "Digite aqui as informações, senhas, códigos ou anotações..." : "Detalhes adicionais..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required={mode === 'text'}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={mode === 'file' ? (!file || !title) : (!title || !description)}>
              {mode === 'file' ? 'Salvar Documento' : 'Salvar Nota'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};