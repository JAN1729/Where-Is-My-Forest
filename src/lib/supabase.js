// Supabase client — secure, no secrets exposed
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create client if configured
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: { params: { eventsPerSecond: 2 } },
    })
    : null;

export function isSupabaseConfigured() {
    return Boolean(supabase);
}

// =============================================
// Safe query wrapper — returns empty data when
// Supabase is not configured instead of crashing.
// =============================================
export async function safeQuery(table, options = {}) {
    if (!supabase) return { data: [], error: null };

    let query = supabase.from(table).select('*');

    if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
    }
    if (options.limit) {
        query = query.limit(options.limit);
    }
    if (options.eq) {
        Object.entries(options.eq).forEach(([col, val]) => {
            query = query.eq(col, val);
        });
    }

    return query;
}

// =============================================
// Realtime subscription helper
// =============================================
export function subscribeToTable(table, callback) {
    if (!supabase) return () => { };

    const channel = supabase
        .channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// =============================================
// Plant a Tree — Image compression utility
// Compresses images client-side before upload
// to keep storage costs minimal and uploads fast
// =============================================
export async function compressImage(file, { maxWidth = 1200, quality = 0.7 } = {}) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Scale down if wider than maxWidth
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) return reject(new Error('Compression failed'));
                        resolve(new File([blob], file.name.replace(/\.\w+$/, '.webp'), {
                            type: 'image/webp',
                        }));
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// =============================================
// Plant a Tree — Upload photo to storage
// =============================================
export async function uploadTreePhoto(file) {
    if (!supabase) throw new Error('Supabase not configured');

    // Compress before upload
    const compressed = await compressImage(file);

    // Unique path: tree-photos/YYYY-MM/uuid.webp
    const now = new Date();
    const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filename = `${folder}/${crypto.randomUUID()}.webp`;

    const { data, error } = await supabase.storage
        .from('tree-photos')
        .upload(filename, compressed, {
            contentType: 'image/webp',
            upsert: false,
        });

    if (error) throw error;

    // Get the public URL
    const { data: urlData } = supabase.storage
        .from('tree-photos')
        .getPublicUrl(data.path);

    return urlData.publicUrl;
}

// =============================================
// Plant a Tree — Submit and trigger verification
// =============================================
export async function submitPlantedTree({ planterName, plantedDate, photoUrl, latitude, longitude }) {
    if (!supabase) throw new Error('Supabase not configured');

    // Insert the tree record
    const { data: tree, error } = await supabase
        .from('planted_trees')
        .insert({
            planter_name: planterName,
            planted_date: plantedDate,
            photo_url: photoUrl,
            latitude,
            longitude,
        })
        .select()
        .single();

    if (error) throw error;

    // Trigger AI verification (async — don't block the UI)
    const fnUrl = `${supabaseUrl}/functions/v1/verify-tree-photo`;
    fetch(fnUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ tree_id: tree.id }),
    }).catch((err) => console.warn('Verification trigger failed:', err));

    return tree;
}

// =============================================
// Plant a Tree — Fetch verified trees for map
// =============================================
export async function fetchVerifiedTrees() {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('planted_trees')
        .select('id, latitude, longitude, tree_type, planted_date, created_at')
        .eq('status', 'verified')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch verified trees:', error);
        return [];
    }

    return data || [];
}

// =============================================
// Plant a Tree — Get total count (for hero section)
// =============================================
export async function getPlantedTreeCount() {
    if (!supabase) return 0;

    const { count, error } = await supabase
        .from('planted_trees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'verified');

    if (error) return 0;
    return count || 0;
}
