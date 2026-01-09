import { FolderColor } from "./types";

export const DEFAULT_FOLDERS = [
  {
    id: '1',
    name: 'Identidades',
    coverColor: FolderColor.DarkBlue,
    icon: 'user', // User icon
    createdAt: Date.now(),
  },
  {
    id: '2',
    name: 'Contas',
    coverColor: FolderColor.Orange,
    icon: 'dollar-sign', // Dollar icon
    createdAt: Date.now(),
  },
  {
    id: '3',
    name: 'Senhas',
    coverColor: FolderColor.Blue,
    icon: 'key', // Key icon
    createdAt: Date.now(),
  },
  {
    id: '4',
    name: 'Comprovantes',
    coverColor: FolderColor.Cyan,
    icon: 'file-text', // Document icon
    createdAt: Date.now(),
  },
];

export const MOCK_USER = {
  id: 'user_123',
  name: 'Usuário Demo',
  email: 'usuario@meudocumento.com'
};

export const AVAILABLE_ICONS = [
  { value: 'user', label: 'Pessoal' },
  { value: 'dollar-sign', label: 'Financeiro' },
  { value: 'key', label: 'Segurança' },
  { value: 'file-text', label: 'Documento' },
  { value: 'shield', label: 'Proteção' },
  { value: 'briefcase', label: 'Trabalho' },
  { value: 'file', label: 'Arquivo' },
  { value: 'credit-card', label: 'Cartões' },
];