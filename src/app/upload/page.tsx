"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImageIcon, Loader2, Check, RotateCcw } from "lucide-react";
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
    <div className="min-h-dvh bg-rosa-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-rosa-500 to-rosa-600 text-white px-5 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-xl font-bold">Enviar Agenda</h1>
        <p className="text-rosa-100 text-sm mt-1">
          Tire uma foto ou envie da galeria
        </p>
      </div>

      <div className="px-4 mt-4">
        {/* Date selector */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-600 block mb-1">
            Data da agenda
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-rosa-200 bg-white
              focus:border-rosa-400 outline-none text-sm"
          />
        </div>

        {/* Upload step */}
        {step === "upload" && (
          <div className="flex flex-col gap-3">
            {imagePreview && (
              <div className="rounded-xl overflow-hidden border-2 border-rosa-200">
                <img src={imagePreview} alt="Preview" className="w-full" />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => cameraInput.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-rosa-500 text-white
                  py-4 rounded-xl font-semibold active:scale-95 transition-all shadow-lg shadow-rosa-200"
              >
                <Camera size={20} />
                Câmera
              </button>
              <button
                onClick={() => fileInput.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-rosa-500
                  py-4 rounded-xl font-semibold border-2 border-rosa-300 active:scale-95 transition-all"
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Processing step */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 size={40} className="text-rosa-500 animate-spin mb-4" />
            <h2 className="text-lg font-semibold text-gray-700">Lendo a agenda...</h2>
            <p className="text-sm text-gray-400 mt-1">
              A IA está identificando os pacientes 🔍
            </p>
          </div>
        )}

        {/* Done step */}
        {step === "done" && (
          <div className="flex flex-col gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
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

            <div className="bg-white rounded-xl border border-rosa-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-rosa-50 border-b border-rosa-200">
                <h3 className="text-sm font-semibold text-rosa-600">Pacientes extraídos</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {extracted.map((apt, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs font-bold text-rosa-500 w-12">{apt.time}</span>
                    <span className="text-sm text-gray-700">{apt.patientName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex-1 bg-rosa-500 text-white py-3.5 rounded-xl font-semibold
                  active:scale-95 transition-all shadow-lg shadow-rosa-200"
              >
                Ver agenda do dia
              </button>
              <button
                onClick={reset}
                className="flex items-center justify-center w-14 bg-white border-2 border-rosa-300
                  rounded-xl active:scale-95 transition-all"
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
