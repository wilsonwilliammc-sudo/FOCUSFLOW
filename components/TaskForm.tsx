
import React, { useState } from 'react';
import { Task, Priority } from '../types';
import Button from './Button';
import { ICONS } from '../constants';

interface TaskFormProps {
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onCancel: () => void;
  initialData?: Task;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSave, onCancel, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<Priority>(initialData?.priority || Priority.MEDIUM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, description, dueDate, priority });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <form 
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-none animate-in zoom-in-95 duration-200"
      >
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {initialData ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h2>
            <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <ICONS.X />
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">O que vais estudar?</label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Prova de Biologia"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all placeholder:text-slate-300"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notas (opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes importantes..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quando?</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Prioridade</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value={Priority.LOW}>Baixa</option>
                  <option value={Priority.MEDIUM}>Média</option>
                  <option value={Priority.HIGH}>Alta</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="flex-1 sm:flex-none px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 active:scale-95 transition-all"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
