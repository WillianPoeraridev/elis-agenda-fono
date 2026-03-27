"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Check, X, Clock } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  time: string;
  patientName: string;
  attended: boolean | null;
}

interface AgendaWithStats {
  id: string;
  date: string;
  clinic: string;
  appointments: Appointment[];
  stats: { total: number; presentes: number; faltas: number; pendentes: number };
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function HistoricoPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [agendas, setAgendas] = useState<AgendaWithStats[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  useEffect(() => {
    fetchMonth();
  }, [monthStr]);

  async function fetchMonth() {
    setLoading(true);
    try {
      const res = await fetch(`/api/historico?month=${monthStr}`);
      const data = await res.json();
      setAgendas(data.agendas || []);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }

  function navigate(delta: number) {
    setCurrentDate((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
    setSelectedDay(null);
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  // Map agendas by day
  const agendaByDay = new Map<number, AgendaWithStats>();
  agendas.forEach((a) => {
    const day = new Date(a.date + "T12:00:00").getDate();
    agendaByDay.set(day, a);
  });

  const selectedAgenda = selectedDay
    ? agendaByDay.get(parseInt(selectedDay))
    : null;

  return (
    <div className="min-h-dvh bg-rosa-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-rosa-500 to-rosa-600 text-white px-5 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-xl font-bold">Histórico</h1>
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 active:scale-95"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-lg font-semibold">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={() => navigate(1)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 active:scale-95"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 mt-4">
        {/* Calendar grid */}
        <div className="bg-white rounded-2xl p-3 border border-rosa-200 shadow-sm">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) return <div key={i} />;

              const agenda = agendaByDay.get(day);
              const isSelected = selectedDay === String(day);
              const hasData = !!agenda;
              const rate = agenda
                ? agenda.stats.presentes / agenda.stats.total
                : 0;

              return (
                <button
                  key={i}
                  onClick={() => hasData && setSelectedDay(String(day))}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all",
                    isSelected && "ring-2 ring-rosa-500",
                    hasData && rate >= 0.7 && "bg-green-100 text-green-700 font-semibold",
                    hasData && rate >= 0.4 && rate < 0.7 && "bg-amber-100 text-amber-700 font-semibold",
                    hasData && rate < 0.4 && "bg-red-100 text-red-700 font-semibold",
                    !hasData && "text-gray-400"
                  )}
                  disabled={!hasData}
                >
                  {day}
                  {hasData && (
                    <div className="w-1.5 h-1.5 rounded-full mt-0.5 bg-current opacity-50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedAgenda && (
          <div className="mt-4 bg-white rounded-2xl border border-rosa-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-rosa-50 border-b border-rosa-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-rosa-600">
                {selectedAgenda.clinic}
              </h3>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1 text-green-600">
                  <Check size={12} /> {selectedAgenda.stats.presentes}
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <X size={12} /> {selectedAgenda.stats.faltas}
                </span>
                <span className="flex items-center gap-1 text-amber-500">
                  <Clock size={12} /> {selectedAgenda.stats.pendentes}
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {selectedAgenda.appointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs font-bold text-rosa-500 w-12">{apt.time}</span>
                  <span className="text-sm text-gray-700 flex-1">{apt.patientName}</span>
                  <span>
                    {apt.attended === true && <Check size={16} className="text-green-500" />}
                    {apt.attended === false && <X size={16} className="text-red-500" />}
                    {apt.attended === null && <Clock size={16} className="text-amber-400" />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && agendas.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">Nenhuma agenda neste mês</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
