export function exportToCSV<T>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (!data.length) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records = data as any[];
  const first = records[0] ?? {};
  const keys = Object.keys(first) as (keyof T)[];
  const headers = columns || keys.map((k) => ({ key: k, label: String(k) }));
  const csvHeader = headers.map((h) => `"${h.label}"`).join(",");
  const csvRows = records.map((row) =>
    headers.map((h) => {
      const val = row[h.key];
      const str = val == null ? "" : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  const csv = [csvHeader, ...csvRows].join("\r\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;header=present" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
