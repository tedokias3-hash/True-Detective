
import React from 'react';
import { 
  User, Calendar, MapPin, FileText, Lightbulb, 
  CheckCircle2, HelpCircle, AlertTriangle, 
  Fingerprint, Hash, Info, Shield, Activity, 
  Archive, Briefcase, Camera, Car, Database, 
  Globe, HardDrive, Lock, Mail, Phone, Search, 
  Smartphone, Truck, Zap
} from 'lucide-react';
import { InvestigationNode, NodeType, NodeStatus, CustomCategory } from '../types';
import { NODE_COLORS, STATUS_COLORS } from '../constants';

interface NodeCardProps {
  node: InvestigationNode;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  isSelected: boolean;
  isLinkingSource: boolean;
  connectionMode: boolean;
  isDragging: boolean;
  customCategories?: CustomCategory[];
}

// Map of available icons for both standard and custom categories
export const IconMap: Record<string, any> = {
  [NodeType.PERSON]: User,
  [NodeType.EVENT]: Calendar,
  [NodeType.LOCATION]: MapPin,
  [NodeType.EVIDENCE]: FileText,
  [NodeType.HYPOTHESIS]: Lightbulb,
  [NodeType.PISTA]: Fingerprint,
  'Shield': Shield,
  'Activity': Activity,
  'Archive': Archive,
  'Briefcase': Briefcase,
  'Camera': Camera,
  'Car': Car,
  'Database': Database,
  'Globe': Globe,
  'HardDrive': HardDrive,
  'Lock': Lock,
  'Mail': Mail,
  'Phone': Phone,
  'Search': Search,
  'Smartphone': Smartphone,
  'Truck': Truck,
  'Zap': Zap,
};

const StatusIcon = {
  [NodeStatus.CONFIRMED]: CheckCircle2,
  [NodeStatus.UNCONFIRMED]: HelpCircle,
  [NodeStatus.HYPOTHESIS]: AlertTriangle,
};

const DefaultStatusLabel = {
  [NodeStatus.CONFIRMED]: 'Confirmado',
  [NodeStatus.UNCONFIRMED]: 'Sob Análise',
  [NodeStatus.HYPOTHESIS]: 'Hipótese',
};

const DataField: React.FC<{ label: string; value?: string; fullWidth?: boolean }> = ({ label, value, fullWidth }) => {
  if (!value || value.trim() === "") return null;
  return (
    <div className={`flex flex-col mb-2 ${fullWidth ? 'w-full' : 'w-[calc(50%-4px)]'}`}>
      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">
        {label}
      </span>
      <span className="text-[10px] text-zinc-200 font-semibold leading-tight break-words">
        {value}
      </span>
    </div>
  );
};

export const NodeCard: React.FC<NodeCardProps> = ({ 
  node, 
  onMouseDown, 
  isSelected, 
  isLinkingSource, 
  connectionMode, 
  isDragging,
  customCategories 
}) => {
  const customCat = customCategories?.find(c => c.id === node.type);
  
  const Icon = customCat ? (IconMap[customCat.icon] || Info) : (IconMap[node.type as NodeType] || Info);
  const SIcon = StatusIcon[node.status];
  const displayStatus = node.statusLabel || DefaultStatusLabel[node.status];

  // Colors
  const bgColorStyle = customCat ? { backgroundColor: customCat.color + 'CC' } : undefined;
  const bgColorClass = !customCat ? (NODE_COLORS[node.type as NodeType] || 'bg-zinc-700') : '';

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, node.id)}
      style={{ 
        left: node.position.x, 
        top: node.position.y,
        zIndex: isDragging ? 1000 : (isSelected ? 500 : 100),
        transition: isDragging ? 'none' : 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        willChange: isDragging ? 'top, left' : 'auto'
      }}
      className={`absolute w-72 rounded-2xl border select-none overflow-hidden flex flex-col
        ${isSelected ? 'border-blue-500/50 shadow-lg ring-1 ring-blue-500/20' : 'border-zinc-800 shadow-md'}
        ${isLinkingSource ? 'border-amber-400 ring-2 ring-amber-400/20' : ''}
        ${isDragging ? 'cursor-grabbing shadow-2xl scale-[1.02] bg-zinc-800/95' : (connectionMode ? 'cursor-alias hover:scale-105' : 'cursor-grab hover:border-zinc-600')}
        bg-zinc-900/95 backdrop-blur-xl group`}
    >
      {node.imageUrl && (
        <div className="w-full h-36 overflow-hidden bg-zinc-950 relative pointer-events-none border-b border-zinc-800">
          <img 
            src={node.imageUrl} 
            alt={node.title} 
            className="w-full h-full object-cover grayscale-[40%] opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
        </div>
      )}

      <div className="p-4 pointer-events-none flex-1">
        <div className="flex items-center justify-between mb-3">
          <div 
            className={`p-1.5 rounded-lg text-zinc-100 shadow-sm ${bgColorClass}`}
            style={bgColorStyle}
          >
            <Icon size={16} />
          </div>
          <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[node.status]}`}>
            <SIcon size={10} />
            {displayStatus}
          </div>
        </div>

        <h3 className="text-zinc-100 font-bold text-sm mb-3 tracking-tight leading-tight border-b border-zinc-800/50 pb-2">
          {node.title}
        </h3>
        
        {node.type === NodeType.PERSON && node.personFields && (
          <div className="flex flex-wrap gap-x-2 mb-2 bg-blue-500/5 p-2 rounded-xl border border-blue-500/10">
            <DataField label="CPF" value={node.personFields.cpf} fullWidth />
            <DataField label="Nascimento" value={node.personFields.dob} />
            <DataField label="Idade" value={node.personFields.age ? `${node.personFields.age} anos` : undefined} />
          </div>
        )}

        {node.type === NodeType.LOCATION && node.locationFields && (
          <div className="flex flex-wrap gap-x-2 mb-2 bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
            <DataField label="Logradouro" value={node.locationFields.logradouro} fullWidth />
            <DataField label="Número" value={node.locationFields.numero} />
            <DataField label="Bairro" value={node.locationFields.bairro} />
            <DataField label="CEP" value={node.locationFields.cep} />
            <DataField label="Município" value={node.locationFields.municipio} />
            <DataField label="Estado" value={node.locationFields.estado} />
            <DataField label="Complemento" value={node.locationFields.complemento} fullWidth />
          </div>
        )}

        {node.description && (
          <div className="mb-3">
            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Notas de Campo</span>
            <p className="text-zinc-400 text-[11px] leading-snug font-medium line-clamp-4 italic border-l-2 border-zinc-700 pl-2">
              {node.description}
            </p>
          </div>
        )}

        {node.customFields && node.customFields.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800/50 flex flex-wrap gap-x-2">
            {node.customFields.map((field, idx) => (
              <DataField key={idx} label={field.label || "Campo Extra"} value={field.value} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-zinc-600 text-[9px] font-black border-t border-zinc-800 pt-3 mt-3 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="opacity-40" />
            <span>{node.date || 'S/D'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash size={11} className="opacity-40" />
            <span>{node.id.split('-').pop()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
