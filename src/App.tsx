import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  User,
  Plus,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Share2,
  Edit3,
  Trash2,
  Search,
  Filter,
  Bell,
  Loader2,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabaseClient';
import { useAuth } from './lib/authContext';
import { Login } from './components/Login';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// --- Types ---

type Status = 'pending' | 'in_progress' | 'completed' | 'closed_house';

interface Photo {
  id: number;
  visit_id: number;
  url: string;
  caption: string;
  created_at: string;
}

interface Visit {
  id: number;
  report_number: string;
  status: Status;
  address: string;
  short_description: string;
  problem_description: string;
  actions_taken: string;
  observations: string;
  created_at: string;
  updated_at: string;
  photos?: Photo[];
}

type Screen = 'dashboard' | 'reports' | 'form' | 'gallery' | 'preview' | 'calendar' | 'profile';

// --- Components ---

const StatusBadge = ({ status }: { status: Status }) => {
  const styles = {
    pending: 'bg-orange-100 text-ios-orange',
    in_progress: 'bg-blue-100 text-ios-blue',
    completed: 'bg-green-100 text-ios-green',
    closed_house: 'bg-slate-100 text-slate-500',
  };

  const labels = {
    pending: 'Pendente',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    closed_house: 'Casa Fechada',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const Dashboard = ({ visits, setScreen, setSelectedVisitId, signOut }: {
  visits: Visit[],
  setScreen: (s: Screen) => void,
  setSelectedVisitId: (id: number | null) => void,
  signOut: () => Promise<void>
}) => {
  const stats = {
    pending: visits.filter(v => v.status === 'pending').length,
    active: visits.filter(v => v.status === 'in_progress').length,
    done: visits.filter(v => v.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 safe-top">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight font-display">Visitas Técnicas</h1>
          <button 
            onClick={() => signOut()}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 text-slate-500 active:bg-slate-200 transition-colors"
          >
            <LogIn className="h-5 w-5 rotate-180" />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6 pb-24">
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <span className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Pendentes</span>
            <span className="text-2xl font-bold text-ios-orange">{stats.pending}</span>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <span className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Ativas</span>
            <span className="text-2xl font-bold text-ios-blue">{stats.active}</span>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <span className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Concluídas</span>
            <span className="text-2xl font-bold text-ios-green">{stats.done}</span>
          </div>
        </section>

        <button
          onClick={() => { setSelectedVisitId(null); setScreen('form'); }}
          className="w-full bg-ios-blue hover:bg-blue-600 active:scale-[0.98] transition-all text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
          <span>Agendar Nova Visita</span>
        </button>

        <section className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-lg font-bold">Atividade Recente</h2>
            <button onClick={() => setScreen('reports')} className="text-ios-blue text-sm font-medium">Ver Tudo</button>
          </div>
          <div className="space-y-3">
            {visits.slice(0, 5).map(visit => (
              <article
                key={visit.id}
                onClick={() => { setSelectedVisitId(visit.id); setScreen('preview'); }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 active:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${visit.status === 'completed' ? 'bg-green-50 text-ios-green' :
                    visit.status === 'in_progress' ? 'bg-blue-50 text-ios-blue' : 'bg-orange-50 text-ios-orange'
                  }`}>
                  {visit.status === 'completed' ? <CheckCircle2 className="h-6 w-6" /> :
                    visit.status === 'in_progress' ? <Clock className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 truncate max-w-[150px]">{visit.short_description || 'Sem Descrição'}</h3>
                    <StatusBadge status={visit.status} />
                  </div>
                  <p className="text-sm text-slate-500 truncate">{visit.address || 'Endereço não informado'}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(visit.created_at).toLocaleDateString()}</p>
                </div>
              </article>
            ))}
            {visits.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                Nenhuma visita encontrada.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

const ReportsList = ({ visits, setScreen, setSelectedVisitId }: {
  visits: Visit[],
  setScreen: (s: Screen) => void,
  setSelectedVisitId: (id: number | null) => void
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = 
      visit.report_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.short_description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || visit.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusLabels: Record<string, string> = {
    'pending': 'Pendente',
    'in_progress': 'Em Andamento',
    'completed': 'Concluído',
    'closed_house': 'Casa Fechada'
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 safe-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => setScreen('dashboard')} className="p-2 -ml-2 text-ios-blue">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold font-display">Relatórios</h1>
          <button className="p-2 -mr-2 text-ios-blue">
            <Bell className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-24">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por número ou endereço"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-ios-blue shadow-sm text-sm outline-none"
          />
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <button 
            onClick={() => setStatusFilter(null)}
            className={`flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition-all ${
              statusFilter === null 
                ? 'bg-ios-blue text-white shadow-md' 
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            Todos
          </button>
          {Object.entries(statusLabels).map(([value, label]) => (
            <button 
              key={value} 
              onClick={() => setStatusFilter(statusFilter === value ? null : value)}
              className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 text-sm font-medium transition-all ${
                statusFilter === value 
                  ? 'bg-ios-blue text-white shadow-md' 
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              <span>{label}</span>
              {statusFilter === value ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 rotate-90 opacity-40" />}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredVisits.map(visit => (
            <div
              key={visit.id}
              onClick={() => { setSelectedVisitId(visit.id); setScreen('preview'); }}
              className={`bg-white p-4 rounded-xl shadow-sm border-l-4 transition-transform active:scale-[0.98] cursor-pointer ${visit.status === 'completed' ? 'border-ios-green' :
                  visit.status === 'in_progress' ? 'border-ios-blue' :
                    visit.status === 'pending' ? 'border-ios-orange' : 'border-slate-400'
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-900">Relatório #{visit.report_number}</h3>
                  <p className="text-xs text-slate-500">{new Date(visit.created_at).toLocaleString()}</p>
                </div>
                <StatusBadge status={visit.status} />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                <MapPin className="h-4 w-4 text-ios-blue" />
                <span className="truncate">{visit.address}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex -space-x-2">
                  <div className="size-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold">TC</div>
                </div>
                <button className="text-ios-blue text-xs font-bold flex items-center gap-1">
                  DETALHES <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          {filteredVisits.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-slate-100 size-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-slate-400 size-8" />
              </div>
              <h3 className="text-slate-900 font-bold">Nenhum resultado</h3>
              <p className="text-slate-500 text-sm mt-1">
                {searchTerm || statusFilter 
                  ? 'Tente ajustar os filtros para encontrar o que procura.' 
                  : 'Nenhuma visita registrada ainda.'}
              </p>
              {(searchTerm || statusFilter) && (
                <button 
                  onClick={() => { setSearchTerm(''); setStatusFilter(null); }}
                  className="mt-4 text-ios-blue font-bold text-sm uppercase tracking-wider"
                >
                  Limpar tudo
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const VisitForm = ({
  selectedVisit,
  selectedVisitId,
  setScreen,
  handleUpdateVisit,
  handleCreateVisit
}: {
  selectedVisit?: Visit,
  selectedVisitId: number | null,
  setScreen: (s: Screen) => void,
  handleUpdateVisit: (id: number, data: Partial<Visit>) => Promise<void>,
  handleCreateVisit: (data: Partial<Visit>) => Promise<void>
}) => {
  const [formData, setFormData] = useState<Partial<Visit>>(
    selectedVisit || {
      status: 'pending',
      address: '',
      short_description: '',
      problem_description: '',
      actions_taken: '',
      observations: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVisitId) {
      handleUpdateVisit(selectedVisitId, formData);
    } else {
      handleCreateVisit(formData);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <header className="bg-material-primary text-white p-4 shadow-md sticky top-0 z-50 flex items-center" style={{ backgroundColor: '#6200ee' }}>
        <button onClick={() => setScreen('dashboard')} className="p-2 mr-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-medium">Formulário de Visita Técnica</h1>
      </header>

      <main className="max-w-md mx-auto p-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-medium px-1">Número do Relatório</label>
              <input
                className="bg-gray-100 border-b-2 border-gray-300 p-2 focus:outline-none text-gray-600 rounded-t cursor-not-allowed"
                readOnly
                value={formData.report_number || 'AUTO-GERADO'}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-medium px-1">Data e Hora</label>
              <input
                className="bg-gray-100 border-b-2 border-gray-300 p-2 focus:outline-none text-gray-600 rounded-t cursor-not-allowed"
                readOnly
                value={new Date().toLocaleString()}
              />
            </div>
          </section>

          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6 border border-slate-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as Status })}
                className="w-full border-b-2 border-gray-300 focus:border-ios-blue focus:ring-0 transition-colors p-2 bg-transparent outline-none"
              >
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluído</option>
                <option value="closed_house">Casa Fechada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Digite o endereço completo"
                className="w-full border-b-2 border-gray-300 focus:border-ios-blue focus:ring-0 transition-colors p-2 bg-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta</label>
              <input
                type="text"
                value={formData.short_description}
                onChange={e => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Resumo curto da visita"
                className="w-full border-b-2 border-gray-300 focus:border-ios-blue focus:ring-0 transition-colors p-2 bg-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Problema</label>
              <textarea
                value={formData.problem_description}
                onChange={e => setFormData({ ...formData, problem_description: e.target.value })}
                placeholder="Descreva os problemas encontrados..."
                rows={3}
                className="w-full border-b-2 border-gray-300 focus:border-ios-blue focus:ring-0 transition-colors p-2 bg-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ações Realizadas</label>
              <textarea
                value={formData.actions_taken}
                onChange={e => setFormData({ ...formData, actions_taken: e.target.value })}
                placeholder="Passos realizados durante a visita..."
                rows={3}
                className="w-full border-b-2 border-gray-300 focus:border-ios-blue focus:ring-0 transition-colors p-2 bg-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                value={formData.observations}
                onChange={e => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Quaisquer notas adicionais..."
                rows={2}
                className="w-full border-b-2 border-gray-300 focus:border-ios-blue focus:ring-0 transition-colors p-2 bg-transparent outline-none resize-none"
              />
            </div>
          </div>

          {selectedVisitId && (
            <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wider">Documentação Fotográfica</h2>
              <div className="grid grid-cols-3 gap-3">
                <div
                  onClick={() => setScreen('gallery')}
                  className="aspect-square bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <Camera className="text-ios-blue h-8 w-8" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Add Foto</span>
                </div>
              </div>
            </section>
          )}

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200">
            <button
              type="submit"
              className="w-full bg-ios-blue text-white py-4 px-6 rounded-full font-bold uppercase tracking-wide shadow-lg active:scale-95 transition-transform flex items-center justify-center"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {selectedVisitId ? 'Atualizar Relatório' : 'Gerar Relatório'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

const PhotoGallery = ({ selectedVisitId, setScreen }: { selectedVisitId: number, setScreen: (s: Screen) => void }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('visit_id', selectedVisitId);

    if (error) {
      console.error('Error fetching photos:', error);
      return;
    }
    setPhotos(data || []);
  };

  useEffect(() => {
    fetchPhotos();
  }, [selectedVisitId]);

  const handleAddPhoto = async () => {
    if (!newPhotoUrl) return;
    try {
      const { error } = await supabase
        .from('photos')
        .insert([{ 
          visit_id: selectedVisitId, 
          url: newPhotoUrl, 
          caption: 'Nova Foto',
          user_id: (await supabase.auth.getUser()).data.user?.id 
        }]);

      if (!error) {
        setNewPhotoUrl('');
        fetchPhotos();
      }
    } catch (err) {
      console.error('Failed to add photo', err);
    }
  };

  const handleDeletePhoto = async (id: number) => {
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);

      if (!error) fetchPhotos();
    } catch (err) {
      console.error('Failed to delete photo', err);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm safe-top">
        <div className="flex items-center space-x-2">
          <button onClick={() => setScreen('form')} className="p-1 -ml-1 text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Fotos da Visita Técnica</h1>
        </div>
        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">{photos.length} Fotos</span>
      </header>

      <main className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {photos.map(photo => (
            <article key={photo.id} className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group">
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-40 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(photo.created_at).toLocaleDateString()}</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{photo.caption}</p>
              </div>
              <button
                onClick={() => handleDeletePhoto(photo.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>

        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Adicionar Foto via URL</h3>
          <input
            type="text"
            value={newPhotoUrl}
            onChange={e => setNewPhotoUrl(e.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
          />
          <button
            onClick={handleAddPhoto}
            className="w-full bg-ios-blue text-white py-2 rounded-lg text-sm font-bold"
          >
            Adicionar Foto
          </button>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 pb-8 flex justify-center items-center">
        <button className="flex items-center justify-center space-x-2 bg-ios-blue hover:bg-blue-700 active:scale-95 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all w-full max-w-xs">
          <Plus className="h-6 w-6" strokeWidth={2.5} />
          <span>Adicionar Fotos</span>
        </button>
      </div>
    </div>
  );
};

const VisitPreview = ({ selectedVisit, setScreen }: { selectedVisit: Visit, setScreen: (s: Screen) => void }) => {
  const reportRef = React.useRef<HTMLDivElement>(null);
  const [includeObservations, setIncludeObservations] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);

    // Inject a style tag that overrides all oklch CSS variables from Tailwind v4
    // with hex equivalents, because html2canvas cannot parse oklch().
    const overrideStyle = document.createElement('style');
    overrideStyle.id = '__pdf-oklch-fix__';
    overrideStyle.innerHTML = `
      *, *::before, *::after {
        --color-slate-50: #f8fafc !important;
        --color-slate-100: #f1f5f9 !important;
        --color-slate-200: #e2e8f0 !important;
        --color-slate-300: #cbd5e1 !important;
        --color-slate-400: #94a3b8 !important;
        --color-slate-500: #64748b !important;
        --color-slate-600: #475569 !important;
        --color-slate-700: #334155 !important;
        --color-slate-800: #1e293b !important;
        --color-slate-900: #0f172a !important;
        --color-gray-50: #f9fafb !important;
        --color-gray-100: #f3f4f6 !important;
        --color-gray-200: #e5e7eb !important;
        --color-gray-300: #d1d5db !important;
        --color-gray-400: #9ca3af !important;
        --color-gray-500: #6b7280 !important;
        --color-gray-600: #4b5563 !important;
        --color-gray-700: #374151 !important;
        --color-gray-800: #1f2937 !important;
        --color-gray-900: #111827 !important;
        --color-red-50: #fef2f2 !important;
        --color-red-100: #fee2e2 !important;
        --color-red-400: #f87171 !important;
        --color-red-500: #ef4444 !important;
        --color-red-600: #dc2626 !important;
        --color-blue-50: #eff6ff !important;
        --color-blue-100: #dbeafe !important;
        --color-blue-400: #60a5fa !important;
        --color-blue-500: #3b82f6 !important;
        --color-blue-600: #2563eb !important;
        --color-blue-700: #1d4ed8 !important;
        --color-green-50: #f0fdf4 !important;
        --color-green-100: #dcfce7 !important;
        --color-green-500: #22c55e !important;
        --color-green-600: #16a34a !important;
        --color-orange-50: #fff7ed !important;
        --color-orange-100: #ffedd5 !important;
        --color-orange-500: #f97316 !important;
        --color-orange-600: #ea580c !important;
        --color-white: #ffffff !important;
        --color-black: #000000 !important;
      }
    `;
    document.head.appendChild(overrideStyle);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgAspectRatio = canvas.width / canvas.height;
      // Calculate dimensions that fit within a single A4 page
      let imgWidth = pageWidth;
      let imgHeight = pageWidth / imgAspectRatio;
      if (imgHeight > pageHeight) {
        imgHeight = pageHeight;
        imgWidth = pageHeight * imgAspectRatio;
      }
      // Center horizontally if narrower than page
      const xOffset = (pageWidth - imgWidth) / 2;
      pdf.addImage(imgData, "PNG", xOffset, 0, imgWidth, imgHeight);
      pdf.save(`Relatorio_${selectedVisit.report_number}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      // Always remove the override style tag, even if an error occurred
      document.getElementById('__pdf-oklch-fix__')?.remove();
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen">
      <nav className="flex justify-between items-center mb-6 max-w-3xl mx-auto print:hidden">
        <button onClick={() => setScreen('dashboard')} className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          Voltar
        </button>
        <div className="flex gap-2">
          <button 
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="bg-ios-blue text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Share2 className="h-5 w-5" />
            {isGenerating ? 'Gerando...' : 'Compartilhar PDF'}
          </button>
          <button
            onClick={() => setScreen('form')}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-900 transition-colors flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-semibold text-slate-700">Incluir Observações no PDF</span>
          <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 transition-colors has-[:checked]:bg-ios-blue">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={includeObservations}
              onChange={(e) => setIncludeObservations(e.target.checked)}
            />
            <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
          </div>
        </label>
      </div>

      <main ref={reportRef} className="max-w-3xl mx-auto bg-white p-6 md:p-10 shadow-lg rounded-sm border border-slate-200">
        <header className="border-b-2 border-gray-100 pb-6 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight font-display">Relatório de Visita Técnica</h1>
            <p className="text-gray-500 mt-1">Ref: #{selectedVisit.report_number}</p>
          </div>
          <div className="text-right">
            <StatusBadge status={selectedVisit.status} />
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Data da Visita</label>
              <p className="text-gray-800 font-medium">{new Date(selectedVisit.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Número do Serviço</label>
              <p className="text-gray-800 font-medium">{selectedVisit.report_number}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Endereço</label>
            <p className="text-gray-800 font-medium leading-relaxed">{selectedVisit.address}</p>
          </div>
        </section>

        <section className="space-y-8 mb-10">
          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-400">
            <label className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Problema Identificado</label>
            <p className="text-gray-700 italic">"{selectedVisit.problem_description || 'Nenhum problema descrito.'}"</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Ações Realizadas</h3>
            <div className="text-gray-700 whitespace-pre-wrap">{selectedVisit.actions_taken || 'Nenhuma ação registrada.'}</div>
          </div>

          {includeObservations && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Observações Finais</h3>
              <p className="text-gray-600">{selectedVisit.observations || 'Nenhuma observação final.'}</p>
            </div>
          )}
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Assinatura do Técnico</p>
            <div className="h-16 w-48 border-b-2 border-gray-300 flex items-end pb-2 italic text-gray-400">
              Assinado Eletronicamente
            </div>
            <p className="text-sm text-gray-600 mt-2">JD - FieldSync Pro</p>
          </div>
          <div className="text-right md:flex md:flex-col md:justify-end">
            <p className="text-xs text-gray-400">Relatório gerado via FieldSync Pro</p>
            <p className="text-xs text-gray-400">Hora: {new Date().toLocaleTimeString()}</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVisits = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*, photos(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (err) {
      console.error('Failed to fetch visits', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVisits();
    }
  }, [user]);

  const selectedVisit = visits.find(v => v.id === selectedVisitId);

  const handleCreateVisit = async (data: Partial<Visit>) => {
    try {
      const report_number = `TV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error } = await supabase
        .from('visits')
        .insert([{ ...data, report_number, user_id: user.id }]);

      if (error) throw error;
      await fetchVisits();
      setScreen('dashboard');
    } catch (err: any) {
      console.error('Failed to create visit', err);
      alert('Erro ao salvar visita: ' + (err.message || JSON.stringify(err)));
    }
  };

  const handleUpdateVisit = async (id: number, data: Partial<Visit>) => {
    try {
      // Remove restricted fields before update to avoid conflicts with Supabase/PostgreSQL
      const { photos, id: _id, created_at, ...updateData } = data as any;
      const { error } = await supabase
        .from('visits')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchVisits();
      setScreen('dashboard');
    } catch (err: any) {
      console.error('Failed to update visit', err);
      alert('Erro ao atualizar visita: ' + (err.message || JSON.stringify(err)));
    }
  };

  const handleDeleteVisit = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta visita?')) return;
    try {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchVisits();
      setScreen('dashboard');
    } catch (err) {
      console.error('Failed to delete visit', err);
    }
  };

  // --- Main Layout ---

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-ios-blue">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-ios-gray relative overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {screen === 'dashboard' && <Dashboard visits={visits} setScreen={setScreen} setSelectedVisitId={setSelectedVisitId} signOut={signOut} />}
          {screen === 'reports' && <ReportsList visits={visits} setScreen={setScreen} setSelectedVisitId={setSelectedVisitId} />}
          {screen === 'form' && (
            <VisitForm
              selectedVisit={selectedVisit}
              selectedVisitId={selectedVisitId}
              setScreen={setScreen}
              handleUpdateVisit={handleUpdateVisit}
              handleCreateVisit={handleCreateVisit}
            />
          )}
          {screen === 'gallery' && selectedVisitId && <PhotoGallery selectedVisitId={selectedVisitId} setScreen={setScreen} />}
          {screen === 'preview' && selectedVisit && <VisitPreview selectedVisit={selectedVisit} setScreen={setScreen} />}
          {screen === 'calendar' && <div className="p-8 text-center">Vista de Calendário (Em breve)</div>}
          {screen === 'profile' && <div className="p-8 text-center">Vista de Perfil (Em breve)</div>}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      {['dashboard', 'reports', 'calendar', 'profile'].includes(screen) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 safe-bottom z-50">
          <div className="flex justify-around items-center py-2 max-w-md mx-auto">
            <button
              onClick={() => setScreen('dashboard')}
              className={`flex flex-col items-center gap-1 ${screen === 'dashboard' ? 'text-ios-blue' : 'text-slate-400'}`}
            >
              <LayoutDashboard className="h-6 w-6" />
              <span className="text-[10px] font-medium">Início</span>
            </button>
            <button
              onClick={() => setScreen('reports')}
              className={`flex flex-col items-center gap-1 ${screen === 'reports' ? 'text-ios-blue' : 'text-slate-400'}`}
            >
              <ClipboardList className="h-6 w-6" />
              <span className="text-[10px] font-medium">Relatórios</span>
            </button>
            <button
              onClick={() => setScreen('calendar')}
              className={`flex flex-col items-center gap-1 ${screen === 'calendar' ? 'text-ios-blue' : 'text-slate-400'}`}
            >
              <Calendar className="h-6 w-6" />
              <span className="text-[10px] font-medium">Agenda</span>
            </button>
            <button
              onClick={() => setScreen('profile')}
              className={`flex flex-col items-center gap-1 ${screen === 'profile' ? 'text-ios-blue' : 'text-slate-400'}`}
            >
              <User className="h-6 w-6" />
              <span className="text-[10px] font-medium">Perfil</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
