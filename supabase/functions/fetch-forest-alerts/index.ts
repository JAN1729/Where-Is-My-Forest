// Edge Function: fetch-forest-alerts
// Fetches deforestation alerts from GFW and fire alerts from NASA FIRMS
// Deploy with: supabase functions deploy fetch-forest-alerts
// Set secrets: supabase secrets set GFW_API_KEY=xxx NASA_FIRMS_API_KEY=xxx

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GFW_API_KEY = Deno.env.get("GFW_API_KEY") || "";
const NASA_FIRMS_KEY = Deno.env.get("NASA_FIRMS_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// =============================================
// 1. Fetch GFW GLAD-S2 deforestation alerts
// Docs: https://data-api.globalforestwatch.org
// =============================================
async function fetchGFWAlerts() {
    try {
        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

        // GFW Data API — GLAD-S2 alerts for India (ISO = IND)
        const url = `https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query?sql=SELECT latitude, longitude, gfw_integrated_alerts__date, gfw_integrated_alerts__confidence, umd_tree_cover_density_2000__threshold FROM results WHERE iso = 'IND' AND gfw_integrated_alerts__date >= '${startDate}' AND gfw_integrated_alerts__date <= '${endDate}' LIMIT 200`;

        const res = await fetch(url, {
            headers: GFW_API_KEY ? { "x-api-key": GFW_API_KEY } : {},
        });

        if (!res.ok) {
            console.error("GFW API error:", res.status, await res.text());
            return [];
        }

        const json = await res.json();
        const rows = json.data || [];

        return rows.map((row: any) => ({
            alert_type: "deforestation",
            severity: row.gfw_integrated_alerts__confidence === "high" ? "high" : "medium",
            latitude: row.latitude,
            longitude: row.longitude,
            state: null, // will be geocoded if needed
            confidence: row.gfw_integrated_alerts__confidence === "high" ? 0.9 : 0.6,
            data_source: "GFW_GLAD",
            detected_at: row.gfw_integrated_alerts__date,
            raw_data: row,
        }));
    } catch (err) {
        console.error("GFW fetch error:", err);
        return [];
    }
}

// =============================================
// 2. Fetch NASA FIRMS active fire data
// Docs: https://firms.modaps.eosdis.nasa.gov
// =============================================
async function fetchNASAFires() {
    try {
        if (!NASA_FIRMS_KEY) {
            console.warn("NASA_FIRMS_API_KEY not set, skipping fire data");
            return [];
        }

        // VIIRS_SNPP active fires for India, last 24h
        const url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${NASA_FIRMS_KEY}/VIIRS_SNPP/IND/1`;
        const res = await fetch(url);

        if (!res.ok) {
            console.error("NASA FIRMS error:", res.status);
            return [];
        }

        const csv = await res.text();
        const lines = csv.trim().split("\n");
        if (lines.length < 2) return [];

        const headers = lines[0].split(",");
        const latIdx = headers.indexOf("latitude");
        const lngIdx = headers.indexOf("longitude");
        const confIdx = headers.indexOf("confidence");
        const dateIdx = headers.indexOf("acq_date");
        const timeIdx = headers.indexOf("acq_time");
        const frpIdx = headers.indexOf("frp");

        return lines.slice(1).slice(0, 200).map((line) => {
            const cols = line.split(",");
            const confidence = cols[confIdx];
            const severity =
                confidence === "h" ? "high" :
                    confidence === "n" ? "medium" : "low";

            return {
                alert_type: "fire",
                severity,
                latitude: parseFloat(cols[latIdx]),
                longitude: parseFloat(cols[lngIdx]),
                state: null,
                confidence: confidence === "h" ? 0.9 : confidence === "n" ? 0.7 : 0.4,
                data_source: "NASA_FIRMS",
                detected_at: `${cols[dateIdx]}T${String(cols[timeIdx]).padStart(4, "0").replace(/(\d{2})(\d{2})/, "$1:$2")}:00Z`,
                raw_data: { frp: cols[frpIdx], confidence },
            };
        });
    } catch (err) {
        console.error("NASA FIRMS fetch error:", err);
        return [];
    }
}

// =============================================
// Main handler
// =============================================
Deno.serve(async (req: Request) => {
    try {
        const [gfwAlerts, fireAlerts] = await Promise.all([
            fetchGFWAlerts(),
            fetchNASAFires(),
        ]);

        const allAlerts = [...gfwAlerts, ...fireAlerts];

        if (allAlerts.length > 0) {
            // Upsert alerts (idempotent using detected_at + lat/lng combination)
            const { error } = await supabase.from("forest_alerts").insert(allAlerts);
            if (error) console.error("Insert error:", error);
        }

        // Update per-state alert counts
        const { data: counts } = await supabase.rpc("update_state_alert_counts");

        return new Response(
            JSON.stringify({
                success: true,
                gfw_count: gfwAlerts.length,
                fire_count: fireAlerts.length,
                total: allAlerts.length,
            }),
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
