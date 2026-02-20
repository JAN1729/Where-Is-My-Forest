// =============================================
// Data Export Utilities
// CSV, JSON, and Print-ready report generation
// =============================================

/**
 * Convert array of objects to CSV string and trigger download
 */
export function exportToCSV(data, filename = 'export') {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            headers.map(h => {
                const val = row[h];
                if (val === null || val === undefined) return '';
                const str = String(val);
                // Escape quotes and wrap in quotes if contains comma/newline
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data as formatted JSON file
 */
export function exportToJSON(data, filename = 'export') {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
}

/**
 * Generate a print-ready report in a new window
 */
export function generatePrintReport({ title, subtitle, sections, timestamp }) {
    const win = window.open('', '_blank');
    if (!win) return;

    const html = `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Georgia', serif; color: #1a1a1a; padding: 40px; max-width: 900px; margin: 0 auto; }
        .header { border-bottom: 2px solid #2D6A4F; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 24px; color: #1a1a1a; font-weight: 700; }
        .header p { font-size: 13px; color: #666; margin-top: 4px; }
        .section { margin-bottom: 28px; page-break-inside: avoid; }
        .section h2 { font-size: 16px; font-weight: 700; color: #2D6A4F; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
        .section p { font-size: 13px; line-height: 1.6; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th { text-align: left; padding: 6px 8px; background: #f5f5f0; border-bottom: 1px solid #ddd; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        tr:hover td { background: #fafaf5; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #888; }
        .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; }
        .badge--critical { background: #fde2e4; color: #b23a48; }
        .badge--high { background: #fef3e2; color: #d4622b; }
        .badge--moderate { background: #e8f4ea; color: #2d6a4f; }
        .badge--low { background: #f0f0f0; color: #666; }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>${subtitle || ''}</p>
        <p>Generated: ${timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
    </div>
    ${sections.map(s => `
    <div class="section">
        <h2>${s.title}</h2>
        ${s.content || ''}
        ${s.table ? renderTable(s.table) : ''}
    </div>`).join('')}
    <div class="footer">
        <p>Where Is My Forest — Conservation Intelligence Platform</p>
        <p>Data sourced from Global Forest Watch, India State of Forest Report 2023, and live monitoring systems.</p>
    </div>
    <script>window.onload = () => window.print();</script>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
}

function renderTable(table) {
    if (!table.rows || !table.headers) return '';
    return `<table>
        <thead><tr>${table.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${table.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
