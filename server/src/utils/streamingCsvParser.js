import fs from 'node:fs';
import crypto from 'node:crypto';
import { normalizeHeader } from './csvParser.js';

/**
 * Streaming RFC-4180 CSV Parser
 * Yields parsed rows asynchronously one by one without buffering the entire file in memory.
 * Computes SHA-256 hash incrementally as the file is read.
 */
export async function* streamCsv(filePath) {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });

  let buffer = '';
  let insideQuotes = false;
  let currentField = '';
  let currentRow = [];
  let currentLineNumber = 1;
  let startRowLineNumber = 1;
  let headers = null;
  let headerIndexMap = null;
  let isFirstChunk = true;

  for await (const chunk of stream) {
    hash.update(chunk);
    let text = chunk.toString('utf-8');

    // Strip UTF-8 BOM if present on the very first chunk
    if (isFirstChunk) {
      if (text.charCodeAt(0) === 0xfeff) {
        text = text.slice(1);
      }
      isFirstChunk = false;
    }

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '\n') {
        currentLineNumber++;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // skip \n of \r\n
        }
        currentLineNumber++;
      }

      if (insideQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentField += '"';
            i++;
          } else {
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

          const hasContent = currentRow.some((val) => val.trim().length > 0);
          if (hasContent) {
            if (!headers) {
              headers = currentRow.map((h) => h.trim());
              headerIndexMap = {};
              headers.forEach((h, idx) => {
                const norm = normalizeHeader(h);
                if (norm) headerIndexMap[norm] = idx;
              });
            } else {
              const rowObj = {};
              for (const [normKey, idx] of Object.entries(headerIndexMap)) {
                rowObj[normKey] = currentRow[idx] !== undefined ? currentRow[idx].trim() : '';
              }
              yield {
                rowNumber: startRowLineNumber,
                fields: currentRow,
                rowObj,
                headers,
                headerIndexMap,
              };
            }
          }

          currentRow = [];
          startRowLineNumber = currentLineNumber;
        } else {
          currentField += char;
        }
      }
    }
  }

  // Handle trailing row if file did not end with newline
  if (insideQuotes) {
    throw new Error(`Malformed CSV: Unclosed quote detected starting at row ${startRowLineNumber}.`);
  }

  if (currentRow.length > 0 || currentField.length > 0) {
    currentRow.push(currentField);
    const hasContent = currentRow.some((val) => val.trim().length > 0);
    if (hasContent) {
      if (!headers) {
        headers = currentRow.map((h) => h.trim());
      } else {
        const rowObj = {};
        for (const [normKey, idx] of Object.entries(headerIndexMap)) {
          rowObj[normKey] = currentRow[idx] !== undefined ? currentRow[idx].trim() : '';
        }
        yield {
          rowNumber: startRowLineNumber,
          fields: currentRow,
          rowObj,
          headers,
          headerIndexMap,
        };
      }
    }
  }

  // Attach final SHA-256 hash to generator return
  return {
    fileHash: hash.digest('hex'),
    headers,
  };
}

/**
 * Utility to calculate file SHA-256 without loading whole file
 */
export async function getFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

