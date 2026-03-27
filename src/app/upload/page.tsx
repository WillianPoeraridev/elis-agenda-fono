"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImageIcon, Check, RotateCcw } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { toDateString } from "@/lib/utils";

interface ExtractedAppointment {
  time: string;
  patientName: string;
}

type Step = "upload" | "processing" | "preview" | "saving" | "done";

export default function UploadPage() {
  const [step, setStep] = useState<Step>("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedAppointment[]>([]);
  const [clinic, setClinic] = useState<string>("Amar Saúde Tramandaí");
  const [date, setDate] = useState(toDateString());
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFile(file: File) {
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageBase64(result);
      processImage(result);
    };
    reader.readAsDataURL(file);
  }

  async function processImage(base64: string) {
    setStep("processing");
    try {
      const res = await fetch("/api/agenda/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, date }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar imagem");
      }

      setExtracted(data.extracted.appointments || []);
      setClinic(data.extracted.clinic || "Amar Saúde Tramandaí");
      setStep("done");
    } catch (err) {
      setError((err as Error).message);
      setStep("upload");
    }
  }

  function reset() {
    setStep("upload");
    setImagePreview(null);
    setImageBase64(null);
    setExtracted([]);
    setError("");
  }

  return (
    <div className="min-h-dvh pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-rosa-500 via-rosa-400 to-lilas-400 text-white px-5 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-xl font-bold font-[var(--font-nunito)]">Enviar Agenda</h1>
        <p className="text-white/80 text-sm mt-1">
          Tire uma foto ou envie da galeria
        </p>
      </div>

      <div className="px-4 mt-4">
        {/* Date selector */}
        <div className="mb-4 animate-slide-up">
          <label className="text-sm font-medium text-gray-600 block mb-1">
            Data da agenda
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border-2 border-rosa-200 bg-white
              focus:border-rosa-400 focus:ring-4 focus:ring-rosa-200/40 outline-none text-sm transition-all duration-200"
          />
        </div>

        {/* Upload step */}
        {step === "upload" && (
          <div className="flex flex-col gap-3 animate-slide-up" style={{ animationDelay: "60ms" }}>
            {imagePreview ? (
              <div className="rounded-2xl overflow-hidden border-2 border-rosa-200 shadow-md">
                <img src={imagePreview} alt="Preview" className="w-full" />
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-rosa-300 bg-rosa-50/50 py-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-rosa-100 flex items-center justify-center mb-3">
                  <Camera size={24} className="text-rosa-400" />
                </div>
                <p className="text-sm text-gray-500">Nenhuma imagem selecionada</p>
                <p className="text-xs text-gray-400 mt-0.5">Tire uma foto ou escolha da galeria</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => cameraInput.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-500 to-lilas-400 text-white
                  py-4 rounded-2xl font-semibold active:scale-95 transition-all duration-200
                  shadow-md shadow-rosa-200/50 hover:shadow-lg"
              >
                <Camera size={20} />
                Câmera
              </button>
              <button
                onClick={() => fileInput.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-rosa-500
                  py-4 rounded-2xl font-semibold border-2 border-rosa-200 active:scale-95 transition-all duration-200
                  hover:shadow-md hover:border-rosa-300"
              >
                <ImageIcon size={20} />
                Galeria
              </button>
            </div>

            <input
              ref={cameraInput}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-600 animate-bounce-in">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Processing step */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="dots-loading text-rosa-400 mb-5">
              <span /><span /><span />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 font-[var(--font-nunito)]">
              Lendo a agenda...
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              A IA está identificando os pacientes 🔍
            </p>
          </div>
        )}

        {/* Done step */}
        {step === "done" && (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
              <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-700">
                  Agenda salva com sucesso!
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  {extracted.length} pacientes encontrados — {clinic}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-rosa-200 overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 bg-rosa-50 border-b border-rosa-100">
                <h3 className="text-sm font-semibold text-rosa-600 font-[var(--font-nunito)]">
                  Pacientes extraídos
                </h3>
              </div>
              <div className="divide-y divide-gray-100 stagger-children">
                {extracted.map((apt, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-slide-up">
                    <span className="text-xs font-bold text-rosa-500 w-12">{apt.time}</span>
                    <span className="text-sm text-gray-700">{apt.patientName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex-1 bg-gradient-to-r from-rosa-500 to-lilas-400 text-white py-3.5 rounded-2xl font-semibold
                  active:scale-95 transition-all duration-200 shadow-md shadow-rosa-200/50 hover:shadow-lg"
              >
                Ver agenda do dia
              </button>
              <button
                onClick={reset}
                className="flex items-center justify-center w-14 bg-white border-2 border-rosa-200
                  rounded-2xl active:scale-95 transition-all duration-200 hover:shadow-md"
              >
                <RotateCcw size={18} className="text-rosa-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
