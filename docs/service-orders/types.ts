/**
 * Types compartilhados entre os componentes de Service Orders
 */

export type OSType = "preventiva" | "chamado" | "corretiva";

export type ElevatorState = "funcionando" | "dependendo-corretiva" | "parado" | null;

export type ChecklistStatus = "conforme" | "nao-conforme" | "na" | null;

export interface ChecklistItem {
  id: number;
  label: string;
  status: ChecklistStatus;
}

export interface HistoryEntry {
  date: string;
  time: string;
  technician: string;
  summary: string;
  details: string;
}

export interface OSBaseData {
  osNumber: string;
  clientName: string;
  equipment: string;
  technician: string;
  status: string;
}

export interface PreventiveOSData extends OSBaseData {
  type: "preventiva";
  checklist: ChecklistItem[];
  observations?: string;
}

export interface CallOSData extends OSBaseData {
  type: "chamado";
  clientDescription: string;
  requesterName: string;
  requesterPhone: string;
  technicalReport?: {
    workDone: string;
    observations: string;
  };
}

export interface CorrectiveOSData extends OSBaseData {
  type: "corretiva";
  clientDescription: string;
  requesterName: string;
  requesterPhone: string;
  technicalReport?: {
    workDone: string;
    observations: string;
  };
}

export type ServiceOrderData = PreventiveOSData | CallOSData | CorrectiveOSData;
