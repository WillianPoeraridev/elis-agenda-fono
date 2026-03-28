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
      <div className="text-center mb-8 animate-slide-up">
        <div className="text-7xl md:text-9xl mb-5">🌸</div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-rosa-600 font-[var(--font-nunito)]">
          Agenda Fono
        </h1>
        <p className="text-2xl md:text-3xl text-gray-800 font-bold mt-3">Elis Pinheiro</p>
      </div>

      <div className="flex gap-4 md:gap-5 mb-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
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
            className="w-16 h-20 md:w-20 md:h-24 text-center text-3xl md:text-4xl font-bold rounded-2xl md:rounded-3xl
              border-2 md:border-3 border-rosa-200 bg-white
              focus:border-rosa-500 focus:ring-4 focus:ring-rosa-200/60 focus:shadow-lg focus:shadow-rosa-200/40
              outline-none transition-all duration-200"
            disabled={loading}
          />
        ))}
      </div>

      <div className="h-7 animate-fade-in">
        {error && (
          <p className="text-red-500 text-base md:text-lg font-semibold animate-bounce-in">{error}</p>
        )}

        {loading && (
          <div className="dots-loading dots-loading-lg text-rosa-400">
            <span /><span /><span />
          </div>
        )}
      </div>

      <div className="text-center mt-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <p className="text-base md:text-lg text-rosa-400 font-medium">Fonoaudióloga</p>
        <p className="text-sm md:text-base text-gray-700 mt-1">CRFa 7-11370</p>
        <p className="text-sm md:text-base text-gray-400 mt-2">Digite seu PIN de 4 dígitos</p>
      </div>
    </div>
  );
}
