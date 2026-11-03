/**
 * RFC 4180 Compliant CSV Parser
 * Handles:
 * - UTF-8 Byte Order Mark (BOM) stripping
 * - Quoted fields with embedded commas and newlines
 * - Escaped double quotes ("" -> ")
 * - CRLF (\r\n), CR (\r), and LF (\n) record separators
 * - Accurate line number tracking for row-level error reporting
 */

export function parseCsv(input) {
  let text = typeof input === 'string' ? input : input.toString('utf-8');

  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  if (!text || text.trim().length === 0) {
    return { headers: [], rows: [] };
  }

  const rawRows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;
  let startRowLineNumber = 1;
  let currentLineNumber = 1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '\n') {
      currentLineNumber++;
    } else if (char === '\r') {
      if (nextChar === '\n') {
        i++; // Treat \r\n as a single newline
      }
      currentLineNumber++;
    }

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i++;
        } else {
          // Closing quote
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' || char === '\n') {
        currentRow.push(currentField);
        currentField = '';

        // Check if row has any non-empty content
        const hasContent = currentRow.some((val) => val.trim().length > 0);
        if (hasContent) {
          rawRows.push({
            rowNumber: startRowLineNumber,
            fields: currentRow,
          });
        }

        currentRow = [];
        startRowLineNumber = currentLineNumber;
      } else {
        currentField += char;
      }
    }
  }

  // Handle remaining field/row at EOF
  if (insideQuotes) {
    throw new Error(`Malformed CSV: Unclosed quote detected starting at row ${startRowLineNumber}.`);
  }

  if (currentRow.length > 0 || currentField.length > 0) {
    currentRow.push(currentField);
    const hasContent = currentRow.some((val) => val.trim().length > 0);
    if (hasContent) {
      rawRows.push({
        rowNumber: startRowLineNumber,
        fields: currentRow,
      });
    }
  }

  if (rawRows.length === 0) {
    return { headers: [], rows: [] };
  }

  // Extract and clean headers from first row
  const headerRow = rawRows[0];
  const headers = headerRow.fields.map((h) => h.trim());

  // Map subsequent rows to objects keyed by headers
  const rows = [];
  for (let r = 1; r < rawRows.length; r++) {
    const raw = rawRows[r];
    const rowObj = { _rowNumber: raw.rowNumber };

    for (let c = 0; c < headers.length; c++) {
      const headerKey = headers[c];
      rowObj[headerKey] = raw.fields[c] !== undefined ? raw.fields[c].trim() : '';
    }

    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Normalizes header string to canonical DSR property name
 */
export function normalizeHeader(header) {
  const clean = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  const MAP = {
    itemcode: 'itemNo',
    itemno: 'itemNo',
    code: 'itemNo',
    category: 'category',
    itemcategory: 'category',
    chapter: 'chapter',
    subhead: 'subhead',
    title: 'title',
    itemtitle: 'title',
    desc: 'desc',
    description: 'desc',
    unit: 'unit',
    uom: 'unit',
    unitlabel: 'unitLabel',
    sqftfactor: 'sqftFactor',
    factor: 'sqftFactor',
    basedsrrateinr: 'baseRate',
    basedsrrate: 'baseRate',
    baserateinr: 'baseRate',
    baserate: 'baseRate',
    rateinr: 'baseRate',
    quotedrate: 'baseRate',
    clientrate: 'baseRate',
    price: 'baseRate',
    rate: 'baseRate',
    pdfsourcepage: 'sourcePage',
    sourcepage: 'sourcePage',
    page: 'sourcePage',
    edition: 'edition',
    volume: 'volume',
    vol: 'volume',
    isaddon: 'isAddOn',
    addon: 'isAddOn',
    coverage: 'coverage',
    typicalbrands: 'typicalBrands',
    brands: 'typicalBrands',
    keywords: 'keywords',
    specification: 'desc',
    spec: 'desc',
    itemdescription: 'desc',
    itemname: 'title',
    name: 'title',
  };

  return MAP[clean] || null;
}
