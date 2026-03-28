"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Check, X, Clock, AlertTriangle } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";

interface PatientStats {
  name: string;
  totalConsultas: number;
  presencas: number;
  faltas: number;
  pendentes: number;
  taxaPresenca: number;
  ultimaConsulta: string;
  clinicas: string[];
}

interface HistoricoItem {
  date: string;
  time: string;
  clinic: string;
  attended: boolean | null;
  notes: string | null;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return `${day}/${month} - ${weekdays[d.getDay()]}`;
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<PatientStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchPacientes = useCallback(async (searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: monthStr });
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      const res = await fetch(`/api/pacientes?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPacientes(data.pacientes || []);
    } catch {
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchPacientes(search);
    setExpanded(null);
  }, [monthStr]);

  function handleSearch(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPacientes(value), 300);
  }

  function navigate(delta: number) {
    setCurrentDate((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  }

  async function toggleExpand(name: string) {
    if (expanded === name) {
      setExpanded(null);
      return;
    }
    setExpanded(name);
    setHistoricoLoading(true);
    setHistorico([]);
    try {
      const params = new URLSearchParams({ name, month: monthStr });
      const res = await fetch(`/api/pacientes/historico?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistorico(data.historico || []);
    } catch {
      setHistorico([]);
    } finally {
      setHistoricoLoading(false);
    }
  }

  return (
    <div className="min-h-dvh pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-rosa-500 via-rosa-400 to-lilas-400 text-white px-5 md:px-8 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-xl font-bold font-[var(--font-nunito)]">Pacientes</h1>
        <p className="text-white/80 text-sm mt-1">Frequência e histórico</p>
      </div>

      <div className="px-4 md:px-6 mt-4">
        {/* Search + Month nav */}
        <div className="flex flex-col gap-3 mb-4 animate-slide-up">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-rosa-200 bg-white
                focus:border-rosa-400 focus:ring-4 focus:ring-rosa-200/40 outline-none text-sm transition-all duration-200"
            />
          </div>

          <div className="flex items-center justify-between bg-white rounded-2xl border border-rosa-100 px-3 py-2">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rosa-50
                active:scale-95 transition-all"
            >
              <ChevronLeft size={18} className="text-rosa-500" />
            </button>
            <span className="text-sm font-semibold text-gray-700 font-[var(--font-nunito)]">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={() => navigate(1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rosa-50
                active:scale-95 transition-all"
            >
              <ChevronRight size={18} className="text-rosa-500" />
            </button>
          </div>
        </div>

        {/* Patient list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="dots-loading text-rosa-400 mb-3">
              <span /><span /><span />
            </div>
            <p className="text-sm text-gray-400">Carregando pacientes...</p>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-rosa-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-gray-400 text-sm">
              {search ? "Nenhum paciente encontrado" : "Nenhum paciente neste mês"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
            {pacientes.map((p) => {
              const isExpanded = expanded === p.name;
              const lowFreq = p.taxaPresenca < 50 && (p.presencas + p.faltas) >= 3;

              return (
                <div key={p.name} className="animate-slide-up">
                  {/* Card */}
                  <button
                    onClick={() => toggleExpand(p.name)}
                    className={cn(
                      "w-full text-left bg-white rounded-2xl border-2 p-4 transition-all duration-200",
                      "shadow-sm hover:shadow-md active:scale-[0.98]",
                      isExpanded ? "border-rosa-300" : "border-rosa-100"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-semibold text-gray-800">{p.name}</p>
                      {lowFreq && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 flex-shrink-0">
                          <AlertTriangle size={10} />
                          Baixa frequência
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all duration-500"
                        style={{ width: `${p.taxaPresenca}%` }}
                      />
                    </div>

                    <p className="text-xs text-gray-500 mt-1.5">
                      {p.presencas} presenças de {p.presencas + p.faltas} consultas ({p.taxaPresenca}%)
                      {p.pendentes > 0 && ` · ${p.pendentes} pendente${p.pendentes > 1 ? "s" : ""}`}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.clinicas.map((c) => (
                        <span key={c} className="text-[10px] bg-rosa-100 text-rosa-600 rounded-full px-2 py-0.5">
                          {c}
                        </span>
                      ))}
                    </div>
                  </button>

                  {/* Expanded historico */}
                  {isExpanded && (
                    <div className="bg-white border-2 border-t-0 border-rosa-200 rounded-b-2xl -mt-2 pt-3 pb-2 px-3 animate-height-in">
                      {historicoLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="dots-loading text-rosa-400">
                            <span /><span /><span />
                          </div>
                        </div>
                      ) : historico.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">
                          Nenhuma consulta neste mês
                        </p>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {historico.map((h, i) => (
                            <div key={i} className="flex items-center gap-2.5 py-2">
                              <span className="text-xs font-semibold text-gray-600 w-24 flex-shrink-0">
                                {formatShortDate(h.date)}
                              </span>
                              <span className="text-xs text-rosa-500 font-bold w-11 flex-shrink-0">
                                {h.time}
                              </span>
                              <span className="text-xs text-gray-500 flex-1 truncate">
                                {h.clinic}
                              </span>
                              <span className="flex-shrink-0">
                                {h.attended === true && <Check size={14} className="text-green-500" />}
                                {h.attended === false && <X size={14} className="text-red-500" />}
                                {h.attended === null && <Clock size={14} className="text-amber-400" />}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
