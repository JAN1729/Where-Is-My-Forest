// =============================================
// Data Service Layer
// All queries to Supabase tables + Edge Functions
// =============================================

import { supabase, isSupabaseConfigured, safeQuery } from './supabase';

// ── Edge Function caller ──────────────────────
async function callEdgeFunction(fnName) {
    if (!isSupabaseConfigured()) return { data: null, error: 'Supabase not configured' };
    const { data, error } = await supabase.functions.invoke(fnName);
    if (error) console.error(`[EdgeFn] ${fnName}:`, error);
    return { data, error };
}

// ── News & Alerts ─────────────────────────────

export async function fetchAlerts(limit = 50) {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    return supabase
        .from('news_articles')
        .select('*')
        .eq('sentiment', 'negative')
        .order('published_at', { ascending: false })
        .limit(limit);
}

export async function fetchNews(filters = {}) {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    let query = supabase
        .from('news_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(100);

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.sentiment) query = query.eq('sentiment', filters.sentiment);
    if (filters.state) query = query.eq('state', filters.state);

    return query;
}

// ── Forest Statistics ─────────────────────────

export async function fetchForestStats() {
    return safeQuery('forest_stats', {
        order: { column: 'forest_cover_sqkm', ascending: false },
    });
}

export async function fetchTrendData() {
    return safeQuery('deforestation_trends', {
        order: { column: 'period', ascending: true },
    });
}

// ── GFW Data ──────────────────────────────────

export async function fetchGFWStats() {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    return supabase
        .from('gfw_stats')
        .select('*')
        .order('year', { ascending: true });
}

// ── Protected Areas ───────────────────────────

export async function fetchProtectedAreas(filters = {}) {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    let query = supabase
        .from('protected_areas')
        .select('*')
        .order('name', { ascending: true });

    if (filters.state) query = query.eq('state', filters.state);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.threat_level) query = query.eq('threat_level', filters.threat_level);

    return query;
}

// ── Incidents ─────────────────────────────────

export async function fetchIncidents(filters = {}) {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    let query = supabase
        .from('incidents')
        .select('*')
        .order('reported_at', { ascending: false })
        .limit(100);

    if (filters.state) query = query.eq('state', filters.state);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.status) query = query.eq('status', filters.status);

    return query;
}

export async function submitIncident(incident) {
    if (!isSupabaseConfigured()) return { data: null, error: 'Not configured' };
    return supabase
        .from('incidents')
        .insert([incident])
        .select()
        .single();
}

// ── Resource Directory ────────────────────────

export async function fetchResourceDirectory(filters = {}) {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    let query = supabase
        .from('resource_directory')
        .select('*')
        .order('state', { ascending: true });

    if (filters.state) query = query.eq('state', filters.state);
    if (filters.category) query = query.eq('category', filters.category);

    return query;
}

// ── Manual Data Refresh ───────────────────────

export async function triggerDataRefresh() {
    const results = await Promise.allSettled([
        callEdgeFunction('fetch-forest-news'),
        callEdgeFunction('fetch-gfw-data'),
    ]);
    return results;
}
