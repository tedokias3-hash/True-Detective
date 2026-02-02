
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, Search, Layers, History as TimelineIcon, 
  Upload, Settings, BrainCircuit, 
  Trash2, X, Maximize2, Minimize2, ChevronRight,
  ChevronLeft, FolderOpen, Save,
  Link as LinkIcon, Zap, Camera,
  PlusCircle, MinusCircle, UserRound, FileText, MapPin,
  Home, Edit3, FileDown, Palette, Clock, Check, MoreHorizontal,
  Eye, EyeOff, Hash, ChevronDown, ChevronUp, Share2, MousePointer2, Fingerprint,
  Lightbulb, RefreshCcw, Shield, Activity, Archive, Briefcase, Car, Database, 
  Globe, HardDrive, Lock, Mail, Phone, Smartphone, Truck, Info, Sparkles, Loader2
} from 'lucide-react';
import { NodeType, NodeStatus, EdgeIntensity, InvestigationNode, InvestigationEdge, Case, CustomField, CustomCategory } from './types';
import { NodeCard, IconMap } from './components/NodeCard';
import { processInvestigativeText, extractNodeData } from './services/geminiService';
import { NODE_COLORS, STATUS_COLORS } from './constants';

const RIBBON_COLORS = [
  { name: 'Crime', color: 'bg-rose-500' },
  { name: 'Frio', color: 'bg-blue-400' },
  { name: 'Sigilo', color: 'bg-emerald-500' },
  { name: 'Mistério', color: 'bg-violet-500' },
  { name: 'Alerta', color: 'bg-amber-400' },
  { name: 'Arquivo', color: 'bg-zinc-500' },
];

const THREAD_COLORS = [
  { name: 'Padrão', color: '#a1a1aa' },
  { name: 'Sangue', color: '#e11d48' },
  { name: 'Confirmado', color: '#10b981' },
  { name: 'Alerta', color: '#f59e0b' },
  { name: 'Frio', color: '#3b82f6' },
  { name: 'Oculto', color: '#a855f7' },
];

const CUSTOM_CATEGORY_ICONS = [
  { name: 'Shield', Icon: Shield },
  { name: 'Activity', Icon: Activity },
  { name: 'Archive', Icon: Archive },
  { name: 'Briefcase', Icon: Briefcase },
  { name: 'Camera', Icon: Camera },
  { name: 'Car', Icon: Car },
  { name: 'Database', Icon: Database },
  { name: 'Globe', Icon: Globe },
  { name: 'HardDrive', Icon: HardDrive },
  { name: 'Lock', Icon: Lock },
  { name: 'Mail', Icon: Mail },
  { name: 'Phone', Icon: Phone },
  { name: 'Search', Icon: Search },
  { name: 'Smartphone', Icon: Smartphone },
  { name: 'Truck', Icon: Truck },
  { name: 'Zap', Icon: Zap },
  { name: 'Fingerprint', Icon: Fingerprint },
  { name: 'Lightbulb', Icon: Lightbulb },
  { name: 'Info', Icon: Info }
];

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#71717a'
];

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'editor'>('home');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isExportExpanded, setIsExportExpanded] = useState(false);

  const [cases, setCases] = useState<Case[]>(() => {
    const saved = localStorage.getItem('truedetective_projects');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // States para Auto-Fill de nó individual
  const [isAutoFillOpen, setIsAutoFillOpen] = useState(false);
  const [autoFillInput, setAutoFillInput] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Custom Category State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Shield');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  
  const [isDragging, setIsDragging] = useState<{ 
    id: string, 
    type: 'node' | 'canvas' | 'edge-cp',
    offset: { x: number, y: number }, 
    startClientPos: { x: number, y: number } 
  } | null>(null);
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, zoom: 1 });
  
  const [isConnectionMode, setIsConnectionMode] = useState(false);
  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectCoverInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const activeCase = useMemo(() => 
    cases.find(c => c.id === activeCaseId) || null,
    [cases, activeCaseId]
  );

  useEffect(() => {
    localStorage.setItem('truedetective_projects', JSON.stringify(cases));
  }, [cases]);

  const getRelativeMousePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: e.clientX, y: e.clientY };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const createNewProject = () => {
    const newCase: Case = {
      id: `case-${Date.now()}`,
      name: 'Novo Relatório Investigativo',
      description: 'Defina os objetivos desta análise profunda...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ribbonColor: RIBBON_COLORS[0].color,
      nodes: [],
      edges: [],
      categories: []
    };
    setCases(prev => [newCase, ...prev]);
    setActiveCaseId(newCase.id);
    setView('editor');
  };

  const deleteProject = (id: string) => {
    if (confirm('Deseja arquivar e excluir permanentemente este projeto?')) {
      setCases(prev => prev.filter(c => c.id !== id));
      if (activeCaseId === id) {
        setView('home');
        setActiveCaseId(null);
      }
      setEditingProjectId(null);
    }
  };

  const updateProject = (id: string, updates: Partial<Case>) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
  };

  const handleProjectCoverUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateProject(id, { coverImage: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const addNode = useCallback((type: NodeType | string = NodeType.HYPOTHESIS) => {
    if (!activeCaseId) return;
    const newNode: InvestigationNode = {
      id: `node-${Date.now()}`,
      title: 'Novo Registro',
      description: '',
      type,
      date: new Date().toISOString().split('T')[0],
      tags: [],
      status: NodeStatus.UNCONFIRMED,
      position: { 
        x: (window.innerWidth / 2 - viewTransform.x) / viewTransform.zoom - 100, 
        y: (window.innerHeight / 2 - viewTransform.y) / viewTransform.zoom - 50
      },
      customFields: []
    };
    if (type === NodeType.PERSON) newNode.personFields = { cpf: '', dob: '', age: '' };
    if (type === NodeType.LOCATION) newNode.locationFields = { cep: '', estado: '', municipio: '', logradouro: '', bairro: '', complemento: '', numero: '' };

    setCases(prev => prev.map(c => 
      c.id === activeCaseId ? { ...c, nodes: [...c.nodes, newNode], updatedAt: new Date().toISOString() } : c
    ));
    setSelectedNodeId(newNode.id);
  }, [activeCaseId, viewTransform]);

  const updateNode = useCallback((nodeId: string, updates: Partial<InvestigationNode>) => {
    setCases(prev => prev.map(c => 
      c.id === activeCaseId ? {
        ...c,
        updatedAt: new Date().toISOString(),
        nodes: c.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n)
      } : c
    ));
  }, [activeCaseId]);

  const updateEdge = useCallback((edgeId: string, updates: Partial<InvestigationEdge>) => {
    setCases(prev => prev.map(c => 
      c.id === activeCaseId ? {
        ...c,
        updatedAt: new Date().toISOString(),
        edges: c.edges.map(e => e.id === edgeId ? { ...e, ...updates } : e)
      } : c
    ));
  }, [activeCaseId]);

  const updatePersonFields = useCallback((nodeId: string, fields: Partial<{ cpf?: string; dob?: string; age?: string; }>) => {
    setCases(prev => prev.map(c => 
      c.id === activeCaseId ? {
        ...c,
        updatedAt: new Date().toISOString(),
        nodes: c.nodes.map(n => n.id === nodeId ? { 
          ...n, 
          personFields: { ...(n.personFields || {}), ...fields } 
        } : n)
      } : c
    ));
  }, [activeCaseId]);

  const updateLocationFields = useCallback((nodeId: string, fields: Partial<{ cep?: string; estado?: string; municipio?: string; logradouro?: string; bairro?: string; complemento?: string; numero?: string; }>) => {
    setCases(prev => prev.map(c => 
      c.id === activeCaseId ? {
        ...c,
        updatedAt: new Date().toISOString(),
        nodes: c.nodes.map(n => n.id === nodeId ? { 
          ...n, 
          locationFields: { ...(n.locationFields || {}), ...fields } 
        } : n)
      } : c
    ));
  }, [activeCaseId]);

  const addCustomField = useCallback((nodeId: string) => {
    setCases(prev => prev.map(c => 
      c.id === activeCaseId ? {
        ...c,
        updatedAt: new Date().toISOString(),
        nodes: c.nodes.map(n => n.id === nodeId ? { 
          ...n, 
          customFields: [...(n.customFields || []), { label: '', value: '' }] 
        } : n)
      } : c
    ));
  }, [activeCaseId]);

  const updateCustomField = useCallback((nodeId: string, index: number, updates: Partial<CustomField>) => {
    setCases(prev => prev.map(c => 
      c.id === activeCaseId ? {
        ...c,
        updatedAt: new Date().toISOString(),
        nodes: c.nodes.map(n => n.id === nodeId ? { 
          ...n, 
          customFields: n.customFields?.map((f, i) => i === index ? { ...f, ...updates } : f) 
        } : n)
      } : c
    ));
  }, [activeCaseId]);

  const removeCustomField = useCallback((nodeId: string, index: number) => {
    setCases(prev => prev.map(c => 
      c.id === activeCaseId ? {
        ...c,
        updatedAt: new Date().toISOString(),
        nodes: c.nodes.map(n => n.id === nodeId ? { 
          ...n, 
          customFields: n.customFields?.filter((_, i) => i !== index) 
        } : n)
      } : c
    ));
  }, [activeCaseId]);

  const deleteNode = useCallback((nodeId: string) => {
    setCases(prev => prev.map(c => 
      c.id === activeCaseId ? {
        ...c,
        updatedAt: new Date().toISOString(),
        nodes: c.nodes.filter(n => n.id !== nodeId),
        edges: c.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
      } : c
    ));
    setSelectedNodeId(null);
  }, [activeCaseId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedNodeId) {
      const reader = new FileReader();
      reader.onloadend = () => updateNode(selectedNodeId, { imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const exportAsMapInv = (project: Case) => {
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}.mapinv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportMapInv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (imported.nodes && imported.edges) {
            imported.id = `case-imp-${Date.now()}`;
            setCases(prev => [imported, ...prev]);
            alert('Investigação importada com sucesso.');
          }
        } catch (err) { alert('Falha: Arquivo inválido.'); }
      };
      reader.readAsText(file);
    }
  };

  // Preenchimento Automático por IA (Nó Individual)
  const handleNodeAutoFill = async () => {
    if (!selectedNodeId || !autoFillInput.trim()) return;
    const node = activeCase?.nodes.find(n => n.id === selectedNodeId);
    if (!node) return;

    setIsAutoFilling(true);
    try {
      const extracted = await extractNodeData(autoFillInput, node.type);
      
      // Mesclar dados extraídos com os existentes
      updateNode(selectedNodeId, {
        title: extracted.title || node.title,
        description: extracted.description || node.description,
        date: extracted.date || node.date,
        status: extracted.status || node.status,
        personFields: extracted.personFields ? { ...node.personFields, ...extracted.personFields } : node.personFields,
        locationFields: extracted.locationFields ? { ...node.locationFields, ...extracted.locationFields } : node.locationFields,
        customFields: [...(node.customFields || []), ...(extracted.customFields || [])].filter((v, i, a) => a.findIndex(t => t.label === v.label) === i)
      });
      
      setIsAutoFillOpen(false);
      setAutoFillInput('');
    } catch (err) {
      console.error(err);
      alert('Erro ao processar preenchimento automático. Tente novamente.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Custom Category Creation
  const createCustomCategory = () => {
    if (!newCatName.trim()) return;
    const newCategory: CustomCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName,
      icon: newCatIcon,
      color: newCatColor
    };
    updateProject(activeCaseId!, { 
      categories: [...(activeCase?.categories || []), newCategory] 
    });
    setNewCatName('');
    setIsCategoryModalOpen(false);
  };

  const deleteCustomCategory = (id: string) => {
    if (confirm('Deseja excluir esta categoria? Os nós que a utilizam perderão a formatação específica.')) {
      updateProject(activeCaseId!, { 
        categories: (activeCase?.categories || []).filter(c => c.id !== id) 
      });
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (isConnectionMode) return;
    const pos = getRelativeMousePos(e);
    
    if (e.target === e.currentTarget) {
      setIsDragging({ 
        id: 'canvas', 
        type: 'canvas',
        offset: { x: pos.x - viewTransform.x, y: pos.y - viewTransform.y },
        startClientPos: { x: e.clientX, y: e.clientY }
      });
      setSelectedEdgeId(null);
      setSelectedNodeId(null);
    }
  };

  const onNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const pos = getRelativeMousePos(e);
    const node = activeCase?.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const modelMouseX = (pos.x - viewTransform.x) / viewTransform.zoom;
    const modelMouseY = (pos.y - viewTransform.y) / viewTransform.zoom;

    setIsDragging({
      id: nodeId,
      type: 'node',
      offset: { 
        x: modelMouseX - node.position.x, 
        y: modelMouseY - node.position.y 
      },
      startClientPos: { x: e.clientX, y: e.clientY }
    });
    setSelectedEdgeId(null);
  };

  const onEdgeCPMouseDown = (e: React.MouseEvent, edgeId: string) => {
    e.stopPropagation();
    const pos = getRelativeMousePos(e);
    const edge = activeCase?.edges.find(e => e.id === edgeId);
    if (!edge) return;

    const modelMouseX = (pos.x - viewTransform.x) / viewTransform.zoom;
    const modelMouseY = (pos.y - viewTransform.y) / viewTransform.zoom;

    setIsDragging({
      id: edgeId,
      type: 'edge-cp',
      offset: { x: 0, y: 0 },
      startClientPos: { x: e.clientX, y: e.clientY }
    });
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const pos = getRelativeMousePos(e);
    const modelX = (pos.x - viewTransform.x) / viewTransform.zoom;
    const modelY = (pos.y - viewTransform.y) / viewTransform.zoom;

    if (isConnectionMode) {
      setMousePos({ x: modelX, y: modelY });
    }

    if (!isDragging) return;

    if (isDragging.type === 'canvas') {
      setViewTransform(prev => ({ 
        ...prev, 
        x: pos.x - isDragging.offset.x, 
        y: pos.y - isDragging.offset.y 
      }));
    } else if (isDragging.type === 'node') {
      if (isConnectionMode) return; 
      const newX = modelX - isDragging.offset.x;
      const newY = modelY - isDragging.offset.y;
      updateNode(isDragging.id, { position: { x: newX, y: newY } });
    } else if (isDragging.type === 'edge-cp') {
      updateEdge(isDragging.id, { controlPoint: { x: modelX, y: modelY } });
    }
  };

  const handleNodeClick = (nodeId: string) => {
    if (isConnectionMode) {
      if (!linkingSourceId) {
        setLinkingSourceId(nodeId);
      } else {
        addEdge(linkingSourceId, nodeId);
        setLinkingSourceId(null);
        setIsConnectionMode(false);
      }
    } else {
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(null);
      setIsAutoFillOpen(false); // Resetar auto-fill ao mudar de nó
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      const dist = Math.sqrt(
        Math.pow(e.clientX - isDragging.startClientPos.x, 2) + 
        Math.pow(e.clientY - isDragging.startClientPos.y, 2)
      );

      if (dist < 8 && isDragging.type === 'node') {
        handleNodeClick(isDragging.id);
      }
    }
    setIsDragging(null);
  };

  const addEdge = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const exists = activeCase?.edges.some(e => (e.source === sourceId && e.target === targetId) || (e.source === targetId && e.target === sourceId));
    if (exists) return;
    const newEdge: InvestigationEdge = { 
      id: `edge-${Date.now()}`, 
      source: sourceId, 
      target: targetId, 
      label: 'Conexão', 
      intensity: EdgeIntensity.MEDIUM, 
      notes: '', 
      isBiDirectional: false,
      color: THREAD_COLORS[0].color
    };
    setCases(prev => prev.map(c => c.id === activeCaseId ? { ...c, edges: [...c.edges, newEdge], updatedAt: new Date().toISOString() } : c));
  };

  const deleteEdge = (edgeId: string) => {
    setCases(prev => prev.map(c => c.id === activeCaseId ? { ...c, edges: c.edges.filter(e => e.id !== edgeId), updatedAt: new Date().toISOString() } : c));
    setSelectedEdgeId(null);
  };

  const onWheel = useCallback((e: React.WheelEvent) => {
    const factor = Math.pow(1.1, -e.deltaY / 200);
    const newZoom = Math.min(Math.max(viewTransform.zoom * factor, 0.1), 3);
    setViewTransform(prev => ({ ...prev, zoom: newZoom }));
  }, [viewTransform.zoom]);

  const handleAiProcess = async () => {
    if (!aiInput.trim()) return;
    setIsProcessing(true);
    try {
      const result = await processInvestigativeText(aiInput);
      const newNodes = result.nodes.map((n: any, i: number) => ({
        id: `ai-node-${Date.now()}-${i}`,
        ...n,
        position: { x: 400 + (i * 150), y: 300 + (i * 20) },
        customFields: []
      }));
      setCases(prev => prev.map(c => c.id === activeCaseId ? { ...c, nodes: [...c.nodes, ...newNodes], updatedAt: new Date().toISOString() } : c));
      setIsAiModalOpen(false);
      setAiInput('');
    } catch (err) { console.error(err); }
    finally { setIsProcessing(false); }
  };

  const filteredNodes = useMemo(() => activeCase?.nodes.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase())) || [], [activeCase, searchTerm]);
  const selectedNode = activeCase?.nodes.find(n => n.id === selectedNodeId);
  
  const selectedEdgeIndex = useMemo(() => activeCase?.edges.findIndex(e => e.id === selectedEdgeId) ?? -1, [activeCase, selectedEdgeId]);
  const selectedEdge = activeCase?.edges[selectedEdgeIndex];

  const ProjectSettingsModal = () => {
    const proj = cases.find(c => c.id === editingProjectId);
    if (!proj) return null;
    return (
      <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[150] flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h3 className="text-xl font-bold flex items-center gap-3"><Settings size={22} className="text-zinc-500" /> Detalhes da Investigação</h3>
            <button onClick={() => setEditingProjectId(null)} className="text-zinc-500 hover:text-zinc-100 p-2 hover:bg-zinc-800 rounded-full transition-all"><X size={24} /></button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Título do Caso</label>
              <input type="text" value={proj.name} onChange={(e) => updateProject(proj.id, { name: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-zinc-100 font-semibold outline-none focus:border-zinc-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Resumo Executivo</label>
              <textarea value={proj.description} onChange={(e) => updateProject(proj.id, { description: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-400 outline-none focus:border-zinc-500 h-24 resize-none leading-relaxed font-medium transition-all" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Etiqueta de Identificação</label>
              <div className="flex gap-3 flex-wrap">
                {RIBBON_COLORS.map(rb => (
                  <button key={rb.color} onClick={() => updateProject(proj.id, { ribbonColor: rb.color })} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${rb.color} ${proj.ribbonColor === rb.color ? 'ring-2 ring-zinc-100 shadow-xl scale-110' : 'opacity-30 hover:opacity-100'}`}>
                    {proj.ribbonColor === rb.color && <Check size={18} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-8 border-t border-zinc-800 flex justify-between items-center">
              <button onClick={() => deleteProject(proj.id)} className="flex items-center gap-2 text-zinc-600 hover:text-rose-500 text-xs font-bold uppercase tracking-wider transition-all"><Trash2 size={16} /> Excluir Arquivo</button>
              <button onClick={() => setEditingProjectId(null)} className="px-10 py-3 bg-zinc-100 text-zinc-950 rounded-2xl font-bold text-sm hover:bg-white active:scale-95 transition-all">Salvar Alterações</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const HomeDashboard = () => (
    <div className="flex-1 overflow-y-auto p-12 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-16">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-zinc-100 mb-4 font-['IBM_Plex_Sans']">True Detective</h1>
            <p className="text-zinc-500 font-medium text-lg leading-relaxed max-w-lg">Plataforma analítica para organização de evidências, conexões e descobertas investigativas.</p>
          </div>
          <div className="flex gap-4 mb-2">
            <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-3 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xl font-semibold transition-all border border-zinc-800"><Upload size={18} /> Importar .mapinv</button>
            <button onClick={createNewProject} className="flex items-center gap-3 px-8 py-3 bg-zinc-100 hover:bg-white text-zinc-950 rounded-2xl font-bold shadow-xl transition-all active:scale-95"><Plus size={20} /> Nova Investigação</button>
          </div>
        </header>
        {cases.length === 0 ? (
          <div className="py-32 border border-zinc-800 rounded-[48px] text-center bg-zinc-900/10 flex flex-col items-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 text-zinc-700"><FolderOpen size={40} /></div>
            <h3 className="text-2xl font-bold text-zinc-400 mb-2">Seu arquivo está limpo.</h3>
            <p className="text-zinc-500 mb-8 max-w-xs mx-auto font-medium">Inicie um novo caso ou importe um arquivo existente para começar a conectar os pontos.</p>
            <button onClick={createNewProject} className="text-blue-400 font-bold hover:text-blue-300 transition-colors uppercase tracking-widest text-xs flex items-center gap-2"><Plus size={16} /> Abrir Novo Registro</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {cases.map(proj => (
              <div key={proj.id} onClick={() => { setActiveCaseId(proj.id); setView('editor'); }} className="group relative bg-zinc-900/40 border border-zinc-800 rounded-[32px] overflow-hidden cursor-pointer hover:border-zinc-700 transition-all hover:shadow-2xl flex flex-col h-[420px] duration-500">
                <div className={`absolute top-0 right-10 w-4 h-14 shadow-lg z-10 ${proj.ribbonColor || 'bg-blue-500'} rounded-b-lg opacity-80`}></div>
                <div className="h-52 bg-zinc-800 relative overflow-hidden">
                  {proj.coverImage ? <img src={proj.coverImage} className="w-full h-full object-cover grayscale-[60%] group-hover:grayscale-[20%] transition-all duration-1000" alt="Capa" /> : <div className="w-full h-full flex items-center justify-center opacity-5 text-zinc-100"><Layers size={120} /></div>}
                  <div className="absolute inset-0 bg-gradient-t-t from-zinc-950 via-transparent to-transparent"></div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-zinc-100 group-hover:text-blue-400/80 transition-colors line-clamp-1 leading-tight">{proj.name}</h3>
                    <button onClick={(e) => { e.stopPropagation(); setEditingProjectId(proj.id); }} className="text-zinc-600 hover:text-zinc-100 p-2 rounded-full hover:bg-zinc-800 transition-all"><MoreHorizontal size={20} /></button>
                  </div>
                  <p className="text-zinc-500 text-sm line-clamp-2 mb-8 font-medium leading-relaxed">{proj.description}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-zinc-800/50 pt-5">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest"><Clock size={12} className="opacity-50" /> {new Date(proj.updatedAt).toLocaleDateString('pt-BR')}</div>
                    <div className="px-3 py-1 bg-zinc-800/50 rounded-full text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{proj.nodes.length} NÓS</div>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); projectCoverInputRef.current?.click(); setActiveCaseId(proj.id); }} className="absolute top-6 left-6 p-3 bg-zinc-950/60 backdrop-blur-md rounded-2xl text-zinc-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-800"><Camera size={20} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen w-full bg-[#1a1b1e] text-[#e8e9ed] overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : ''}`}>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={projectCoverInputRef} onChange={(e) => activeCaseId && handleProjectCoverUpload(e, activeCaseId)} accept="image/*" className="hidden" />
      <input type="file" ref={importInputRef} onChange={handleImportMapInv} accept=".mapinv" className="hidden" />

      {editingProjectId && <ProjectSettingsModal />}

      {view === 'home' ? <HomeDashboard /> : (
        <>
          <aside className={`${isSidebarOpen && !isZenMode ? 'w-80' : 'w-0'} transition-all duration-500 border-r border-zinc-800 bg-[#1e1f23] flex flex-col z-50 overflow-hidden`}>
            <div className="p-8 flex items-center justify-between border-b border-zinc-800/50">
              <button onClick={() => setView('home')} className="flex items-center gap-3 group">
                <div className="p-2.5 bg-zinc-900 rounded-xl group-hover:bg-zinc-100 group-hover:text-zinc-950 transition-all duration-300"><Home size={20} /></div>
                <span className="font-bold tracking-tight text-xl uppercase tracking-[0.1em]">True Detective</span>
              </button>
              <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-600 hover:text-zinc-100 transition-all"><ChevronLeft size={24} /></button>
            </div>
            <div className="p-6 flex flex-col gap-8 overflow-y-auto flex-1 custom-scrollbar">
              
              <div className="space-y-2">
                <button 
                  onClick={() => setIsExportExpanded(!isExportExpanded)} 
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 hover:bg-zinc-800 transition-all text-[10px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-800/50"
                >
                  <div className="flex items-center gap-2"><Share2 size={14} /> Arquivo & Ações</div>
                  {isExportExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                {isExportExpanded && (
                  <div className="grid grid-cols-1 gap-1.5 pl-2 animate-in slide-in-from-top-2 duration-300">
                    <button onClick={() => exportAsMapInv(activeCase!)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-all text-[10px] font-semibold text-zinc-400 hover:text-zinc-100">
                      <Save size={14} className="text-zinc-600" /> Exportar .mapinv
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-all text-[10px] font-semibold text-zinc-400 hover:text-zinc-100">
                      <FileDown size={14} className="text-zinc-600" /> Relatório PDF
                    </button>
                  </div>
                )}
              </div>

              <div className="relative group px-1">
                <Search className="absolute left-5 top-3.5 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" size={16} />
                <input type="text" placeholder="Filtrar evidências..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-900/20 border border-zinc-800/50 rounded-xl py-3 pl-12 pr-4 text-xs focus:border-zinc-700 outline-none font-medium transition-all" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] opacity-70">Categorias de Análise</h4>
                  <button onClick={() => setIsCategoryModalOpen(true)} className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-100 transition-all" title="Criar Categoria"><Plus size={14}/></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => addNode(NodeType.PERSON)} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900/20 hover:bg-zinc-800/60 transition-all border border-zinc-800/30 hover:border-zinc-700">
                    <div className="p-1.5 bg-blue-500/10 text-blue-500/70 rounded-lg"><UserRound size={16} /></div>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Pessoa</span>
                  </button>
                  <button onClick={() => addNode(NodeType.EVENT)} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900/20 hover:bg-zinc-800/60 transition-all border border-zinc-800/30 hover:border-zinc-700">
                    <div className="p-1.5 bg-rose-500/10 text-rose-500/70 rounded-lg"><TimelineIcon size={16} /></div>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Evento</span>
                  </button>
                  <button onClick={() => addNode(NodeType.EVIDENCE)} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900/20 hover:bg-zinc-800/60 transition-all border border-zinc-800/30 hover:border-zinc-700">
                    <div className="p-1.5 bg-amber-500/10 text-amber-400/70 rounded-lg"><FileText size={16} /></div>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Prova</span>
                  </button>
                  <button onClick={() => addNode(NodeType.LOCATION)} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900/20 hover:bg-zinc-800/60 transition-all border border-zinc-800/30 hover:border-zinc-700">
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-500/70 rounded-lg"><MapPin size={16} /></div>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Local</span>
                  </button>
                  <button onClick={() => addNode(NodeType.HYPOTHESIS)} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900/20 hover:bg-zinc-800/60 transition-all border border-zinc-800/30 hover:border-zinc-700">
                    <div className="p-1.5 bg-violet-500/10 text-violet-500/70 rounded-lg"><Lightbulb size={16} /></div>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Hipótese</span>
                  </button>
                  <button onClick={() => addNode(NodeType.PISTA)} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900/20 hover:bg-zinc-800/60 transition-all border border-zinc-800/30 hover:border-zinc-700">
                    <div className="p-1.5 bg-cyan-500/10 text-cyan-500/70 rounded-lg"><Fingerprint size={16} /></div>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Pista</span>
                  </button>

                  {/* Custom Categories Buttons */}
                  {activeCase?.categories?.map(cat => {
                    const CategoryIcon = IconMap[cat.icon] || Info;
                    return (
                      <div key={cat.id} className="relative group/cat">
                        <button 
                          onClick={() => addNode(cat.id)} 
                          className="w-full flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900/20 hover:bg-zinc-800/60 transition-all border border-zinc-800/30 hover:border-zinc-700"
                        >
                          <div className="p-1.5 rounded-lg" style={{ backgroundColor: cat.color + '22', color: cat.color }}>
                            <CategoryIcon size={16} />
                          </div>
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter truncate w-full text-center">{cat.name}</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteCustomCategory(cat.id); }}
                          className="absolute -top-1 -right-1 p-1 bg-zinc-950/80 rounded-full text-zinc-600 hover:text-rose-500 opacity-0 group-hover/cat:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-zinc-800/50 bg-zinc-950/20">
               <button onClick={() => setIsAiModalOpen(true)} className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-100 hover:bg-white text-zinc-950 rounded-2xl font-bold text-[10px] uppercase tracking-[0.15em] shadow-xl transition-all active:scale-95"><BrainCircuit size={18} /> Análise IA</button>
            </div>
          </aside>

          <main className="flex-1 relative overflow-hidden flex flex-col bg-[#1a1b1e]" ref={containerRef}>
            <div className={`absolute top-8 left-8 z-40 flex items-center gap-6 no-print transition-all duration-700 ${isZenMode ? 'opacity-0 -translate-y-10' : 'opacity-100'}`}>
              {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-3.5 bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-2xl hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all"><ChevronRight size={24} /></button>}
              <div className="px-8 py-4 bg-zinc-900/70 backdrop-blur-2xl rounded-[28px] border border-zinc-800/80 shadow-2xl flex items-center gap-6">
                <div className={`w-3 h-10 rounded-full ${activeCase?.ribbonColor || 'bg-blue-500'} opacity-70`}></div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-100 tracking-tight leading-none mb-1.5">{activeCase?.name}</h2>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{activeCase?.nodes.length} NÓS INVESTIGADOS</div>
                </div>
                <div className="w-[1px] h-8 bg-zinc-800 mx-2"></div>
                <button onClick={() => setEditingProjectId(activeCaseId)} className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-100 transition-all" title="Configurar Investigação"><Edit3 size={18} /></button>
                <button onClick={() => setIsZenMode(!isZenMode)} className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-100 transition-all" title="Modo Foco">{isZenMode ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            {selectedNode && !isZenMode && (
              <div className="absolute top-8 right-8 w-[440px] max-w-[calc(100vw-32px)] bg-zinc-900/90 backdrop-blur-3xl border border-zinc-800 shadow-2xl rounded-[40px] z-[60] flex flex-col overflow-hidden max-h-[calc(100vh-64px)] animate-in slide-in-from-right duration-500 no-print">
                <div className="p-8 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/40">
                   <h3 className="font-bold flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-zinc-500">Perfil da Entidade</h3>
                   <button onClick={() => setSelectedNodeId(null)} className="p-2.5 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-100 transition-all"><X size={22} /></button>
                </div>
                <div className="p-10 flex flex-col gap-10 overflow-y-auto custom-scrollbar">
                  
                  {/* Bloco de Preenchimento IA - Individual */}
                  <div className="bg-zinc-950/40 p-6 rounded-[32px] border border-zinc-800/60 shadow-inner group">
                    {!isAutoFillOpen ? (
                      <button 
                        onClick={() => setIsAutoFillOpen(true)}
                        className="w-full flex items-center justify-between text-zinc-500 group-hover:text-zinc-100 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-400/10 text-amber-400 rounded-xl"><Sparkles size={20} /></div>
                          <div className="text-left">
                            <span className="text-[10px] font-black uppercase tracking-widest block">Preenchimento IA</span>
                            <span className="text-[8px] text-zinc-600 font-bold uppercase">Cole informações brutas aqui</span>
                          </div>
                        </div>
                        <ChevronDown size={18} />
                      </button>
                    ) : (
                      <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/40">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80 px-2">Dados da Investigação</span>
                          <button 
                            onClick={() => setIsAutoFillOpen(false)} 
                            className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-600 hover:text-zinc-300 transition-colors"
                          >
                            <X size={16}/>
                          </button>
                        </div>
                        <div className="space-y-2">
                          <textarea 
                            value={autoFillInput}
                            onChange={(e) => setAutoFillInput(e.target.value)}
                            className="w-full min-h-[160px] bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-xs font-medium text-zinc-200 focus:border-amber-400/50 outline-none transition-all resize-none shadow-inner placeholder:text-zinc-700 leading-relaxed"
                            placeholder="Cole aqui: Nome, CPF, endereço, observações, datas relevantes, depoimentos..."
                          />
                          <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest px-2 text-center">A IA irá distribuir os dados automaticamente nos campos abaixo.</p>
                        </div>
                        <button 
                          onClick={handleNodeAutoFill}
                          disabled={isAutoFilling || !autoFillInput.trim()}
                          className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all shadow-xl active:scale-95"
                        >
                          {isAutoFilling ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                          Distribuir Informações
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Evidência Visual</label>
                    <div className="flex flex-col gap-5">
                      {selectedNode.imageUrl && (
                        <div className="relative group rounded-[32px] overflow-hidden h-72 bg-zinc-950 border border-zinc-800">
                          <img src={selectedNode.imageUrl} className="w-full h-full object-contain grayscale-[30%] opacity-80" alt="Preview" />
                          <button onClick={() => updateNode(selectedNode.id, { imageUrl: undefined })} className="absolute top-5 right-5 p-2.5 bg-rose-600/80 backdrop-blur-md rounded-full text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all"><X size={18} /></button>
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-4">
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-3 py-5 border border-zinc-800 rounded-3xl text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-300"><Camera size={18} /> Enviar Arquivo</button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Identificador</label>
                      <input type="text" value={selectedNode.title} onChange={(e) => updateNode(selectedNode.id, { title: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-zinc-100 font-bold outline-none focus:border-zinc-600 transition-all shadow-inner" />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Rótulo de Status (ex: Sob Análise)</label>
                      <input type="text" placeholder="Sob Análise" value={selectedNode.statusLabel || ''} onChange={(e) => updateNode(selectedNode.id, { statusLabel: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-100 outline-none focus:border-zinc-600 transition-all" />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Observações</label>
                      <textarea rows={4} value={selectedNode.description} onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-sm text-zinc-400 outline-none resize-none focus:border-zinc-600 leading-relaxed font-medium shadow-inner" />
                    </div>

                    {selectedNode.type === NodeType.PERSON && (
                      <div className="p-6 bg-zinc-950/40 rounded-3xl border border-zinc-800/50 space-y-6">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2"><UserRound size={14} /> Dados da Pessoa</label>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase">CPF</label>
                          <input type="text" placeholder="000.000.000-00" value={selectedNode.personFields?.cpf || ''} onChange={(e) => updatePersonFields(selectedNode.id, { cpf: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-zinc-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-600 uppercase">Nascimento</label>
                            <input type="text" placeholder="DD/MM/AAAA" value={selectedNode.personFields?.dob || ''} onChange={(e) => updatePersonFields(selectedNode.id, { dob: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-zinc-600" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-600 uppercase">Idade</label>
                            <input type="text" value={selectedNode.personFields?.age || ''} onChange={(e) => updatePersonFields(selectedNode.id, { age: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-zinc-600" />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === NodeType.LOCATION && (
                      <div className="p-6 bg-zinc-950/40 rounded-3xl border border-zinc-800/50 space-y-6">
                        <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2"><MapPin size={14} /> Dados do Local</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-600 uppercase">CEP</label>
                            <input type="text" placeholder="00000-000" value={selectedNode.locationFields?.cep || ''} onChange={(e) => updateLocationFields(selectedNode.id, { cep: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-zinc-600" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-600 uppercase">Estado</label>
                            <input type="text" placeholder="Ex: SP" value={selectedNode.locationFields?.estado || ''} onChange={(e) => updateLocationFields(selectedNode.id, { estado: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-zinc-600" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase">Município</label>
                          <input type="text" placeholder="Ex: São Paulo" value={selectedNode.locationFields?.municipio || ''} onChange={(e) => updateLocationFields(selectedNode.id, { municipio: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-zinc-600" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase">Logradouro</label>
                          <input type="text" placeholder="Ex: Av. Paulista" value={selectedNode.locationFields?.logradouro || ''} onChange={(e) => updateLocationFields(selectedNode.id, { logradouro: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-zinc-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-600 uppercase">Bairro</label>
                            <input type="text" placeholder="Ex: Centro" value={selectedNode.locationFields?.bairro || ''} onChange={(e) => updateLocationFields(selectedNode.id, { bairro: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-zinc-600" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-600 uppercase">Número</label>
                            <input type="text" value={selectedNode.locationFields?.numero || ''} onChange={(e) => updateLocationFields(selectedNode.id, { numero: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-zinc-600" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase">Complemento</label>
                          <input type="text" placeholder="Ex: Apto 101" value={selectedNode.locationFields?.complemento || ''} onChange={(e) => updateLocationFields(selectedNode.id, { complemento: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none focus:border-zinc-600" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Campos Extras</label><button onClick={() => addCustomField(selectedNode.id)} className="p-2 text-zinc-500 hover:text-zinc-100 transition-all"><PlusCircle size={22} /></button></div>
                      {selectedNode.customFields?.map((field, idx) => (
                        <div key={idx} className="flex gap-4 items-end bg-zinc-950/20 p-4 rounded-2xl border border-zinc-800/50">
                          <div className="flex-1 space-y-2">
                            <input placeholder="Rótulo" value={field.label} onChange={(e) => updateCustomField(selectedNode.id, idx, { label: e.target.value })} className="w-full bg-transparent border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase outline-none focus:border-zinc-600" />
                            <input placeholder="Valor" value={field.value} onChange={(e) => updateCustomField(selectedNode.id, idx, { value: e.target.value })} className="w-full bg-transparent text-xs font-medium text-zinc-300 outline-none" />
                          </div>
                          <button onClick={() => removeCustomField(selectedNode.id, idx)} className="text-zinc-700 hover:text-rose-500 transition-all"><MinusCircle size={20} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-10 border-t border-zinc-800/50">
                    <button onClick={() => deleteNode(selectedNode.id)} className="w-full flex items-center justify-center gap-3 py-5 text-zinc-600 hover:text-rose-500 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500/5 rounded-3xl transition-all"><Trash2 size={18} /> Expurgar Registro</button>
                  </div>
                </div>
              </div>
            )}

            {selectedEdge && (
              <div className="absolute top-8 right-8 w-80 bg-zinc-900/95 backdrop-blur-3xl border border-zinc-800 shadow-2xl rounded-[32px] z-[60] flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 no-print">
                <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/40">
                  <h3 className="font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500"><LinkIcon size={14} /> Fio de Conexão</h3>
                  <button onClick={() => setSelectedEdgeId(null)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-100 transition-all"><X size={18} /></button>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Rótulo da Ligação</label>
                    <input type="text" value={selectedEdge.label} onChange={(e) => updateEdge(selectedEdge.id, { label: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 font-bold outline-none focus:border-zinc-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Sequência Cronológica</label>
                    <input 
                      type="number" 
                      value={selectedEdge.customOrder ?? (selectedEdgeIndex + 1)} 
                      onChange={(e) => updateEdge(selectedEdge.id, { customOrder: parseInt(e.target.value) || undefined })} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 font-bold outline-none focus:border-zinc-600" 
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Cor do Fio</label>
                    <div className="flex gap-2 flex-wrap">
                      {THREAD_COLORS.map(tc => (
                        <button key={tc.color} onClick={() => updateEdge(selectedEdge.id, { color: tc.color })} className={`w-8 h-8 rounded-full border-2 transition-all ${selectedEdge.color === tc.color ? 'border-zinc-100 scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`} style={{ backgroundColor: tc.color }} title={tc.name} />
                      ))}
                    </div>
                  </div>
                  <button onClick={() => updateEdge(selectedEdge.id, { controlPoint: undefined })} className="w-full flex items-center justify-center gap-2 py-4 text-zinc-500 hover:text-amber-400 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400/5 rounded-2xl transition-all border border-transparent hover:border-amber-400/20">
                    <RefreshCcw size={16} /> Resetar Curvatura
                  </button>
                  <button onClick={() => deleteEdge(selectedEdge.id)} className="w-full flex items-center justify-center gap-2 py-4 text-zinc-500 hover:text-rose-500 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500/5 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"><Trash2 size={16} /> Cortar Conexão</button>
                </div>
              </div>
            )}

            {isZenMode && <button onClick={() => setIsZenMode(false)} className="absolute top-8 right-8 z-50 p-4 bg-zinc-900/80 backdrop-blur-xl rounded-full text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-all shadow-2xl border border-zinc-800"><Eye size={24} /></button>}

            <div 
                className={`w-full h-full relative ${isConnectionMode ? 'cursor-alias' : 'cursor-crosshair'} bg-[#1a1b1e] [background-image:radial-gradient(#2d2e32_1px,transparent_1px)] [background-size:48px_48px]`} 
                onMouseDown={onMouseDown} 
                onMouseMove={onMouseMove} 
                onMouseUp={onMouseUp} 
                onWheel={onWheel}
            >
              <div 
                className="absolute" 
                style={{ 
                  transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.zoom})`, 
                  transformOrigin: '0 0', 
                  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                  willChange: 'transform'
                }}
              >
                <svg className="absolute overflow-visible pointer-events-none" style={{ zIndex: 0, top: -5000, left: -5000, width: 10000, height: 10000 }}>
                  {isConnectionMode && linkingSourceId && activeCase?.nodes.find(n => n.id === linkingSourceId) && (
                      <line 
                        x1={activeCase.nodes.find(n => n.id === linkingSourceId)!.position.x + 144 + 5000} 
                        y1={activeCase.nodes.find(n => n.id === linkingSourceId)!.position.y + 70 + 5000} 
                        x2={mousePos.x + 5000} 
                        y2={mousePos.y + 5000} 
                        stroke="#fbbf24" 
                        strokeWidth="3" 
                        strokeDasharray="8,8" 
                        className="animate-pulse shadow-xl"
                      />
                  )}

                  {activeCase?.edges.map((edge, index) => {
                    const s = activeCase.nodes.find(n => n.id === edge.source);
                    const t = activeCase.nodes.find(n => n.id === edge.target);
                    if (!s || !t) return null;
                    
                    const x1 = s.position.x + 144 + 5000; 
                    const y1 = s.position.y + 70 + 5000;
                    const x2 = t.position.x + 144 + 5000; 
                    const y2 = t.position.y + 70 + 5000;
                    
                    const dist = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
                    const sag = Math.min(100, dist * 0.15);
                    
                    const mx = edge.controlPoint ? edge.controlPoint.x + 5000 : (x1 + x2) / 2;
                    const my = edge.controlPoint ? edge.controlPoint.y + 5000 : (y1 + y2) / 2 + (y2 > y1 ? sag : -sag);
                    
                    const cx = 2 * mx - 0.5 * x1 - 0.5 * x2;
                    const cy = 2 * my - 0.5 * y1 - 0.5 * y2;
                    
                    const edgeColor = edge.color || THREAD_COLORS[0].color;
                    const isEdgeSelected = selectedEdgeId === edge.id;
                    const isBeingDragged = isDragging?.id === edge.id && isDragging?.type === 'edge-cp';

                    return (
                      <g key={edge.id} className="group pointer-events-auto" onClick={(e) => { e.stopPropagation(); setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}>
                        <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} fill="none" stroke="transparent" strokeWidth="32" className="cursor-pointer" />
                        
                        {isEdgeSelected && (
                          <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} fill="none" stroke={edgeColor} strokeWidth="12" className="opacity-20 blur-md no-print" />
                        )}

                        <path 
                          d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} 
                          fill="none" 
                          stroke={edgeColor} 
                          strokeWidth={isEdgeSelected ? 5 : (edge.intensity === EdgeIntensity.STRONG ? 4 : 2)} 
                          className={`transition-all duration-300 no-print ${isEdgeSelected ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'group-hover:opacity-100 group-hover:stroke-white/60'}`} 
                        />
                        
                        <g 
                          transform={`translate(${mx}, ${my})`} 
                          onMouseDown={(e) => onEdgeCPMouseDown(e, edge.id)}
                          className="no-print cursor-move"
                        >
                          <circle r={isBeingDragged ? 18 : 14} fill={edgeColor} className={`transition-all duration-300 ${isBeingDragged ? 'opacity-40 animate-pulse' : 'opacity-0 group-hover:opacity-20'}`} />
                          
                          <circle 
                            r="12" 
                            fill={isEdgeSelected || isBeingDragged ? "#fff" : "#1a1b1e"} 
                            stroke={edgeColor} 
                            strokeWidth="2" 
                            className={`shadow-2xl transition-all duration-300 ${isBeingDragged ? 'scale-125' : 'group-hover:scale-110'}`} 
                          />
                          
                          <text 
                            dy=".35em" 
                            textAnchor="middle" 
                            className={`text-[10px] font-black tracking-tighter select-none pointer-events-none transition-colors duration-300 ${isEdgeSelected || isBeingDragged ? 'fill-zinc-950' : 'fill-zinc-100'}`}
                          >
                            {edge.customOrder ?? (index + 1)}
                          </text>
                        </g>

                        <text 
                          x={mx} 
                          y={my - 18} 
                          textAnchor="middle" 
                          className="text-[9px] font-bold uppercase tracking-widest fill-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none"
                        >
                          {edge.label}
                        </text>

                        {!isEdgeSelected && !isBeingDragged && (
                          <g className="opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer" onClick={(e) => { e.stopPropagation(); deleteEdge(edge.id); }}>
                             <circle cx={mx + 20} cy={my - 20} r="8" fill="#e11d48" className="shadow-lg" />
                             <X x={mx+15} y={my-25} size={10} className="text-white" />
                          </g>
                        )}
                        
                        <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} fill="none" stroke="#000" strokeWidth="1" className="print-only" />
                      </g>
                    );
                  })}
                </svg>
                {filteredNodes.map(node => (
                  <NodeCard 
                    key={node.id} 
                    node={node} 
                    isSelected={selectedNodeId === node.id} 
                    isLinkingSource={linkingSourceId === node.id} 
                    connectionMode={isConnectionMode} 
                    isDragging={isDragging?.id === node.id && isDragging?.type === 'node'} 
                    onMouseDown={onNodeMouseDown}
                    customCategories={activeCase?.categories}
                  />
                ))}
              </div>
            </div>

            <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 p-4 bg-zinc-900/60 backdrop-blur-2xl rounded-[32px] border border-zinc-800/80 shadow-2xl no-print transition-all duration-700 ${isZenMode ? 'opacity-30 hover:opacity-100 translate-y-4 hover:translate-y-0' : 'opacity-100'}`}>
                <button 
                  onClick={() => { setSelectedEdgeId(null); setSelectedNodeId(null); setIsConnectionMode(false); }} 
                  className={`p-4 rounded-2xl transition-all duration-300 ${!selectedEdgeId && !selectedNodeId && !isConnectionMode ? 'bg-zinc-100 text-zinc-950' : 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-100'}`}
                  title="Seleção Livre"
                >
                  <MousePointer2 size={24} />
                </button>
                
                <button onClick={() => { setIsConnectionMode(!isConnectionMode); setLinkingSourceId(null); setSelectedEdgeId(null); }} className={`p-4 rounded-2xl transition-all duration-300 relative ${isConnectionMode ? 'bg-amber-400 text-zinc-950 scale-110 shadow-xl' : 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-100'}`} title="Vincular">
                  <LinkIcon size={24} />
                  {isConnectionMode && !linkingSourceId && <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-amber-400 text-zinc-950 px-3 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap animate-bounce">SELECIONE ORIGEM</span>}
                  {isConnectionMode && linkingSourceId && <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-amber-400 text-zinc-950 px-3 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap animate-pulse">CLIQUE NO DESTINO</span>}
                </button>
                <div className="w-[1px] h-10 bg-zinc-800 mx-2"></div>
                <button onClick={() => setViewTransform(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.1, 3) }))} className="p-4 hover:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-zinc-100 transition-all"><Plus size={24} /></button>
                <button onClick={() => setViewTransform(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.1, 0.1) }))} className="p-4 hover:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-zinc-100 transition-all"><MinusCircle size={24} /></button>
                <button onClick={() => setViewTransform({ x: 0, y: 0, zoom: 1 })} className="p-4 hover:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-zinc-100 transition-all"><Maximize2 size={24} /></button>
            </div>
          </main>

          {/* New Category Modal */}
          {isCategoryModalOpen && (
            <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[160] flex items-center justify-center p-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <h3 className="text-xl font-bold flex items-center gap-3"><Palette size={22} className="text-zinc-500" /> Nova Categoria</h3>
                  <button onClick={() => setIsCategoryModalOpen(false)} className="text-zinc-500 hover:text-zinc-100 p-2 hover:bg-zinc-800 rounded-full transition-all"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Nome</label>
                    <input 
                      type="text" 
                      value={newCatName} 
                      onChange={(e) => setNewCatName(e.target.value)} 
                      placeholder="Ex: Transações Suspeitas"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-zinc-100 font-semibold outline-none focus:border-zinc-500 transition-all" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Ícone</label>
                    <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 border border-zinc-800 rounded-2xl custom-scrollbar bg-zinc-950">
                      {CUSTOM_CATEGORY_ICONS.map(({ name, Icon }) => (
                        <button 
                          key={name}
                          onClick={() => setNewCatIcon(name)}
                          className={`flex items-center justify-center p-3 rounded-xl transition-all ${newCatIcon === name ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
                        >
                          <Icon size={20} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Cor</label>
                    <div className="flex flex-wrap gap-2 p-1">
                      {PRESET_COLORS.map(color => (
                        <button 
                          key={color}
                          onClick={() => setNewCatColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${newCatColor === color ? 'border-zinc-100 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={createCustomCategory}
                      className="w-full py-4 bg-zinc-100 text-zinc-950 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-white active:scale-95 transition-all shadow-xl"
                    >
                      Criar Categoria
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAiModalOpen && (
            <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-[150] flex items-center justify-center p-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-[48px] w-full max-w-2xl overflow-hidden flex flex-col shadow-[0_0_120px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-500">
                <div className="p-10 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/20">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-zinc-100 text-zinc-950 rounded-2xl shadow-xl"><BrainCircuit size={32} /></div>
                    <div><h3 className="text-2xl font-bold uppercase tracking-tight text-zinc-100">Motor de Análise</h3><p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Geração de Conexões</p></div>
                  </div>
                  <button onClick={() => setIsAiModalOpen(false)} className="p-3 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-all"><X size={32} /></button>
                </div>
                <div className="p-12 space-y-8">
                  <textarea className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-[32px] p-8 text-sm focus:border-zinc-600 outline-none resize-none font-medium leading-relaxed shadow-inner placeholder:text-zinc-700 transition-all" placeholder="Descreva o cenário..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} />
                  <button onClick={handleAiProcess} disabled={isProcessing || !aiInput.trim()} className="w-full py-6 bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 rounded-[28px] font-bold uppercase tracking-[0.25em] flex items-center justify-center gap-4 transition-all text-sm active:scale-95 shadow-2xl">
                    {isProcessing ? <div className="flex items-center gap-3"><div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-950 rounded-full animate-spin"></div><span>Analisando...</span></div> : <><Zap size={22} /> Processar Inteligência</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
