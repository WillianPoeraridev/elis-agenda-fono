"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImageIcon, Check, RotateCcw, X, Plus, AlertTriangle } from "lucide-react";
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
  const [extracted, setExtracted] = useState<ExtractedAppointment[]>([]);
  const [clinic, setClinic] = useState<string>("Amar Saúde Tramandaí");
  const [date, setDate] = useState(toDateString());
  const [error, setError] = useState("");
  const [existingCount, setExistingCount] = useState<number | null>(null);
  const [saveSummary, setSaveSummary] = useState<{ mantidos: number; novos: number; total: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1400;
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas não suportado"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => reject(new Error("Erro ao carregar imagem"));
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleFile(file: File) {
    setError("");
    if (file.size > 15 * 1024 * 1024) {
      setError("Imagem muito grande. Tente uma com menos de 15MB.");
      return;
    }
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed);
      extractFromImage(compressed);
    } catch {
      setError("Erro ao processar imagem. Tente outra.");
    }
  }

  async function extractFromImage(base64: string) {
    setStep("processing");
    try {
      const res = await fetch("/api/agenda/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, date }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar imagem");
      }

      setExtracted(data.appointments || []);
      setClinic(data.clinic || "Amar Saúde Tramandaí");

      // Check if agenda already exists for this date
      const checkRes = await fetch(
        `/api/agenda/check?date=${date}&clinic=${encodeURIComponent(data.clinic || "Amar Saúde Tramandaí")}`
      );
      const checkData = await checkRes.json();
      setExistingCount(checkData.exists ? checkData.appointmentCount : null);

      setStep("preview");
    } catch (err) {
      setError((err as Error).message);
      setStep("upload");
    }
  }

  function updateExtracted(index: number, field: "time" | "patientName", value: string) {
    setExtracted((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeExtracted(index: number) {
    setExtracted((prev) => prev.filter((_, i) => i !== index));
  }

  function addExtracted() {
    setExtracted((prev) => [...prev, { time: "", patientName: "" }]);
  }

  async function confirmAndSave() {
    const valid = extracted.filter((a) => a.time.trim() && a.patientName.trim());
    if (valid.length === 0) {
      setError("Adicione pelo menos um paciente.");
      return;
    }

    setStep("saving");
    setError("");
    try {
      const res = await fetch("/api/agenda/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, clinic, appointments: valid }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar");
      }

      setSaveSummary(data.summary);
      setStep("done");
    } catch (err) {
      setError((err as Error).message);
      setStep("preview");
    }
  }

  function reset() {
    setStep("upload");
    setImagePreview(null);
    setExtracted([]);
    setError("");
    setExistingCount(null);
    setSaveSummary(null);
  }

  return (
    <div className="min-h-dvh pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-rosa-500 via-rosa-400 to-lilas-400 text-white px-5 md:px-8 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-xl font-bold font-[var(--font-nunito)]">Enviar Agenda</h1>
        <p className="text-white/80 text-sm mt-1">
          {step === "preview" ? "Confira e edite os dados antes de salvar" :
           step === "processing" ? "Processando imagem..." :
           step === "saving" ? "Salvando..." :
           "Tire uma foto ou envie da galeria"}
        </p>
      </div>

      <div className="px-4 md:px-6 mt-4">
        {/* Date selector — visible on upload and preview */}
        {(step === "upload" || step === "preview") && (
          <div className="mb-4 animate-slide-up">
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Data da agenda
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={step === "preview"}
              className="w-full md:w-auto md:min-w-64 px-4 py-2.5 rounded-2xl border-2 border-rosa-200 bg-white
                focus:border-rosa-400 focus:ring-4 focus:ring-rosa-200/40 outline-none text-sm transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        )}

        {/* Upload step */}
        {step === "upload" && (
          <div className="flex flex-col gap-3 animate-slide-up" style={{ animationDelay: "60ms" }}>
            {imagePreview ? (
              <div className="rounded-2xl overflow-hidden border-2 border-rosa-200 shadow-md">
                <img src={imagePreview} alt="Preview" className="w-full md:max-h-80 md:object-contain md:mx-auto" />
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

        {/* Preview step — edit before saving */}
        {step === "preview" && (
          <div className="flex flex-col gap-4 animate-slide-up">
            {/* Existing agenda warning */}
            {existingCount !== null && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 animate-bounce-in">
                <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">
                    Já existe agenda para este dia
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {existingCount} pacientes registrados. Os pacientes em comum terão a presença mantida.
                  </p>
                </div>
              </div>
            )}

            {/* Image preview (small) */}
            {imagePreview && (
              <div className="rounded-2xl overflow-hidden border border-rosa-200 shadow-sm">
                <img src={imagePreview} alt="Agenda" className="w-full max-h-48 object-contain bg-gray-50" />
              </div>
            )}

            {/* Editable patient list */}
            <div className="bg-white rounded-2xl border border-rosa-200 overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 bg-rosa-50 border-b border-rosa-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-rosa-600 font-[var(--font-nunito)]">
                  Pacientes extraídos ({extracted.length})
                </h3>
                <button
                  onClick={addExtracted}
                  className="flex items-center gap-1 text-xs font-semibold text-rosa-500
                    hover:text-rosa-600 active:scale-95 transition-all"
                >
                  <Plus size={14} />
                  Adicionar
                </button>
              </div>

              <div className="divide-y divide-gray-100 stagger-children">
                {extracted.map((apt, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2.5 animate-slide-up">
                    <input
                      type="text"
                      value={apt.time}
                      onChange={(e) => updateExtracted(i, "time", e.target.value)}
                      placeholder="HH:MM"
                      className="w-16 text-xs font-bold text-rosa-500 bg-rosa-50 rounded-lg px-2 py-1.5
                        border border-rosa-200 focus:border-rosa-400 focus:ring-2 focus:ring-rosa-200/40 outline-none text-center"
                    />
                    <input
                      type="text"
                      value={apt.patientName}
                      onChange={(e) => updateExtracted(i, "patientName", e.target.value)}
                      placeholder="Nome do paciente"
                      className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5
                        border border-gray-200 focus:border-rosa-400 focus:ring-2 focus:ring-rosa-200/40 outline-none"
                    />
                    <button
                      onClick={() => removeExtracted(i)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400
                        hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                      aria-label="Remover"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-600 animate-bounce-in">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={confirmAndSave}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-500 to-lilas-400 text-white
                  py-3.5 rounded-2xl font-semibold active:scale-95 transition-all duration-200
                  shadow-md shadow-rosa-200/50 hover:shadow-lg"
              >
                <Check size={18} />
                Confirmar e Salvar
              </button>
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 px-5 bg-white text-rosa-500 border-2 border-rosa-200
                  py-3.5 rounded-2xl font-semibold active:scale-95 transition-all duration-200 hover:shadow-md"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Saving step */}
        {step === "saving" && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="dots-loading text-rosa-400 mb-5">
              <span /><span /><span />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 font-[var(--font-nunito)]">
              Salvando agenda...
            </h2>
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
                  {saveSummary
                    ? `${saveSummary.total} pacientes total — ${saveSummary.novos} novos, ${saveSummary.mantidos} mantidos`
                    : `${extracted.length} pacientes — ${clinic}`
                  }
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-rosa-200 overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 bg-rosa-50 border-b border-rosa-100">
                <h3 className="text-sm font-semibold text-rosa-600 font-[var(--font-nunito)]">
                  Pacientes confirmados
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-gray-100 stagger-children">
                {extracted.map((apt, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-slide-up md:border-b md:border-gray-100">
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
