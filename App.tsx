import React, { useState, useEffect } from 'react';
// Rename File to FileIcon to avoid conflict with the global File constructor
import { Shield, Plus, LogOut, ArrowLeft, Search, User as UserIcon, Lock, Trash2, Eye, Pencil, Share2, MoreVertical, Key, FileText, DollarSign, Briefcase, File as FileIcon, CreditCard, ScanLine, FileStack, X, Folder as FolderIcon, StickyNote, AlignLeft, Clock, Loader2 } from 'lucide-react';
import { User, Folder, Document, ViewState, FolderColor } from './types';
import { 
  getFolders, createFolder as serviceCreateFolder, updateFolder, deleteFolder,
  getDocuments, addDocument, deleteDocument, updateDocument, createDefaultFolders
} from './services/storage';

// Firebase Imports
import { 
    auth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile 
} from './services/firebase';

import { Input } from './components/Input';
import { Button } from './components/Button';
import { CreateFolderModal } from './components/CreateFolderModal';
import { EditFolderModal } from './components/EditFolderModal';
import { DeleteFolderModal } from './components/DeleteFolderModal';
import { UploadDocumentModal } from './components/UploadDocumentModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { EditDocumentModal } from './components/EditDocumentModal';
import { ScanPdfModal } from './components/ScanPdfModal';
import { MergePdfModal } from './components/MergePdfModal';
import { PdfThumbnail } from './components/PdfThumbnail';
import { useToast } from './components/Toast';

// Map string keys to Lucide components for rendering
const iconMap: Record<string, React.ElementType> = {
  'user': UserIcon,
  'key': Key,
  'file-text': FileText,
  'dollar-sign': DollarSign,
  'shield': Shield,
  'briefcase': Briefcase,
  'file': FileIcon, // Use FileIcon here
  'credit-card': CreditCard,
  'lock': Lock // Fallback
};

// --- Logo Component ---
const Logo = ({ className = "h-12", showText = true }: { className?: string, showText?: boolean }) => {
    const [imgError, setImgError] = useState(false);

    if (imgError) {
        // Fallback SVG Logo (Folder with MD + Shield feel)
        return (
            <div className={`flex items-center gap-2 ${className.includes('h-28') ? 'flex-col' : ''}`}>
                <div className={`${className} aspect-square flex items-center justify-center bg-brand-dark text-white rounded-xl shadow-lg relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-1 opacity-20">
                        <Shield size="100%" />
                    </div>
                    <span className={`font-bold tracking-tighter ${className.includes('h-28') ? 'text-5xl' : 'text-2xl'}`}>
                        MD
                    </span>
                </div>
                {showText && (
                    <span className={`font-bold text-brand-dark ${className.includes('h-28') ? 'text-3xl mt-4' : 'text-xl'}`}>
                        Meu Documento
                    </span>
                )}
            </div>
        );
    }

    return (
        <img 
            src="/logo.png" 
            alt="Meu Documento" 
            className={`${className} object-contain`}
            onError={() => setImgError(true)}
        />
    );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Loading state for initial auth check

  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isScanPdfOpen, setIsScanPdfOpen] = useState(false);
  const [isMergePdfOpen, setIsMergePdfOpen] = useState(false);
  
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [name, setName] = useState(''); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);

  // Toast
  const { showToast } = useToast();

  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Map Firebase user to App User
        const appUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Usuário',
            email: firebaseUser.email || ''
        };
        setUser(appUser);
        
        // Ensure default folders exist
        createDefaultFolders();
        await loadData();
      } else {
        setUser(null);
        setDocuments([]);
        setFolders([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    setFolders(getFolders());
    const docs = await getDocuments();
    setDocuments(docs);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        showToast('Preencha todos os campos.', 'error');
        return;
    }

    setIsAuthProcessing(true);

    try {
        if (isRegistering) {
            if (!name) {
                showToast('O nome é obrigatório para cadastro.', 'error');
                setIsAuthProcessing(false);
                return;
            }
            
            // Register
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Update Profile with Name
            await updateProfile(userCredential.user, { displayName: name });
            
            showToast('Conta criada com sucesso!', 'success');
            // State user updates automatically via useEffect hook
        } else {
            // Login
            await signInWithEmailAndPassword(auth, email, password);
            showToast(`Bem-vindo de volta!`, 'success');
        }
        
        // Reset form
        setEmail('');
        setPassword('');
        setName('');

    } catch (error: any) {
        console.error("Auth error", error);
        let msg = 'Erro ao realizar autenticação.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') msg = 'Email ou senha inválidos.';
        if (error.code === 'auth/email-already-in-use') msg = 'Este email já está em uso.';
        if (error.code === 'auth/weak-password') msg = 'A senha deve ter pelo menos 6 caracteres.';
        
        showToast(msg, 'error');
    } finally {
        setIsAuthProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        setCurrentView(ViewState.DASHBOARD);
        setSelectedFolder(null);
        setEmail('');
        setPassword('');
        showToast('Você saiu com sucesso.', 'info');
    } catch (error) {
        console.error("Logout error", error);
    }
  };

  const openFolder = async (folder: Folder) => {
    setSelectedFolder(folder);
    const docs = await getDocuments(folder.id);
    setDocuments(docs);
    setCurrentView(ViewState.FOLDER);
    setSearchQuery(''); // Clear search when entering a folder
  };

  const handleCreateFolder = async (name: string, color: string, icon: string) => {
    serviceCreateFolder(name, color, icon);
    await loadData();
    setIsCreateFolderOpen(false);
    showToast('Pasta criada com sucesso!', 'success');
  };

  const handleUpdateFolder = async (folder: Folder) => {
    updateFolder(folder);
    await loadData();
    setEditingFolder(null);
    showToast('Pasta atualizada!', 'success');
  };

  const handleDeleteFolderConfirm = async () => {
    if (deletingFolder) {
      await deleteFolder(deletingFolder.id);
      await loadData();
      setDeletingFolder(null);
      showToast('Pasta excluída com sucesso.', 'success');
    }
  };

  const handleUploadDocument = async (fileData: string, title: string, description: string, tags: string[], dueDate?: number) => {
    if (!selectedFolder) return;
    
    // Determine file type. If fileData is empty, it's a text note.
    const fileType = fileData ? 'image/jpeg' : 'text/plain';

    const newDoc: Document = {
      id: Date.now().toString(),
      folderId: selectedFolder.id,
      title,
      description,
      fileData, // Might be empty for text notes
      fileType,
      createdAt: Date.now(),
      dueDate,
      tags
    };
    
    try {
      await addDocument(newDoc);
      const docs = await getDocuments(selectedFolder.id);
      setDocuments(docs);
      setIsUploadOpen(false);
      showToast(fileType === 'text/plain' ? 'Nota criada com sucesso!' : 'Documento anexado com sucesso!', 'success');
    } catch (e) {
      console.error("Failed to save document", e);
      showToast('Erro ao salvar documento.', 'error');
    }
  };

  const handleSavePdf = async (fileData: string, title: string) => {
    if (!selectedFolder) return;

    const newDoc: Document = {
        id: Date.now().toString(),
        folderId: selectedFolder.id,
        title,
        description: 'PDF Gerado',
        fileData,
        fileType: 'application/pdf',
        createdAt: Date.now(),
        tags: ['pdf']
    };

    try {
      await addDocument(newDoc);
      const docs = await getDocuments(selectedFolder.id);
      setDocuments(docs);
      setIsScanPdfOpen(false);
      setIsMergePdfOpen(false);
      showToast('PDF salvo com sucesso!', 'success');
    } catch (e) {
      console.error("Failed to save PDF", e);
      showToast('Erro ao salvar PDF.', 'error');
    }
  };

  const handleUpdateDocument = async (doc: Document) => {
    await updateDocument(doc);
    // Reload all documents to update search results if in dashboard, or specific folder if in folder view
    const docs = selectedFolder ? await getDocuments(selectedFolder.id) : await getDocuments();
    setDocuments(docs);
    setEditingDoc(null);
    showToast('Alterações salvas.', 'success');
  };

  const handleDeleteDocument = async (id: string) => {
    if(confirm("Tem certeza que deseja excluir este documento?")) {
        await deleteDocument(id);
        const docs = selectedFolder ? await getDocuments(selectedFolder.id) : await getDocuments();
        setDocuments(docs);
        showToast('Documento excluído.', 'success');
    }
  };

  const handleShare = async (doc: Document) => {
    if (doc.fileType === 'text/plain') {
        if (navigator.share) {
            await navigator.share({
                title: doc.title,
                text: `${doc.title}\n\n${doc.description}`
            });
        } else {
             navigator.clipboard.writeText(`${doc.title}\n\n${doc.description}`);
             showToast('Conteúdo copiado para a área de transferência!', 'success');
        }
        return;
    }

    if (navigator.share) {
      try {
        const response = await fetch(doc.fileData);
        const blob = await response.blob();
        
        const extension = doc.fileType === 'application/pdf' ? 'pdf' : 'jpg';
        const file = new File([blob], `${doc.title}.${extension}`, { type: doc.fileType });

        await navigator.share({
          title: doc.title,
          text: doc.description || `Documento: ${doc.title}`,
          files: [file]
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      showToast('Compartilhamento não suportado neste dispositivo.', 'info');
    }
  };

  const getFolderDocCount = (folderId: string) => {
    return documents.filter(doc => doc.folderId === folderId).length;
  };

  const getFolderName = (folderId: string) => {
    return folders.find(f => f.id === folderId)?.name || 'Pasta desconhecida';
  };

  const getFilteredDocuments = () => {
    if (!searchQuery.trim()) return [];
    return documents.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Helper to render thumbnail content based on type
  const renderThumbnail = (doc: Document) => {
      if (doc.fileType === 'application/pdf') {
          return <PdfThumbnail fileData={doc.fileData} className="pointer-events-none" />;
      } else if (doc.fileType === 'text/plain') {
          return (
              <div className="w-full h-full bg-yellow-50 p-2 flex flex-col items-start border-l-4 border-yellow-400">
                  <div className="flex items-center gap-1 text-yellow-600 mb-1">
                      <StickyNote size={12} />
                      <span className="text-[10px] font-bold uppercase">Nota</span>
                  </div>
                  <div className="w-full space-y-1">
                      <div className="h-1 bg-gray-200 rounded w-full"></div>
                      <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-1 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <p className="mt-2 text-[10px] text-gray-500 line-clamp-3 leading-tight w-full">
                      {doc.description}
                  </p>
              </div>
          );
      } else {
          return <img src={doc.fileData} alt={doc.title} className="w-full h-full object-cover" />;
      }
  };

  // Helper to calculate days remaining
  const getExpirationStatus = (dueDate?: number) => {
      if (!dueDate) return null;
      
      const now = new Date();
      now.setHours(0,0,0,0);
      
      const due = new Date(dueDate);
      due.setHours(0,0,0,0);
      
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 60) {
          if (diffDays < 0) return { label: 'Vencido', color: 'bg-red-100 text-red-600 border-red-200' };
          if (diffDays === 0) return { label: 'Vence Hoje', color: 'bg-red-100 text-red-600 border-red-200' };
          if (diffDays <= 7) return { label: `Vence em ${diffDays} dias`, color: 'bg-orange-100 text-orange-600 border-orange-200' };
          return { label: `Vence em ${diffDays} dias`, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
      }
      return null;
  };

  // --- Views ---
  
  // Loading Check
  if (authLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-brand-cream">
              <div className="flex flex-col items-center gap-4">
                <Logo className="h-20 w-20 animate-pulse" showText={false} />
                <p className="text-brand-primary font-medium">Carregando...</p>
              </div>
          </div>
      );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-brand-cream bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-peach/50 via-brand-cream to-brand-cream">
        <div className="bg-white/90 backdrop-blur-md w-full max-w-md p-8 rounded-3xl shadow-2xl border-2 border-white">
          <div className="text-center mb-8 flex flex-col items-center">
            <Logo className="h-28 w-28 mb-4" />
            <p className="text-brand-primary mt-2">Segurança para seus documentos</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-6">
            {isRegistering && (
                <Input 
                  label="Seu Nome" 
                  type="text" 
                  placeholder="Como devemos te chamar?" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
            )}
            <Input 
              label="Email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Senha" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <Button type="submit" className="w-full py-3 text-lg" disabled={isAuthProcessing}>
              {isAuthProcessing ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" /> Processando...
                  </>
              ) : (
                  isRegistering ? 'Criar Conta Grátis' : 'Entrar na Plataforma'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                  setIsRegistering(!isRegistering);
                  // Clear fields when switching mode
                  setEmail('');
                  setPassword('');
                  setName('');
              }}
              className="text-brand-primary font-medium hover:underline text-sm"
              disabled={isAuthProcessing}
            >
              {isRegistering ? 'Já tem conta? Fazer Login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      {/* Navigation */}
      <nav className="bg-brand-dark text-white px-6 py-4 sticky top-0 z-40 shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={async () => {
             setCurrentView(ViewState.DASHBOARD); 
             setSelectedFolder(null);
             setSearchQuery('');
             const docs = await getDocuments();
             setDocuments(docs);
          }}>
            <Logo className="h-10" showText={false} />
            <span className="text-xl font-bold tracking-wide hidden sm:block">Meu Documento</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-brand-primary/30 px-3 py-1.5 rounded-full border border-brand-primary/50">
                <UserIcon size={16} className="text-brand-light" />
                <span className="text-sm font-medium text-brand-light truncate max-w-[100px] sm:max-w-none">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Sair">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        
        {/* Breadcrumb / Header */}
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {currentView === ViewState.FOLDER && selectedFolder ? (
              <button 
                onClick={async () => {
                    setCurrentView(ViewState.DASHBOARD); 
                    setSelectedFolder(null);
                    setSearchQuery('');
                    const docs = await getDocuments();
                    setDocuments(docs);
                }}
                className="flex items-center gap-2 text-brand-primary font-bold hover:underline mb-2"
              >
                <ArrowLeft size={20} />
                Voltar para Pastas
              </button>
            ) : (
                <p className="text-brand-primary font-medium mb-1">Olá, {user.name}!</p>
            )}
            <h1 className="text-3xl font-bold text-brand-dark">
              {currentView === ViewState.DASHBOARD ? (searchQuery ? 'Resultados da Busca' : 'Meus Arquivos') : selectedFolder?.name}
            </h1>
          </div>

          {currentView === ViewState.DASHBOARD ? (
            !searchQuery && (
                <Button onClick={() => setIsCreateFolderOpen(true)}>
                <Plus size={20} /> Nova Pasta
                </Button>
            )
          ) : (
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <Button onClick={() => setIsScanPdfOpen(true)} variant="secondary" className="px-3">
                    <ScanLine size={20} /> <span className="hidden sm:inline">Scanner PDF</span>
                </Button>
                <Button onClick={() => setIsMergePdfOpen(true)} variant="secondary" className="px-3">
                    <FileStack size={20} /> <span className="hidden sm:inline">Unir PDFs</span>
                </Button>
                <Button onClick={() => setIsUploadOpen(true)} variant="primary">
                    <Plus size={20} /> <span className="hidden sm:inline">Anexar</span>
                </Button>
            </div>
          )}
        </header>

        {/* Dashboard View (Search and Folders) */}
        {currentView === ViewState.DASHBOARD && (
          <div className="space-y-6">
            
            {/* Global Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className={`h-5 w-5 ${searchQuery ? 'text-brand-primary' : 'text-gray-400'}`} />
                </div>
                <input
                    type="text"
                    placeholder="Pesquisar documento por nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-4 bg-white rounded-2xl shadow-sm border-2 border-transparent focus:border-brand-primary/50 focus:shadow-lg focus:outline-none transition-all placeholder:text-gray-400 text-brand-dark"
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-brand-primary transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {searchQuery ? (
                // Search Results List View
                <div className="animate-fade-in">
                   {getFilteredDocuments().length === 0 ? (
                        <div className="text-center py-12 bg-white/50 rounded-3xl">
                            <Search className="w-12 h-12 text-brand-primary/30 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Nenhum documento encontrado para "{searchQuery}"</p>
                        </div>
                   ) : (
                       <div className="space-y-3">
                           {getFilteredDocuments().map(doc => {
                               const expirationStatus = getExpirationStatus(doc.dueDate);
                               return (
                                   <div key={doc.id} className="bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all flex items-center gap-4 group">
                                       {/* Thumbnail */}
                                       <div 
                                            className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-gray-100 relative"
                                            onClick={() => setViewingDoc(doc)}
                                        >
                                            {renderThumbnail(doc)}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Eye size={20} className="text-white drop-shadow-md" />
                                            </div>
                                       </div>

                                       {/* Info */}
                                       <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewingDoc(doc)}>
                                           <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-brand-dark truncate">{doc.title}</h4>
                                                {expirationStatus && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${expirationStatus.color}`}>
                                                        {expirationStatus.label}
                                                    </span>
                                                )}
                                           </div>
                                           <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-medium text-brand-primary bg-brand-light/30 px-2 py-0.5 rounded-full flex items-center gap-1 truncate">
                                                    <FolderIcon size={10} />
                                                    {getFolderName(doc.folderId)}
                                                </span>
                                                <span className="text-xs text-gray-400 hidden sm:inline-block">
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </span>
                                           </div>
                                       </div>

                                       {/* Actions */}
                                       <div className="flex items-center gap-1 sm:gap-2 border-l pl-2 sm:pl-4 border-gray-100">
                                            <button 
                                                onClick={() => setEditingDoc(doc)}
                                                className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-light/20 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteDocument(doc.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                       </div>
                                   </div>
                               );
                           })}
                       </div>
                   )}
                </div>
            ) : (
                // Existing Folders Grid
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {folders.map(folder => {
                    const count = getFolderDocCount(folder.id);
                    const IconComponent = iconMap[folder.icon] || Lock;

                    return (
                    <div 
                        key={folder.id}
                        className="group relative bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-brand-primary/30 active:scale-95"
                    >
                        {/* Folder Click Area */}
                        <div onClick={() => openFolder(folder)} className="cursor-pointer">
                            <div className={`w-14 h-14 rounded-xl ${folder.coverColor} flex items-center justify-center mb-4 text-white shadow-md group-hover:scale-110 transition-transform`}>
                                <IconComponent size={24} opacity={0.9} />
                            </div>
                            <h3 className="font-bold text-brand-dark truncate pr-6">{folder.name}</h3>
                            <p className="text-xs text-gray-500 mt-1 font-medium">{count} {count === 1 ? 'documento' : 'documentos'}</p>
                        </div>

                        {/* Edit/Delete Actions */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); }}
                                className="p-1.5 bg-gray-100 hover:bg-brand-light hover:text-brand-primary rounded-lg text-gray-500 transition-colors"
                                title="Editar Pasta"
                            >
                                <Pencil size={14} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setDeletingFolder(folder); }}
                                className="p-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-500 transition-colors"
                                title="Excluir Pasta"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    )})}
                </div>
            )}
          </div>
        )}

        {/* Folder View (Documents) */}
        {currentView === ViewState.FOLDER && (
          <div className="space-y-4">
            {documents.length === 0 ? (
               <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-brand-primary/20">
                 <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-brand-primary" />
                 </div>
                 <h3 className="text-xl font-bold text-brand-dark">Pasta Vazia</h3>
                 <p className="text-gray-500 max-w-xs mx-auto mt-2">Nenhum documento anexado ainda. Clique em "Anexar" para começar.</p>
               </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map(doc => {
                        const expirationStatus = getExpirationStatus(doc.dueDate);
                        return (
                        <div key={doc.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group">
                            <div 
                                className="h-40 bg-gray-100 relative overflow-hidden cursor-pointer flex items-center justify-center"
                                onClick={() => setViewingDoc(doc)}
                            >
                                {renderThumbnail(doc)}
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                                     <span className="text-white font-medium text-sm flex items-center gap-1">
                                        <Eye size={16} /> Ver Arquivo
                                     </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-brand-dark line-clamp-1" title={doc.title}>{doc.title}</h4>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</span>
                                    {expirationStatus && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${expirationStatus.color}`}>
                                            <Clock size={10} /> {expirationStatus.label}
                                        </span>
                                    )}
                                </div>
                                
                                {doc.description && doc.fileType !== 'text/plain' && (
                                    <p className="text-sm text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded-lg mb-4 h-14">{doc.description}</p>
                                )}
                                {doc.fileType === 'text/plain' && (
                                    <p className="text-xs text-gray-500 italic mb-4">Registro de texto</p>
                                )}
                                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-2">
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => setEditingDoc(doc)}
                                            className="p-2 text-gray-500 hover:text-brand-primary hover:bg-brand-light/30 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleShare(doc)}
                                            className="p-2 text-gray-500 hover:text-brand-primary hover:bg-brand-light/30 rounded-lg transition-colors"
                                            title="Compartilhar/Copiar"
                                        >
                                            <Share2 size={18} />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
          </div>
        )}

      </main>

      {/* Modals */}
      {isCreateFolderOpen && (
        <CreateFolderModal 
          onClose={() => setIsCreateFolderOpen(false)} 
          onCreate={handleCreateFolder} 
        />
      )}

      {editingFolder && (
        <EditFolderModal
            folder={editingFolder}
            onClose={() => setEditingFolder(null)}
            onSave={handleUpdateFolder}
        />
      )}

      {deletingFolder && (
        <DeleteFolderModal
            folderName={deletingFolder.name}
            onClose={() => setDeletingFolder(null)}
            onConfirm={handleDeleteFolderConfirm}
        />
      )}

      {isUploadOpen && (
        <UploadDocumentModal 
          onClose={() => setIsUploadOpen(false)} 
          onUpload={handleUploadDocument} 
        />
      )}
      
      {isScanPdfOpen && (
        <ScanPdfModal
          onClose={() => setIsScanPdfOpen(false)}
          onSave={handleSavePdf}
        />
      )}

      {isMergePdfOpen && (
        <MergePdfModal
          documents={documents}
          onClose={() => setIsMergePdfOpen(false)}
          onMerge={handleSavePdf}
        />
      )}
      
      {viewingDoc && (
        <ImagePreviewModal
            document={viewingDoc}
            onClose={() => setViewingDoc(null)}
        />
      )}

      {editingDoc && (
        <EditDocumentModal
            document={editingDoc}
            onClose={() => setEditingDoc(null)}
            onSave={handleUpdateDocument}
        />
      )}

    </div>
  );
}