function normalizeFileName(name) {
  return typeof name === "string" ? name.toLowerCase() : "";
}

function getVocabTypesFromFileNames(fileNames) {
  const hasGrid = fileNames.some(name => normalizeFileName(name).endsWith(".grid3user"));
  const hasP2G = fileNames.some(name => normalizeFileName(name).endsWith(".p2gbk"));
  const hasSaltillo = fileNames.some(name => {
    const normalized = normalizeFileName(name);
    return normalized.endsWith(".ce") || normalized.endsWith(".wf");
  });

  const ordered = [];
  if (hasGrid) ordered.push("Grid");
  if (hasP2G) ordered.push("P2G");
  if (hasSaltillo) ordered.push("Saltillo");
  return ordered;
}

function buildZipFilename(payload) {
  const firstName = typeof payload?.firstName === "string" ? payload.firstName : "";
  const lastName = typeof payload?.lastName === "string" ? payload.lastName : "";
  const dateStr = typeof payload?.dateStr === "string" && payload.dateStr ? payload.dateStr : "Unknown Date";
  const fileNames = Array.isArray(payload?.fileNames) ? payload.fileNames : [];

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Client";
  const vocabTypes = getVocabTypesFromFileNames(fileNames);
  const typeLabel = vocabTypes.length ? vocabTypes.join(", ") : "Vocab";

  return `${fullName} ${typeLabel} Vocab from Trial ${dateStr}.zip`;
}

function runPrepFlowTask(payload) {
  const action = typeof payload?.action === "string" ? payload.action : "";
  const crmId = typeof payload?.crmId === "string" ? payload.crmId.trim() : "";

  switch (action) {
    case "OPEN_GRID_SIDEKICK":
      return { status: "ok", route: "grid" };
    case "OPEN_TALKPAD_PREP":
      return { status: "ok", route: "prepType" };
    case "OPEN_GRIDPAD_PREP":
      return { status: "ok", route: "gridPadPrep" };
    case "PREP_TYPE_SERVICE_LOAN":
      return { status: "ok", route: "prepSlCrm" };
    case "PREP_TYPE_STANDARD":
      return { status: "ok", route: "prepStandard" };
    case "PREP_TYPE_RETURN_TO_LANDING":
      return { status: "ok", route: "landing" };
    case "PREP_SL_RETURN_TO_TYPE":
      return { status: "ok", route: "prepType" };
    case "PREP_SL_SUBMIT_CRM":
      if (!crmId) {
        return { status: "error", message: "Enter a CRM ID to continue." };
      }
      return { status: "ok", route: "prepServiceLoan", crmId };
    case "PREP_FINISH":
      return { status: "ok", route: "landing", incrementCounter: "preps" };
    case "GRIDPAD_PREP_FINISH":
      return { status: "ok", route: "landing", incrementCounter: "preps" };
    default:
      throw new Error(`Unsupported prep flow task: ${action || "(empty)"}`);
  }
}

function runQaFlowTask(payload) {
  const action = typeof payload?.action === "string" ? payload.action : "";
  const crmId = typeof payload?.crmId === "string" ? payload.crmId.trim() : "";

  switch (action) {
    case "OPEN_QA_FORM":
      return { status: "ok", route: "qaComplete", openQaForm: true };
    case "QA_FINISH":
      return {
        status: "ok",
        route: "landing",
        closeQaForm: true,
        resetQaFields: true,
        incrementCounter: "qas"
      };
    case "QA_RETURN":
      return { status: "ok", route: "landing", closeQaForm: true, resetQaFields: true };
    case "QA_NAVIGATE_CRM":
      if (!crmId) {
        return { status: "error", message: "Enter a CRM ID to continue." };
      }
      return { status: "ok", crmId };
    default:
      throw new Error(`Unsupported QA flow task: ${action || "(empty)"}`);
  }
}

self.onmessage = event => {
  const { type, payload = {}, requestId } = event?.data || {};

  try {
    if (type === "BUILD_ZIP_FILENAME") {
      const zipName = buildZipFilename(payload);
      self.postMessage({ type: "WORKFLOW_DONE", requestId, payload: { zipName } });
      return;
    }
    if (type === "RUN_PREP_FLOW") {
      const result = runPrepFlowTask(payload);
      self.postMessage({ type: "WORKFLOW_DONE", requestId, payload: result });
      return;
    }
    if (type === "RUN_QA_FLOW") {
      const result = runQaFlowTask(payload);
      self.postMessage({ type: "WORKFLOW_DONE", requestId, payload: result });
      return;
    }

    throw new Error(`Unsupported workflow task: ${type || "(empty)"}`);
  } catch (error) {
    self.postMessage({
      type: "WORKFLOW_ERROR",
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
