export type TrainingVideo = { kind: "iframe" | "video"; src: string };

export function trainingVideo(raw?: string | null): TrainingVideo | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const id = host === "youtu.be" ? url.pathname.split("/")[1]
        : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
      return id && /^[a-zA-Z0-9_-]+$/.test(id) ? { kind: "iframe", src: `https://www.youtube.com/embed/${id}` } : null;
    }
    if (host === "drive.google.com") {
      const id = url.pathname.match(/^\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get("id");
      return id && /^[a-zA-Z0-9_-]+$/.test(id) ? { kind: "iframe", src: `https://drive.google.com/file/d/${id}/preview` } : null;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      return id ? { kind: "iframe", src: `https://player.vimeo.com/video/${id}${url.searchParams.has("h") ? `?h=${encodeURIComponent(url.searchParams.get("h") ?? "")}` : ""}` } : null;
    }
    return /\.(mp4|webm|ogg|mov)$/i.test(url.pathname) ? { kind: "video", src: url.href } : null;
  } catch { return null; }
}

export type AssessmentLink = { id: string; procedimento_id: string };
export function assessmentPath(trainingId: string, assessment: AssessmentLink | null): string | null {
  return assessment?.procedimento_id === trainingId
    ? `/procedimento/${encodeURIComponent(trainingId)}/prova/${encodeURIComponent(assessment.id)}` : null;
}

export type Question = { enunciado: string; alternativas: string[] };
export function readQuestions(value: unknown): Question[] {
  if (!Array.isArray(value)) return [];
  return value.filter((q): q is Question => !!q && typeof q === "object"
    && typeof q.enunciado === "string" && Array.isArray(q.alternativas)
    && q.alternativas.length >= 2 && q.alternativas.every((a: unknown) => typeof a === "string"));
}