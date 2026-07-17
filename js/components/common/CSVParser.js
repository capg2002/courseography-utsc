export async function fetchCsvRows(url) {
  const text = await fetch(url).then(r => {
    if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
    return r.text();
  });

  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]);

  return lines.slice(1).map(line => {
    const cols = splitCsvLine(line);
    const row = {};
    header.forEach((h, i) => (row[h] = cols[i] ?? ""));
    return row;
  });
}

// Handles commas inside quotes: a,"b,c",d
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);

  // trim + strip surrounding quotes
  return out.map(s => {
    const t = s.trim();
    return (t.startsWith('"') && t.endsWith('"')) ? t.slice(1, -1) : t;
  });
}