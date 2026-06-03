const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `Você é uma IA especializada em criação de procedimentos operacionais para transportadoras.
Receba um conteúdo bruto (transcrição, descrição ou passo a passo) e gere um procedimento operacional padronizado, profissional e claro, em português do Brasil.
Responda APENAS com JSON válido (sem markdown, sem comentários) no formato:
{
  "codigo": "POP-XXX-001",
  "titulo": "string",
  "objetivo": "string",
  "responsavel": "string",
  "sistemas": "string",
  "passo_a_passo": ["string", ...],
  "alertas": ["string", ...],
  "problemas_comuns": [{"problema":"string","solucao":"string"}],
  "versao": "1.0"
}
Regras:
- Código sugere prefixo do setor (ex: POP-OPE-001 para Operacional, POP-FAT-001 para Faturamento, POP-EXP, POP-MON, POP-FRO, POP-RH, POP-FIN, POP-COM).
- Título objetivo e direto.
- Passo a passo numerável, ações concretas, verbos no infinitivo ou imperativo.
- Corrija português, padronize termos.
- Se o conteúdo for vago, infira o que faltar de forma realista para uma transportadora.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { conteudo, setor } = await req.json();
    if (!conteudo || typeof conteudo !== "string") {
      return new Response(JSON.stringify({ error: "conteudo obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Setor: ${setor}\n\nConteúdo bruto:\n${conteudo}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "Créditos do Lovable AI esgotados. Adicione créditos no workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: `Gateway: ${t}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(content); }
    catch { parsed = { titulo: "Procedimento", passo_a_passo: [content] }; }

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
