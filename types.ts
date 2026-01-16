export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Document {
  id: string;
  folderId: string;
  title: string;
  description?: string;
  fileData: string; // Base64 for demo purposes
  fileType: string;
  createdAt: number;
  dueDate?: number; // Timestamp for expiration date
  tags?: string[];
}

export interface Folder {
  id: string;
  name: string;
  coverColor: string;
  icon: string;
  createdAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export enum FolderColor {
  Blue = 'bg-brand-primary',
  DarkBlue = 'bg-brand-dark',
  Cyan = 'bg-brand-cyan',
  Orange = 'bg-brand-orange',
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  FOLDER = 'FOLDER',
}