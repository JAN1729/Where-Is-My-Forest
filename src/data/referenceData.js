import { generateForestDots, FOREST_REGION_LABELS as _FOREST_REGION_LABELS } from './forestRegions';
// Static reference data — accurate India forest cover figures
// Source: India State of Forest Report 2023 (Forest Survey of India)
// Boundary: Survey of India official boundary including J&K, Ladakh, Aksai Chin
// These are non-changing reference values, NOT mock data.
// Live alerts and news come from Supabase.

export const INDIA_CENTER = [22.5, 82.0];
export const INDIA_ZOOM = 5;

import indiaBoundary from './india_boundary.json';

// ... (existing comments)

// =============================================
// India GeoJSON outline — High-resolution boundary
// Sourced from DataMeet (Official Survey of India compatible)
// =============================================
export const INDIA_OUTLINE = indiaBoundary;

// =============================================
// Simplified India polygon for point-in-polygon tests
// Used in Edge Functions to filter fire alerts
// =============================================
export const INDIA_BOUNDARY_SIMPLE = [
    [77.57, 8.08], [75.49, 11.68], [74.28, 14.28], [73.02, 17.38],
    [72.78, 19.18], [72.68, 20.68], [69.28, 21.08], [68.18, 23.58],
    [70.08, 24.72], [69.52, 28.08], [72.88, 30.58], [74.38, 31.72],
    [76.58, 33.68], [78.08, 34.92], [77.08, 35.58], [78.88, 36.52],
    [80.28, 35.08], [79.68, 33.88], [79.18, 32.78], [79.88, 31.58],
    [82.08, 29.68], [85.18, 28.48], [87.18, 27.82], [88.78, 28.18],
    [92.98, 28.08], [97.28, 27.68], [96.08, 26.18], [94.28, 24.38],
    [93.28, 23.18], [93.38, 21.68], [92.08, 22.08], [90.58, 23.48],
    [89.18, 24.38], [88.08, 24.08], [88.98, 22.28], [89.08, 21.82],
    [86.78, 21.28], [84.68, 19.18], [82.18, 16.78], [80.18, 14.98],
    [80.28, 13.18], [79.78, 11.38], [79.18, 9.78], [77.57, 8.08]
];

/**
 * Point-in-polygon test using ray-casting algorithm
 * @param {number} lat - Latitude of the point
 * @param {number} lng - Longitude of the point
 * @param {Array} polygon - Array of [lng, lat] pairs
 * @returns {boolean}
 */
export function isPointInIndia(lat, lng) {
    const poly = INDIA_BOUNDARY_SIMPLE;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][1], yi = poly[i][0]; // lat, lng
        const xj = poly[j][1], yj = poly[j][0];
        const intersect = ((yi > lng) !== (yj > lng)) &&
            (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// =============================================
// Forest cover visualization — Generated from
// forestRegions.js for accurate boundary tracing
// =============================================
export const FOREST_DOTS = generateForestDots();
export const FOREST_REGION_LABELS = _FOREST_REGION_LABELS;

// =============================================
// Helpers
// =============================================

export function getSeverityColor(severity) {
    const map = { critical: '#C1121F', high: '#D6472B', medium: '#D4A017', low: '#40916C' };
    return map[severity] || '#888';
}

export function getAlertTypeLabel(type) {
    const map = { deforestation: 'Deforestation', fire: 'Fire', encroachment: 'Encroachment' };
    return map[type] || type;
}

export function getCategoryLabel(cat) {
    const map = { deforestation: 'Deforestation', fire: 'Fire', conservation: 'Conservation', wildlife: 'Wildlife', policy: 'Policy' };
    return map[cat] || cat;
}

export function getCategoryColor(cat) {
    const map = { deforestation: '#C1121F', fire: '#D6472B', conservation: '#40916C', wildlife: '#2D6A4F', policy: '#333' };
    return map[cat] || '#888';
}

export function formatTimeAgo(dateString) {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
