(() => {
  const base = "https://portal.talktometechnologies.com/admin/EditClient.aspx?ID=";
  function build(crmId, linkBase = base) {
    const id = String(crmId ?? "").trim();
    return id ? `${linkBase}${encodeURIComponent(id)}` : "";
  }
  globalThis.sidekickCrmLinks = Object.freeze({ build });
})();
