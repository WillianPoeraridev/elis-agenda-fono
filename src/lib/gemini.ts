import { GoogleGenerativeAI } from "@google/generative-ai";

interface ExtractedAppointment {
  time: string;
  patientName: string;
}

interface ExtractedAgenda {
  clinic: string | null;
  appointments: ExtractedAppointment[];
}

const EXTRACTION_PROMPT = `Analise esta imagem de uma agenda de consultório médico/clínica.
Extraia TODOS os pacientes visíveis com seus horários.
Retorne APENAS um JSON válido no formato exato abaixo, sem texto adicional, sem markdown, sem backticks:
{"clinic": "nome da clínica se visível ou null", "appointments": [{"time": "HH:MM", "patientName": "Nome Completo"}]}
Ordene por horário. Se um horário não for legível, use "??:??".
Se um nome não for totalmente legível, faça o melhor esforço.`;

export async function extractAgendaFromImage(
  base64Image: string
): Promise<ExtractedAgenda> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Remove data URL prefix if present
  const imageData = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const result = await model.generateContent([
    EXTRACTION_PROMPT,
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData,
      },
    },
  ]);

  const text = result.response.text().trim();

  // Clean possible markdown fences
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed: ExtractedAgenda = JSON.parse(cleaned);

    // Validate structure
    if (!Array.isArray(parsed.appointments)) {
      throw new Error("Campo appointments não é um array");
    }

    // Sort by time
    parsed.appointments.sort((a, b) => a.time.localeCompare(b.time));

    return parsed;
  } catch (e) {
    console.error("Erro ao parsear resposta do Gemini:", text);
    throw new Error(`Falha ao extrair agenda da imagem: ${(e as Error).message}`);
  }
}
