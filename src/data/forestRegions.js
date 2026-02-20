// =============================================
// Accurate forest coverage data for India
// Based on ISFR 2023 + actual forest boundaries
// Uses path-tracing belts, area fills, and patches
// =============================================

let _seed = 42;
function sr() {
    _seed = (_seed * 16807) % 2147483647;
    return (_seed - 1) / 2147483646;
}

// Generate dots along a path (belt) with given width
function beltDots(waypoints, width, dotsPerSegment) {
    const dots = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
        const [lat1, lng1] = waypoints[i];
        const [lat2, lng2] = waypoints[i + 1];
        for (let d = 0; d < dotsPerSegment; d++) {
            const t = sr();
            const lat = lat1 + (lat2 - lat1) * t + (sr() - 0.5) * width;
            const lng = lng1 + (lng2 - lng1) * t + (sr() - 0.5) * width;
            dots.push([lat, lng]);
        }
    }
    return dots;
}

// Fill a rectangular area with dots
function areaFill(latMin, latMax, lngMin, lngMax, count) {
    const dots = [];
    for (let i = 0; i < count; i++) {
        dots.push([
            latMin + sr() * (latMax - latMin),
            lngMin + sr() * (lngMax - lngMin),
        ]);
    }
    return dots;
}

// Cluster dots around a point
function patch(lat, lng, radius, count) {
    const dots = [];
    for (let i = 0; i < count; i++) {
        const angle = sr() * Math.PI * 2;
        const r = Math.sqrt(sr()) * radius;
        dots.push([lat + r * Math.cos(angle), lng + r * Math.sin(angle)]);
    }
    return dots;
}

export function generateForestDots() {
    _seed = 42;
    let dots = [];

    // ═══════════════════════════════════════════
    // 1. WESTERN GHATS — 1600km strip, UNESCO hotspot
    //    Traced from Kanyakumari to Gujarat
    // ═══════════════════════════════════════════
    const westernGhats = [
        [8.25, 77.35],  // Kanyakumari tip
        [8.50, 77.30],  // Agasthyamalai
        [8.75, 77.15],  // Kalakkad-Mundanthurai
        [9.10, 77.05],  // Srivilliputhur
        [9.47, 77.05],  // Periyar
        [9.80, 76.95],  // Cardamom Hills
        [10.10, 77.05], // Eravikulam
        [10.35, 76.85], // Chinnar / Idukki
        [10.55, 76.70], // Parambikulam
        [10.85, 76.55], // Vazhachal
        [11.05, 76.45], // Silent Valley
        [11.35, 76.40], // Nilgiris / Ooty
        [11.60, 76.30], // Mudumalai / Wayanad
        [11.85, 76.15], // Nagarhole / Bandipur
        [12.10, 75.95], // Coorg / Kodagu
        [12.45, 75.75], // Pushpagiri
        [12.80, 75.55], // Kudremukh
        [13.15, 75.30], // Agumbe
        [13.55, 75.05], // Bhadra
        [13.90, 74.85], // Sharavathi Valley
        [14.20, 74.70], // Mookambika
        [14.55, 74.50], // Shimoga forests
        [15.05, 74.35], // Anshi-Dandeli
        [15.35, 74.20], // Goa - Mollem
        [15.65, 73.95], // Sindhudurg
        [16.00, 73.80], // Sahyadri - S Maharashtra
        [16.40, 73.65], // Radhanagari
        [16.80, 73.55], // Kolhapur ghats
        [17.20, 73.50], // Satara ghats
        [17.65, 73.45], // Mahabaleshwar
        [18.10, 73.40], // Pune ghats
        [18.50, 73.35], // Bhimashankar
        [18.90, 73.40], // Junnar ghats
        [19.30, 73.35], // Nashik ghats
        [19.70, 73.45], // Trimbak
        [20.10, 73.40], // Toranmal
        [20.50, 73.35], // Dang forests
        [20.80, 73.30], // South Gujarat ghats
    ];
    dots.push(...beltDots(westernGhats, 0.30, 55));

    // Wider sections: Nilgiri-Wayanad-Coorg block
    dots.push(...areaFill(11.20, 12.20, 75.90, 76.80, 400));
    // Kerala midlands forests
    dots.push(...areaFill(9.00, 11.00, 76.30, 77.20, 300));

    // ═══════════════════════════════════════════
    // 2. NORTHEAST INDIA — Densest forest region
    // ═══════════════════════════════════════════

    // Arunachal Pradesh — nearly full coverage
    dots.push(...areaFill(26.50, 29.00, 91.50, 97.40, 1200));
    // Extra density in Namdapha/Changlang
    dots.push(...areaFill(27.00, 27.80, 95.50, 97.00, 200));

    // Meghalaya — Khasi, Garo, Jaintia Hills
    dots.push(...areaFill(25.00, 25.90, 89.80, 92.80, 350));

    // Nagaland — full coverage
    dots.push(...areaFill(25.20, 26.80, 93.30, 95.20, 400));

    // Manipur
    dots.push(...areaFill(24.00, 25.60, 93.00, 94.60, 350));

    // Mizoram — continuous forest
    dots.push(...areaFill(21.90, 24.50, 92.10, 93.40, 400));

    // Tripura forests
    dots.push(...areaFill(23.00, 24.20, 91.20, 92.00, 150));

    // Assam — Karbi Anglong and Dima Hasao hills
    dots.push(...areaFill(25.00, 26.30, 92.50, 93.80, 250));
    // Assam — Kaziranga-Manas belt
    dots.push(...beltDots([
        [26.50, 89.90], [26.60, 90.50], [26.65, 91.10],
        [26.70, 91.80], [26.60, 92.50], [26.55, 93.20],
        [26.50, 93.80],
    ], 0.15, 40));
    // Cachar / Barak valley
    dots.push(...areaFill(24.50, 25.20, 92.50, 93.30, 100));

    // Sikkim
    dots.push(...areaFill(27.00, 27.90, 88.10, 88.80, 120));

    // ═══════════════════════════════════════════
    // 3. CENTRAL INDIAN HIGHLANDS — MP, CG, JH
    //    Largest contiguous forest block in India
    // ═══════════════════════════════════════════

    // Madhya Pradesh — Satpura-Pench-Kanha belt
    dots.push(...beltDots([
        [21.50, 77.50], [21.80, 78.00], [22.20, 78.50],
        [22.50, 79.00], [22.40, 79.50], [22.30, 80.00],
        [22.35, 80.60], [22.50, 81.00],
    ], 0.40, 60));
    // MP — Vindhyan range forests
    dots.push(...beltDots([
        [23.50, 77.50], [23.70, 78.00], [23.80, 78.50],
        [24.00, 79.00], [24.30, 79.50], [24.50, 80.00],
        [24.60, 80.50], [24.20, 81.00], [24.10, 81.70],
    ], 0.35, 50));
    // MP — Northern forests (Shivpuri/Gwalior)
    dots.push(...areaFill(24.80, 25.80, 77.20, 78.50, 120));

    // Chhattisgarh — Bastar-Dantewada dense forests
    dots.push(...areaFill(18.50, 20.50, 80.20, 82.20, 500));
    // CG — Achanakmar-Bilaspur belt
    dots.push(...areaFill(22.00, 23.20, 81.00, 82.80, 250));
    // CG — Surguja/Koriya forests
    dots.push(...areaFill(23.00, 24.20, 82.00, 83.50, 200));

    // Jharkhand — Saranda-Singhbhum iron ore forests
    dots.push(...areaFill(22.00, 22.80, 85.00, 86.00, 200));
    // JH — Palamau/Latehar forests
    dots.push(...areaFill(23.40, 24.20, 83.50, 85.00, 200));
    // JH — Hazaribagh-Giridih forests
    dots.push(...areaFill(23.70, 24.30, 85.00, 86.30, 150));

    // ═══════════════════════════════════════════
    // 4. EASTERN GHATS & ODISHA
    // ═══════════════════════════════════════════

    // Odisha — Simlipal block
    dots.push(...areaFill(21.40, 22.20, 86.00, 87.00, 200));
    // Odisha — Koraput-Malkangiri-Rayagada belt
    dots.push(...areaFill(18.20, 19.80, 82.00, 83.80, 300));
    // Odisha — Satkosia-Angul forests
    dots.push(...areaFill(20.30, 21.20, 83.50, 85.00, 200));
    // Odisha — Sundargarh forests
    dots.push(...areaFill(21.80, 22.40, 83.50, 85.00, 150));
    // Odisha — Bhitarkanika mangroves
    dots.push(...patch(20.72, 86.88, 0.12, 60));

    // Andhra Pradesh — Nallamala Hills (Eastern Ghats spine)
    dots.push(...beltDots([
        [14.80, 78.60], [15.20, 78.70], [15.60, 78.80],
        [16.00, 78.85], [16.40, 79.00], [16.80, 79.10],
    ], 0.30, 50));
    // AP — Seshachalam Hills
    dots.push(...areaFill(13.40, 14.00, 79.00, 79.60, 100));
    // AP — Papikonda
    dots.push(...patch(17.30, 81.30, 0.20, 80));

    // Telangana — Kawal-Adilabad forests
    dots.push(...areaFill(18.80, 19.80, 78.30, 79.50, 200));
    // Telangana — Amrabad
    dots.push(...patch(16.32, 78.83, 0.20, 80));

    // Tamil Nadu Eastern Ghats — Javadi, Shevaroy, Kolli Hills
    dots.push(...patch(12.35, 78.85, 0.15, 60));
    dots.push(...patch(11.80, 78.20, 0.12, 50));
    dots.push(...patch(11.30, 78.30, 0.12, 50));

    // ═══════════════════════════════════════════
    // 5. HIMALAYAN BELT — UK, HP, J&K
    // ═══════════════════════════════════════════

    // Uttarakhand — Terai-Bhabar (foothills)
    dots.push(...beltDots([
        [29.00, 78.00], [29.20, 78.50], [29.40, 79.00],
        [29.50, 79.50], [29.30, 80.00], [29.10, 80.50],
    ], 0.20, 50));
    // UK — Garhwal Himalayas
    dots.push(...areaFill(30.00, 31.00, 78.50, 80.00, 300));
    // UK — Kumaon forests
    dots.push(...areaFill(29.20, 30.00, 79.00, 80.20, 200));

    // Himachal Pradesh — Lower Himalayas
    dots.push(...beltDots([
        [31.00, 76.50], [31.30, 77.00], [31.50, 77.50],
        [31.80, 78.00], [32.00, 78.50],
    ], 0.30, 50));
    // HP — Kullu-Manali-Chamba forests
    dots.push(...areaFill(31.80, 32.80, 76.00, 77.50, 200));

    // Jammu & Kashmir forests
    dots.push(...beltDots([
        [33.00, 74.00], [33.30, 74.50], [33.60, 75.00],
        [33.80, 75.50], [34.10, 76.00],
    ], 0.25, 45));
    // J&K — Pir Panjal range
    dots.push(...areaFill(33.20, 34.20, 74.20, 75.80, 200));

    // ═══════════════════════════════════════════
    // 6. MAHARASHTRA (non-Ghats)
    // ═══════════════════════════════════════════
    dots.push(...areaFill(19.80, 21.00, 79.00, 80.20, 180)); // Tadoba-Navegaon
    dots.push(...areaFill(21.00, 21.80, 76.60, 77.60, 150)); // Melghat

    // ═══════════════════════════════════════════
    // 7. RAJASTHAN — Aravalli belt
    // ═══════════════════════════════════════════
    dots.push(...beltDots([
        [24.50, 72.70], [24.80, 73.10], [25.10, 73.50],
        [25.50, 73.80], [26.00, 74.20], [26.50, 74.70],
        [27.00, 75.30], [27.50, 75.80],
    ], 0.15, 25));
    // Ranthambore
    dots.push(...patch(26.02, 76.45, 0.15, 60));
    // Sariska
    dots.push(...patch(27.32, 76.43, 0.12, 50));

    // ═══════════════════════════════════════════
    // 8. GUJARAT
    // ═══════════════════════════════════════════
    dots.push(...patch(21.13, 70.82, 0.18, 80)); // Gir
    dots.push(...patch(21.88, 73.68, 0.15, 60)); // Shoolpaneshwar
    dots.push(...patch(20.75, 73.52, 0.10, 40)); // Vansda
    dots.push(...areaFill(20.40, 21.20, 73.10, 73.80, 80)); // Dang forests

    // ═══════════════════════════════════════════
    // 9. WEST BENGAL
    // ═══════════════════════════════════════════
    // Sundarbans mangroves
    dots.push(...areaFill(21.50, 22.30, 88.50, 89.40, 250));
    // North Bengal — Buxa-Gorumara-Jaldapara
    dots.push(...beltDots([
        [26.50, 88.50], [26.60, 88.90], [26.65, 89.30],
        [26.60, 89.70],
    ], 0.15, 40));

    // ═══════════════════════════════════════════
    // 10. UTTAR PRADESH — Terai
    // ═══════════════════════════════════════════
    dots.push(...beltDots([
        [28.30, 79.80], [28.50, 80.10], [28.55, 80.50],
        [28.60, 80.90], [28.50, 81.20],
    ], 0.12, 35)); // Dudhwa-Pilibhit

    // ═══════════════════════════════════════════
    // 11. BIHAR
    // ═══════════════════════════════════════════
    dots.push(...patch(27.32, 83.95, 0.18, 70)); // Valmiki TR

    // ═══════════════════════════════════════════
    // 12. ANDAMAN & NICOBAR ISLANDS
    // ═══════════════════════════════════════════
    // South Andaman
    dots.push(...areaFill(11.50, 12.00, 92.50, 93.00, 100));
    // Middle Andaman
    dots.push(...areaFill(12.00, 12.80, 92.60, 93.10, 120));
    // North Andaman
    dots.push(...areaFill(12.80, 13.40, 92.70, 93.20, 100));
    // Great Nicobar
    dots.push(...areaFill(6.80, 7.40, 93.60, 94.00, 60));
    // Car Nicobar / Little Andaman
    dots.push(...patch(10.50, 92.60, 0.10, 40));

    // ═══════════════════════════════════════════
    // 13. KARNATAKA interior (non-Ghats)
    // ═══════════════════════════════════════════
    dots.push(...patch(11.92, 77.15, 0.15, 60)); // BRT Hills
    dots.push(...patch(11.83, 77.23, 0.15, 50)); // Sathyamangalam overflow

    // ═══════════════════════════════════════════
    // 14. GOA — small forest patches
    // ═══════════════════════════════════════════
    dots.push(...patch(15.35, 74.20, 0.08, 30));

    return dots;
}

// Major forest region labels for map display
export const FOREST_REGION_LABELS = [
    { name: 'Western Ghats', lat: 14.0, lng: 74.6, type: 'hotspot' },
    { name: 'Sundarbans', lat: 21.90, lng: 88.90, type: 'mangrove' },
    { name: 'Nilgiri Biosphere', lat: 11.4, lng: 76.7, type: 'biosphere' },
    { name: 'Satpura–Maikal Belt', lat: 22.4, lng: 79.0, type: 'belt' },
    { name: 'Eastern Ghats', lat: 15.5, lng: 78.8, type: 'range' },
    { name: 'Arunachal Forests', lat: 27.8, lng: 94.5, type: 'primary' },
    { name: 'Karbi Anglong', lat: 25.6, lng: 93.2, type: 'hills' },
    { name: 'Meghalaya Hills', lat: 25.5, lng: 91.3, type: 'subtropical' },
    { name: 'Mizoram', lat: 23.2, lng: 92.8, type: 'tropical' },
    { name: 'Nagaland', lat: 26.0, lng: 94.2, type: 'montane' },
    { name: 'Manipur', lat: 24.8, lng: 93.8, type: 'montane' },
    { name: 'Garhwal Himalayas', lat: 30.5, lng: 79.2, type: 'alpine' },
    { name: 'Kaziranga', lat: 26.6, lng: 93.3, type: 'park' },
    { name: 'Gir Forest', lat: 21.1, lng: 70.8, type: 'park' },
    { name: 'Simlipal', lat: 21.8, lng: 86.5, type: 'park' },
    { name: 'Bastar Forests', lat: 19.5, lng: 81.2, type: 'belt' },
    { name: 'Periyar', lat: 9.5, lng: 77.1, type: 'park' },
    { name: 'Great Himalayan NP', lat: 31.8, lng: 77.5, type: 'park' },
    { name: 'Andaman Islands', lat: 12.2, lng: 92.8, type: 'island' },
    { name: 'Saranda', lat: 22.2, lng: 85.5, type: 'belt' },
    { name: 'Vindhyan Range', lat: 24.0, lng: 79.5, type: 'range' },
    { name: 'Aravalli Hills', lat: 25.5, lng: 73.6, type: 'range' },
    { name: 'Nallamala Hills', lat: 15.8, lng: 78.8, type: 'range' },
    { name: 'Koraput–Malkangiri', lat: 19.0, lng: 83.0, type: 'belt' },
    { name: 'Pir Panjal', lat: 33.7, lng: 75.0, type: 'range' },
    { name: 'Dudhwa', lat: 28.5, lng: 80.5, type: 'park' },
];
