const DEVICE_LOOKUP_SPECIAL_SERIALS = new Set([
  "DTP10.009",
  "DTP10.010",
  "DTP10.011",
  "TP10.012",
  "DTP10.012",
  "TP10.013",
  "DTP10.013",
  "TP10.014",
  "DTP10.014",
  "TP10.015",
  "DTP10.015",
  "DTP10.016"
]);
function extractValidSerial(scanInput) {
  if (!scanInput) return null;
  let cleaned = scanInput.replace(/\(01\)\d+/g, "");
  cleaned = cleaned.replace(/\(21\)/g, "").trim().toUpperCase();

  if (DEVICE_LOOKUP_SPECIAL_SERIALS.has(cleaned)) return cleaned;

  const fourDigitDotPrefixes = ["DTP10", "DTP8"];
  const sixDigitDotPrefixes = ["DW13", "DW5", "DWM", "DW"];
  const noDotPrefixes6or7 = ["DGPG", "DTT", "DTZ"];
  const noDotPrefixes4 = ["Z10D", "Z12D", "Z16D"];

  for (const prefix of fourDigitDotPrefixes) {
    if (cleaned.startsWith(prefix)) {
      const digits = cleaned.slice(prefix.length).replace(/\D/g, "");
      if (/^\d{4}$/.test(digits)) return `${prefix}.${digits}`;
    }
  }

  for (const prefix of sixDigitDotPrefixes) {
    if (cleaned.startsWith(prefix)) {
      const digits = cleaned.slice(prefix.length).replace(/\D/g, "");
      if (/^\d{6}$/.test(digits)) return `${prefix}.${digits}`;
    }
  }

  for (const prefix of noDotPrefixes6or7) {
    if (cleaned.startsWith(prefix)) {
      const digits = cleaned.slice(prefix.length);
      if (/^\d{6,7}$/.test(digits)) return `${prefix}${digits}`;
    }
  }

  const last7 = cleaned.match(/(\d{7})$/);
  if (last7) {
    const suffix = last7[1];
    if (cleaned.includes("5060446901465")) return `DTZ${suffix}`;
    if (cleaned.includes("5060446901373")) return `DTT${suffix}`;
  }

  for (const prefix of noDotPrefixes4) {
    if (cleaned.startsWith(prefix)) {
      const digits = cleaned.slice(prefix.length);
      if (/^\d{4}$/.test(digits)) return `${prefix}${digits}`;
    }
  }

  return null;
}

function detectDeviceModel(deviceNumberRaw) {
  const s = (deviceNumberRaw || "").trim().toUpperCase();
  if (s === "X") return "Mount Only";

  const rules = [
    { prefix: "DTP10", model: "Talk Pad 10" },
    { prefix: "DTP8", model: "Talk Pad 8" },
    { prefix: "Z16", model: "Zuvo 16" },
    { prefix: "Z12", model: "Zuvo 12" },
    { prefix: "Z10", model: "Zuvo 10" },
    { prefix: "DW5", model: "Wego 5A" },
    { prefix: "DWM", model: "Wego 7A" },
    { prefix: "DW13", model: "Wego 13A" },
    { prefix: "DW", model: "Wego 10A" },
    { prefix: "DGPG", model: "Grid Pad Go" },
    { prefix: "DTT", model: "Grid Pad 13" },
    { prefix: "DTZ", model: "Grid Pad 16" }
  ];

  for (const r of rules) {
    if (s.startsWith(r.prefix)) return r.model;
  }
  return "Device";
}

function detectQueueDeviceType(serial) {
  const model = detectDeviceModel(extractValidSerial(serial) || serial);
  if (model.startsWith('Talk Pad')) return 'Talkpad';
  if (model.startsWith('Grid Pad')) return 'Gridpad';
  if (model.startsWith('Zuvo')) return 'Zuvo';
  if (model.startsWith('Wego')) return 'Wego';
  return '';
}
