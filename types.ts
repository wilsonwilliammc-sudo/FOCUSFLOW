
export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: Priority;
  completed: boolean;
  createdAt: number;
}

export type SortOption = 'date' | 'priority' | 'status';

export interface SuggestionResponse {
  steps: string[];
  tips: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
