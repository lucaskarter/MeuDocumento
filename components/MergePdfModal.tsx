import React, { useState } from 'react';
import { X, FileStack, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Document } from '../types';
import { mergePdfs } from '../services/pdfService';

interface MergePdfModalProps {
  documents: Document[];
  onClose: () => void;
  onMerge: (fileData: string, title: string) => void;
}

export const MergePdfModal: React.FC<MergePdfModalProps> = ({ documents, onClose, onMerge }) => {
  // Filter only PDF documents
  const pdfDocuments = documents.filter(doc => doc.fileType === 'application/pdf');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length >= 2 && title) {
      setIsMerging(true);
      try {
        // Get full fileData based on selection order
        const filesToMerge = selectedIds
            .map(id => pdfDocuments.find(doc => doc.id === id)?.fileData)
            .filter((data): data is string => !!data);

        const mergedPdfData = await mergePdfs(filesToMerge);
        onMerge(mergedPdfData, title);
      } catch (error) {
        console.error("Error merging PDFs", error);
        alert("Erro ao unir PDFs");
      } finally {
        setIsMerging(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
            <FileStack className="w-6 h-6 text-brand-primary" />
            Unir PDFs
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        {pdfDocuments.length < 2 ? (
            <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-brand-orange mx-auto mb-3" />
                <p className="text-gray-600">Você precisa ter pelo menos 2 arquivos PDF nesta pasta para uní-los.</p>
                <p className="text-sm text-gray-500 mt-2">Use o "Scanner PDF" para criar documentos PDF.</p>
                <div className="mt-6">
                     <Button onClick={onClose} variant="outline" className="w-full">Voltar</Button>
                </div>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
                <label className="text-sm font-semibold text-brand-dark mb-2 block">Selecione os arquivos na ordem desejada:</label>
                <div className="max-h-60 overflow-y-auto border rounded-xl divide-y">
                    {pdfDocuments.map(doc => {
                        const isSelected = selectedIds.includes(doc.id);
                        const selectionOrder = selectedIds.indexOf(doc.id) + 1;

                        return (
                            <div 
                                key={doc.id} 
                                onClick={() => toggleSelection(doc.id)}
                                className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-brand-light/20' : ''}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-primary border-brand-primary text-white' : 'border-gray-300'}`}>
                                        {isSelected && <Check size={12} />}
                                    </div>
                                    <span className="truncate text-sm font-medium text-gray-700">{doc.title}</span>
                                </div>
                                {isSelected && (
                                    <span className="text-xs font-bold bg-brand-primary text-white w-6 h-6 flex items-center justify-center rounded-full">
                                        {selectionOrder}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">{selectedIds.length} selecionados</p>
            </div>

            <Input 
                label="Nome do Arquivo Unificado" 
                placeholder="Ex: Documentos Completos"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
            
            <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={selectedIds.length < 2 || !title || isMerging}>
                {isMerging ? <Loader2 className="animate-spin" /> : 'Unir Arquivos'}
                </Button>
            </div>
            </form>
        )}
      </div>
    </div>
  );
};