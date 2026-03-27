"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  async function submitPin(fullPin: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: fullPin }),
      });
      if (res.ok) {
        router.push("/");
      } else {
        setError("PIN incorreto");
        setPin(["", "", "", ""]);
        inputs.current[0]?.focus();
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError("");

    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3) {
      const fullPin = newPin.join("");
      if (fullPin.length === 4) {
        submitPin(fullPin);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-rosa-50 px-6">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🌸</div>
        <h1 className="text-2xl font-bold text-rosa-600">Agenda Fono</h1>
        <p className="text-sm text-gray-500 mt-1">Elis Pinheiro</p>
      </div>

      <div className="flex gap-3 mb-6">
        {pin.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 border-rosa-300 bg-white
              focus:border-rosa-500 focus:ring-2 focus:ring-rosa-200 outline-none transition-all"
            disabled={loading}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>
      )}

      {loading && (
        <p className="text-rosa-400 text-sm">Entrando...</p>
      )}

      <p className="text-xs text-gray-400 mt-8">Digite seu PIN de 4 dígitos</p>
    </div>
  );
}
