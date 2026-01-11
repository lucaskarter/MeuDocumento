import React, { useState, useRef, useEffect } from 'react';
import { X, Save, FileImage, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Document } from '../types';

interface EditDocumentModalProps {
  document: Document;
  onClose: () => void;
  onSave: (doc: Document) => void;
}

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({ document, onClose, onSave }) => {
  const [fileData, setFileData] = useState(document.fileData);
  const [title, setTitle] = useState(document.title);
  const [description, setDescription] = useState(document.description || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isText = document.fileType === 'text/plain';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title) {
      onSave({
        ...document,
        title,
        description,
        fileData
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-brand-primary" />
            Editar {isText ? 'Nota' : 'Documento'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* File Preview Area - Only show if not text-only */}
          {!isText && (
            <div className="relative group">
                <div 
                    className="w-full h-48 rounded-xl overflow-hidden border-2 border-brand-light bg-gray-50 flex items-center justify-center"
                >
                    <img src={fileData} alt="Preview" className="w-full h-full object-contain" />
                </div>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white font-medium rounded-xl"
                >
                    <FileImage className="w-8 h-8 mb-2" />
                    Alterar Imagem
                </button>
                <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
                />
            </div>
          )}

          <div className="space-y-4">
            <Input 
              label="Título" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-brand-dark">{isText ? 'Conteúdo' : 'Descrição'}</label>
              <textarea 
                className={`px-4 py-3 rounded-xl border-2 border-brand-light focus:border-brand-primary focus:ring-2 focus:ring-brand-light outline-none transition-all bg-white/80 resize-none text-brand-dark placeholder:text-gray-400 ${isText ? 'h-48' : 'h-24'}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              <Save size={18} /> Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};