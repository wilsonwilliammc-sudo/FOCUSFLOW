
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, SortOption } from './types';
import { ICONS } from './constants';
import Button from './components/Button';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import ChatWidget from './components/ChatWidget';
import { getDailyMotivation, getSmartPriorities } from './services/geminiService';

const STORAGE_KEY = 'focusflow_tasks_v1';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [motivation, setMotivation] = useState<string>('');
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Daily Motivation
  useEffect(() => {
    const fetchMotivation = async () => {
      const today = new Date().toDateString();
      const lastQuoteDate = localStorage.getItem('focusflow_quote_date');
      const lastQuote = localStorage.getItem('focusflow_quote');

      if (lastQuoteDate === today && lastQuote) {
        setMotivation(lastQuote);
      } else {
        const quote = await getDailyMotivation(tasks.filter(t => !t.completed).length);
        setMotivation(quote);
        localStorage.setItem('focusflow_quote', quote);
        localStorage.setItem('focusflow_quote_date', today);
      }
    };
    fetchMotivation();
  }, [tasks.length]);

  const handleSmartPriority = async () => {
    setIsLoadingAI(true);
    const pendingTasks = tasks.filter(t => !t.completed);
    const plan = await getSmartPriorities(pendingTasks);
    setAiPlan(plan);
    setIsLoadingAI(false);
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTasks = tasks.filter(t => t.dueDate === today);
    const totalToday = todaysTasks.length;
    const completedToday = todaysTasks.filter(t => t.completed).length;
    
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, pending: total - completed, totalToday, completedToday, progress };
  }, [tasks]);

  const sortedTasks = useMemo(() => {
    let filtered = tasks;
    if (filter === 'pending') filtered = tasks.filter(t => !t.completed);
    if (filter === 'completed') filtered = tasks.filter(t => t.completed);

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortBy === 'priority') {
        const order = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2 };
        return order[a.priority] - order[b.priority];
      }
      return Number(a.completed) - Number(b.completed);
    });
  }, [tasks, sortBy, filter]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: Task = { ...taskData, id: crypto.randomUUID(), completed: false, createdAt: Date.now() };
    setTasks(prev => [newTask, ...prev]);
    setIsFormOpen(false);
  };

  const updateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    if (!editingTask) return;
    setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    setEditingTask(undefined);
  };

  const deleteTask = (id: string) => {
    if (confirm('Deseja excluir esta tarefa?')) setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4">
        <div className="max-w-4xl mx-auto h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm">
              <ICONS.Brain />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">FocusFlow</h1>
          </div>
          <Button onClick={() => setIsFormOpen(true)} icon={<ICONS.Plus />} className="text-sm px-3 sm:px-4">
            <span className="hidden sm:inline">Nova Tarefa</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-6 sm:py-8 flex-grow">
        
        {/* Motivation Banner & Progress */}
        <section className="flex flex-col gap-4 mb-8">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[140px] sm:min-h-[180px]">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <ICONS.Sparkles />
             </div>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Estuda com Alma</p>
             <h2 className="text-xl sm:text-2xl font-semibold leading-tight italic">
               "{motivation || "Prepara o café, vamos começar..."}"
             </h2>
          </div>

          <div className="bg-emerald-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mb-1">O Teu Progresso</p>
                <h3 className="text-3xl font-black tracking-tight">{stats.progress}%</h3>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl">
                <ICONS.Check />
              </div>
            </div>
            <div className="w-full bg-emerald-700/50 h-2.5 rounded-full overflow-hidden">
              <div className="bg-white h-full transition-all duration-1000 ease-out" style={{ width: `${stats.progress}%` }} />
            </div>
          </div>
        </section>

        {/* Dashboard Stats - Dynamic Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
           {[
             { label: 'Total', value: stats.total, color: 'slate-900' },
             { label: 'Pendentes', value: stats.pending, color: 'slate-900' },
             { label: 'Feitas', value: stats.completed, color: 'emerald-600' },
             { label: 'Hoje', value: stats.totalToday, color: 'blue-600' }
           ].map((stat, i) => (
             <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
             </div>
           ))}
        </section>

        {/* AI SMART PLAN */}
        <section className="mb-10">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ICONS.Brain />
                   </div>
                   <h3 className="font-bold text-slate-900 tracking-tight">Coach de Prioridades</h3>
                </div>
                <button 
                  onClick={handleSmartPriority} 
                  disabled={isLoadingAI || tasks.length === 0}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all shadow-md"
                >
                  {isLoadingAI ? "A ler os teus planos..." : "O que fazer agora?"}
                </button>
             </div>
             
             {aiPlan ? (
               <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-slate-700 text-sm animate-in fade-in slide-in-from-top-2">
                 <p className="leading-relaxed">✨ {aiPlan}</p>
               </div>
             ) : (
               <p className="text-slate-400 text-xs sm:text-sm italic px-1">
                 Deixa a IA analisar os teus prazos e sugerir o melhor caminho para hoje.
               </p>
             )}
          </div>
        </section>

        {/* Filters and Task List */}
        <section className="mb-6 space-y-4">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
            <div className="flex min-w-full sm:min-w-0">
              {(['all', 'pending', 'completed'] as const).map((f) => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${filter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : 'Concluídas'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
            <span>Ordenar:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-slate-900 focus:outline-none cursor-pointer border-b-2 border-slate-200 pb-0.5"
            >
              <option value="date">Data</option>
              <option value="priority">Prioridade</option>
              <option value="status">Status</option>
            </select>
          </div>
        </section>

        <section className="space-y-4 pb-20">
          {sortedTasks.length > 0 ? (
            sortedTasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onEdit={setEditingTask} />
            ))
          ) : (
            <div className="text-center py-16 sm:py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <ICONS.Calendar />
              </div>
              <p className="text-slate-600 font-bold">Tudo limpo!</p>
              <p className="text-slate-400 text-xs mt-1">Cria a tua primeira meta de estudos.</p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Chat Widget */}
      <ChatWidget />

      {(isFormOpen || editingTask) && (
        <TaskForm onSave={editingTask ? updateTask : addTask} onCancel={() => { setIsFormOpen(false); setEditingTask(undefined); }} initialData={editingTask} />
      )}

      <footer className="py-8 text-center bg-slate-100/50">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">FocusFlow &bull; Powered by Gemini 3</p>
      </footer>
    </div>
  );
};

export default App;
