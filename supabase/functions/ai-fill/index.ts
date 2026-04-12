import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { password, dictionaryName, count = 50, existingWords = [] } = await req.json();

    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    if (!password || password !== adminPassword) {
      return new Response(JSON.stringify({ error: "Neplatné heslo" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const existingSample = existingWords.slice(0, 30).join(", ");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Jsi generátor slov pro českou hru "Kufr" (pantomima/vysvětlování slov). Generuješ česká slova, která jsou středně těžká - ne příliš jednoduchá, ne příliš složitá. Slova musí být vhodná pro hru kde jeden hráč vysvětluje slovo a druhý hádá. Preferuj podstatná jména, ale občas můžeš přidat přídavná jména nebo slovesa. Odpovídej POUZE seznamem slov oddělených čárkami, bez číslování, bez dalšího textu.`
          },
          {
            role: "user",
            content: `Vygeneruj ${count} unikátních českých slov pro slovník "${dictionaryName}". ${existingSample ? `Tato slova už existují, NEOPAKUJ je: ${existingSample}` : ""} Odpověz pouze slovy oddělenými čárkami.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_words",
              description: "Return generated words as a structured list",
              parameters: {
                type: "object",
                properties: {
                  words: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of generated Czech words"
                  }
                },
                required: ["words"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_words" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Příliš mnoho požadavků, zkuste to později." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Nedostatek kreditů pro AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    
    let words: string[] = [];
    
    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        words = parsed.words || [];
      } catch {
        // Fallback: parse from content
        const content = data.choices?.[0]?.message?.content || "";
        words = content.split(",").map((w: string) => w.trim()).filter((w: string) => w.length > 0);
      }
    }

    // Clean and deduplicate
    words = words
      .map((w: string) => w.trim().toLowerCase())
      .filter((w: string) => w.length > 0 && w.length <= 100)
      .filter((w: string, i: number, arr: string[]) => arr.indexOf(w) === i)
      .filter((w: string) => !existingWords.includes(w));

    return new Response(JSON.stringify({ words }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI fill error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Chyba" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
