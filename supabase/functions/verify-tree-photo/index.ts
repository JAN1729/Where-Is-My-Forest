
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = Deno.env.get('AI_MODEL_NAME') || 'google/gemini-2.0-flash-001'; // Cheap & fast vision model via OpenRouter

// Supabase Setup
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

Deno.serve(async (req) => {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
    }

    try {
        // --- Rate Limiting (10 requests per hour per IP) ---
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (clientIp !== 'unknown') {
            const { data: rlData } = await supabase
                .from('rate_limits')
                .select('request_count, last_request')
                .eq('ip_address', clientIp)
                .single();

            const now = new Date();
            if (rlData) {
                const lastReq = new Date(rlData.last_request);
                const diffMins = (now.getTime() - lastReq.getTime()) / (1000 * 60);

                if (diffMins < 60) {
                    if (rlData.request_count >= 10) {
                        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in an hour.' }), {
                            status: 429,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    await supabase.from('rate_limits').update({ request_count: rlData.request_count + 1 }).eq('ip_address', clientIp);
                } else {
                    await supabase.from('rate_limits').update({ request_count: 1, last_request: now.toISOString() }).eq('ip_address', clientIp);
                }
            } else {
                await supabase.from('rate_limits').insert({ ip_address: clientIp, request_count: 1, last_request: now.toISOString() });
            }
        }
        // ---------------------------------------------------

        const { tree_id } = await req.json();
        if (!tree_id) throw new Error('Missing tree_id');

        console.log(`Verifying tree: ${tree_id} (IP: ${clientIp})`);

        // 1. Fetch tree record
        const { data: tree, error: fetchError } = await supabase
            .from('planted_trees')
            .select('*')
            .eq('id', tree_id)
            .single();

        if (fetchError || !tree) throw new Error('Tree not found');

        // 2. Get image URL
        const photoUrl = tree.photo_url;

        if (!photoUrl) {
            await updateStatus(tree_id, 'rejected', 0, 'No photo provided');
            return new Response(JSON.stringify({ status: 'rejected', reason: 'No photo' }), { headers: { 'Content-Type': 'application/json' } });
        }

        // 3. Call OpenRouter AI
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');

        if (!openRouterKey) {
            console.error('Missing OPENROUTER_API_KEY');
            return new Response(JSON.stringify({ error: 'Server misconfiguration: AI Verification unavailable' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        const verification = await verifyWithOpenRouter(photoUrl, openRouterKey);

        // 4. Update Status based on logic
        // NORMALIZATION handled in verifyWithOpenRouter helper now (everything returned as 0-1)

        // User requested strict 80% threshold. 
        // Since we normalized everything to 0-1, 80% is 0.8
        const isConfident = verification.is_tree && verification.confidence >= 0.8;
        const newStatus = isConfident ? 'verified' : 'rejected';

        console.log(`AI Result: is_tree=${verification.is_tree}, conf=${verification.confidence}, status=${newStatus}`);

        await updateStatus(tree_id, newStatus, verification.confidence, verification.tree_type);

        return new Response(JSON.stringify({
            success: true,
            status: newStatus,
            confidence: verification.confidence,
            tree_type: verification.tree_type
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});

async function updateStatus(id: string, status: string, confidence: number, type: string) {
    await supabase.from('planted_trees').update({
        status,
        ai_confidence: confidence,
        tree_type: type || 'Tree'
    }).eq('id', id);
}

async function verifyWithOpenRouter(imageUrl: string, apiKey: string) {
    const prompt = `
    Analyze this image carefully. Is this a photo of a newly planted tree, sapling, or valid reforestation effort?
    
    Strictly evaluate:
    1. Is there a real plant/tree visible?
    2. Does it look like a planting activity (soil disturbed, sapling, etc.)?
    3. Is it NOT a random photo of something else?

    Return a valid JSON object ONLY, with no markdown formatting:
    {
      "is_tree": boolean,
      "confidence": number, // 0 to 100
      "tree_type": "string guess of species or type",
      "details": "short reason"
    }
    `;

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://whereismyforest.app',
            'X-Title': 'WhereIsMyForest'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: imageUrl } }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('OpenRouter API Error details:', err);
        throw new Error(`OpenRouter API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    try {
        // Clean markdown code blocks if present
        const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
        const result = JSON.parse(jsonStr);

        // Normalize confidence to 0-1 range
        if (result.confidence > 1) {
            result.confidence = result.confidence / 100;
        }

        // Clamp to 0-1 just in case
        result.confidence = Math.max(0, Math.min(1, result.confidence));

        return result;
    } catch (e) {
        console.error('Failed to parse AI response:', content);
        return { is_tree: false, confidence: 0, tree_type: 'Unknown', details: 'Parse Error' };
    }
}
