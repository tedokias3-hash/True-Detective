
export enum NodeType {
  PERSON = 'pessoa',
  EVENT = 'evento',
  LOCATION = 'local',
  EVIDENCE = 'prova',
  HYPOTHESIS = 'hipotese',
  PISTA = 'pista'
}

export enum NodeStatus {
  CONFIRMED = 'confirmado',
  UNCONFIRMED = 'pendente',
  HYPOTHESIS = 'hipotese'
}

export enum EdgeIntensity {
  WEAK = 'fraca',
  MEDIUM = 'media',
  STRONG = 'forte'
}

export interface CustomField {
  label: string;
  value: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  icon: string; // Key for IconMap
  color: string; // Hex color
}

export interface InvestigationNode {
  id: string;
  type: NodeType | string; // Supports standard enums or custom category IDs
  title: string;
  description: string;
  date: string;
  tags: string[];
  status: NodeStatus;
  statusLabel?: string;
  position: { x: number; y: number };
  imageUrl?: string;
  personFields?: {
    cpf?: string;
    dob?: string;
    age?: string;
  };
  locationFields?: {
    cep?: string;
    estado?: string;
    municipio?: string;
    logradouro?: string;
    bairro?: string;
    complemento?: string;
    numero?: string;
  };
  customFields?: CustomField[];
  metadata?: Record<string, any>;
}

export interface InvestigationEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  intensity: EdgeIntensity;
  notes: string;
  isBiDirectional: boolean;
  color?: string;
  controlPoint?: { x: number; y: number };
  customOrder?: number;
}

export interface Case {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
  ribbonColor?: string;
  nodes: InvestigationNode[];
  edges: InvestigationEdge[];
  categories?: CustomCategory[];
}

export interface InvestigationState {
  cases: Case[];
  activeCaseId: string | null;
}
