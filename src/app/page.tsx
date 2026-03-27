"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Check, X, Clock } from "lucide-react";
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
  const router = useRouter();
  const today = toDateString();

  useEffect(() => {
    fetchAgenda();
  }, []);

  async function fetchAgenda() {
    try {
      const res = await fetch(`/api/agenda?date=${today}`);
      const data = await res.json();
      setAgendas(data.agendas || []);
    } catch (err) {
      console.error("Erro ao carregar agenda:", err);
    } finally {
      setLoading(false);
    }
  }

  const allAppointments = agendas.flatMap((a) => a.appointments);
  const presentes = allAppointments.filter((a) => a.attended === true).length;
  const faltas = allAppointments.filter((a) => a.attended === false).length;
  const pendentes = allAppointments.filter((a) => a.attended === null).length;

  return (
    <div className="min-h-dvh bg-rosa-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-rosa-500 to-rosa-600 text-white px-5 pt-12 pb-6 rounded-b-3xl">
        <p className="text-rosa-100 text-sm">Olá, Elis 🌸</p>
        <h1 className="text-xl font-bold mt-1 capitalize">{formatDate(today)}</h1>

        {allAppointments.length > 0 && (
          <div className="flex gap-3 mt-4">
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
      <div className="px-4 mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-rosa-300 border-t-rosa-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400 mt-3">Carregando agenda...</p>
          </div>
        ) : agendas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-gray-700">Nenhuma agenda hoje</h2>
            <p className="text-sm text-gray-400 mt-1 mb-6">
              Envie a foto da agenda para começar
            </p>
            <button
              onClick={() => router.push("/upload")}
              className="bg-rosa-500 text-white px-6 py-3 rounded-xl font-semibold
                hover:bg-rosa-600 active:scale-95 transition-all shadow-lg shadow-rosa-200"
            >
              📸 Enviar agenda de hoje
            </button>
          </div>
        ) : (
          agendas.map((agenda) => (
            <div key={agenda.id} className="mb-6">
              <h2 className="text-sm font-semibold text-rosa-600 mb-3 px-1">
                {agenda.clinic}
              </h2>
              <div className="flex flex-col gap-2">
                {agenda.appointments.map((apt) => (
                  <PatientCard
                    key={apt.id}
                    id={apt.id}
                    time={apt.time}
                    patientName={apt.patientName}
                    attended={apt.attended}
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
