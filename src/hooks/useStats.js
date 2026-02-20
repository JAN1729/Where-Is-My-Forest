import { useState, useEffect, useMemo } from 'react';
import { fetchForestStats, fetchTrendData } from '../lib/dataService';

export function useStats() {
    const [stats, setStats] = useState([]);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            const [statsRes, trendsRes] = await Promise.all([
                fetchForestStats(),
                fetchTrendData(),
            ]);
            if (!cancelled) {
                if (statsRes.error || trendsRes.error) setError(statsRes.error || trendsRes.error);
                setStats(statsRes.data || []);
                setTrends(trendsRes.data || []);
                setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    // Auto-refresh every 30 minutes
    useEffect(() => {
        const interval = setInterval(async () => {
            const [statsRes, trendsRes] = await Promise.all([
                fetchForestStats(),
                fetchTrendData(),
            ]);
            if (statsRes.data) setStats(statsRes.data);
            if (trendsRes.data) setTrends(trendsRes.data);
        }, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const summary = useMemo(() => {
        if (!stats.length) return {
            totalForestCover: 0, totalAlerts: 0, statesAffected: 0,
            decreasingStates: 0,
        };
        return {
            totalForestCover: stats.reduce((s, st) => s + (st.forest_cover_sqkm || 0), 0),
            totalAlerts: stats.reduce((s, st) => s + (st.alerts_count || 0), 0),
            statesAffected: stats.filter(st => (st.alerts_count || 0) > 0).length,
            decreasingStates: stats.filter(st => st.trend === 'decreasing').length,
        };
    }, [stats]);

    return { stats, trends, summary, loading, error };
}
