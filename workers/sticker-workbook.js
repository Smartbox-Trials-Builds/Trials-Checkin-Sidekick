// Read saved E/H values only. Never update the workbook or evaluate formulas.
((root) => {
  const normalize = value => String(value ?? "").trim().toUpperCase();
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
      if (!file) throw new Error("Missing DTP Stickers.xlsx could not be read.");
      const xml = await file.async("string");
      if (xml.length > 16000000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("Unsupported sticker workbook XML.");
      return xml;
    };
    const sheets = [...(await read("xl/workbook.xml")).matchAll(/<(?:\w+:)?sheet\b([^>]*?)\/?\s*>/g)].map(m => attrs(m[1]));
    const relations = [...(await read("xl/_rels/workbook.xml.rels")).matchAll(/<(?:\w+:)?Relationship\b([^>]*?)\/?\s*>/g)].map(m => attrs(m[1]));
    const strings = zip.file("xl/sharedStrings.xml") ? [...(await read("xl/sharedStrings.xml")).matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)].map(m => texts(m[1])) : [];
    if (!sheets.length) throw new Error("No sticker worksheets were found.");
    const matches = Object.create(null);
    for (const sheet of sheets) {
      const relation = relations.find(r => r.Id === sheet["r:id"]);
      if (!relation || relation.TargetMode === "External") throw new Error("Unsupported sticker worksheet.");
      const target = relation.Target.startsWith("/") ? relation.Target.slice(1) : `xl/${relation.Target}`;
      if (!/^xl\/worksheets\/[\w.-]+\.xml$/.test(target)) throw new Error("Unsupported sticker worksheet path.");
      for (const cell of (await read(target)).matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
        const a = attrs(cell[1]), ref = /^([EH])(\d+)$/.exec(a.r || "");
        if (!ref || Number(ref[2]) < 2) continue;
        if (a.t === "e") throw new Error("A sticker worksheet contains an error in column E or H.");
        const xml = cell[2] || "";
        const saved = /<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/.exec(xml)?.[1];
        if (/<(?:\w+:)?f\b/.test(xml) && saved === undefined) throw new Error("A sticker worksheet has an unsaved formula value.");
        const serial = normalize(a.t === "s" ? strings[Number(saved)] ?? "" : a.t === "inlineStr" ? texts(xml) : decode(saved));
        if (!serial) continue;
        (matches[serial] ||= []).push({ sheet: sheet.name, row: Number(ref[2]), column: ref[1], cell: a.r });
      }
    }
    return matches;
  }
  root.sidekickStickerWorkbook = { parse, normalize };
  if (typeof module !== "undefined" && module.exports) module.exports = { parse, normalize };
})(globalThis);
