import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from 'recharts';
import { useStats } from '../hooks/useStats';
import { useNews } from '../hooks/useNews';
import { fetchGFWStats } from '../lib/dataService';
import './Analytics.css';

// ── Tooltip ───────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="analytics-tooltip">
            <p className="analytics-tooltip__label">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="analytics-tooltip__item" style={{ color: entry.color }}>
                    {entry.name}: <strong>{typeof entry.value === 'number' ? entry.value.toLocaleString('en-IN') : entry.value}</strong>
                </p>
            ))}
        </div>
    );
}

// ── Helper to format large numbers ────────────────────────────────────────────
function formatNum(v, unit) {
    if (unit === 'million_hectares' || unit === 'Mha') return `${v} Mha`;
    if (v >= 1000000) return `${(v / 1000000).toFixed(2)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return v.toLocaleString('en-IN');
}

// ── Reusable stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
    return (
        <div className="gfw-stat-card" style={{ '--accent': accent || 'var(--forest)' }}>
            <span className="gfw-stat-card__label">{label}</span>
            <span className="gfw-stat-card__value">{value}</span>
            {sub && <span className="gfw-stat-card__sub">{sub}</span>}
        </div>
    );
}

// ── Animation preset ──────────────────────────────────────────────────────────
const appear = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay },
});

// ── Color palette ─────────────────────────────────────────────────────────────
const COLORS = {
    loss: '#B23A48',
    primary: '#8B2252',
    co2: '#D4622B',
    fire: '#E8683F',
    forest: '#2D6A4F',
    gain: '#40916C',
    land: ['#2D6A4F', '#40916C', '#DAA520', '#A0A878', '#5B8FA8', '#8B7355', '#C4A882', '#93B1C6'],
    sentiment: { negative: '#B23A48', positive: '#2D6A4F', neutral: '#5B7FA5' },
    category: {
        deforestation: '#B23A48', fire: '#D4622B', wildlife: '#A67C00',
        conservation: '#2D6A4F', pollution: '#6C757D', policy: '#5B7FA5', other: '#adb5bd',
    },
};

// ═════════════════════════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function Analytics() {
    const { stats, trends, summary, loading } = useStats();
    const { news } = useNews();

    // ── GFW data ──────────────────────────────────────────────────────────────
    const [gfw, setGfw] = useState(null);
    const [gfwLoading, setGfwLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setGfwLoading(true);
            const { data, error } = await fetchGFWStats();
            if (data && !error) {
                const byMetric = (m) => data.filter(d => d.metric === m);
                const summaryVal = (m) => byMetric(m)[0]?.value;

                setGfw({
                    // Time series
                    annualLoss: byMetric('tree_cover_loss').map(d => ({ year: d.year, loss: Number(d.value) })),
                    primaryLoss: byMetric('primary_forest_loss').map(d => ({ year: d.year, loss: Number(d.value) })),
                    co2: byMetric('co2_emissions').map(d => ({ year: d.year, co2: Number(d.value) })),
                    fireLoss: byMetric('fire_loss').map(d => ({ year: d.year, fire: Number(d.value) })),
                    // Breakdowns
                    landCover: byMetric('land_cover').map(d => ({ name: d.region, value: Number(d.value) })),
                    regions: byMetric('regional_loss').map(d => ({ name: d.region, loss: Number(d.value) })).sort((a, b) => b.loss - a.loss),
                    canopy: byMetric('canopy_density').map(d => ({ threshold: d.region, area: Number(d.value) })),
                    // Summary
                    summary: {
                        treeCover2000: Number(summaryVal('tree_cover_2000') || 0),
                        treeCoverCurrent: Number(summaryVal('tree_cover_current') || 0),
                        totalLoss: Number(summaryVal('total_loss') || 0),
                        percentDecline: Number(summaryVal('percent_decline') || 0),
                        peakLossHa: Number(summaryVal('peak_loss_year') || 0),
                        naturalForest: Number(summaryVal('natural_forest_2020') || 0),
                        naturalForestPct: Number(summaryVal('natural_forest_pct') || 0),
                        plantationArea: Number(summaryVal('plantation_area') || 0),
                        primaryLossTotal: Number(summaryVal('primary_humid_loss_total') || 0),
                        treeCoverGain: Number(summaryVal('tree_cover_gain') || 0),
                        gainOutsidePlantations: Number(summaryVal('gain_outside_plantations') || 0),
                        firePct: Number(summaryVal('fire_loss_pct') || 0),
                        totalCO2: Number(summaryVal('total_co2') || 0),
                    },
                });
            }
            setGfwLoading(false);
        })();
    }, []);

    // ── Combined loss + CO2 chart data ────────────────────────────────────────
    const combinedData = useMemo(() => {
        if (!gfw) return [];
        return gfw.annualLoss.map(d => {
            const co2Row = gfw.co2.find(c => c.year === d.year);
            const fireRow = gfw.fireLoss.find(f => f.year === d.year);
            const primaryRow = gfw.primaryLoss.find(p => p.year === d.year);
            return {
                year: d.year,
                loss: d.loss,
                co2: co2Row?.co2 || 0,
                fire: fireRow?.fire || 0,
                primary: primaryRow?.loss || 0,
            };
        });
    }, [gfw]);

    // ── News distributions ────────────────────────────────────────────────────
    const newsCategory = useMemo(() => {
        if (!news.length) return [];
        const ct = {};
        news.forEach(n => { ct[n.category || 'other'] = (ct[n.category || 'other'] || 0) + 1; });
        return Object.entries(ct)
            .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: COLORS.category[name] || '#adb5bd' }))
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [news]);

    const newsSentiment = useMemo(() => {
        if (!news.length) return [];
        const ct = { Negative: 0, Positive: 0, Neutral: 0 };
        news.forEach(n => {
            if (n.sentiment === 'negative') ct.Negative++;
            else if (n.sentiment === 'positive') ct.Positive++;
            else ct.Neutral++;
        });
        return [
            { name: 'Negative', value: ct.Negative, color: COLORS.sentiment.negative },
            { name: 'Positive', value: ct.Positive, color: COLORS.sentiment.positive },
            { name: 'Neutral', value: ct.Neutral, color: COLORS.sentiment.neutral },
        ].filter(d => d.value > 0);
    }, [news]);

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading && gfwLoading) {
        return (
            <div className="analytics">
                <div className="analytics__loading"><p>Loading analytics...</p></div>
            </div>
        );
    }

    const s = gfw?.summary;

    return (
        <div className="analytics">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <motion.div className="analytics__header" {...appear(0)}>
                <h1 className="analytics__title">Forest Analytics</h1>
                <p className="analytics__subtitle">
                    Comprehensive India forest data from Global Forest Watch, ISFR 2023,
                    and live environment news monitoring
                </p>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 1 — GFW KEY METRICS
            ═══════════════════════════════════════════════════════════════════ */}
            {s && (
                <>
                    <motion.div className="analytics__section-header" {...appear(0.05)}>
                        <h2>Global Forest Watch — India</h2>
                        <span className="analytics__section-source">
                            Hansen/UMD/Google/USGS/NASA · <a href="https://www.globalforestwatch.org/dashboards/country/IND/" target="_blank" rel="noopener noreferrer">View on GFW</a>
                        </span>
                    </motion.div>

                    {/* Key Stats Row */}
                    <motion.div className="gfw-stat-row" {...appear(0.08)}>
                        <StatCard label="Tree Cover (2000)" value={`${s.treeCover2000} Mha`} sub="At >30% canopy density" />
                        <StatCard label="Current Estimate" value={`${s.treeCoverCurrent} Mha`} sub={`${s.percentDecline}% decline since 2000`} accent="var(--alert-red, #B23A48)" />
                        <StatCard label="Total Loss (2001–23)" value={`${s.totalLoss} Mha`} sub={`Peak: ${formatNum(s.peakLossHa)} ha in 2017`} accent="#B23A48" />
                        <StatCard label="Natural Forest" value={`${s.naturalForest} Mha`} sub={`${s.naturalForestPct}% of land area`} />
                        <StatCard label="Tree Cover Gain" value={`${s.treeCoverGain} Mha`} sub={`${s.gainOutsidePlantations}% outside plantations`} accent="var(--forest)" />
                        <StatCard label="Total CO₂ Emitted" value={`${formatNum(s.totalCO2)} Mt`} sub="From tree cover loss" accent="#D4622B" />
                    </motion.div>
                </>
            )}

            {/* ── Charts Grid ────────────────────────────────────────────────── */}
            <div className="analytics__grid">

                {/* 1. Annual Tree Cover Loss — full width area chart */}
                {combinedData.length > 0 && (
                    <motion.div className="analytics__chart analytics__chart--wide solid-card" {...appear(0.1)}>
                        <h3 className="analytics__chart-title">Annual Tree Cover Loss in India</h3>
                        <p className="analytics__chart-subtitle">Hectares lost per year (2001–2023) · 30% canopy density threshold</p>
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={combinedData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#888' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#888' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                                <Tooltip content={<CustomTooltip />} />
                                <defs>
                                    <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.loss} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={COLORS.loss} stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="loss" name="Total Loss (ha)" stroke={COLORS.loss} strokeWidth={2.5}
                                    fill="url(#lossGrad)" dot={{ r: 2.5, fill: COLORS.loss }} activeDot={{ r: 5 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* 2. CO₂ Emissions Trend */}
                {gfw?.co2.length > 0 && (
                    <motion.div className="analytics__chart solid-card" {...appear(0.15)}>
                        <h3 className="analytics__chart-title">CO₂ Emissions from Tree Loss</h3>
                        <p className="analytics__chart-subtitle">Megatonnes of CO₂ per year</p>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={gfw.co2}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#888' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <defs>
                                    <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.co2} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={COLORS.co2} stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="co2" name="CO₂ (Mt)" stroke={COLORS.co2} strokeWidth={2} fill="url(#co2Grad)"
                                    dot={{ r: 2, fill: COLORS.co2 }} activeDot={{ r: 4 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* 3. Primary Forest Loss */}
                {gfw?.primaryLoss.length > 0 && (
                    <motion.div className="analytics__chart solid-card" {...appear(0.2)}>
                        <h3 className="analytics__chart-title">Primary Humid Forest Loss</h3>
                        <p className="analytics__chart-subtitle">Hectares of primary forest lost annually</p>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={gfw.primaryLoss}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#888' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#888' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="loss" name="Primary Loss (ha)" fill={COLORS.primary} radius={[3, 3, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* 4. Fire-Related Tree Cover Loss */}
                {gfw?.fireLoss.length > 0 && (
                    <motion.div className="analytics__chart solid-card" {...appear(0.25)}>
                        <h3 className="analytics__chart-title">Fire-Related Tree Cover Loss</h3>
                        <p className="analytics__chart-subtitle">Area lost to fire each year · {s?.firePct}% of total loss</p>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={gfw.fireLoss}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#888' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="fire" name="Fire Loss (ha)" fill={COLORS.fire} radius={[3, 3, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* 5. Top States by Tree Cover Loss — horizontal bars */}
                {gfw?.regions.length > 0 && (
                    <motion.div className="analytics__chart solid-card" {...appear(0.3)}>
                        <h3 className="analytics__chart-title">Top States by Tree Cover Loss</h3>
                        <p className="analytics__chart-subtitle">Cumulative loss (2001–2023)</p>
                        <ResponsiveContainer width="100%" height={380}>
                            <BarChart data={gfw.regions} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K ha`} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#555' }} width={110} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="loss" name="Loss (ha)" fill={COLORS.loss} radius={[0, 4, 4, 0]} barSize={14} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* 6. Land Cover Breakdown */}
                {gfw?.landCover.length > 0 && (
                    <motion.div className="analytics__chart solid-card" {...appear(0.35)}>
                        <h3 className="analytics__chart-title">India Land Cover Breakdown</h3>
                        <p className="analytics__chart-subtitle">Percentage of total land area (2020)</p>
                        <ResponsiveContainer width="100%" height={340}>
                            <PieChart>
                                <Pie data={gfw.landCover} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} dataKey="value"
                                    label={({ name, value }) => `${name} (${value}%)`}
                                    labelLine={{ stroke: '#ccc', strokeWidth: 1 }}
                                >
                                    {gfw.landCover.map((_, i) => (
                                        <Cell key={i} fill={COLORS.land[i % COLORS.land.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val) => `${val}%`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* 7. Canopy Density Distribution */}
                {gfw?.canopy.length > 0 && (
                    <motion.div className="analytics__chart solid-card" {...appear(0.38)}>
                        <h3 className="analytics__chart-title">Tree Cover by Canopy Density</h3>
                        <p className="analytics__chart-subtitle">Area at different canopy thresholds (year 2000)</p>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={gfw.canopy}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                <XAxis dataKey="threshold" tick={{ fontSize: 12, fill: '#555' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#888' }} unit=" Mha" />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="area" name="Area (Mha)" fill={COLORS.forest} radius={[4, 4, 0, 0]} barSize={40}>
                                    {gfw.canopy.map((_, i) => (
                                        <Cell key={i} fill={['#B7E4C7', '#74C69D', '#40916C', '#1B4332'][i]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* 8. Loss vs Primary Loss Comparison */}
                {combinedData.length > 0 && (
                    <motion.div className="analytics__chart solid-card" {...appear(0.4)}>
                        <h3 className="analytics__chart-title">Total vs Primary Forest Loss</h3>
                        <p className="analytics__chart-subtitle">Comparing overall tree cover loss with primary humid forest loss</p>
                        <ResponsiveContainer width="100%" height={280}>
                            <ComposedChart data={combinedData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#888' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#888' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="primary" name="Primary (ha)" fill={COLORS.primary} radius={[3, 3, 0, 0]} barSize={8} opacity={0.7} />
                                <Line type="monotone" dataKey="loss" name="Total Loss (ha)" stroke={COLORS.loss} strokeWidth={2}
                                    dot={false} activeDot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 2 — ISFR 2023 DATA
            ═══════════════════════════════════════════════════════════════════ */}
            <motion.div className="analytics__section-header" {...appear(0.42)}>
                <h2>India State of Forest Report 2023</h2>
                <span className="analytics__section-source">Forest Survey of India · Ministry of Environment</span>
            </motion.div>

            <motion.div className="analytics__verbal solid-card" {...appear(0.44)}>
                <h3 className="analytics__verbal-title">Summary</h3>
                <div className="analytics__verbal-content">
                    <p>
                        India's total forest cover stands at approximately <strong>{summary.totalForestCover.toLocaleString('en-IN')} km²</strong>,
                        covering <strong>21.71%</strong> of the country's geographical area.
                        <strong> {summary.decreasingStates} states</strong> show declining forest cover.
                        Madhya Pradesh leads in absolute cover (77,073 km²), while Mizoram has the highest percentage (84.5%).
                    </p>
                </div>
            </motion.div>

            {/* State-wise Table */}
            {stats.length > 0 && (
                <motion.div className="analytics__table-wrapper solid-card" {...appear(0.46)}>
                    <h3 className="analytics__chart-title">State-wise Forest Data</h3>
                    <div className="analytics__table-scroll">
                        <table className="analytics__table">
                            <thead>
                                <tr>
                                    <th>State</th>
                                    <th>Forest Cover (km²)</th>
                                    <th>Coverage %</th>
                                    <th>Alerts</th>
                                    <th>Trend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((row) => (
                                    <tr key={row.state || row.id}>
                                        <td className="analytics__table-state">{row.state}</td>
                                        <td>{row.forest_cover_sqkm?.toLocaleString('en-IN')}</td>
                                        <td>
                                            <div className="analytics__table-bar-wrapper">
                                                <div className="analytics__table-bar" style={{ width: `${Math.min(row.forest_cover_pct || 0, 100)}%` }} />
                                                <span>{(row.forest_cover_pct || 0).toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${(row.alerts_count || 0) > 8 ? 'badge--red' : (row.alerts_count || 0) > 4 ? 'badge--orange' : 'badge--green'}`}>
                                                {row.alerts_count || 0}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`analytics__trend analytics__trend--${row.trend || 'stable'}`}>
                                                {row.trend || 'stable'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 3 — NEWS ANALYTICS
            ═══════════════════════════════════════════════════════════════════ */}
            {news.length > 0 && (
                <>
                    <motion.div className="analytics__section-header" {...appear(0.48)}>
                        <h2>News Monitoring</h2>
                        <span className="analytics__section-source">Tracking {news.length} articles across India</span>
                    </motion.div>

                    <div className="analytics__grid">
                        {newsCategory.length > 0 && (
                            <motion.div className="analytics__chart solid-card" {...appear(0.5)}>
                                <h3 className="analytics__chart-title">News by Category</h3>
                                <p className="analytics__chart-subtitle">Distribution of environment news topics</p>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={newsCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                                            paddingAngle={3} dataKey="value"
                                            label={({ name, value }) => `${name} (${value})`}
                                        >
                                            {newsCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </motion.div>
                        )}

                        {newsSentiment.length > 0 && (
                            <motion.div className="analytics__chart solid-card" {...appear(0.52)}>
                                <h3 className="analytics__chart-title">Sentiment Distribution</h3>
                                <p className="analytics__chart-subtitle">Tone of coverage across all articles</p>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={newsSentiment} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                                            paddingAngle={4} dataKey="value"
                                            label={({ name, value }) => `${name} (${value})`}
                                        >
                                            {newsSentiment.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </motion.div>
                        )}
                    </div>
                </>
            )}

            {/* Empty fallback */}
            {stats.length === 0 && !gfw && (
                <div className="analytics__empty solid-card">
                    <p>No analytics data available. Data will populate once Supabase is configured and Edge Functions run.</p>
                </div>
            )}
        </div>
    );
}
