
import { NodeType, NodeStatus, EdgeIntensity } from './types';

export const NODE_COLORS: Record<NodeType, string> = {
  [NodeType.PERSON]: 'bg-blue-500/80',
  [NodeType.EVENT]: 'bg-rose-500/80',
  [NodeType.LOCATION]: 'bg-emerald-500/80',
  [NodeType.EVIDENCE]: 'bg-amber-500/80',
  [NodeType.HYPOTHESIS]: 'bg-violet-500/80',
  [NodeType.PISTA]: 'bg-cyan-500/80',
};

export const STATUS_COLORS: Record<NodeStatus, string> = {
  [NodeStatus.CONFIRMED]: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  [NodeStatus.UNCONFIRMED]: 'text-zinc-400 border-zinc-700 bg-zinc-800/20',
  [NodeStatus.HYPOTHESIS]: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
};

export const INTENSITY_STYLES: Record<EdgeIntensity, string> = {
  [EdgeIntensity.WEAK]: 'border-dotted',
  [EdgeIntensity.MEDIUM]: 'border-dashed',
  [EdgeIntensity.STRONG]: 'border-solid',
};

export const DEFAULT_POSITION = { x: 100, y: 100 };
