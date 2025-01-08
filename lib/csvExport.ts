export function exportToCsv(filename: string, headers: string[], data: any[], formatRow: (row: any) => string[]) {
    const csvContent = [
        headers.join(','),
        ...data.map(formatRow).map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
