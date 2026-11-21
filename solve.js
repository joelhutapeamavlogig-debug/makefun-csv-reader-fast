// A faster drop-in for csv-reader 1.0.0: same answer, slice-based scanning.
const COMMA = 0, LINE_BREAK = 1, END = 2;

export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const len = text.length;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;
  let pos = 0;
  let line = 1;
  if (len !== 0 && text.charCodeAt(0) === 0xfeff) pos = 1;

  let recordLine = 1;
  let recordRow = null;

  const err = (code) => errors.push({ code, line: recordLine, row: recordRow });

  function readUnquoted(value) {
    let added = 0;
    let seg = pos;
    while (pos < len) {
      const c = text.charCodeAt(pos);
      if (c === 44) {
        if (pos > seg) { value += text.slice(seg, pos); added += pos - seg; }
        pos += 1;
        return { value, ended: COMMA, added };
      }
      if (c === 10) {
        if (pos > seg) { value += text.slice(seg, pos); added += pos - seg; }
        pos += 1; line += 1;
        return { value, ended: LINE_BREAK, added };
      }
      if (c === 13) {
        if (pos > seg) { value += text.slice(seg, pos); added += pos - seg; }
        if (pos + 1 < len && text.charCodeAt(pos + 1) === 10) {
          pos += 2; line += 1;
          return { value, ended: LINE_BREAK, added };
        }
        err('stray_cr');
        pos += 1; seg = pos;
        continue;
      }
      pos += 1;
    }
    if (pos > seg) { value += text.slice(seg, pos); added += pos - seg; }
    return { value, ended: END, added };
  }

  function readQuoted() {
    const open = pos;
    const openLine = line;
    let value = '';
    pos += 1;
    let seg = pos;
    let closed = false;
    while (pos < len) {
      const c = text.charCodeAt(pos);
      if (c === 34) {
        if (pos + 1 < len && text.charCodeAt(pos + 1) === 34) {
          value += text.slice(seg, pos) + '"';
          pos += 2; seg = pos;
          continue;
        }
        value += text.slice(seg, pos);
        pos += 1; closed = true;
        break;
      }
      if (c === 13) {
        value += text.slice(seg, pos) + '\n';
        line += 1;
        pos += (pos + 1 < len && text.charCodeAt(pos + 1) === 10) ? 2 : 1;
        seg = pos;
        continue;
      }
      if (c === 10) {
        value += text.slice(seg, pos) + '\n';
        line += 1; pos += 1; seg = pos;
        continue;
      }
      pos += 1;
    }
    if (!closed) {
      pos = open + 1;
      line = openLine;
      err('unterminated_quote');
      return readUnquoted('"');
    }
    if (pos >= len) return { value, ended: END };
    const c = text.charCodeAt(pos);
    if (c === 44) { pos += 1; return { value, ended: COMMA }; }
    if (c === 10) { pos += 1; line += 1; return { value, ended: LINE_BREAK }; }
    if (c === 13 && pos + 1 < len && text.charCodeAt(pos + 1) === 10) {
      pos += 2; line += 1; return { value, ended: LINE_BREAK };
    }
    const junk = readUnquoted(value);
    if (junk.added > 0) err('quote_junk');
    return junk;
  }

  for (;;) {
    while (pos < len) {
      const c = text.charCodeAt(pos);
      if (c === 10) { pos += 1; line += 1; }
      else if (c === 13 && pos + 1 < len && text.charCodeAt(pos + 1) === 10) { pos += 2; line += 1; }
      else break;
    }
    if (pos >= len) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let field;
    let quoted;
    do {
      quoted = text.charCodeAt(pos) === 34;
      field = quoted ? readQuoted() : readUnquoted('');
      fields.push(field.value);
    } while (field.ended === COMMA);

    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) { columns = fields; continue; }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }

  return { columns: header ? (columns ?? []) : null, rows, errors };
}
