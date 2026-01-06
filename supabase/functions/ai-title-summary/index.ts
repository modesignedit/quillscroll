import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

if (!LOVABLE_API_KEY) {
  console.error("LOVABLE_API_KEY is not configured");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const content: string | undefined = body.content_markdown;
    const existingTitle: string | undefined = body.title;
    const existingExcerpt: string | undefined = body.excerpt;

    if (!content || typeof content !== "string" || content.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Not enough content to suggest a title and summary." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const prompt = `You are helping a creator writing a blog post for a Gen Z, Twitter/X-inspired dark theme blog. Given the markdown content below, suggest:
1) A short, scroll-stopping title under 80 characters.
2) A 1-2 sentence summary (excerpt) under 220 characters, conversational but not clickbait.

Return strict JSON with this shape and nothing else:
{
  "title": "string",
  "excerpt": "string"
}

Current draft title (may be empty): ${existingTitle ?? ""}
Current draft excerpt (may be empty): ${existingExcerpt ?? ""}

---
CONTENT START
${content}
CONTENT END`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a precise copy assistant for a blogging platform. Always return valid JSON only, no markdown, no comments.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error", response.status, text);
      const status = response.status;
      let errorMessage = "AI suggestion failed. Please try again.";
      if (status === 402) {
        errorMessage = "AI credits exhausted. Please top up usage in workspace settings.";
      } else if (status === 429) {
        errorMessage = "Too many AI requests. Please wait a moment and try again.";
      }
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    let title = existingTitle ?? "";
    let excerpt = existingExcerpt ?? "";

    if (typeof rawContent === "string") {
      try {
        const parsed = JSON.parse(rawContent);
        if (typeof parsed.title === "string") title = parsed.title.trim();
        if (typeof parsed.excerpt === "string") excerpt = parsed.excerpt.trim();
      } catch (e) {
        console.error("Failed to parse AI JSON response", e, rawContent);
      }
    }

    return new Response(JSON.stringify({ title, excerpt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-title-summary function error", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error while generating suggestions." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
