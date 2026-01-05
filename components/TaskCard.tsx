
import React, { useState } from 'react';
import { Task, Priority } from '../types';
import { ICONS } from '../constants';
import Button from './Button';
import { getTaskBreakdown } from '../services/geminiService';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete, onEdit }) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [breakdown, setBreakdown] = useState<{ steps: string[], tips: string } | null>(null);

  const priorityColors = {
    [Priority.LOW]: "bg-blue-50 text-blue-600",
    [Priority.MEDIUM]: "bg-amber-50 text-amber-600",
    [Priority.HIGH]: "bg-rose-50 text-rose-600"
  };

  const handleAIHelp = async () => {
    if (breakdown) {
      setBreakdown(null);
      return;
    }
    setLoadingAI(true);
    const result = await getTaskBreakdown(task.title, task.description);
    if (result) setBreakdown(result);
    setLoadingAI(false);
  };

  return (
    <div className={`group bg-white border border-slate-100 rounded-xl p-4 transition-all hover:shadow-sm ${
      task.completed ? 'animate-task-complete opacity-75' : 'hover:border-slate-200'
    }`}>
      <div className="flex items-start gap-3">
        <button 
          onClick={() => onToggle(task.id)}
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
            task.completed 
            ? 'bg-emerald-500 border-emerald-500 text-white scale-110' 
            : 'border-slate-300 hover:border-slate-400 hover:scale-105'
          }`}
        >
          {task.completed && <ICONS.Check />}
        </button>

        <div className="flex-grow">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium px-2 py-0.5 rounded-full transition-opacity duration-300 ${priorityColors[task.priority]} ${task.completed ? 'opacity-50' : 'opacity-100'}`}>
              {task.priority}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" onClick={handleAIHelp} className="p-1 h-8 w-8" disabled={loadingAI || task.completed}>
                <ICONS.Sparkles />
              </Button>
              <Button variant="ghost" onClick={() => onEdit(task)} className="p-1 h-8 w-8">
                <ICONS.Edit />
              </Button>
              <Button variant="ghost" onClick={() => onDelete(task.id)} className="p-1 h-8 w-8 text-rose-500 hover:text-rose-600">
                <ICONS.Trash />
              </Button>
            </div>
          </div>
          
          <h3 className={`text-slate-800 font-medium transition-all duration-500 ${task.completed ? 'line-through text-slate-400 opacity-60' : 'text-slate-800'}`}>
            {task.title}
          </h3>
          
          {task.description && (
            <p className={`text-sm mt-1 line-clamp-2 transition-all duration-500 ${task.completed ? 'text-slate-300' : 'text-slate-500'}`}>
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <ICONS.Calendar />
              <span>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {breakdown && !task.completed && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <ICONS.Sparkles /> Sugestão FocusFlow:
              </p>
              <ul className="space-y-1.5 mb-3">
                {breakdown.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold mt-0.5">{idx + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
              <div className="p-2 bg-white border border-slate-100 rounded text-xs italic text-slate-500">
                💡 {breakdown.tips}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
