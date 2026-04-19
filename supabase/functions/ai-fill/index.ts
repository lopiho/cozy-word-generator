import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(apiKey: string, model: string, body: Record<string, unknown>) {
  const response = await fetch(LOVABLE_AI, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, ...body }),
  });
  if (!response.ok) {
    const t = await response.text();
    console.error("AI error:", response.status, t);
    const err: any = new Error("AI gateway error");
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      password,
      dictionaryName,
      dictionaryDescription = "",
      count = 50,
      existingWords = [],
      theme = "",
      difficulty = "střední",
      wordType = "mix",
    } = await req.json();

    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    if (!password || password !== adminPassword) {
      return new Response(JSON.stringify({ error: "Neplatné heslo" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Sample more existing words to better avoid duplicates
    const existingSet = new Set<string>(existingWords.map((w: string) => w.toLowerCase().trim()));
    const existingSample = existingWords
      .sort(() => Math.random() - 0.5)
      .slice(0, 60)
      .join(", ");

    const themeHint = theme
      ? `Téma slovníku: "${theme}". Slova musí silně souviset s tímto tématem.`
      : `Slovník se jmenuje "${dictionaryName}"${dictionaryDescription ? ` (${dictionaryDescription})` : ""}. Generuj slova vhodná pro tento slovník.`;

    const wordTypeHint = {
      mix: "Mix podstatných jmen, sloves a přídavných jmen, ale převážně podstatná jmena.",
      noun: "Pouze podstatná jména v 1. pádě jednotného čísla.",
      verb: "Pouze slovesa v infinitivu.",
      adj: "Pouze přídavná jména v 1. pádě.",
    }[wordType as string] || "Mix slov, převážně podstatná jména.";

    const difficultyHint = {
      "lehká": "Jednoduchá, běžná slova, která zná každé dítě.",
      "střední": "Středně těžká slova, která zná dospělý běžný člověk.",
      "těžká": "Náročnější slova, která vyžadují přemýšlení, ale stále vysvětlitelná.",
    }[difficulty as string] || "Středně těžká slova.";

    // ===== PASS 1: GENERATE (oversample 2x to allow validation rejections) =====
    const targetGenerate = Math.min(Math.ceil(count * 2), 200);

    const genSystem = `Jsi expert na českou hru "Kufr" (pantomima/vysvětlování slov bez použití kořene daného slova).

PRAVIDLA PRO DOBRÉ SLOVO:
✓ Konkrétní, představitelné, vysvětlitelné gesty nebo opisem
✓ V základním tvaru (1. pád jednotné číslo, infinitiv)
✓ Bez diakritických chyb, bez překlepů
✓ Česká slova nebo zažité přejímky

ZAKÁZÁNO:
✗ Vlastní jména (osob, míst, značek) - kromě obecných pojmů
✗ Příliš abstraktní pojmy (filozofie, esence, paradigma)
✗ Příliš obecná slova (věc, něco, prvek)
✗ Vulgarismy a urážlivá slova
✗ Slova s pomlčkou nebo více slov
✗ Zkratky a cizí slova bez českého ekvivalentu

${difficultyHint}
${wordTypeHint}
${themeHint}

Odpovídej POUZE přes nástroj return_words.`;

    const genUser = `Vygeneruj ${targetGenerate} unikátních českých slov pro slovník "${dictionaryName}".
${existingSample ? `\nNEOPAKUJ tato existující slova: ${existingSample}` : ""}
${theme ? `\nVšechna slova musí souviset s tématem: ${theme}` : ""}

Buď kreativní a vyhni se obvyklým klišé. Generuj rozmanitý mix slov.`;

    let genResp;
    try {
      genResp = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-pro", {
        messages: [
          { role: "system", content: genSystem },
          { role: "user", content: genUser },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_words",
            description: "Return generated Czech words",
            parameters: {
              type: "object",
              properties: {
                words: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of generated Czech words in base form",
                },
              },
              required: ["words"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_words" } },
      });
    } catch (e: any) {
      if (e.status === 429) {
        return new Response(JSON.stringify({ error: "Příliš mnoho požadavků, zkuste to později." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (e.status === 402) {
        return new Response(JSON.stringify({ error: "Nedostatek kreditů pro AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    let candidates: string[] = [];
    const toolCall = genResp.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        candidates = parsed.words || [];
      } catch {
        candidates = [];
      }
    }

    // Pre-clean candidates
    candidates = candidates
      .map((w: string) => w.trim().toLowerCase())
      .filter((w: string) => w.length > 1 && w.length <= 40)
      .filter((w: string) => !w.includes(" ") || w.split(" ").length <= 2)
      .filter((w: string) => !existingSet.has(w))
      .filter((w: string, i: number, arr: string[]) => arr.indexOf(w) === i);

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ words: [], stats: { generated: 0, validated: 0, rejected: 0 } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== PASS 2: VALIDATE =====
    const valSystem = `Jsi přísný kurátor slovní zásoby pro českou hru "Kufr".

Tvým úkolem je VYHODIT slova, která NEJSOU vhodná. Buď přísný.

VHODNÉ slovo (PŘIJMOUT):
✓ Konkrétní, představitelné
✓ V základním tvaru
✓ Vysvětlitelné gesty nebo opisem bez použití samotného slova
✓ Spadá do tématu slovníku (pokud je téma zadáno)

NEVHODNÉ slovo (ODMÍTNOUT):
✗ Vlastní jméno (Praha, Apple, Petr)
✗ Příliš abstraktní (entita, koncept, paradigma)
✗ Příliš obecné (věc, něco)
✗ Překlep, špatný tvar, cizí slovo bez českého protějšku
✗ Více slov / fráze
✗ Mimo téma slovníku

Slovník: "${dictionaryName}"${theme ? `, téma: ${theme}` : ""}.
Obtížnost: ${difficulty}.`;

    const valUser = `Vyhodnoť tato slova a vrať POUZE ta vhodná:\n\n${candidates.join(", ")}`;

    const valResp = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash", {
      messages: [
        { role: "system", content: valSystem },
        { role: "user", content: valUser },
      ],
      tools: [{
        type: "function",
        function: {
          name: "filter_words",
          description: "Return only words appropriate for Kufr",
          parameters: {
            type: "object",
            properties: {
              approved: {
                type: "array",
                items: { type: "string" },
                description: "Words that are appropriate for the game",
              },
            },
            required: ["approved"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "filter_words" } },
    });

    let approved: string[] = [];
    const valTool = valResp.choices?.[0]?.message?.tool_calls?.[0];
    if (valTool?.function?.arguments) {
      try {
        const parsed = JSON.parse(valTool.function.arguments);
        approved = parsed.approved || [];
      } catch {
        approved = candidates; // fallback: trust generation
      }
    } else {
      approved = candidates;
    }

    // Final clean and trim to count
    const final = approved
      .map((w: string) => w.trim().toLowerCase())
      .filter((w: string) => w.length > 1 && w.length <= 40)
      .filter((w: string) => !existingSet.has(w))
      .filter((w: string, i: number, arr: string[]) => arr.indexOf(w) === i)
      .slice(0, count);

    return new Response(JSON.stringify({
      words: final,
      stats: {
        generated: candidates.length,
        validated: final.length,
        rejected: candidates.length - approved.length,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI fill error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Chyba" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
