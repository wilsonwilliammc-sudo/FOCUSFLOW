
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
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm">
              <ICONS.Brain />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">FocusFlow</h1>
          </div>
          <Button onClick={() => setIsFormOpen(true)} icon={<ICONS.Plus />}>
            Nova Tarefa
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-grow">
        
        {/* Daily Motivation & AI Coach */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[180px]">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                <ICONS.Sparkles />
             </div>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Inspiração do Dia</p>
             <h2 className="text-2xl font-semibold leading-tight italic">
               "{motivation || "Carregando motivação..."}"
             </h2>
          </div>

          <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between">
            <div>
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-2">Progresso Diário</p>
              <h3 className="text-4xl font-black">{stats.progress}%</h3>
            </div>
            <div className="w-full bg-emerald-700/50 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-white h-full transition-all duration-1000" style={{ width: `${stats.progress}%` }} />
            </div>
            <p className="text-emerald-100 text-xs mt-4">
              {stats.completed} de {stats.total} tarefas concluídas
            </p>
          </div>
        </section>

        {/* Dashboard Stats Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <div className="bg-white border border-slate-200 p-4 rounded-2xl">
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
           </div>
           <div className="bg-white border border-slate-200 p-4 rounded-2xl">
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
           </div>
           <div className="bg-white border border-slate-200 p-4 rounded-2xl">
              <p className="text-emerald-600 text-xs font-bold uppercase mb-1">Concluídas</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
           </div>
           <div className="bg-white border border-slate-200 p-4 rounded-2xl">
              <p className="text-blue-600 text-xs font-bold uppercase mb-1">Hoje</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalToday}</p>
           </div>
        </section>

        {/* AI SMART PLAN */}
        <section className="mb-10">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ICONS.Brain />
                   </div>
                   <h3 className="font-bold text-slate-900">Coach de Prioridades (IA)</h3>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={handleSmartPriority} 
                  disabled={isLoadingAI || tasks.length === 0}
                  className="text-sm"
                >
                  {isLoadingAI ? "Analisando..." : "Analisar minhas tarefas"}
                </Button>
             </div>
             
             {aiPlan ? (
               <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-slate-700 text-sm animate-in fade-in slide-in-from-top-2">
                 <p className="leading-relaxed">✨ {aiPlan}</p>
               </div>
             ) : (
               <p className="text-slate-400 text-sm italic">
                 Clique no botão acima para que a IA analise seus prazos e prioridades e sugira o melhor caminho.
               </p>
             )}
          </div>
        </section>

        {/* Filters and Task List */}
        <section className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {(['all', 'pending', 'completed'] as const).map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${filter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : 'Feitas'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Ordenar:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-slate-900 focus:outline-none cursor-pointer border-b border-slate-300 pb-0.5"
            >
              <option value="date">Data</option>
              <option value="priority">Prioridade</option>
              <option value="status">Status</option>
            </select>
          </div>
        </section>

        <section className="space-y-4">
          {sortedTasks.length > 0 ? (
            sortedTasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onEdit={setEditingTask} />
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <ICONS.Calendar />
              </div>
              <p className="text-slate-500 font-medium">Nada por aqui ainda.</p>
              <p className="text-slate-400 text-sm mt-1">Organize seus estudos criando sua primeira tarefa.</p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Chat Widget */}
      <ChatWidget />

      {(isFormOpen || editingTask) && (
        <TaskForm onSave={editingTask ? updateTask : addTask} onCancel={() => { setIsFormOpen(false); setEditingTask(undefined); }} initialData={editingTask} />
      )}

      <footer className="py-10 text-center">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">FocusFlow &copy; Inteligência para Estudantes</p>
      </footer>
    </div>
  );
};

export default App;
