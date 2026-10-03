importScripts("../libs/jszip.min.js");

self.onmessage = async event => {
  const data = event?.data || {};
  if (data.type !== "ZIP_FILES") return;

  try {
    if (typeof JSZip === "undefined") {
      throw new Error("JSZip is unavailable in zip worker.");
    }

    const files = Array.isArray(data.files) ? data.files : [];
    const zip = new JSZip();
    files.forEach(file => {
      if (!file?.name || !file?.data) return;
      zip.file(file.name, file.data);
    });

    const zipArrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
    self.postMessage({ type: "ZIP_DONE", zipArrayBuffer }, [zipArrayBuffer]);
  } catch (error) {
    self.postMessage({
      type: "ZIP_ERROR",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
