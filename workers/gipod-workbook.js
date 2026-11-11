// Reads saved cell values only; never evaluates formulas, runs macros or writes a workbook.
((root) => {
  const decode = value => String(value || "").replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    if (entity[0] !== "#") return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[entity.toLowerCase()];
    const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });
  const attrs = xml => Object.fromEntries([...xml.matchAll(/([\w:.-]+)\s*=\s*(["'])(.*?)\2/gs)].map(m => [m[1], decode(m[3])]));
  const texts = xml => [...xml.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)].map(m => decode(m[1])).join("");
  async function parse(buffer, library = root.JSZip) {
    const zip = await library.loadAsync(buffer);
    const read = async name => {
      const file = zip.file(name);
      if (!file) throw new Error("The purchasing tracker worksheet could not be read.");
      const xml = await file.async("string");
      if (xml.length > 32000000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("Unsupported purchasing tracker XML.");
      return xml;
    };
    const sheets = [...(await read("xl/workbook.xml")).matchAll(/<(?:\w+:)?sheet\b([^>]*?)\/?\s*>/g)].map(m => attrs(m[1]));
    const sheet = sheets.filter(s => s.name === "Smartbox Grid Licenses");
    if (sheet.length !== 1) throw new Error("Smartbox Grid Licenses worksheet was not found.");
    const relations = [...(await read("xl/_rels/workbook.xml.rels")).matchAll(/<(?:\w+:)?Relationship\b([^>]*?)\/?\s*>/g)].map(m => attrs(m[1]));
    const relation = relations.find(r => r.Id === sheet[0]["r:id"]);
    if (!relation || relation.TargetMode === "External") throw new Error("Unsupported purchasing tracker worksheet.");
    const target = relation.Target.startsWith("/") ? relation.Target.slice(1) : `xl/${relation.Target}`;
    if (!/^xl\/worksheets\/[\w.-]+\.xml$/.test(target)) throw new Error("Unsupported purchasing tracker worksheet path.");
    const strings = zip.file("xl/sharedStrings.xml") ? [...(await read("xl/sharedStrings.xml")).matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)].map(m => texts(m[1])) : [];
    const cells = new Map();
    let maxRow = 1;
    for (const match of (await read(target)).matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
      const a = attrs(match[1]);
      const ref = /^([EF])(\d+)$/.exec(a.r || "");
      if (!ref) continue;
      if (a.t === "e") throw new Error("The purchasing tracker contains an error in columns E or F.");
      const xml = match[2] || "";
      const saved = /<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/.exec(xml)?.[1];
      if (/<(?:\w+:)?f\b/.test(xml) && saved === undefined) throw new Error("The purchasing tracker has an unsaved formula value.");
      const value = a.t === "s" ? strings[Number(saved)] ?? "" : a.t === "inlineStr" ? texts(xml) : decode(saved);
      cells.set(a.r, value.trim());
      maxRow = Math.max(maxRow, Number(ref[2]));
    }
    if (!/Grid\s*\+\s*PODD/i.test(cells.get("E1") || "") || !/Client Name/i.test(cells.get("F1") || "")) throw new Error("Expected GIPOD codes in E and client names in F.");
    let firstAvailable = 2;
    while (firstAvailable <= maxRow && cells.get(`F${firstAvailable}`)) firstAvailable++;
    let firstEmptyCode = firstAvailable;
    while (firstEmptyCode <= maxRow && cells.get(`E${firstEmptyCode}`)) firstEmptyCode++;
    // The empty E cell is the exclusive end; do not count later code blocks.
    return { count: firstEmptyCode - firstAvailable, firstAvailable, firstEmptyCode };
  }
  root.sidekickGipodWorkbook = { parse };
  if (typeof module !== "undefined" && module.exports) module.exports = { parse };
})(globalThis);
