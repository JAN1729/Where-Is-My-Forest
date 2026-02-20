// Edge Function: fetch-forest-news
// Fetches India forest/environment news from NewsData.io
// Categorizes using AI and inserts into Supabase
// Deploy with: supabase functions deploy fetch-forest-news
// Set secrets: supabase secrets set NEWSDATA_API_KEY=xxx OPENAI_API_KEY=xxx

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NEWSDATA_API_KEY = Deno.env.get("NEWSDATA_API_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Indian state coordinates for approximate geocoding
const STATE_COORDS: Record<string, [number, number]> = {
    "madhya pradesh": [23.2, 77.4], "chhattisgarh": [21.3, 81.6],
    "jharkhand": [23.6, 85.3], "odisha": [20.9, 84.0],
    "maharashtra": [19.7, 75.7], "karnataka": [15.3, 75.7],
    "kerala": [10.8, 76.3], "tamil nadu": [11.1, 78.7],
    "andhra pradesh": [15.9, 79.7], "telangana": [18.1, 79.0],
    "assam": [26.2, 92.9], "meghalaya": [25.5, 91.4],
    "arunachal pradesh": [28.2, 94.7], "nagaland": [26.2, 94.6],
    "manipur": [24.8, 93.9], "mizoram": [23.2, 92.9],
    "tripura": [23.9, 91.9], "sikkim": [27.5, 88.5],
    "uttarakhand": [30.1, 79.0], "himachal pradesh": [31.1, 77.2],
    "rajasthan": [27.0, 74.2], "gujarat": [22.3, 71.2],
    "uttar pradesh": [26.8, 80.9], "west bengal": [22.9, 87.9],
    "bihar": [25.1, 85.3], "punjab": [31.1, 75.3],
    "haryana": [29.1, 76.1], "goa": [15.3, 74.0],
    "jammu": [33.7, 74.9], "kashmir": [34.1, 74.8],
};

function extractState(text: string): { state: string; lat: number; lng: number } | null {
    const lower = text.toLowerCase();
    for (const [state, coords] of Object.entries(STATE_COORDS)) {
        if (lower.includes(state)) {
            return {
                state: state.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
                lat: coords[0] + (Math.random() - 0.5) * 0.5,
                lng: coords[1] + (Math.random() - 0.5) * 0.5,
            };
        }
    }
    return null;
}

// =============================================
// AI categorization (optional — falls back to
// keyword matching if OpenAI key not set)
// =============================================
async function categorizeArticle(title: string, desc: string) {
    const text = `${title} ${desc}`.toLowerCase();

    // Try AI first
    if (OPENAI_API_KEY) {
        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content:
                                'Categorize this forest/environment news article. Return JSON: {"category":"deforestation|fire|conservation|wildlife|policy","sentiment":"positive|negative|neutral","summary":"one line summary"}',
                        },
                        { role: "user", content: `Title: ${title}\nDescription: ${desc}` },
                    ],
                    max_tokens: 100,
                    temperature: 0.1,
                }),
            });

            if (res.ok) {
                const json = await res.json();
                const content = json.choices[0]?.message?.content || "";
                const parsed = JSON.parse(content);
                return parsed;
            }
        } catch (e) {
            console.warn("AI categorization failed, falling back to keywords:", e);
        }
    }

    // Keyword fallback
    let category = "conservation";
    let sentiment = "neutral";

    if (text.includes("deforest") || text.includes("felling") || text.includes("illegal logging")) {
        category = "deforestation";
        sentiment = "negative";
    } else if (text.includes("fire") || text.includes("blaze") || text.includes("wildfire")) {
        category = "fire";
        sentiment = "negative";
    } else if (text.includes("wildlife") || text.includes("tiger") || text.includes("elephant") || text.includes("poach")) {
        category = "wildlife";
        sentiment = text.includes("poach") || text.includes("kill") ? "negative" : "neutral";
    } else if (text.includes("policy") || text.includes("government") || text.includes("ministry") || text.includes("act") || text.includes("law")) {
        category = "policy";
    } else if (text.includes("plant") || text.includes("green") || text.includes("conserv") || text.includes("restore")) {
        category = "conservation";
        sentiment = "positive";
    }

    return { category, sentiment, summary: null };
}

// =============================================
// Fetch from NewsData.io
// =============================================
async function fetchNewsArticles() {
    if (!NEWSDATA_API_KEY) {
        console.warn("NEWSDATA_API_KEY not set");
        return [];
    }

    try {
        const url = `https://newsdata.io/api/1/latest?apikey=${NEWSDATA_API_KEY}&q=forest%20OR%20deforestation%20OR%20wildlife%20OR%20environment&country=in&language=en&category=environment&size=25`;
        const res = await fetch(url);

        if (!res.ok) {
            console.error("NewsData.io error:", res.status);
            return [];
        }

        const json = await res.json();
        return json.results || [];
    } catch (err) {
        console.error("NewsData.io fetch error:", err);
        return [];
    }
}

// =============================================
// Main handler
// =============================================
Deno.serve(async (req: Request) => {
    try {
        const rawArticles = await fetchNewsArticles();
        let inserted = 0;

        for (const article of rawArticles) {
            const externalId = article.article_id || article.link;
            if (!externalId) continue;

            // Check for duplicate
            const { data: existing } = await supabase
                .from("news_articles")
                .select("id")
                .eq("external_id", externalId)
                .limit(1);

            if (existing && existing.length > 0) continue;

            // Categorize
            const { category, sentiment, summary } = await categorizeArticle(
                article.title || "",
                article.description || ""
            );

            // Extract location
            const locationInfo = extractState(
                `${article.title} ${article.description} ${article.content || ""}`
            );

            const record = {
                title: article.title,
                description: article.description,
                source_name: article.source_name || article.source_id,
                source_url: article.link,
                category,
                sentiment,
                state: locationInfo?.state || null,
                latitude: locationInfo?.lat || null,
                longitude: locationInfo?.lng || null,
                published_at: article.pubDate || new Date().toISOString(),
                ai_summary: summary,
                external_id: externalId,
            };

            const { error } = await supabase.from("news_articles").insert([record]);
            if (error) console.error("Insert error:", error);
            else inserted++;
        }

        return new Response(
            JSON.stringify({ success: true, fetched: rawArticles.length, inserted }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Handler error:", err);
        return new Response(
            JSON.stringify({ success: false, error: String(err) }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});
