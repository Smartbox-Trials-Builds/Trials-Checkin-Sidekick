// Read only the saved query!A, B and D values. Never evaluate formulas or run VBA.
((root) => {
  const normalize = value => String(value ?? "").trim().toUpperCase();
  function categoryFor(value) {
    const name = normalize(value).replace(/\s+/g, " ");
    const aliases = {
      "TALK PAD 10": "Talkpad 10", "TALKPAD 10": "Talkpad 10", "WEGO TALKPAD 10": "Talkpad 10",
      "WEGO 10": "Talkpad 10", "WEGO 10S": "Talkpad 10",
      "TALK PAD 8": "Talkpad 8", "TALKPAD 8": "Talkpad 8", "WEGO TALKPAD 8": "Talkpad 8", "WEGO 7": "Talkpad 8",
      "WEGO 13": "Wego 13", "WEGO 13A": "Wego 13", "WEGO 5": "Wego 5", "WEGO 5A": "Wego 5"
    };
    return Object.hasOwn(aliases, name) ? aliases[name] : null;
  }
  const decode = value => String(value || "").replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
    if (entity[0] !== "#") return named[entity.toLowerCase()];
    const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });
  const attrs = text => Object.fromEntries([...text.matchAll(/([\w:.-]+)\s*=\s*(["'])(.*?)\2/gs)].map(match => [match[1], decode(match[3])]));
  const texts = xml => [...xml.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)].map(match => decode(match[1])).join("");
  async function parse(buffer, zipLibrary = root.JSZip) {
    if (!zipLibrary) throw new Error("The workbook reader is unavailable. Reload Sidekick.");
    const zip = await zipLibrary.loadAsync(buffer);
    const read = async name => {
      const file = zip.file(name);
      if (!file) throw new Error(`Audit.xlsm is missing ${name}.`);
      const result = await file.async("string");
      if (result.length > 16000000) throw new Error("The Audit worksheet is too large.");
      if (/<!DOCTYPE|<!ENTITY/i.test(result)) throw new Error("Unsupported workbook XML.");
      return result;
    };
    const book = await read("xl/workbook.xml");
    const sheets = [...book.matchAll(/<(?:\w+:)?sheet\b([^>]*?)\/?\s*>/g)].map(match => attrs(match[1]));
    const query = sheets.filter(sheet => normalize(sheet.name) === "QUERY");
    if (query.length !== 1) throw new Error("Audit.xlsm must contain one worksheet named query.");
    const relationships = [...(await read("xl/_rels/workbook.xml.rels")).matchAll(/<(?:\w+:)?Relationship\b([^>]*?)\/?\s*>/g)].map(match => attrs(match[1]));
    const relation = relationships.find(item => item.Id === query[0]["r:id"]);
    if (!relation || relation.TargetMode === "External") throw new Error("The query worksheet could not be located.");
    const target = relation.Target.startsWith("/") ? relation.Target.slice(1) : `xl/${relation.Target}`;
    if (!/^xl\/worksheets\/[\w.-]+\.xml$/.test(target)) throw new Error("Unsupported query worksheet path.");
    const strings = zip.file("xl/sharedStrings.xml") ? [...(await read("xl/sharedStrings.xml")).matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)].map(match => texts(match[1])) : [];
    const worksheet = await read(target);
    const map = Object.create(null), ambiguous = new Set();
    const categories = Object.create(null), categoryAmbiguous = new Set();
    let rowCount = 0, headers = false;
    for (const row of worksheet.matchAll(/<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g)) {
      const values = {};
      for (const cell of row[1].matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
        const attribute = attrs(cell[1]);
        const column = /^([ABD])\d+$/.exec(attribute.r || "")?.[1];
        if (!column || attribute.t === "e") continue;
        const xml = cell[2] || "";
        const value = /<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/.exec(xml)?.[1];
        values[column] = attribute.t === "s" ? strings[Number(value)] ?? "" : attribute.t === "inlineStr" ? texts(xml) : decode(value);
      }
      if (!headers) {
        if (!["TTMT SERIAL NUMBER", "DEVICE NUMBER", "DEVICE NUMBERS"].includes(normalize(values.A))
          || !["TITLE", "INTERNAL SERIAL NUMBER", "INTERNAL SERIAL NUMBERS"].includes(normalize(values.B))) throw new Error("Expected device numbers in query column A and internal serials in column B.");
        headers = true;
        continue;
      }
      const device = normalize(values.A), serial = String(values.B || "").trim();
      if (!device) continue;
      const category = categoryFor(values.D);
      if (category) {
        if (Object.hasOwn(categories, device) && categories[device] !== category) categoryAmbiguous.add(device);
        else categories[device] = category;
      }
      if (!serial) continue;
      rowCount++;
      if (Object.hasOwn(map, device) && normalize(map[device]) !== normalize(serial)) ambiguous.add(device);
      else map[device] = serial;
    }
    for (const device of ambiguous) { delete map[device]; delete categories[device]; }
    for (const device of categoryAmbiguous) delete categories[device];
    if (!Object.keys(map).length) throw new Error("No device and internal serial pairs were found in query!A:B.");
    return { schemaVersion: 2, map, categories, categoryAmbiguous: [...categoryAmbiguous], ambiguous: [...ambiguous], rowCount, count: Object.keys(map).length };
  }
  const central = timestamp => Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(timestamp)).filter(part => part.type !== "literal").map(part => [part.type, Number(part.value)]));
  function centralInstant(wallTime) {
    let guess = wallTime;
    for (let n = 0; n < 3; n++) {
      const parts = central(guess);
      const actual = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
      guess += wallTime - actual;
    }
    return guess;
  }
  function refreshWindow(now = Date.now()) {
    const parts = central(now);
    const date = Date.UTC(parts.year, parts.month - 1, parts.day);
    const daysSinceWednesday = (new Date(date).getUTCDay() - 3 + 7) % 7;
    let wall = date - daysSinceWednesday * 86400000 + 5 * 3600000;
    if (centralInstant(wall) > now) wall -= 7 * 86400000;
    return { previous: centralInstant(wall), next: centralInstant(wall + 7 * 86400000) };
  }
  const api = { parse, normalize, categoryFor, refreshWindow };
  root.sidekickAuditWorkbook = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
