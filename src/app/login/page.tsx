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
    <div className="min-h-dvh flex flex-col items-center justify-center px-6">
      <div className="text-center mb-12 animate-slide-up">
        <div className="text-8xl mb-5">🌸</div>
        <h1 className="text-4xl font-bold text-rosa-600 font-[var(--font-nunito)]">
          Agenda Fono
        </h1>
        <p className="text-xl text-rosa-400 font-medium mt-2">Elis Pinheiro</p>
      </div>

      <div className="flex gap-4 mb-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
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
            className="w-16 h-20 text-center text-3xl font-bold rounded-2xl border-2 border-rosa-200 bg-white
              focus:border-rosa-500 focus:ring-4 focus:ring-rosa-200/60 focus:shadow-lg focus:shadow-rosa-200/40
              outline-none transition-all duration-200"
            disabled={loading}
          />
        ))}
      </div>

      <div className="h-6 animate-fade-in">
        {error && (
          <p className="text-red-500 text-base font-medium animate-bounce-in">{error}</p>
        )}

        {loading && (
          <div className="dots-loading text-rosa-400">
            <span /><span /><span />
          </div>
        )}
      </div>

      <p className="text-sm text-gray-400 mt-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
        Digite seu PIN de 4 dígitos
      </p>
    </div>
  );
}
