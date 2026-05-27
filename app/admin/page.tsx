"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield, LogOut, Plus, Pencil, Trash2, Save, X, Loader2,
  Target, DollarSign, Users, TrendingUp, Calendar, Lock, Mail,
  ChevronLeft, Eye, EyeOff, AlertTriangle, CheckCircle2, ChevronRight
} from "lucide-react";

const ADMIN_EMAIL = "ti.bh@v4company.com";
const ADMIN_PASS = "V4SA@Tibh123";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const emptyMeta = {
  data_inicio: "", data_termino: "",
  meta_investimento: 0, investimento_meta_ads: 0, investimento_google_ads: 0,
  investimento_linkedin_ads: 0, investimento_tiktok_ads: 0,
  meta_lead: 0, meta_mql: 0, meta_sql: 0, meta_venda: 0,
  meta_faturamento: 0, meta_venda_ltv: 0, meta_faturamento_ltv: 0,
  meta_vendas_projeto: 0, meta_faturamento_projeto: 0,
};

// Currencies fields
const CURRENCY_FIELDS = [
  "meta_investimento", "investimento_meta_ads", "investimento_google_ads",
  "investimento_linkedin_ads", "investimento_tiktok_ads", "meta_faturamento",
  "meta_faturamento_ltv", "meta_faturamento_projeto"
];

// Helper to format raw number to BRL Currency (R$ 1.234,56)
const formatBRL = (value: number | string) => {
  if (value === undefined || value === null) return "R$ 0,00";
  let cleanValue = String(value).replace(/\D/g, "");
  
  if (typeof value === "number") {
    // If it has decimals, convert to integer representation of cents
    cleanValue = Math.round(value * 100).toString();
  }
  
  if (!cleanValue || cleanValue === "0") return "R$ 0,00";
  
  const cents = parseInt(cleanValue, 10);
  const floatValue = cents / 100;
  
  return floatValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
};

// Helper to convert formatted currency string back to standard Float number
const parseBRLToFloat = (formattedValue: string) => {
  const clean = formattedValue.replace(/\D/g, "");
  if (!clean) return 0;
  return parseInt(clean, 10) / 100;
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

type Toast = { msg: string; type: "success" | "error" };

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [metas, setMetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ ...emptyMeta });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMetas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/metas");
      const data = await res.json();
      setMetas(data.metas || []);
    } catch { showToast("Erro ao carregar metas", "error"); }
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) fetchMetas(); }, [authed, fetchMetas]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr("");
    setTimeout(() => {
      if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
        setAuthed(true);
      } else {
        setLoginErr("Credenciais inválidas");
      }
      setLoginLoading(false);
    }, 800);
  };

  const openCreate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const end = `${y}-${String(m + 1).padStart(2, "0")}-${new Date(y, m + 1, 0).getDate()}`;
    setForm({ ...emptyMeta, data_inicio: start, data_termino: end });
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (meta: any) => {
    const f: any = {};
    Object.keys(emptyMeta).forEach(k => {
      if (k === "data_inicio" || k === "data_termino") {
        f[k] = meta[k] ? String(meta[k]).slice(0, 10) : "";
      } else {
        f[k] = Number(meta[k]) || 0;
      }
    });
    setForm(f);
    setEditing(meta);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, ...form } : form;
      const res = await fetch("/api/metas", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      showToast(editing ? "Meta atualizada!" : "Meta criada!", "success");
      setModalOpen(false);
      fetchMetas();
    } catch (err: any) { showToast(err.message || "Erro ao salvar", "error"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/metas?id=${id}`, { method: "DELETE" });
      showToast("Meta excluída", "success");
      fetchMetas();
    } catch { showToast("Erro ao excluir", "error"); }
    setDeleting(null);
  };

  const setField = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const numField = (k: string, v: string) => setField(k, v === "" ? 0 : Number(v));

  // Specialized Currency input handler
  const handleCurrencyChange = (key: string, inputValue: string) => {
    const numericValue = parseBRLToFloat(inputValue);
    setField(key, numericValue);
  };

  const fmtDate = (d: string) => {
    if (!d) return "-";
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
  };

  const getMonthLabel = (d: string) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
  };

  // LOGIN SCREEN - Modern Minimalist Clean White
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans antialiased">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all">
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Painel Administrativo</h1>
              <p className="text-xs text-slate-400 mt-1">Gerenciamento de Metas HGMax</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="exemplo@v4company.com" required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="••••••••" required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {loginErr && (
                <div className="flex items-center gap-2 text-rose-500 text-xs bg-rose-50 border border-rose-100 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {loginErr}
                </div>
              )}
              
              <button
                type="submit" disabled={loginLoading}
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.15)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.25)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {loginLoading ? "Acessando..." : "Entrar no Painel"}
              </button>
            </form>
          </div>
          
          <a href="/" className="flex items-center justify-center gap-1.5 mt-6 text-slate-400 hover:text-slate-600 text-xs transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }

  // ADMIN PANEL - Clean Minimalist White & Sleek Blue Accents
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans antialiased text-slate-600">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] text-sm font-semibold text-white animate-in slide-in-from-top-2 duration-300 ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none mb-1">Metas de Performance</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Gestão Comercial & Investimentos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="/" className="text-xs text-slate-400 hover:text-blue-600 font-bold flex items-center gap-1 transition-all">
              <ChevronLeft className="w-3.5 h-3.5" /> Dashboard
            </a>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-medium text-slate-400 hidden sm:block">{ADMIN_EMAIL}</span>
            <button onClick={() => setAuthed(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Sair do painel">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Metas Mensais</h2>
            <p className="text-xs text-slate-400 mt-0.5">{metas.length} cadastros ativos</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.12)] hover:shadow-[0_4px_18px_rgba(37,99,235,0.22)] transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> Nova Meta
          </button>
        </div>

        {/* Table / Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-28">
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
          </div>
        ) : metas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">Nenhuma meta ativa</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">Crie agora mesmo o planejamento de metas e faturamento comercial.</p>
            <button onClick={openCreate} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer">
              <Plus className="w-3.5 h-3.5 inline mr-1" /> Configurar Primeira Meta
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Período</th>
                    <th className="px-4 py-4 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">Investimento Total</th>
                    <th className="px-4 py-4 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">Metas Google / Meta</th>
                    <th className="px-4 py-4 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">Meta Leads</th>
                    <th className="px-4 py-4 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">MQL / SQL</th>
                    <th className="px-4 py-4 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vendas</th>
                    <th className="px-4 py-4 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">Faturamento Alvo</th>
                    <th className="px-6 py-4 text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {metas.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-sm">{getMonthLabel(m.data_inicio)}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{fmtDate(m.data_inicio)} — {fmtDate(m.data_termino)}</div>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-800">{fmt(Number(m.meta_investimento) || 0)}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-slate-700 font-semibold">G: {fmt(Number(m.investimento_google_ads) || 0)}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">M: {fmt(Number(m.investimento_meta_ads) || 0)}</div>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-800">{Number(m.meta_lead).toLocaleString("pt-BR") || 0}</td>
                      <td className="px-4 py-4 text-right text-slate-500">
                        <div>MQL: {Number(m.meta_mql) || 0}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">SQL: {Number(m.meta_sql) || 0}</div>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-800">{Number(m.meta_venda) || 0}</td>
                      <td className="px-4 py-4 text-right font-bold text-emerald-600 text-sm">{fmt(Number(m.meta_faturamento) || 0)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(m)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer" title="Editar Meta">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50 cursor-pointer" title="Excluir"
                          >
                            {deleting === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal - Modern and minimalist */}
      {modalOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center p-4 pt-[6vh] bg-slate-900/25 backdrop-blur-[2px] overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.1)] border border-slate-100 animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Target className="w-4.5 h-4.5" />
                </div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {editing ? "Editar Planejamento" : "Nova Meta Mensal"}
                </h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"><X className="w-4.5 h-4.5 text-slate-400" /></button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Período */}
              <div>
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500" /> Duração da Meta</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Início</label>
                    <input type="date" value={form.data_inicio} onChange={e => setField("data_inicio", e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Término</label>
                    <input type="date" value={form.data_termino} onChange={e => setField("data_termino", e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Investimentos */}
              <div>
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-blue-500" /> Investimentos Alocados</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    ["meta_investimento", "Total Investimento"],
                    ["investimento_meta_ads", "Meta Ads"],
                    ["investimento_google_ads", "Google Ads"],
                    ["investimento_linkedin_ads", "LinkedIn Ads"],
                    ["investimento_tiktok_ads", "TikTok Ads"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
                      <input
                        type="text"
                        value={formatBRL(form[key])}
                        onChange={e => handleCurrencyChange(key, e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-semibold text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-left"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Funil */}
              <div>
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-500" /> Volume do Funil</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    ["meta_lead", "Leads"],
                    ["meta_mql", "MQL"],
                    ["meta_sql", "SQL"],
                    ["meta_venda", "Vendas"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
                      <input
                        type="number"
                        value={form[key] || ""}
                        onChange={e => numField(key, e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Faturamento */}
              <div>
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Receita & LTV</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    ["meta_faturamento", "Faturamento Geral", true],
                    ["meta_venda_ltv", "Vendas LTV", false],
                    ["meta_faturamento_ltv", "Faturamento LTV", true],
                    ["meta_vendas_projeto", "Vendas Projeto", false],
                    ["meta_faturamento_projeto", "Faturamento Projeto", true],
                  ].map(([key, label, isCurrency]) => (
                    <div key={key as string}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label as string}</label>
                      {isCurrency ? (
                        <input
                          type="text"
                          value={formatBRL(form[key as string])}
                          onChange={e => handleCurrencyChange(key as string, e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-semibold text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-left"
                        />
                      ) : (
                        <input
                          type="number"
                          value={form[key as string] || ""}
                          onChange={e => numField(key as string, e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          placeholder="0"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4.5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/30 rounded-b-3xl">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Salvando..." : editing ? "Salvar Alterações" : "Salvar Meta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
