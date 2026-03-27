"use client";

import { useState } from "react";
import { Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientCardProps {
  id: string;
  time: string;
  patientName: string;
  attended: boolean | null;
}

export function PatientCard({ id, time, patientName, attended: initialAttended }: PatientCardProps) {
  const [attended, setAttended] = useState<boolean | null>(initialAttended);
  const [loading, setLoading] = useState(false);
  const [tapped, setTapped] = useState<string | null>(null);

  async function updateAttendance(value: boolean | null) {
    if (loading) return;
    setLoading(true);
    const key = value === true ? "check" : value === false ? "x" : "clock";
    setTapped(key);
    setTimeout(() => setTapped(null), 250);
    try {
      const res = await fetch(`/api/appointment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attended: value }),
      });
      if (res.ok) {
        setAttended(value);
      }
    } catch (err) {
      console.error("Erro ao atualizar:", err);
    } finally {
      setLoading(false);
    }
  }

  const bgColor =
    attended === true
      ? "bg-green-50 border-green-300"
      : attended === false
        ? "bg-red-50 border-red-300"
        : "bg-white border-rosa-100";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-300",
        "shadow-sm hover:shadow-md",
        bgColor,
        loading && "opacity-60"
      )}
    >
      <div className="flex-shrink-0 w-14 text-center">
        <span className="text-sm font-bold text-rosa-600">{time}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{patientName}</p>
        <p className="text-xs text-gray-400">
          {attended === true ? "Presente ✓" : attended === false ? "Faltou" : "Pendente"}
        </p>
      </div>

      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={() => updateAttendance(true)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
            tapped === "check" && "animate-bounce-tap",
            attended === true
              ? "bg-green-500 text-white shadow-md"
              : "bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600"
          )}
          aria-label="Presente"
        >
          <Check size={18} strokeWidth={3} />
        </button>

        <button
          onClick={() => updateAttendance(false)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
            tapped === "x" && "animate-bounce-tap",
            attended === false
              ? "bg-red-500 text-white shadow-md"
              : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600"
          )}
          aria-label="Faltou"
        >
          <X size={18} strokeWidth={3} />
        </button>

        <button
          onClick={() => updateAttendance(null)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
            tapped === "clock" && "animate-bounce-tap",
            attended === null
              ? "bg-amber-400 text-white shadow-md"
              : "bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-600"
          )}
          aria-label="Pendente"
        >
          <Clock size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
