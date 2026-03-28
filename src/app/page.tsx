"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Check, X, Clock, AlertCircle, RefreshCw, LogOut } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { PatientCard } from "@/components/patient-card";
import { formatDate, toDateString } from "@/lib/utils";

interface Appointment {
  id: string;
  time: string;
  patientName: string;
  attended: boolean | null;
}

interface Agenda {
  id: string;
  date: string;
  clinic: string;
  appointments: Appointment[];
}

export default function DashboardPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();
  const today = toDateString();

  useEffect(() => {
    fetchAgenda();
  }, []);

  async function fetchAgenda() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/agenda?date=${today}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAgendas(data.agendas || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const handleAttendanceUpdate = useCallback((id: string, attended: boolean | null) => {
    setAgendas((prev) =>
      prev.map((agenda) => ({
        ...agenda,
        appointments: agenda.appointments.map((apt) =>
          apt.id === id ? { ...apt, attended } : apt
        ),
      }))
    );
  }, []);

  const allAppointments = agendas.flatMap((a) => a.appointments);
  const presentes = allAppointments.filter((a) => a.attended === true).length;
  const faltas = allAppointments.filter((a) => a.attended === false).length;
  const pendentes = allAppointments.filter((a) => a.attended === null).length;

  return (
    <div className="min-h-dvh pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-rosa-500 via-rosa-400 to-lilas-400 text-white px-5 md:px-8 pt-12 pb-6 rounded-b-3xl animate-fade-in relative">
        <button
          onClick={async () => {
            if (!window.confirm("Deseja sair?")) return;
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
          }}
          className="absolute top-4 right-4 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10
            transition-all duration-200 active:scale-90"
          aria-label="Sair"
        >
          <LogOut size={16} />
        </button>
        <p className="text-white/80 text-sm">Olá, Elis 🌸</p>
        <h1 className="text-xl font-bold mt-1 capitalize font-[var(--font-nunito)]">
          {formatDate(today)}
        </h1>

        {allAppointments.length > 0 && (
          <div className="flex gap-3 md:gap-5 mt-4">
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
              <Check size={14} />
              <span className="text-sm font-semibold">{presentes}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
              <X size={14} />
              <span className="text-sm font-semibold">{faltas}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
              <Clock size={14} />
              <span className="text-sm font-semibold">{pendentes}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5 ml-auto">
              <Users size={14} />
              <span className="text-sm font-semibold">{allAppointments.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="dots-loading text-rosa-400 mb-3">
              <span /><span /><span />
            </div>
            <p className="text-sm text-gray-400">Carregando agenda...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 font-[var(--font-nunito)]">
              Não foi possível carregar a agenda
            </h2>
            <p className="text-sm text-gray-400 mt-1 mb-6">
              Verifique sua conexão e tente novamente
            </p>
            <button
              onClick={fetchAgenda}
              className="flex items-center gap-2 bg-white text-rosa-500 border-2 border-rosa-200 px-5 py-2.5 rounded-2xl
                font-semibold active:scale-95 transition-all duration-200 hover:shadow-md"
            >
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          </div>
        ) : agendas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-rosa-100 flex items-center justify-center mb-5">
              <span className="text-4xl">📋</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-700 font-[var(--font-nunito)]">
              Nenhuma agenda hoje
            </h2>
            <p className="text-sm text-gray-400 mt-1 mb-6">
              Envie a foto da agenda para começar
            </p>
            <button
              onClick={() => router.push("/upload")}
              className="bg-gradient-to-r from-rosa-500 to-lilas-400 text-white px-6 py-3.5 rounded-2xl font-semibold
                hover:shadow-lg hover:shadow-rosa-200 active:scale-95 transition-all duration-200
                shadow-md shadow-rosa-200/50"
            >
              📸 Enviar agenda de hoje
            </button>
          </div>
        ) : (
          agendas.map((agenda) => (
            <div key={agenda.id} className="mb-6 animate-slide-up">
              <h2 className="text-sm font-semibold text-rosa-600 mb-3 px-1 font-[var(--font-nunito)]">
                {agenda.clinic}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 stagger-children">
                {agenda.appointments.map((apt) => (
                  <PatientCard
                    key={apt.id}
                    id={apt.id}
                    time={apt.time}
                    patientName={apt.patientName}
                    attended={apt.attended}
                    onUpdate={handleAttendanceUpdate}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
