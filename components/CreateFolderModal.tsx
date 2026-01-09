import React, { useState } from 'react';
import { X, Folder, User, Key, FileText, DollarSign, Shield, Briefcase, File, CreditCard, Lock } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { FolderColor } from '../types';
import { AVAILABLE_ICONS } from '../constants';

interface CreateFolderModalProps {
  onClose: () => void;
  onCreate: (name: string, color: string, icon: string) => void;
}

// Map string keys to Lucide components for rendering inside modal
const iconMap: Record<string, React.ElementType> = {
  'user': User,
  'key': Key,
  'file-text': FileText,
  'dollar-sign': DollarSign,
  'shield': Shield,
  'briefcase': Briefcase,
  'file': File,
  'credit-card': CreditCard,
};

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(FolderColor.Blue);
  const [selectedIcon, setSelectedIcon] = useState<string>('folder');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name, selectedColor, selectedIcon);
    }
  };

  const colors = [
    { value: FolderColor.Blue, label: 'Azul' },
    { value: FolderColor.DarkBlue, label: 'Escuro' },
    { value: FolderColor.Cyan, label: 'Ciano' },
    { value: FolderColor.Orange, label: 'Laranja' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in my-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
            <Folder className="w-6 h-6 text-brand-primary" />
            Nova Pasta
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Nome da Pasta" 
            placeholder="Ex: Documentos da Casa"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />

          <div>
            <label className="text-sm font-semibold text-brand-dark mb-2 block">Ícone da Pasta</label>
            <div className="grid grid-cols-4 gap-3">
              {AVAILABLE_ICONS.map((icon) => {
                const IconComponent = iconMap[icon.value] || Lock;
                return (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => setSelectedIcon(icon.value)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${selectedIcon === icon.value ? 'border-brand-primary bg-brand-light/30 text-brand-primary' : 'border-gray-100 text-gray-500 hover:border-brand-primary/50'}`}
                  >
                    <IconComponent size={24} className="mb-1" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-brand-dark mb-2 block">Cor da Capa</label>
            <div className="flex gap-3">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  className={`w-10 h-10 rounded-full ${c.value} transition-transform ${selectedColor === c.value ? 'scale-110 ring-2 ring-offset-2 ring-brand-primary' : 'hover:scale-105'}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Criar Pasta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};