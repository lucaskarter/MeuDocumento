import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { verifyPassword } from '../services/storage';

interface DeleteFolderModalProps {
  folderName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({ folderName, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPassword(password)) {
      onConfirm();
    } else {
      setError('Senha incorreta.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in border-l-4 border-red-500">
        <div className="flex justify-between items-start mb-6">
          <div>
             <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                Excluir Pasta
            </h2>
            <p className="text-gray-500 text-sm mt-1">Isso excluirá "{folderName}" e todos os documentos dentro dela.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Confirme sua Senha" 
            type="password"
            placeholder="Sua senha de login"
            value={password}
            onChange={(e) => {
                setPassword(e.target.value);
                setError('');
            }}
            required
            className={error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
          />
          
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="danger" className="flex-1">
              <Trash2 size={18} /> Confirmar Exclusão
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};