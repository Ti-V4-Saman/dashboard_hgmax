"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { 
  subDays, 
  startOfDay, 
  endOfDay, 
  isWithinInterval, 
  parseISO, 
  differenceInDays,
  differenceInHours,
  format,
  eachDayOfInterval,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  isAfter,
  isBefore,
  startOfYear,
  endOfYear,
  subYears
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DollarSign, 
  Trophy, 
  TrendingUp, 
  Target, 
  Calendar, 
  Percent, 
  Clock, 
  Users, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Filter, 
  LayoutDashboard, 
  Settings, 
  HelpCircle, 
  Menu, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  Sparkles, 
  Loader2, 
  BrainCircuit, 
  X, 
  LineChart as LineChartIcon, 
  AlertTriangle, 
  Zap, 
  ShoppingBag, 
  Lightbulb, 
  Activity, 
  Layers, 
  CalendarRange, 
  Globe2, 
  ImageIcon, 
  PlayCircle, 
  Eye, 
  MoreHorizontal,
  ChevronUp,
  ArrowUpDown,
  Hash,
  Type,
  UserCheck, 
  Ban,
  ClipboardList,
  Target as TargetIcon,
  Tag,
  FilterIcon,
  MousePointer2,
  Flag,
  Network,
  Plus, 
  CheckCircle2,
  ArrowDown,
  MousePointerClick,
  Timer,
  Check,
  ArrowRight,
  Info,
  CalendarDays,
  Save,
  Calculator,
  Layout,
  History,
  MousePointer,
  MapPin,
  User
} from "lucide-react";
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  XAxis, 
  YAxis,
  AreaChart, 
  Area,
  LineChart,
  Line,
  Legend,
  BarChart, 
  Bar, 
  Cell,
  LabelList,
  ReferenceLine
} from 'recharts';

/**
 * CONFIGURAÇÃO DA API GEMINI
 */
const apiKey = "";

const callGemini = async (prompt, systemInstruction = "Você é um analista sênior de marketing e vendas focado em ROI e performance de anúncios.") => {
  let delay = 1000;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
          }),
        }
      );
      if (!response.ok) throw new Error("A chamada da API falhou");
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) {
      if (i === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

/**
 * DADOS MOCK E AUXILIARES
 */
const TICKET_MEDIO_DEFAULT = 119;
const CITIES = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Salvador", "Fortaleza"];
const CAMPAIGNS_META = ["Meta - Black Friday", "Meta - Natal", "Meta - Verão", "Meta - Re-engagement"];
const CAMPAIGNS_GOOGLE = ["Google - Pesquisa Institucional", "Google - PMax Vendas", "Google - YouTube Branding", "Google - Display Remarketing"];
const KEYWORDS_MOCK = ["comprar agora", "melhor preço", "oferta exclusiva", "investimento seguro", "consultoria grátis", "soluções inteligentes"];
const RESPONSIBLES_MOCK = ["Ana Silva", "Bruno Costa", "Carla Dias", "Daniel Oliveira"];
const LOSS_REASONS_MOCK = ["Preço elevado", "Sem interesse", "Contato inválido", "Comprou no concorrente", "Não atende", "Fora de perfil"];

const generateMockData = () => {
  const data = [];
  const creativeTypes = ["[IU] Estático", "[VD] Vídeo", "[IU] Carrossel"];
  const creativeThemes = ["Investidores", "Depoimento", "Rentabilidade", "41 anos+", "Dicas Úteis"];

  for (let i = 0; i < 300; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    CITIES.forEach(city => {
      [...CAMPAIGNS_META, ...CAMPAIGNS_GOOGLE].forEach(campaign => {
        const platform = campaign.startsWith('Meta') ? 'meta' : 'google';
        const adName = `${creativeTypes[Math.floor(Math.random() * 3)]} ${creativeThemes[Math.floor(Math.random() * 5)]}`;
        data.push({
          date, city, campaign, platform,
          adset: `Conjunto - ${campaign}`,
          ad: adName,
          keyword: KEYWORDS_MOCK[Math.floor(Math.random() * KEYWORDS_MOCK.length)],
          spent: Math.random() * 50 + 10,
          impressions: Math.floor(Math.random() * 1000 + 200),
          leads: Math.floor(Math.random() * 4),
          messages: platform === 'meta' ? Math.floor(Math.random() * 2) : 0,
          link_clicks: Math.floor(Math.random() * 25),
        });
      });
    });
  }
  return data;
};

const generateMockCRM = () => {
  const records = [];
  const stages = ["Novos Leads", "Contato Efetivo", "Agendamento", "Compareceu ao Test Training", "Ganho", "Perdido"];
  const platforms = ['meta', 'google'];
  for (let i = 0; i < 5000; i++) {
    const creationDate = subDays(new Date(), Math.floor(Math.random() * 300));
    const movementDate = subDays(creationDate, -Math.floor(Math.random() * 8)); 
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    
    records.push({
      id: i.toString(),
      idLead: `L-${Math.floor(i/1.5)}`,
      platform,
      ad: `${["[IU] Estático", "[VD] Vídeo", "[IU] Carrossel"][Math.floor(Math.random() * 3)]} ${["Investidores", "Depoimento", "Rentabilidade", "41 anos+", "Dicas Úteis"][Math.floor(Math.random() * 5)]}`,
      campaign: platform === 'meta' ? CAMPAIGNS_META[Math.floor(Math.random() * 4)] : CAMPAIGNS_GOOGLE[Math.floor(Math.random() * 4)],
      keyword: KEYWORDS_MOCK[Math.floor(Math.random() * KEYWORDS_MOCK.length)],
      dataCriacao: format(creationDate, 'yyyy-MM-dd HH:mm:ss'),
      dataMovimentacao: format(movementDate, 'yyyy-MM-dd HH:mm:ss'),
      unidade: CITIES[Math.floor(Math.random() * CITIES.length)],
      etapa: stage,
      responsavel: RESPONSIBLES_MOCK[Math.floor(Math.random() * RESPONSIBLES_MOCK.length)],
      motivoPerda: stage === "Perdido" ? LOSS_REASONS_MOCK[Math.floor(Math.random() * LOSS_REASONS_MOCK.length)] : null,
      nome: `Usuário ${i}`,
      telefone: `(11) 9${Math.floor(Math.random() * 99999999)}`
    });
  }
  return records;
};

/**
 * COMPONENTES DE SUPORTE
 */

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm ${className}`}>
    {children}
  </div>
);

const AIModal = ({ isOpen, onClose, title, content, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
            <Sparkles className="h-5 w-5" />
            <span>{title}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-slate-700 dark:text-slate-300 text-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
              <p className="text-sm font-semibold animate-pulse text-indigo-600 uppercase tracking-widest">Processando dados...</p>
            </div>
          ) : (
            <div className="whitespace-pre-wrap leading-relaxed">
              {content || "Nenhum insight disponível no momento."}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const KPICardLarge = ({ 
  title, value, icon, accentColor, loading, 
  currentValue = 0, comparisonValue = 0, 
  isCurrency = false, invertColors = false,
  comparisonLabel = "Meta"
}) => {
  const diffAbs = currentValue - comparisonValue;
  const isPositive = diffAbs >= 0;
  const isGoodChange = isPositive;

  const formatCurrency = (val) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatNumber = (val) => Math.round(val).toLocaleString('pt-BR');

  return (
    <Card className="p-6 relative overflow-hidden group border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full min-h-[140px]">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-5 rounded-full ${accentColor === 'primary' ? 'bg-blue-600' : 'bg-emerald-600'}`} />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {title}
          </p>
          <div className={`p-2 rounded-lg ${accentColor === 'primary' ? 'bg-blue-50/50 text-blue-600' : 'bg-emerald-50/50 text-emerald-600'}`}>
            {React.cloneElement(icon, { size: 18 })}
          </div>
        </div>

        <div className="mt-auto">
          {loading ? (
            <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : (
            <div className="flex flex-col">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                {value}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="text-slate-400 font-medium">
                  {comparisonLabel}: <span className="font-bold text-slate-700 dark:text-slate-200">{isCurrency ? formatCurrency(comparisonValue) : formatNumber(comparisonValue)}</span>
                </span>
                <div className={`flex items-center gap-0.5 font-black ${isGoodChange ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {isPositive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                   <span>
                     {isPositive ? '+' : ''}{isCurrency ? formatCurrency(diffAbs) : formatNumber(diffAbs)}
                   </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const KPICardSmall = ({ 
  title, value, icon, loading, 
  currentValue = 0, comparisonValue = 0, 
  invertColors = false, isCurrency = false,
  comparisonLabel = "Meta"
}) => {
  const diffAbs = currentValue - comparisonValue;
  const isPositive = diffAbs >= 0;
  const isGoodChange = isPositive;

  const formatCurrency = (val) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatNumber = (val) => Math.round(val).toLocaleString('pt-BR');

  return (
    <Card className="p-4 group hover:border-indigo-400 transition-all cursor-default border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md text-slate-500 group-hover:text-indigo-500 transition-colors">
            {icon}
          </div>
          <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 line-clamp-1 uppercase tracking-widest">{title}</p>
        </div>
      </div>
      
      {loading ? (
        <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
      ) : (
        <div className="flex flex-col">
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{value}</span>
          <div className="flex flex-col gap-0.5 text-[10px]">
            <span className="text-slate-400 font-medium">
              {comparisonLabel}: <span className="font-bold text-slate-700 dark:text-slate-200">{isCurrency ? formatCurrency(comparisonValue).replace(',00', '') : formatNumber(comparisonValue)}</span>
            </span>
            <div className={`flex items-center gap-0.5 font-black ${isGoodChange ? 'text-emerald-600' : 'text-rose-600'}`}>
               {isPositive ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
               <span>
                 {isPositive ? '+' : ''}{isCurrency ? formatCurrency(diffAbs).replace(',00', '') : formatNumber(diffAbs)}
               </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

const SalesFunnel = ({ data, comparisonData, avgClosingTime, lostCount }) => {
  const stages = [
    { key: 'leads', label: 'Leads', highlighted: true },
    { key: 'leadsQualificados', label: 'Leads Qualificados', highlighted: false },
    { key: 'oportunidades', label: 'Oportunidades', highlighted: false },
    { key: 'vendas', label: 'Vendas', highlighted: false }
  ];

  // Cálculo da efetividade total do funil (Leads -> Vendas)
  const funnelEffectiveness = data.leads > 0 ? (data.vendas / data.leads) * 100 : 0;

  return (
    <Card className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-none">
      <div className="flex justify-between items-start mb-10">
        <h3 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-tight mt-1">
          Funil de Vendas & Eficiência
        </h3>
        
        {/* Novas métricas solicitadas no canto superior direito */}
        <div className="flex items-center gap-8">
           <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none mb-1.5">Tempo Médio</span>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Timer size={14} className="text-slate-300" />
                {avgClosingTime.toFixed(1)} dias
              </span>
           </div>
           <div className="flex flex-col items-end border-l border-slate-200 dark:border-slate-800 pl-8">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none mb-1.5">Efetividade</span>
              <span className="text-[13px] font-bold text-indigo-600 flex items-center gap-1.5">
                <Zap size={14} className="text-indigo-300" />
                {funnelEffectiveness.toFixed(1)}%
              </span>
           </div>
           <div className="flex flex-col items-end border-l border-slate-200 dark:border-slate-800 pl-8">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none mb-1.5">Perdidos</span>
              <span className="text-[13px] font-bold text-rose-500 flex items-center gap-1.5">
                <Ban size={14} className="text-rose-300" />
                {lostCount.toLocaleString()}
              </span>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {stages.map((stage, index) => {
          const currentVal = data[stage.key] || 0;
          const compVal = comparisonData ? comparisonData[stage.key] || 0 : 0;
          const diffAbs = currentVal - compVal;
          const isPositive = diffAbs >= 0;

          const nextStage = stages[index + 1];
          const nextVal = nextStage ? (data[nextStage.key] || 0) : null;
          const currentConvRate = (nextVal !== null && currentVal > 0) ? (nextVal / currentVal) * 100 : null;

          const nextCompVal = nextStage && comparisonData ? (comparisonData[nextStage.key] || 0) : null;
          const compConvRate = (nextCompVal !== null && compVal > 0) ? (nextCompVal / compVal) * 100 : null;
          const rateDiff = (currentConvRate !== null && compConvRate !== null) ? (currentConvRate - compConvRate) : null;

          return (
            <React.Fragment key={stage.key}>
              <div className={`relative flex flex-col items-center justify-center min-w-[180px] h-[160px] rounded-2xl border transition-all ${
                stage.highlighted 
                ? 'bg-cyan-400 border-cyan-500 shadow-lg shadow-cyan-100 dark:shadow-none' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
              }`}>
                <div className="flex items-center gap-1 mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${stage.highlighted ? 'text-cyan-900' : 'text-slate-500 dark:text-slate-400'}`}>
                    {stage.label}
                  </span>
                </div>

                <span className={`text-4xl font-black tracking-tighter ${stage.highlighted ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {currentVal.toLocaleString('pt-BR')}
                </span>

                <div className="mt-4 flex items-center gap-1.5">
                  <div className={`flex items-center text-[10px] font-black ${
                    isPositive 
                    ? (stage.highlighted ? 'text-cyan-900' : 'text-emerald-500') 
                    : (stage.highlighted ? 'text-rose-900' : 'text-rose-500')
                  }`}>
                    {isPositive ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {Math.abs(diffAbs).toLocaleString('pt-BR')} 
                  </div>
                </div>
              </div>

              {currentConvRate !== null && (
                <div className="flex flex-col items-center min-w-[80px] group">
                  <div className="relative flex flex-col items-center justify-center w-14 h-12 bg-slate-900 dark:bg-black rounded-xl shadow-lg transition-transform group-hover:scale-105">
                    <span className="text-[13px] font-black text-white leading-none mb-0.5">{currentConvRate.toFixed(0)}%</span>
                    
                    {rateDiff !== null && (
                      <div className={`flex items-center text-[8px] font-bold ${rateDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {rateDiff >= 0 ? '+' : ''}{rateDiff.toFixed(1)} p.p.
                      </div>
                    )}
                    
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-slate-900 dark:border-l-black"></div>
                  </div>
                  <span className="text-[8px] font-black uppercase text-slate-400 mt-2 tracking-tighter">Taxa</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
};

const AdvancedDatePicker = ({ range, onRangeChange, currentPreset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const presets = [
    { label: "Hoje", id: "today" },
    { label: "Ontem", id: "yesterday" },
    { label: "Últimos 7 dias", id: "7" },
    { label: "Últimos 15 dias", id: "15" },
    { label: "Últimos 30 dias", id: "30" },
    { label: "Este mês", id: "mtd" },
    { label: "Mês passado", id: "lastMonth" },
    { label: "Este ano", id: "ytd" },
    { label: "Ano passado", id: "lastYear" }
  ];

  const activePreset = presets.find(p => p.id === currentPreset)?.label || "Personalizado";

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 shadow-sm hover:border-indigo-400 transition-all"
      >
        <CalendarDays size={16} className="text-indigo-500" />
        <span className="truncate max-w-[140px] uppercase tracking-tight">{activePreset}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[520px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden flex animate-in slide-in-from-top-2 duration-200">
          <div className="w-40 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-100 dark:border-slate-800 p-2 space-y-1">
            <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Atalhos</p>
            {presets.map(p => (
              <button 
                key={p.id}
                onClick={() => { onRangeChange(p.id); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${currentPreset === p.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Período Customizado</h4>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Início</label>
                <input 
                  type="date" 
                  value={format(range.from, 'yyyy-MM-dd')}
                  onChange={(e) => onRangeChange('custom', { ...range, from: startOfDay(parseISO(e.target.value)) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Fim</label>
                <input 
                  type="date" 
                  value={format(range.to, 'yyyy-MM-dd')}
                  onChange={(e) => onRangeChange('custom', { ...range, to: endOfDay(parseISO(e.target.value)) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-colors">
                Atualizar Datas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const HierarchicalPerformanceTable = ({ data, drillLevel, setDrillLevel, channelFilter, setChannelFilter, realPerfData }) => {
  const [sortField, setSortField] = useState('spent');
  const [sortOrder, setSortOrder] = useState('desc');
  const [extraMetrics, setExtraMetrics] = useState(['oportunidade', 'faturamento']);
  const [isMetricMenuOpen, setIsMetricMenuOpen] = useState(false);

  const availableMetrics = [
    { id: 'oportunidade', label: 'Oportunidade' },
    { id: 'cpo', label: 'CPO' },
    { id: 'valor_oportunidade', label: 'Valor Oport.' },
    { id: 'venda', label: 'Venda' },
    { id: 'cpv', label: 'CPV' },
    { id: 'faturamento', label: 'Faturamento' },
    { id: 'roas', label: 'ROAS' }
  ];

  const toggleMetric = (id) => {
    setExtraMetrics(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id) 
        : (prev.length < 2 ? [...prev, id] : [prev[1], id])
    );
  };

  const processedData = useMemo(() => {
    const levelKey = drillLevel === 'campaign' ? 'campaign' : drillLevel === 'ad' ? 'ad' : 'keyword';
    const realRows = realPerfData ? realPerfData[levelKey] : null;

    if (realRows && realRows.length > 0) {
      const groups = {};
      const filtered = channelFilter === 'all' ? realRows : realRows.filter(r => r.platform === channelFilter);
      filtered.forEach(row => {
        const key = row.name || 'Não definido';
        if (!groups[key]) groups[key] = { name: key, spent: 0, leads: 0, mqls: 0, oportunidade: 0, venda: 0, faturamento: 0 };
        groups[key].spent += Number(row.spent) || 0;
        groups[key].leads += Number(row.leads) || 0;
        groups[key].oportunidade += Number(row.oportunidade) || 0;
        groups[key].venda += Number(row.venda) || 0;
        groups[key].faturamento += Number(row.faturamento) || 0;
      });
      return Object.values(groups).sort((a, b) => {
        const order = sortOrder === 'desc' ? -1 : 1;
        const valA = Number(a[sortField]) || 0;
        const valB = Number(b[sortField]) || 0;
        if (valA !== valB) {
          return valA < valB ? order : -order;
        }
        const spentA = Number(a.spent) || 0;
        const spentB = Number(b.spent) || 0;
        if (spentA !== spentB) return spentB - spentA;
        const fatA = Number(a.faturamento) || 0;
        const fatB = Number(b.faturamento) || 0;
        if (fatA !== fatB) return fatB - fatA;
        const leadsA = Number(a.leads) || 0;
        const leadsB = Number(b.leads) || 0;
        if (leadsA !== leadsB) return leadsB - leadsA;
        const opA = Number(a.oportunidade) || 0;
        const opB = Number(b.oportunidade) || 0;
        if (opA !== opB) return opB - opA;
        return a.name.localeCompare(b.name);
      });
    }

    // Fallback mock
    const groups = {};
    const field = drillLevel === 'campaign' ? 'campaign' : drillLevel === 'ad' ? 'ad' : 'keyword';
    data.filter(item => channelFilter === 'all' || item.platform === channelFilter).forEach(item => {
      const key = item[field] || 'Não definido';
      if (!groups[key]) groups[key] = { name: key, spent: 0, leads: 0, mqls: 0, oportunidade: 0, venda: 0, faturamento: 0 };
      groups[key].spent += item.spent;
      groups[key].leads += item.leads;
      groups[key].mqls += Math.floor(item.leads * 0.4);
      groups[key].oportunidade += Math.floor(item.leads * 0.15);
      groups[key].venda += Math.floor(item.leads * 0.05);
      groups[key].faturamento += Math.floor(item.leads * 0.05) * TICKET_MEDIO_DEFAULT;
    });
    return Object.values(groups).sort((a, b) => {
      const order = sortOrder === 'desc' ? -1 : 1;
      const valA = Number(a[sortField]) || 0;
      const valB = Number(b[sortField]) || 0;
      if (valA !== valB) {
        return valA < valB ? order : -order;
      }
      const spentA = Number(a.spent) || 0;
      const spentB = Number(b.spent) || 0;
      if (spentA !== spentB) return spentB - spentA;
      const fatA = Number(a.faturamento) || 0;
      const fatB = Number(b.faturamento) || 0;
      if (fatA !== fatB) return fatB - fatA;
      const leadsA = Number(a.leads) || 0;
      const leadsB = Number(b.leads) || 0;
      if (leadsA !== leadsB) return leadsB - leadsA;
      const opA = Number(a.oportunidade) || 0;
      const opB = Number(b.oportunidade) || 0;
      if (opA !== opB) return opB - opA;
      return a.name.localeCompare(b.name);
    });
  }, [data, drillLevel, sortField, sortOrder, channelFilter, realPerfData]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
  };

  const formatValue = (id, val) => {
    if (['spent', 'faturamento', 'valor_oportunidade', 'cpl', 'cpmql', 'cpo', 'cpv'].includes(id)) 
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
    if (id === 'roas') return val.toFixed(2) + 'x';
    return val.toLocaleString('pt-BR');
  };

  const calculateMetric = (id, row) => {
    switch(id) {
      case 'cpl': return row.leads > 0 ? row.spent / row.leads : 0;
      case 'cpmql': return row.mqls > 0 ? row.spent / row.mqls : 0;
      case 'cpo': return row.oportunidade > 0 ? row.spent / row.oportunidade : 0;
      case 'cpv': return row.venda > 0 ? row.spent / row.venda : 0;
      case 'roas': return row.spent > 0 ? row.faturamento / row.spent : 0;
      case 'valor_oportunidade': return row.oportunidade * TICKET_MEDIO_DEFAULT;
      default: return row[id] || 0;
    }
  };

  return (
    <Card className="overflow-visible bg-white dark:bg-slate-900 border-slate-100 shadow-sm rounded-none">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white dark:bg-slate-900 flex-wrap gap-4">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 text-slate-400 group cursor-pointer" onClick={() => setChannelFilter(channelFilter === 'all' ? 'meta' : channelFilter === 'meta' ? 'google' : 'all')}>
              <span className="text-[11px] font-medium uppercase tracking-wider">
                {channelFilter === 'all' ? 'TODAS AS MÍDIAS PAGAS' : channelFilter.toUpperCase()}
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
             <button 
                onClick={() => setIsMetricMenuOpen(!isMetricMenuOpen)}
                className="px-3 py-1.5 text-[10px] font-medium border border-slate-200 rounded-md hover:bg-slate-50 transition-all flex items-center gap-2 uppercase tracking-tighter text-slate-600"
             >
                <Layout className="h-3 w-3" /> Métricas ({extraMetrics.length}/2)
             </button>
             {isMetricMenuOpen && (
               <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-2 space-y-0.5">
                    {availableMetrics.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => toggleMetric(m.id)}
                        className={`w-full text-left px-3 py-2 text-[10px] uppercase font-medium rounded flex items-center justify-between ${extraMetrics.includes(m.id) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        {m.label}
                        {extraMetrics.includes(m.id) && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
               </div>
             )}
          </div>

          <button 
            onClick={() => setDrillLevel(drillLevel === 'campaign' ? 'ad' : drillLevel === 'ad' ? 'keyword' : 'campaign')}
            className="px-3 py-1.5 text-[10px] font-medium border border-slate-200 rounded-md hover:bg-slate-50 uppercase tracking-tighter text-slate-600"
          >
            Nível: {drillLevel === 'campaign' ? 'Campanha' : drillLevel === 'ad' ? 'Anúncio' : 'Palavra'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px] border-collapse">
          <thead className="bg-white text-slate-400 font-medium uppercase text-[10px] tracking-wider border-b border-slate-100">
            <tr>
              <th className="pl-6 py-4 cursor-pointer hover:text-slate-600 transition-colors" onClick={() => handleSort('name')}>Ativo</th>
              <th className="px-4 py-4 text-right cursor-pointer hover:text-slate-600" onClick={() => handleSort('spent')}>Investimento</th>
              <th className="px-4 py-4 text-right cursor-pointer hover:text-slate-600" onClick={() => handleSort('leads')}>Leads</th>
              <th className="px-4 py-4 text-right cursor-pointer hover:text-slate-600" onClick={() => handleSort('cpl')}>CPL</th>
              {extraMetrics.map(mID => {
                const cfg = availableMetrics.find(m => m.id === mID);
                return (
                  <th key={mID} className="px-4 py-4 text-right cursor-pointer hover:text-slate-600 uppercase" onClick={() => handleSort(mID)}>
                    {cfg?.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {processedData.map((item, i) => (
              <tr key={i} className="bg-white hover:bg-slate-50/50 transition-colors">
                <td className="py-4 pl-6">
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-medium">{item.name}</span>
                    <span className="text-[10px] text-slate-400 lowercase">{drillLevel}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right text-slate-600">{formatValue('spent', item.spent)}</td>
                <td className="px-4 py-4 text-right text-slate-600">{item.leads}</td>
                <td className="px-4 py-4 text-right text-slate-600">{formatValue('cpl', calculateMetric('cpl', item))}</td>
                {extraMetrics.map(mID => (
                  <td key={mID} className="px-4 py-4 text-right text-slate-600">
                    {formatValue(mID, calculateMetric(mID, item))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const GoogleAdsStyleChart = ({ adsData, range, channelFilter, setChannelFilter, realAdsDaily }) => {
  const [selectedMetrics, setSelectedMetrics] = useState(['spent', 'ctr']);

  const metricConfig = {
    spent: { label: "Investimento", color: "#EA4335", icon: <Tag />, type: 'currency' },
    ctr: { label: "CTR", color: "#8E24AA", icon: <MousePointer2 />, type: 'percent' },
    cpm: { label: "CPM", color: "#607D8B", icon: <Eye />, type: 'currency' },
    cpc: { label: "CPC", color: "#4285F4", icon: <MousePointerClick />, type: 'currency' },
    cpl: { label: "CPL", color: "#FBBC05", icon: <DollarSign />, type: 'currency' },
    txConv: { label: "Taxa de Conversão", color: "#00ACC1", icon: <Zap />, type: 'percent' },
    cpmql: { label: "CPMQL", color: "#5E35B1", icon: <TargetIcon />, type: 'currency' }
  };

  const chartData = useMemo(() => {
    if (!range.from || !range.to) return [];
    const days = eachDayOfInterval({ start: range.from, end: range.to });
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      let spent = 0, impressions = 0, clicks = 0, leads = 0, mqls = 0;

      if (realAdsDaily) {
        if (channelFilter === 'all' || channelFilter === 'google') {
          const gDay = realAdsDaily.google.find(d => d.date === dateStr);
          if (gDay) {
            spent += Number(gDay.spent) || 0;
            impressions += Number(gDay.impressions) || 0;
            clicks += Number(gDay.clicks) || 0;
            leads += Number(gDay.leads) || 0;
          }
        }
        if (channelFilter === 'all' || channelFilter === 'meta') {
          const mDay = realAdsDaily.meta.find(d => d.date === dateStr);
          if (mDay) {
            spent += Number(mDay.spent) || 0;
            impressions += Number(mDay.impressions) || 0;
            clicks += Number(mDay.clicks) || 0;
            leads += Number(mDay.leads) || 0;
          }
        }
        const dayMqls = (realAdsDaily.mqls || []).filter(d => {
          const dateMatch = d.date === dateStr;
          if (channelFilter === 'all') return dateMatch && d.platform !== 'other';
          return dateMatch && d.platform === channelFilter;
        });
        mqls = dayMqls.reduce((sum, d) => sum + (Number(d.mqls) || 0), 0);
      } else {
        const dayAds = adsData.filter(d => (channelFilter === 'all' || d.platform === channelFilter) && d.date === dateStr);
        spent = dayAds.reduce((acc, curr) => acc + curr.spent, 0);
        leads = dayAds.reduce((acc, curr) => acc + curr.leads, 0);
        clicks = dayAds.reduce((acc, curr) => acc + curr.link_clicks, 0);
        impressions = dayAds.reduce((acc, curr) => acc + curr.impressions, 0);
        mqls = Math.floor(leads * 0.4);
      }

      return {
        date: format(day, 'dd/MM'),
        spent,
        conversions: leads,
        clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        txConv: clicks > 0 ? (leads / clicks) * 100 : 0,
        cpm: impressions > 0 ? (spent / impressions) * 1000 : 0,
        cpc: clicks > 0 ? spent / clicks : 0,
        cpl: leads > 0 ? spent / leads : 0,
        cpmql: mqls > 0 ? spent / mqls : 0
      };
    });
  }, [adsData, range, channelFilter, realAdsDaily]);

  const toggleMetric = (id) => {
    setSelectedMetrics(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(m => m !== id) : prev) 
        : (prev.length < 2 ? [...prev, id] : [prev[1], id])
    );
  };

  const formatValue = (val, id) => {
    const cfg = metricConfig[id];
    if (!cfg) return val;
    if (cfg.type === 'currency') return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (cfg.type === 'percent') return `${val.toFixed(2)}%`;
    if (val >= 1000) return `${(val/1000).toFixed(1)}k`;
    return val.toLocaleString('pt-BR');
  };

  const totals = useMemo(() => {
    const results = {};
    Object.keys(metricConfig).forEach(id => {
      const val = chartData.reduce((acc, curr) => acc + curr[id], 0);
      results[id] = (id.includes('cp') || id.includes('ctr') || id.includes('tx')) ? val / (chartData.length || 1) : val;
    });
    return results;
  }, [chartData, metricConfig]);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border border-slate-100 bg-white dark:bg-slate-900 shadow-sm rounded-none">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-2 text-slate-400 group cursor-pointer" onClick={() => setChannelFilter(channelFilter === 'all' ? 'meta' : channelFilter === 'meta' ? 'google' : 'all')}>
              <span className="text-[11px] font-medium uppercase tracking-wider">
                {channelFilter === 'all' ? 'TODAS AS MÍDIAS PAGAS' : channelFilter.toUpperCase()}
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
           </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-x divide-slate-50 border-b border-slate-50">
          {Object.entries(metricConfig).map(([id, cfg]) => {
            const isActive = selectedMetrics.includes(id);
            return (
              <div 
                key={id} 
                onClick={() => toggleMetric(id)}
                className={`p-5 flex flex-col justify-center gap-1.5 cursor-pointer transition-all hover:bg-slate-50/50 group ${isActive ? 'bg-white' : 'opacity-40 grayscale'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                    {cfg.label}
                  </span>
                  <div className={`p-1 rounded transition-all ${isActive ? 'bg-slate-50 text-slate-400' : 'text-slate-300'}`}>
                    {React.cloneElement(cfg.icon, { size: 10 })}
                  </div>
                </div>
                <span className={`text-lg font-medium tracking-tight ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                  {formatValue(totals[id], id)}
                </span>
                {isActive && <div className="h-0.5 w-full mt-1" style={{ backgroundColor: cfg.color }} />}
              </div>
            );
          })}
        </div>

        <div className="p-8 bg-white">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                {selectedMetrics.length > 1 && <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />}
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '11px', fontWeight: '500' }}
                  formatter={(value, name) => {
                    const metricKey = Object.keys(metricConfig).find(k => metricConfig[k].label === name);
                    return [formatValue(value, metricKey), name];
                  }}
                />
                {selectedMetrics.map((id, index) => (
                  <Line 
                    key={id}
                    yAxisId={index === 0 ? "left" : "right"}
                    type="monotone" 
                    dataKey={id} 
                    name={metricConfig[id].label}
                    stroke={metricConfig[id].color} 
                    strokeWidth={2}
                    dot={false}
                    animationDuration={1000}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
};

const CampaignAnalysis = ({ adsData, range, onAnalyze, realAdsDaily, realPerfData }) => {
  const [drillLevel, setDrillLevel] = useState('campaign');
  const [channelFilter, setChannelFilter] = useState('all');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-medium text-slate-900 uppercase tracking-tight">Performance de Canais</h3>
        <p className="text-xs text-slate-400">Análise exploratória de mídia paga e conversões.</p>
      </div>

      <GoogleAdsStyleChart 
        adsData={adsData} 
        range={range} 
        channelFilter={channelFilter}
        setChannelFilter={setChannelFilter}
        realAdsDaily={realAdsDaily}
      />
      
      <HierarchicalPerformanceTable 
        data={adsData} 
        drillLevel={drillLevel} 
        setDrillLevel={setDrillLevel}
        channelFilter={channelFilter}
        setChannelFilter={setChannelFilter}
        realPerfData={realPerfData}
      />
    </div>
  );
};

const CommercialAnalysis = ({ adsData, crmData, realCommercialData }) => {
  const [activeAssetView, setActiveAssetView] = useState('campaign');
  const [sortConfig, setSortConfig] = useState({ field: 'leadsIn', order: 'desc' });
  const [performanceView, setPerformanceView] = useState('responsavel'); // 'responsavel' ou 'unidade'
  const [selectedReason, setSelectedReason] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const performanceData = useMemo(() => {
    // Use real data when available
    if (realCommercialData) {
      const key = performanceView === 'responsavel' ? 'vendedor' : 'regiao';
      const realRows = realCommercialData[key];
      if (realRows && realRows.length > 0) return realRows;
    }

    // Fallback mock
    const groups = {};
    const field = performanceView;
    crmData.forEach(d => {
      const key = d[field] || 'Geral';
      if (!groups[key]) groups[key] = { name: key, leads: new Set(), vendas: 0, faturamento: 0 };
      groups[key].leads.add(d.idLead);
      if (d.etapa === 'Ganho') {
        groups[key].vendas++;
        groups[key].faturamento += 100;
      }
    });
    return Object.values(groups).map(g => ({
      ...g,
      leads: g.leads.size,
      ticket: g.vendas > 0 ? g.faturamento / g.vendas : 0,
      efetividade: g.leads.size > 0 ? (g.vendas / g.leads.size) * 100 : 0
    })).sort((a, b) => b.faturamento - a.faturamento);
  }, [crmData, performanceView, realCommercialData]);

  const lossReasonsData = useMemo(() => {
    if (realCommercialData?.quality?.lostAgg) {
      const reasons = {};
      const lostAgg = realCommercialData.quality.lostAgg;
      
      lostAgg.forEach(d => {
        const field = activeAssetView === 'ad' ? 'ad' : activeAssetView;
        const matchAsset = !selectedAsset || d[field] === selectedAsset;
        if (matchAsset) {
          const reason = d.motivoPerda || 'Não informado';
          reasons[reason] = (reasons[reason] || 0) + d.count;
        }
      });

      const total = Object.values(reasons).reduce((a, b) => a + b, 0) || 1;
      return Object.entries(reasons).map(([name, count]) => ({
        name, count, percentage: ((count / total) * 100).toFixed(1)
      })).sort((a, b) => b.count - a.count);
    }

    const reasons = {};
    const lostRecords = crmData.filter(d => {
      const isLost = d.etapa === 'Perdido';
      const field = activeAssetView === 'ad' ? 'ad' : activeAssetView;
      const matchAsset = !selectedAsset || d[field] === selectedAsset;
      return isLost && matchAsset;
    });

    lostRecords.forEach(d => {
      const reason = d.motivoPerda || 'Não informado';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    const total = lostRecords.length || 1;
    return Object.entries(reasons).map(([name, count]) => ({
      name, count, percentage: ((count / total) * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count);
  }, [crmData, selectedAsset, activeAssetView, realCommercialData]);

  const lossesByStage = useMemo(() => {
    if (realCommercialData?.quality?.lostAgg) {
      const stages = {};
      const lostAgg = realCommercialData.quality.lostAgg;
      
      lostAgg.forEach(d => {
        const field = activeAssetView === 'ad' ? 'ad' : activeAssetView;
        const matchAsset = !selectedAsset || d[field] === selectedAsset;
        if (matchAsset) {
          const stage = d.etapa || 'Sem Etapa';
          stages[stage] = (stages[stage] || 0) + d.count;
        }
      });

      return Object.entries(stages)
        .map(([stage, lost]) => ({ stage, lost }))
        .sort((a, b) => b.lost - a.lost);
    }

    const stagesOrder = ["Novos Leads", "Contato Efetivo", "Agendamento", "Compareceu ao Test Training"];
    return stagesOrder.map(s => ({ stage: s, lost: Math.floor(Math.random() * 40) + 10 }));
  }, [realCommercialData, selectedAsset, activeAssetView]);


  const assetLossData = useMemo(() => {
    if (realCommercialData?.quality) {
      const realData = realCommercialData.quality[activeAssetView] || [];
      return [...realData].sort((a, b) => { 
        const f = sortConfig.field; 
        const o = sortConfig.order === 'desc' ? -1 : 1; 
        return (a[f] || 0) < (b[f] || 0) ? o : -o; 
      });
    }

    const groups = {};
    const field = activeAssetView;
    
    adsData.forEach(item => { 
      const key = item[field] || 'Geral'; 
      if (!groups[key]) groups[key] = { name: key, leadsIn: 0, lostCount: 0, closingTimes: [] }; 
      groups[key].leadsIn += item.leads; 
    });

    crmData.forEach(d => { 
      const key = d[field === 'ad' ? 'ad' : field] || 'Geral'; 
      if (groups[key]) {
        const matchReason = !selectedReason || d.motivoPerda === selectedReason;
        if (d.etapa === 'Perdido' && matchReason) groups[key].lostCount++;
      }
    });

    return Object.values(groups).map(asset => ({ 
      ...asset, 
      lossPct: asset.leadsIn > 0 ? (asset.lostCount / asset.leadsIn) * 100 : 0
    })).sort((a, b) => { 
      const f = sortConfig.field; 
      const o = sortConfig.order === 'desc' ? -1 : 1; 
      return (a[f] || 0) < (b[f] || 0) ? o : -o; 
    });
  }, [adsData, crmData, activeAssetView, sortConfig, selectedReason, realCommercialData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-slate-100 shadow-sm rounded-none overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-medium text-slate-900 text-lg uppercase tracking-tight">Performance de Vendas</h3>
            <p className="text-xs text-slate-400">Resultados e eficiência por vendedor ou região</p>
          </div>
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
            <button onClick={() => setPerformanceView('responsavel')} className={`px-4 py-1.5 text-[10px] font-medium rounded-md transition-all uppercase flex items-center gap-2 ${performanceView === 'responsavel' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <User size={12}/> Vendedor
            </button>
            <button onClick={() => setPerformanceView('unidade')} className={`px-4 py-1.5 text-[10px] font-medium rounded-md transition-all uppercase flex items-center gap-2 ${performanceView === 'unidade' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <MapPin size={12}/> Região
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white text-slate-400 font-medium uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">{performanceView === 'responsavel' ? 'Vendedor' : 'Região'}</th>
                <th className="px-4 py-4 text-center">Leads</th>
                <th className="px-4 py-4 text-center">Vendas</th>
                <th className="px-4 py-4 text-right">Faturamento</th>
                <th className="px-4 py-4 text-right">Ticket</th>
                <th className="px-6 py-4 text-center">Efetividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {performanceData.map((row, i) => (
                <tr key={i} className="bg-white hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-900 font-medium">{row.name}</td>
                  <td className="px-4 py-4 text-center text-slate-600">{row.leads}</td>
                  <td className="px-4 py-4 text-center text-slate-600 font-medium">{row.vendas}</td>
                  <td className="px-4 py-4 text-right text-slate-600">{row.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-4 text-right text-slate-400">{row.ticket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[11px] font-medium border border-indigo-100">
                      {row.efetividade.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-slate-100 shadow-sm rounded-none overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div><h3 className="font-medium text-slate-900 text-lg uppercase tracking-tight flex items-center gap-2">Análise de Qualidade</h3></div>
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
            {['campaign', 'ad', 'platform'].map(v => (
              <button key={v} onClick={() => { setActiveAssetView(v); setSelectedAsset(null); }} className={`px-4 py-1.5 text-[10px] font-medium rounded-md transition-all uppercase tracking-tighter ${activeAssetView === v ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                {v === 'campaign' ? 'Campanha' : v === 'ad' ? 'Anúncio' : 'Rede'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white text-slate-400 font-medium uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => setSortConfig({ field: 'name', order: sortConfig.field === 'name' && sortConfig.order === 'desc' ? 'asc' : 'desc' })}>
                  <div className="flex items-center gap-2">Ativo <ArrowUpDown size={10}/></div>
                </th>
                <th className="px-6 py-4 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => setSortConfig({ field: 'leadsIn', order: sortConfig.field === 'leadsIn' && sortConfig.order === 'desc' ? 'asc' : 'desc' })}>
                  <div className="flex items-center justify-center gap-2">Entradas <ArrowUpDown size={10}/></div>
                </th>
                <th className="px-6 py-4 text-center cursor-pointer hover:text-slate-900 transition-colors text-rose-600" onClick={() => setSortConfig({ field: 'lostCount', order: sortConfig.field === 'lostCount' && sortConfig.order === 'desc' ? 'asc' : 'desc' })}>
                  <div className="flex items-center justify-center gap-2">Perdas <ArrowUpDown size={10}/></div>
                </th>
                <th className="px-6 py-4 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => setSortConfig({ field: 'lossPct', order: sortConfig.field === 'lossPct' && sortConfig.order === 'desc' ? 'asc' : 'desc' })}>
                  <div className="flex items-center justify-center gap-2">% Perda <ArrowUpDown size={10}/></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assetLossData.map((asset, i) => (
                <tr key={i} onClick={() => setSelectedAsset(selectedAsset === asset.name ? null : asset.name)} className={`cursor-pointer ${selectedAsset === asset.name ? 'bg-blue-50/50' : 'hover:bg-slate-50/30'}`}>
                  <td className="px-6 py-4 font-medium text-slate-900">{asset.name}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{asset.leadsIn.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center font-medium text-rose-600">{asset.lostCount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center text-slate-400">{asset.lossPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-slate-100 shadow-sm rounded-none overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center"><h3 className="font-medium text-slate-900 uppercase tracking-tight text-sm">Motivos de Perda</h3></div>
          <table className="w-full text-left text-[12px]">
            <thead className="text-slate-400 font-medium uppercase text-[9px] tracking-widest border-b border-slate-50">
              <tr><th className="px-6 py-3">Motivo</th><th className="px-6 py-3 text-center">QTD</th><th className="px-6 py-3 text-center">% TOTAL</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lossReasonsData.map((reason, i) => (
                <tr key={i} onClick={() => setSelectedReason(selectedReason === reason.name ? null : reason.name)} className={`cursor-pointer ${selectedReason === reason.name ? 'bg-rose-50' : 'hover:bg-slate-50'}`}>
                  <td className="px-6 py-4 text-slate-700">{reason.name}</td>
                  <td className="px-6 py-4 text-center font-medium text-slate-900">{reason.count}</td>
                  <td className="px-6 py-4 text-center text-slate-400">{reason.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-6 border-slate-100 shadow-sm rounded-none">
          <h3 className="font-medium text-slate-900 uppercase tracking-tight text-sm mb-10">Perdas por Etapa</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lossesByStage} layout="vertical" margin={{ left: 10, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} width={160} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="lost" radius={[0, 4, 4, 0]} barSize={18}>
                  <LabelList dataKey="lost" position="right" style={{ fontSize: '10px', fill: '#94a3b8' }} />
                  {lossesByStage.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#cbd5e1' : '#f43f5e'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

const DynamicCharts = ({ adsData, crmData, range, goalMap, realDailyData = [], dateFilterType = 'movimentacao' }) => {
  const [metric, setMetric] = useState('investment');
  const [grouping, setGrouping] = useState('day');
  
  const metricsOptions = [ 
    { value: 'investment', label: 'Investimento', color: '#3b82f6', goalKey: 'investment' }, 
    { value: 'revenue', label: 'Faturamento', color: '#10b981', goalKey: 'faturamento' },
    { value: 'leads', label: 'Leads', color: '#6366f1', goalKey: 'leads' }, 
    { value: 'mql', label: 'MQL', color: '#8b5cf6', goalKey: 'mql' }, 
    { value: 'opportunity', label: 'Oportunidade', color: '#a855f7', goalKey: 'opportunity' }, 
    { value: 'sale', label: 'Venda', color: '#059669', goalKey: 'venda' }, 
    { value: 'lost', label: 'Perdido', color: '#ef4444', goalKey: 'perdido' } 
  ];

  const groupingOptions = [ { value: 'day', label: 'Diário' }, { value: 'week', label: 'Semanal' }, { value: 'month', label: 'Mensal' } ];
  const activeMetric = metricsOptions.find(m => m.value === metric);
  const totalGoal = goalMap[activeMetric.goalKey] || 0;
  
  const processedData = useMemo(() => { 
    if (!range.from || !range.to) return []; 
    const daysInRange = eachDayOfInterval({ start: range.from, end: range.to }); 
    const buckets = {}; 
    const isRealDataMode = realDailyData && realDailyData.length > 0;

    daysInRange.forEach(day => { 
      let bucketKey; 
      if (grouping === 'month') bucketKey = format(startOfMonth(day), 'yyyy-MM-dd'); 
      else if (grouping === 'week') bucketKey = format(startOfWeek(day), 'yyyy-MM-dd'); 
      else bucketKey = format(day, 'yyyy-MM-dd'); 
      if (!buckets[bucketKey]) buckets[bucketKey] = { label: '', active: 0, dateObj: day }; 
      const dateStr = format(day, 'yyyy-MM-dd'); 
      const dayAds = adsData.filteredAds.filter(d => d.date === dateStr); 
      const dayCrm = crmData.fullFilteredCrm.filter(d => {
        const dDate = dateFilterType === 'criacao' ? d.dataCriacao : d.dataMovimentacao;
        return dDate.startsWith(dateStr);
      }); 
      
      let val = 0; 
      if (isRealDataMode) {
        const dayReal = realDailyData.find(d => d.date === dateStr);
        if (dayReal) {
          if (metric === 'investment') val = Number(dayReal.spent) || 0;
          else if (metric === 'leads') val = Number(dayReal.leads) || 0;
          else if (metric === 'revenue') val = Number(dayReal.faturamento) || 0;
          else if (metric === 'mql') val = Number(dayReal.mql) || 0;
          else if (metric === 'opportunity') val = Number(dayReal.opportunity) || 0;
          else if (metric === 'sale') val = Number(dayReal.sales) || 0;
          else if (metric === 'lost') val = Number(dayReal.lost) || 0;
        } else {
          val = 0; // Absolute database precision: no database record = 0
        }
      } else {
        // Fallback to pure mock demo data
        if (metric === 'investment') val = dayAds.reduce((acc, curr) => acc + curr.spent, 0); 
        else if (metric === 'leads') val = dayAds.reduce((acc, curr) => acc + curr.leads, 0); 
        else if (metric === 'revenue') val = dayCrm.filter(d => d.etapa === 'Ganho').length * TICKET_MEDIO_DEFAULT; 
        else { 
          const stageMap = { mql: 'Contato Efetivo', opportunity: 'Agendamento', sale: 'Ganho', lost: 'Perdido' }; 
          val = dayCrm.filter(d => d.etapa === stageMap[metric]).length; 
        } 
      }
      buckets[bucketKey].active += val; 
    }); 
    const result = Object.keys(buckets).sort().map(key => { 
      const bucket = buckets[key]; 
      let label = format(bucket.dateObj, 'dd/MM'); 
      if (grouping === 'month') label = format(bucket.dateObj, 'MMM/yy'); 
      else if (grouping === 'week') label = `S-${format(bucket.dateObj, 'dd/MM')}`; 
      return { ...bucket, date: label }; 
    }); 
    let cumulativeSum = 0; 
    const targetPerStep = totalGoal / (result.length || 1); 
    return result.map((item, idx) => { 
      cumulativeSum += item.active; 
      return { ...item, cumulative: cumulativeSum, goal: Math.round(targetPerStep * (idx + 1)) }; 
    }); 
  }, [adsData, crmData, range, metric, grouping, totalGoal, realDailyData, dateFilterType]);

  const dailyGoalAvg = totalGoal / (processedData.length || 1);

  return ( 
    <div className="space-y-6"> 
      <Card className="p-6 border border-slate-200 dark:border-slate-800"> 
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"> 
          <div><h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" />Gap de Objetivos</h3><p className="text-xs text-slate-400">Progresso acumulado vs. projeção de meta</p></div> 
          <div className="flex flex-wrap gap-2">
            <select value={metric} onChange={(e) => setMetric(e.target.value)} className="pl-3 pr-8 py-1.5 text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer"> 
              {metricsOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))} 
            </select>
            <select value={grouping} onChange={(e) => setGrouping(e.target.value)} className="pl-3 pr-8 py-1.5 text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer"> 
              {groupingOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))} 
            </select>
          </div>
        </div> 
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip formatter={(v) => v.toLocaleString('pt-BR')} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="cumulative" stroke={activeMetric.color} strokeWidth={4} dot={false} name="Realizado" />
              <Line type="monotone" dataKey="goal" stroke="#64748b" strokeWidth={3} strokeDasharray="10 5" dot={false} name="Meta (Teórico)" />
            </LineChart>
          </ResponsiveContainer>
        </div> 
      </Card> 
      <Card className="p-6 border border-slate-200 dark:border-slate-800"> 
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"> 
          <div><h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Activity className="h-5 w-5 text-indigo-500" />Atividade por Período</h3><p className="text-xs text-slate-400">Distribuição temporal vs. ritmo diário</p></div> 
        </div> 
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeMetric.color} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip formatter={(v) => v.toLocaleString('pt-BR')} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="active" stroke={activeMetric.color} strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" name={activeMetric.label} />
              <ReferenceLine y={dailyGoalAvg} stroke="#64748b" strokeWidth={2} strokeDasharray="8 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div> 
      </Card> 
    </div> 
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [rawAdsData, setRawAdsData] = useState([]);
  const [rawCrmData, setRawCrmData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [platform, setPlatform] = useState('all'); 
  const [aiModal, setAiModal] = useState({ isOpen: false, title: "", content: "", loading: false });
  const [activeTab, setActiveTab] = useState('overview');
  const [comparisonMode, setComparisonMode] = useState('target'); 
  const [datePreset, setDatePreset] = useState('30');

  const handleRangeChange = (id, custom) => {
    if (id === 'custom') {
      setDateRange(custom);
      setDatePreset('custom');
      return;
    }
    const now = new Date();
    let f = dateRange.from;
    let t = dateRange.to;
    switch (id) {
      case 'today': f = now; t = now; break;
      case 'yesterday': f = subDays(now, 1); t = subDays(now, 1); break;
      case '7': f = subDays(now, 7); t = now; break;
      case '15': f = subDays(now, 15); t = now; break;
      case '30': f = subDays(now, 30); t = now; break;
      case 'mtd': f = startOfMonth(now); t = endOfMonth(now); break;
      case 'lastMonth': {
        const prev = subMonths(now, 1);
        f = startOfMonth(prev); t = endOfMonth(prev); break;
      }
      case 'ytd': f = startOfYear(now); t = endOfYear(now); break;
      case 'lastYear': {
        const prevY = subYears(now, 1);
        f = startOfYear(prevY); t = endOfYear(prevY); break;
      }
    }
    setDateRange({ from: startOfDay(f), to: endOfDay(t) });
    setDatePreset(id);
  };
  const [dateRange, setDateRange] = useState({ from: startOfDay(subDays(new Date(), 30)), to: endOfDay(new Date()) });
  const [dateFilterType, setDateFilterType] = useState("movimentacao");
  const [dbMetas, setDbMetas] = useState<any[]>([]);

  useEffect(() => {
    const fetchDbMetas = async () => {
      try {
        const res = await fetch('/api/metas');
        const data = await res.json();
        if (data.metas) setDbMetas(data.metas);
      } catch (err) {
        console.error("Erro ao buscar metas do BD:", err);
      }
    };
    fetchDbMetas();
  }, []);

  const [monthlyGoals, setMonthlyGoals] = useState({ investment: 80000, leads: 1200, mql: 400, opportunity: 150, venda: 250, faturamento: 35000, perdido: 300, cpl: 50, cpmql: 150, cpo: 400, cpv: 1200, ticketMedio: 119 });
  const [realStats, setRealStats] = useState({ 
    current: { 
      totalInvestimento: 0, vendasConcluidas: 0, faturamentoBruto: 0,
      funnel: { leads: 0, leadsQualificados: 0, oportunidades: 0, vendas: 0, vendasComercial: 0, perdidos: 0, tempoMedio: 0 }
    },
    previous: { 
      totalInvestimento: 0, vendasConcluidas: 0, faturamentoBruto: 0,
      funnel: { leads: 0, leadsQualificados: 0, oportunidades: 0, vendas: 0, vendasComercial: 0, perdidos: 0, tempoMedio: 0 }
    },
    daily: []
  });
  const [realAdsDaily, setRealAdsDaily] = useState(null);
  const [realPerfData, setRealPerfData] = useState(null);
  const [realCommercialData, setRealCommercialData] = useState(null);

  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        const start = format(dateRange.from, 'yyyy-MM-dd');
        const end = format(dateRange.to, 'yyyy-MM-dd');
        const res = await fetch(`/api/stats?startDate=${start}&endDate=${end}&dateFilterType=${dateFilterType}&platform=${platform}`);
        const data = await res.json();
        if (data.current) {
          setRealStats(data);
        }
      } catch (error) {
        console.error("Erro ao buscar dados reais:", error);
      }
    };
    fetchRealStats();

    const fetchAdsDaily = async () => {
      try {
        const start = format(dateRange.from, 'yyyy-MM-dd');
        const end = format(dateRange.to, 'yyyy-MM-dd');
        const res = await fetch(`/api/ads-daily?startDate=${start}&endDate=${end}&dateFilterType=${dateFilterType}&platform=${platform}`);
        const data = await res.json();
        if (!data.error) setRealAdsDaily(data);
      } catch (error) {
        console.error("Erro ao buscar dados de ads:", error);
      }
    };
    fetchAdsDaily();

    const fetchPerfData = async () => {
      try {
        const start = format(dateRange.from, 'yyyy-MM-dd');
        const end = format(dateRange.to, 'yyyy-MM-dd');
        const res = await fetch(`/api/ads-performance?startDate=${start}&endDate=${end}&dateFilterType=${dateFilterType}&platform=${platform}`);
        const data = await res.json();
        if (!data.error) setRealPerfData(data);
      } catch (error) {
        console.error("Erro ao buscar performance:", error);
      }
    };
    fetchPerfData();

    const fetchCommercialData = async () => {
      try {
        const start = format(dateRange.from, 'yyyy-MM-dd');
        const end = format(dateRange.to, 'yyyy-MM-dd');
        const res = await fetch(`/api/commercial-performance?startDate=${start}&endDate=${end}&dateFilterType=${dateFilterType}&platform=${platform}`);
        const data = await res.json();
        if (!data.error) setRealCommercialData(data);
      } catch (error) {
        console.error("Erro ao buscar dados comerciais:", error);
      }
    };
    fetchCommercialData();
  }, [dateRange, dateFilterType, platform]);

  useEffect(() => { 
    setLoading(true); 
    setTimeout(() => { setRawAdsData(generateMockData()); setRawCrmData(generateMockCRM()); setLoading(false); }, 800); 
  }, []);

  const daysInPeriod = useMemo(() => (differenceInDays(dateRange.to, dateRange.from) + 1) || 1, [dateRange]);
  const periodGoals = useMemo(() => {
    // Fallback static goals scaling
    const fallbackScale = daysInPeriod / 30;
    const fallbackGoals = Object.keys(monthlyGoals).reduce((acc: any, key) => {
      const isRate = ['cpl', 'cpmql', 'cpo', 'cpv', 'ticketMedio'].includes(key);
      acc[key] = isRate ? monthlyGoals[key] : monthlyGoals[key] * fallbackScale;
      return acc;
    }, {} as any);

    if (!dbMetas || dbMetas.length === 0) {
      return fallbackGoals;
    }

    let investment = 0;
    let leads = 0;
    let mql = 0;
    let opportunity = 0;
    let venda = 0;
    let faturamento = 0;
    let overlapDaysTotal = 0;

    dbMetas.forEach(meta => {
      const metaStart = startOfDay(new Date(meta.data_inicio));
      const metaEnd = endOfDay(new Date(meta.data_termino));
      
      const rangeStart = startOfDay(dateRange.from);
      const rangeEnd = endOfDay(dateRange.to);

      // Find intersection
      const start = metaStart > rangeStart ? metaStart : rangeStart;
      const end = metaEnd < rangeEnd ? metaEnd : rangeEnd;

      if (start <= end) {
        const daysOverlap = differenceInDays(end, start) + 1;
        const metaDays = differenceInDays(metaEnd, metaStart) + 1;
        const weight = daysOverlap / metaDays;

        investment += (Number(meta.meta_investimento) || 0) * weight;
        leads += (Number(meta.meta_lead) || 0) * weight;
        mql += (Number(meta.meta_mql) || 0) * weight;
        opportunity += (Number(meta.meta_sql) || 0) * weight;
        venda += (Number(meta.meta_venda) || 0) * weight;
        faturamento += (Number(meta.meta_faturamento) || 0) * weight;
        
        overlapDaysTotal += daysOverlap;
      }
    });

    if (overlapDaysTotal === 0) {
      return fallbackGoals;
    }

    return {
      investment,
      leads: Math.round(leads),
      mql: Math.round(mql),
      opportunity: Math.round(opportunity),
      venda: Math.round(venda),
      faturamento,
      perdido: Math.round(venda * 1.2),
      cpl: leads > 0 ? investment / leads : 50,
      cpmql: mql > 0 ? investment / mql : 150,
      cpo: opportunity > 0 ? investment / opportunity : 400,
      cpv: venda > 0 ? investment / venda : 1200,
      ticketMedio: venda > 0 ? faturamento / venda : 119
    };
  }, [dbMetas, dateRange, daysInPeriod, monthlyGoals]);

  const calculateData = useCallback((ads, crm, range, filterType, currentPlatform) => {
    const filteredAds = ads.filter(item => isWithinInterval(parseISO(item.date), { start: range.from, end: range.to }) && (currentPlatform === 'all' || item.platform === currentPlatform));
    const filteredCrm = crm.filter(record => { 
      const date = parseISO((filterType === "criacao" ? record.dataCriacao : record.dataMovimentacao).split(' ')[0]); 
      return isWithinInterval(date, { start: range.from, end: range.to }) && (currentPlatform === 'all' || record.platform === currentPlatform); 
    });
    const latestByLead = {}; 
    filteredCrm.forEach(r => { if (!latestByLead[r.idLead] || parseInt(r.id) > parseInt(latestByLead[r.idLead].id)) latestByLead[r.idLead] = r; });
    
    let totalClosingDays = 0;
    let closingCount = 0;
    const funnel = { leads: 0, contatoEfetivo: 0, agendamento: 0, venda: 0, perdido: 0 };
    
    Object.values(latestByLead).forEach(r => { 
      if (r.etapa === 'Novos Leads') funnel.leads++; 
      else if (r.etapa === 'Contato Efetivo') funnel.contatoEfetivo++; 
      else if (r.etapa === 'Agendamento') funnel.agendamento++; 
      else if (r.etapa === 'Ganho') {
        funnel.venda++;
        // Cálculo do ciclo médio
        const start = parseISO(r.dataCriacao.replace(' ', 'T'));
        const end = parseISO(r.dataMovimentacao.replace(' ', 'T'));
        totalClosingDays += differenceInHours(end, start) / 24;
        closingCount++;
      }
      else if (r.etapa === 'Perdido') funnel.perdido++; 
    });

    const avgClosingTime = closingCount > 0 ? totalClosingDays / closingCount : 0;

    return { 
      investment: filteredAds.reduce((acc, i) => acc + i.spent, 0), 
      vendas: funnel.venda, 
      faturamento: funnel.venda * monthlyGoals.ticketMedio, 
      leads: Object.keys(latestByLead).length, 
      agendamentos: funnel.agendamento, 
      funnel, 
      filteredAds, 
      fullFilteredCrm: filteredCrm,
      avgClosingTime,
      lostCount: funnel.perdido
    };
  }, [monthlyGoals.ticketMedio]);

  const globalKpis = useMemo(() => calculateData(rawAdsData, rawCrmData, dateRange, dateFilterType, platform), [rawAdsData, rawCrmData, dateRange, dateFilterType, platform, calculateData]);
  const globalPrevKpis = useMemo(() => calculateData(rawAdsData, rawCrmData, { from: subDays(dateRange.from, daysInPeriod), to: subDays(dateRange.from, 1) }, dateFilterType, platform), [rawAdsData, rawCrmData, dateRange, dateFilterType, platform, daysInPeriod, calculateData]);
  const metricsValues = useMemo(() => {
    const calc = (d, isReal = false) => {
      if (isReal) {
        const inv = d.totalInvestimento;
        const f = d.funnel;
        return {
          cpl: f.leads > 0 ? inv / f.leads : 0,
          cpmql: f.leadsQualificados > 0 ? inv / f.leadsQualificados : 0,
          cpo: f.oportunidades > 0 ? inv / f.oportunidades : 0,
          cpv: f.vendasComercial > 0 ? inv / f.vendasComercial : (f.vendas > 0 ? inv / f.vendas : 0),
          ticketMedio: f.vendas > 0 ? d.faturamentoBruto / f.vendas : 0,
          ...d
        };
      }
      return { 
        cpl: d.investment / (d.leads || 1), 
        cpmql: d.investment / (d.funnel.contatoEfetivo || 1), 
        cpo: d.investment / (d.agendamentos || 1), 
        cpv: d.investment / (d.vendas || 1), 
        ticketMedio: d.vendas > 0 ? d.faturamento / d.vendas : monthlyGoals.ticketMedio, 
        ...d 
      };
    };

    return { 
      current: realStats.current.totalInvestimento > 0 ? calc(realStats.current, true) : calc(globalKpis), 
      previous: realStats.previous.totalInvestimento > 0 ? calc(realStats.previous, true) : calc(globalPrevKpis), 
      target: periodGoals 
    };
  }, [globalKpis, globalPrevKpis, periodGoals, realStats, monthlyGoals.ticketMedio]);

  const getComparisonValues = (key) => comparisonMode === 'target' ? metricsValues.target[key] : metricsValues.previous[key];
  const getComparisonFunnel = useMemo(() => comparisonMode === 'target' ? { leads: periodGoals.leads, contatoEfetivo: periodGoals.mql, agendamento: periodGoals.opportunity, venda: periodGoals.venda } : metricsValues.previous.funnel, [comparisonMode, metricsValues, periodGoals]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <AIModal isOpen={aiModal.isOpen} onClose={() => setAiModal(p => ({ ...p, isOpen: false }))} title={aiModal.title} content={aiModal.content} loading={aiModal.loading} />
      
      <aside className={`bg-white dark:bg-slate-900 border-r border-slate-200 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shrink-0 shadow-lg"><Trophy className="h-6 w-6 text-white" /></div>
          {sidebarOpen && <h1 className="font-bold text-xl uppercase tracking-tighter">Dash Felipe</h1>}
        </div>
        <div className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutDashboard className="h-4 w-4 mr-3" />{sidebarOpen && "Visão Geral"}</button>
          <button onClick={() => setActiveTab('campaign-analysis')} className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold ${activeTab === 'campaign-analysis' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><TargetIcon className="h-4 w-4 mr-3" />{sidebarOpen && "Performance Ads"}</button>
          <button onClick={() => setActiveTab('commercial')} className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold ${activeTab === 'commercial' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><ClipboardList className="h-4 w-4 mr-3" />{sidebarOpen && "CRM Leads"}</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-auto py-4 bg-white dark:bg-slate-900 border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-full"><Menu className="h-5 w-5" /></button>
            <h2 className="hidden lg:block text-lg font-black uppercase">Inteligência Comercial</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <div className="relative group min-w-[160px]">
              <History className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition-colors z-10" />
              <select value={dateFilterType} onChange={(e) => setDateFilterType(e.target.value)} className="w-full pl-9 pr-8 py-2 text-[10px] font-black bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none cursor-pointer">
                <option value="movimentacao">Filtrar: Movimentação</option>
                <option value="criacao">Filtrar: Criação Lead</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative group min-w-[150px]">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition-colors z-10" />
              <select value={comparisonMode} onChange={(e) => setComparisonMode(e.target.value)} className="w-full pl-9 pr-8 py-2 text-[10px] font-black bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none cursor-pointer">
                <option value="target">Comparar vs. Meta</option>
                <option value="previous_period">Comparar vs. Ant.</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <AdvancedDatePicker range={dateRange} onRangeChange={handleRangeChange} currentPreset={datePreset} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICardLarge 
                  title="Investimento Período" 
                  value={`R$ ${realStats.current.totalInvestimento.toLocaleString('pt-BR')}`} 
                  icon={<DollarSign />} 
                  accentColor="primary" 
                  loading={loading} 
                  currentValue={realStats.current.totalInvestimento} 
                  comparisonValue={comparisonMode === 'target' ? periodGoals.investment : realStats.previous.totalInvestimento} 
                  isCurrency 
                  invertColors 
                  comparisonLabel={comparisonMode === 'target' ? 'Meta' : 'Ant.'}
                />
                <KPICardLarge 
                  title="Vendas Concluídas" 
                  value={realStats.current.vendasConcluidas} 
                  icon={<Trophy />} 
                  accentColor="accent" 
                  loading={loading} 
                  currentValue={realStats.current.vendasConcluidas} 
                  comparisonValue={comparisonMode === 'target' ? periodGoals.venda : realStats.previous.vendasConcluidas} 
                  comparisonLabel={comparisonMode === 'target' ? 'Meta' : 'Ant.'}
                />
                <KPICardLarge 
                  title="Faturamento Bruto" 
                  value={`R$ ${realStats.current.faturamentoBruto.toLocaleString('pt-BR')}`} 
                  icon={<TrendingUp />} 
                  accentColor="accent" 
                  loading={loading} 
                  currentValue={realStats.current.faturamentoBruto} 
                  comparisonValue={comparisonMode === 'target' ? periodGoals.faturamento : realStats.previous.faturamentoBruto} 
                  isCurrency 
                  comparisonLabel={comparisonMode === 'target' ? 'Meta' : 'Ant.'}
                />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICardSmall title="CPL" value={`R$ ${metricsValues.current.cpl.toFixed(2)}`} icon={<Users className="h-4 w-4" />} loading={loading} currentValue={metricsValues.current.cpl} comparisonValue={getComparisonValues('cpl')} isCurrency invertColors comparisonLabel={comparisonMode === 'target' ? 'Meta' : 'Ant.'} />
                <KPICardSmall title="CPMQL" value={`R$ ${metricsValues.current.cpmql.toFixed(2)}`} icon={<Zap className="h-4 w-4" />} loading={loading} currentValue={metricsValues.current.cpmql} comparisonValue={getComparisonValues('cpmql')} isCurrency invertColors comparisonLabel={comparisonMode === 'target' ? 'Meta' : 'Ant.'} />
                <KPICardSmall title="CPO" value={`R$ ${metricsValues.current.cpo.toFixed(2)}`} icon={<Calendar className="h-4 w-4" />} loading={loading} currentValue={metricsValues.current.cpo} comparisonValue={getComparisonValues('cpo')} isCurrency invertColors comparisonLabel={comparisonMode === 'target' ? 'Meta' : 'Ant.'} />
                <KPICardSmall title="CAC" value={`R$ ${metricsValues.current.cpv.toFixed(2)}`} icon={<Target className="h-4 w-4" />} loading={loading} currentValue={metricsValues.current.cpv} comparisonValue={getComparisonValues('cpv')} isCurrency invertColors comparisonLabel={comparisonMode === 'target' ? 'Meta' : 'Ant.'} />
                <KPICardSmall title="Ticket Médio" value={`R$ ${metricsValues.current.ticketMedio.toFixed(2)}`} icon={<ShoppingBag className="h-4 w-4" />} loading={loading} currentValue={metricsValues.current.ticketMedio} comparisonValue={getComparisonValues('ticketMedio')} isCurrency comparisonLabel={comparisonMode === 'target' ? 'Meta' : 'Ant.'} />
              </div>
              
              <SalesFunnel 
                data={realStats.current.funnel} 
                comparisonData={comparisonMode === 'target' ? {
                  leads: periodGoals.leads,
                  leadsQualificados: periodGoals.mql,
                  oportunidades: periodGoals.opportunity,
                  vendas: periodGoals.venda
                } : realStats.previous.funnel} 
                avgClosingTime={realStats.current.funnel.tempoMedio}
                lostCount={realStats.current.funnel.perdidos}
              />
              
              <DynamicCharts 
                adsData={globalKpis} 
                crmData={globalKpis} 
                range={dateRange} 
                goalMap={periodGoals} 
                realDailyData={realStats.daily}
                dateFilterType={dateFilterType}
              />
            </>
          )}

          {activeTab === 'campaign-analysis' && <CampaignAnalysis adsData={globalKpis.filteredAds} range={dateRange} realAdsDaily={realAdsDaily} realPerfData={realPerfData} />}
          {activeTab === 'commercial' && <CommercialAnalysis adsData={globalKpis.filteredAds} crmData={globalKpis.fullFilteredCrm} realCommercialData={realCommercialData} />}
          
          <footer className="py-8 text-center border-t border-slate-200">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Dash Felipe v6.1 • © 2026</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

