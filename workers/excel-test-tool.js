(() => {
  const HEADERS = ['Last Name','First Name','Device','Loan Type','Queue Date','Vocabulary','Accessories/Keyguard/Notes','R','DC'];
  const MANUAL_HEADERS = ['Device number','Camera number','GIPOD code'];
  let notesVisible = false;
  const paste = document.getElementById('excelTestPaste');
  const grid = document.getElementById('excelTestGrid');
  const status = document.getElementById('excelTestStatus');
  const KEY = 'sidekickExcelTestDraft';
  const origin = crypto.randomUUID();
  let rows = [];
  let working = false;
  const api = globalThis.sidekickSupabase;
  const client = api.getClient();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function safeLink(value) {
    value = String(value || '').trim();
    if (!value) return '';
    try { return /^(https?:|mailto:|tel:)$/i.test(new URL(value).protocol) ? value : ''; } catch { return ''; }
  }
  function safeStyle(style) {
    return String(style || '').split(';').map(part => {
      const colon = part.indexOf(':');
      const key = part.slice(0, colon).trim().toLowerCase();
      const value = part.slice(colon + 1).trim();
      const allowed = /^(color|background-color|font-(family|size|weight|style)|text-(align|decoration)|vertical-align|white-space|border(-[a-z-]+)?|padding(-[a-z]+)?|width|height|mso-number-format)$/;
      return colon > 0 && allowed.test(key) && !/url\s*\(|expression\s*\(|[<>]/i.test(value) ? `${key}:${value}` : '';
    }).filter(Boolean).join(';');
  }
  function tsv(text) {
    const result = [[]]; let value = '', quoted = false;
    text = text.replace(/\r\n?/g, '\n');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"' && (!value || quoted)) {
        if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted;
      } else if (!quoted && (c === '\t' || c === '\n')) {
        result.at(-1).push(value); value = '';
        if (c === '\n') result.push([]);
      } else value += c;
    }
    result.at(-1).push(value);
    if (result.length > 1 && result.at(-1).length === 1 && !result.at(-1)[0]) result.pop();
    return result;
  }
  function cleanMarkup(source) {
    if (source.nodeType === 3) return escape(source.textContent);
    if (source.nodeType !== 1) return '';
    const tag = source.tagName.toLowerCase();
    if (['script','style','iframe','object','img','svg'].includes(tag)) return '';
    const children = [...source.childNodes].map(cleanMarkup).join('');
    if (tag === 'br') return '<br>';
    if (tag === 'a') {
      const href = safeLink(source.getAttribute('href'));
      const style = safeStyle(source.dataset?.excelStyle || source.getAttribute("style"));
      return href ? `<a href="${escape(href)}"${style ? ` style="${escape(style)}"` : ""}>${children}</a>` : children;
    }
    if (!['b','strong','i','em','u','s','span','div','p'].includes(tag)) return children;
    const style = safeStyle(source.dataset?.excelStyle || source.getAttribute('style'));
    return `<${tag}${style ? ` style="${escape(style)}"` : ''}>${children}</${tag}>`;
  }
  function textOf(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return doc.body.textContent || '';
  }
  function parse(html, plain) {
    const doc = html ? new DOMParser().parseFromString(html, 'text/html') : null;
    const table = doc?.querySelector('table');
    const classes = new Map();
    for (const element of doc?.querySelectorAll('style') || []) {
      for (const rule of element.textContent.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        for (const selector of rule[1].split(',')) {
          const match = selector.trim().match(/^\.([\w-]+)$/);
          if (match) classes.set(match[1], rule[2]);
          else if (selector.trim() === 'td') classes.set('td',rule[2]);
        }
      }
    }
    if (doc) {
      for (const source of doc.querySelectorAll('td,th,span,div,p,a,b,strong,i,em,u,s')) {
        const inherited = source.closest('table')?.getAttribute('style') || '';
        const base = classes.get('td') || '';
        source.dataset.excelStyle = safeStyle(inherited + ';' + base + ';' + [...source.classList].map(cls => classes.get(cls) || '').join(';') + ';' + (source.getAttribute('style') || '') + (source.getAttribute('align') ? ';text-align:' + source.getAttribute('align') : ''));
      }
    }
    const result = table ? [...table.rows].map(row => [...row.cells].map(source => {
      if (source.colSpan > 1 || source.rowSpan > 1) throw new Error('Paste unmerged cells H–I.');
      return {
        html: [...source.childNodes].map(cleanMarkup).join(''),
        style: source.dataset.excelStyle || ''
      };
    })) : tsv(plain).map(row => row.map(text => ({ html: escape(text).replace(/\n/g,'<br>'), style: '' })));
    const normalized = value => value.replace(/\s/g,'').toLowerCase();
    if (result[0]?.length === 2 && result[0].every((cell,i) => normalized(textOf(cell.html)) === normalized(HEADERS[i + 7]))) result.shift();
    for (const row of result) {
      if (row.length > 2) throw new Error('Paste only columns H–I (two columns).');
      while (row.length < 2) row.push({html:'',style:''});
      row.unshift(...Array.from({length:7},() => ({html:'',style:''}))); 
    }
    return result;
  }
  function updateStatus() {
    const links = rows.flat().reduce((count, cell) => count + (cell.html.match(/<a\s/g) || []).length, 0);
    status.textContent = `${rows.length} rows · ${links} hyperlinks`;
    document.getElementById('excelTestCopy').disabled = !rows.length;
    updateBulkControls();
  }
  function updateBulkControls() {
    document.getElementById('excelTestClaim').disabled = working || !rows.some(row => !textOf(row[8].html).trim() && !row[8].claim);
    const hasPending = rows.some(row => row[8]?.claim && !row[8].sent);
    document.getElementById('excelTestSend').disabled = working || !hasPending;
    document.getElementById('excelTestRelease').disabled = working || !hasPending;
    document.getElementById('excelTestClear').disabled = working;
    document.getElementById('excelTestPriority').disabled = working;
    document.getElementById('excelTestPasteMode').disabled = working;
    document.getElementById('excelTestMarkX').disabled = working || !rows.length;
    paste.disabled = working;
    grid.querySelectorAll('.excel-test-cell').forEach(editor => {
      editor.contentEditable = !working && editor.dataset.locked !== 'true' ? 'true' : 'false';
    });
  }
  async function save() {
    await chrome.storage.session.set({ [KEY]: { rows, origin } });
  }
  function render() {
    rows.forEach(row => { while (row.length < 12) row.push({html:'',style:''}); });
    grid.replaceChildren();
    const table = document.createElement('table'); table.className = 'excel-test-table';
    const head = document.createElement('thead'); const header = document.createElement('tr');
    [...HEADERS,...MANUAL_HEADERS,...(notesVisible ? ['Prep note'] : [])].forEach((title, i) => { if (i < 7) return; const th = document.createElement('th'); th.textContent = title; th.scope = 'col'; th.dataset.column = i; header.append(th); });
    head.append(header); table.append(head);
    const body = document.createElement('tbody');
    rows.forEach((row, r) => {
      const tr = document.createElement('tr');
      row.forEach((cell, c) => {
        if (c < 7) return;
        const td = document.createElement('td'); td.dataset.column = c;
        const editor = document.createElement('div');
        editor.className = 'excel-test-cell'; editor.contentEditable = 'true';
        if (c === 8 && cell.claim) {
          editor.contentEditable = 'false'; editor.dataset.locked = 'true';
          editor.title = cell.sent ? 'Prep notification sent' : `Reserved until ${new Date(cell.claim.reserved_until).toLocaleTimeString()}. Release reservations to change initials.`;
          td.className = cell.sent ? 'excel-dc-sent' : 'excel-dc-reserved';
        }
        editor.setAttribute('role','textbox'); editor.setAttribute('aria-label',`Row ${r + 1}, ${HEADERS[c] || MANUAL_HEADERS[c - 9]}`);
        editor.innerHTML = cell.html;
        editor.addEventListener('click', event => { if (event.target.closest('a')) event.preventDefault(); });
        editor.addEventListener('input', () => {
          cell.html = [...editor.childNodes].map(cleanMarkup).join('');
          if (c >= 9 && notesVisible) { const noteCell = tr.lastElementChild; noteCell.querySelector('pre').textContent = row.slice(9,12).map(cell => textOf(cell.html).trim()).filter(Boolean).join('\n'); noteCell.querySelector('button').disabled = !noteCell.querySelector('pre').textContent; }
          updateStatus(); void save();
        });
        editor.addEventListener('paste', event => {
          event.preventDefault();
          document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
        });
        const links = new DOMParser().parseFromString(cell.html,'text/html').querySelectorAll('a[href]');
        td.append(editor);
        if (links.length) {
          const details = document.createElement('details');
          const summary = document.createElement('summary'); summary.textContent = `${links.length} link${links.length > 1 ? 's' : ''}`;
          details.append(summary);
          links.forEach((link, index) => {
            const input = document.createElement('input'); input.type = 'url'; input.value = link.getAttribute('href');
            input.setAttribute('aria-label',`Row ${r + 1}, ${HEADERS[c]}, hyperlink ${index + 1}`);
            input.addEventListener('change', () => {
              const href = safeLink(input.value);
              if (!href) { status.textContent = 'Enter a full http://, https://, mailto: or tel: link.'; return; }
              const current = new DOMParser().parseFromString(editor.innerHTML,'text/html');
              const anchor = current.querySelectorAll('a[href]')[index];
              if (!anchor) return;
              anchor.setAttribute('href',href); cell.html = [...current.body.childNodes].map(cleanMarkup).join(''); editor.innerHTML = cell.html;
              void save();
            });
            details.append(input);
          });
          td.append(details);
        }
        tr.append(td);
      });
      if (notesVisible) {
        const td = document.createElement('td');
        const note = row.slice(9,12).map(cell => textOf(cell.html).trim()).filter(Boolean).join('\n');
        const preview = document.createElement('pre'); preview.className = 'excel-prep-note'; preview.textContent = note;
        const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'toggle-btn queue-small-btn'; copy.textContent = 'Copy note'; copy.disabled = !note;
        copy.addEventListener('click',async () => { try { await navigator.clipboard.writeText(row.slice(9,12).map(cell => textOf(cell.html).trim()).filter(Boolean).join('\n')); status.textContent = 'Copied note for row ' + (r + 1); } catch(error) { status.textContent = error.message; } });
        td.append(preview,copy); tr.append(td);
      }
      body.append(tr);
    });
    table.append(body); grid.append(table); updateStatus();
  }
  paste.addEventListener('paste', async event => {
    event.preventDefault();
    if (working) return;
    try {
      const html = event.clipboardData.getData('text/html');
      const plain = event.clipboardData.getData('text/plain');
      if (!html && !plain) throw new Error('Copy Excel cells H–I first.');
      const imported = parse(html,plain);
      if (document.getElementById('excelTestPasteMode').value !== 'append' && rows.some(row => row[8]?.claim && !row[8].sent)) throw new Error('Release your queue reservations before replacing the table.');
      const next = document.getElementById('excelTestPasteMode').value === 'append' ? [...rows,...imported] : imported;
      if (next.length > 500) throw new Error('Use up to 500 rows at a time.');
      rows = next; render(); await save(); paste.value = '';
      if (!html) status.textContent += ' · Text-only paste; no hyperlinks or formatting were supplied.';
    } catch (error) { status.textContent = error.message; }
  });
  function centeredMarkup(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.body.querySelectorAll('[style], [align]').forEach(element => {
      element.style.textAlign = 'center';
      if (element.hasAttribute('align')) element.setAttribute('align','center');
    });
    return doc.body.innerHTML;
  }
  function exportCells() {
    const html = '<html><head><meta charset="utf-8"></head><body><table>' + rows.map(row => '<tr>' + row.slice(7,9).map(cell => `<td align="center" style="${escape(cell.style)};text-align:center">${centeredMarkup(cell.html)}</td>`).join('') + '</tr>').join('') + '</table></body></html>';
    const quote = value => /[\t\n"]/.test(value) ? '"' + value.replace(/"/g,'""') + '"' : value;
    const plain = rows.map(row => row.slice(7,9).map(cell => quote(textOf(cell.html))).join('\t')).join('\r\n');
    return { html, plain };
  }
  document.getElementById('excelTestCopy').addEventListener('click', async () => {
    try {
      const { html,plain } = exportCells();
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html],{type:'text/html'}), 'text/plain': new Blob([plain],{type:'text/plain'}) })]);
      status.textContent = `Copied ${rows.length} rows with hyperlinks and formatting. Paste into column H in Excel.`;
    } catch (error) { status.textContent = `Copy failed: ${error.message}`; }
  });
  document.getElementById('excelTestMarkX').addEventListener('click',async () => {
    if (working) return;
    rows.forEach(row => { row[7].html = 'X'; }); render(); await save();
  });
  document.getElementById('excelTestNotes').addEventListener('click',() => { notesVisible = !notesVisible; document.getElementById('excelTestNotes').textContent = notesVisible ? 'Hide notes' : 'Enter notes'; render(); });
  document.getElementById('excelTestClear').addEventListener('click', async () => {
    if (working) return;
    working = true; updateBulkControls();
    try { await releaseClaims(); rows = []; render(); await save(); }
    catch (error) { status.textContent = error.message; }
    finally { working = false; updateBulkControls(); }
  });
  document.getElementById('excelTestPopOut')?.addEventListener('click', async () => {
    try {
      await save(); const result = await chrome.runtime.sendMessage({ type:'sidekick-open-excel-test' });
      if (!result?.ok) throw new Error(result?.error || 'Could not open the window.');
    } catch (error) { status.textContent = error.message; }
  });
  chrome.storage.onChanged.addListener((changes,area) => {
    const draft = changes[KEY]?.newValue;
    if (area === 'session' && draft && draft.origin !== origin) { rows = draft.rows || []; render(); }
  });
  void chrome.storage.session.get(KEY).then(stored => { rows = stored[KEY]?.rows || []; render(); });

  function assignmentFromRow(row, index) {
    const first = textOf(row[1].html).trim(), last = textOf(row[0].html).trim();
    const name = [first,last].filter(Boolean).join(' ');
    if (!name || name.length > 200) throw new Error(`Row ${index + 1}: enter the client's name in columns A/B.`);
    const rawDevice = textOf(row[2].html).trim().toLowerCase().replace(/\s+/g,'');
    const device = rawDevice.startsWith('talkpad') ? 'Talkpad' : rawDevice.startsWith('gridpad') ? 'Gridpad' : rawDevice.startsWith('zuvo') ? 'Zuvo' : rawDevice.startsWith('wego') ? 'Wego' : '';
    if (!device) throw new Error(`Row ${index + 1}: Device must be Talkpad, Zuvo, Gridpad or Wego.`);
    const ids = new Set();
    for (const cell of row) {
      const doc = new DOMParser().parseFromString(cell.html,'text/html');
      for (const anchor of doc.querySelectorAll('a[href]')) {
        try {
          const url = new URL(anchor.getAttribute('href'));
          let id = [...url.searchParams].find(([key]) => /^(id|crmid)$/i.test(key))?.[1];
          if (!id) id = url.pathname.match(/\/crmid\/?([^/]+)$/i)?.[1];
          if (id?.trim()) ids.add(decodeURIComponent(id).trim());
        } catch {}
      }
    }
    if (ids.size !== 1 || [...ids][0].length > 100) throw new Error(`Row ${index + 1}: include one unambiguous CRM ID hyperlink (for example ?ID=12345).`);
    const loan = textOf(row[3].html).trim().toLowerCase();
    const chosen = document.getElementById('excelTestPriority').value;
    const priority = chosen !== 'auto' ? chosen : loan.includes('expedite') ? 'Expedite' : loan.includes('funded') && loan.includes('rental') ? 'Funded rental' : loan.includes('ship') && loan.includes('request') ? 'Ship request' : 'Daily queue';
    return { name,device_type:device,priority,crm_id:[...ids][0] };
  }
  async function rpc(name,args) {
    const result = await client.rpc(name,args);
    if (result.error) throw new Error(result.error.message || 'Queue operation failed.');
    return result.data;
  }
  async function releaseClaims() {
    const pending = rows.filter(row => row[8]?.claim && !row[8].sent);
    if (!pending.length) return;
    await rpc('sidekick_release_queue',{ p_claims:pending.map(row => row[8].claim.claim_id) });
    pending.forEach(row => { row[8].html = ''; delete row[8].claim; });
    await save(); render();
  }
  document.getElementById('excelTestClaim').addEventListener('click', async () => {
    if (working) return;
    working = true; updateBulkControls();
    try {
      const eligible = rows.map((row,index) => ({row,index})).filter(({row}) => !textOf(row[8].html).trim() && !row[8].claim).slice(0,100);
      if (!eligible.length) throw new Error('There are no empty DC cells.');

      const claimed = await rpc('sidekick_claim_queue',{p_count:eligible.length});
      claimed.forEach((claim,i) => { const dc = eligible[i].row[8]; dc.html = escape(claim.dashboard_initials); dc.claim = claim; });
      await save(); render();
      status.textContent = `Added ${claimed.length} users' initials to column I. Reserved for 15 minutes.${claimed.length < eligible.length ? ' Remaining rows have no available queue users.' : ''}`;
    } catch (error) { status.textContent = error.message; }
    finally { working = false; updateBulkControls(); }
  });
  document.getElementById('excelTestRelease').addEventListener('click', async () => {
    if (working) return;
    working = true; updateBulkControls();
    try { await releaseClaims(); status.textContent = 'Released unsent queue reservations and cleared their DC cells.'; }
    catch (error) { status.textContent = error.message; }
    finally { working = false; updateBulkControls(); }
  });
  function editNotifications(pending) {
    return new Promise(resolve => {
      const dialog = document.createElement('dialog'); dialog.className = 'excel-notification-editor';
      const form = document.createElement('form');
      const title = document.createElement('h2'); title.textContent = 'Review prep notifications'; form.append(title);
      const hint = document.createElement('p'); hint.textContent = 'Edit each recipient’s details before sending. Client names are delivered live only.'; form.append(hint);
      const fields = pending.map(({row,index}) => {
        let initial = {}; try { initial = assignmentFromRow(row,index); } catch {}
        initial.priority ||= document.getElementById('excelTestPriority').value === 'auto' ? 'Daily queue' : document.getElementById('excelTestPriority').value;
        initial = {...initial,...row[8].notificationDraft};
        initial.device_type = detectQueueDeviceType(textOf(row[9]?.html || '')) || initial.device_type || '';
        const section = document.createElement('fieldset'); const legend = document.createElement('legend'); legend.textContent = 'Row ' + (index + 1) + ' · ' + textOf(row[8].html); section.append(legend);
        const inputs = {};
        for (const [key,label,options,max] of [['name','Client name',null,200],['crm_id','CRM ID',null,100],['device_type','Device',['Talkpad','Zuvo','Gridpad','Wego']],['priority','Priority',['Expedite','Funded rental','Ship request','Daily queue']]]) {
          const wrapper = document.createElement('label'); wrapper.textContent = label;
          const input = document.createElement(options ? 'select' : 'input'); input.required = true;
          if (key === 'device_type') { const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Select device'; input.append(placeholder); }
          if (options) options.forEach(value => { const option = document.createElement('option'); option.value = value; option.textContent = value; input.append(option); });
          else { input.type = 'text'; input.maxLength = max; }
          input.value = initial[key] || (key === 'priority' ? 'Daily queue' : (key === 'device_type' ? '' : options?.[0]) || '');
          wrapper.append(input); section.append(wrapper); inputs[key] = input;
        }
        form.append(section); return {row,inputs};
      });
      const actions = document.createElement('div'); actions.className = 'excel-test-toolbar';
      const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel';
      const send = document.createElement('button'); send.type = 'submit'; send.textContent = 'Send ' + pending.length + ' notifications'; actions.append(cancel,send); form.append(actions);
      const finish = result => { dialog.close(); dialog.remove(); resolve(result); };
      cancel.addEventListener('click',() => finish(null)); dialog.addEventListener('cancel',event => { event.preventDefault(); finish(null); });
      form.addEventListener('submit',event => {
        event.preventDefault();
        const jobs = fields.map(({row,inputs}) => ({row,...Object.fromEntries(Object.entries(inputs).map(([key,input]) => [key,input.value.trim()]))}));
        for (const {inputs} of fields) { for (const input of Object.values(inputs)) { input.setCustomValidity(input.value.trim() ? '' : 'Enter a value.'); } }
        if (!form.reportValidity()) return;
        jobs.forEach(job => { job.row[8].notificationDraft = {name:job.name,crm_id:job.crm_id,device_type:job.device_type,priority:job.priority}; });
        void save(); finish(jobs);
      });
      form.addEventListener('input',event => event.target.setCustomValidity?.(''));
      dialog.append(form); document.body.append(dialog); dialog.showModal();
    });
  }
  document.getElementById('excelTestSend').addEventListener('click', async () => {
    if (working) return;
    working = true; updateBulkControls();
    try {
      const pending = rows.map((row,index) => ({row,index})).filter(({row}) => row[8]?.claim && !row[8].sent);
      if (!pending.length) throw new Error('Bulk add queue initials first.');
      const jobs = await editNotifications(pending);
      if (!jobs) return;
      status.textContent = `Sending ${jobs.length} prep notifications…`;
      // Deliberately exclude client names from every database request.
      const receipts = await rpc('sidekick_bulk_assign',{ p_items:jobs.map(job => ({claim_id:job.row[8].claim.claim_id,device_type:job.device_type,priority:job.priority,crm_id:job.crm_id})) });
      const session = await client.auth.getSession();
      let nameFailures = 0;
      for (const receipt of receipts) {
        const job = jobs.find(job => job.row[8].claim.claim_id === receipt.claim_id);
        job.row[8].sent = true;
        try { await api.sendLiveClientName({ recipientId:receipt.user_id,notificationId:receipt.notification_id,name:job.name,senderId:session.data.session.user.id }); }
        catch { nameFailures++; }
      }
      await save(); render();
      status.textContent = `Sent ${receipts.length} prep notifications. Users were removed from the queue.${nameFailures ? ` ${nameFailures} live client names could not be delivered; CRM, device and priority still sent.` : ''}`;
    } catch (error) { status.textContent = error.message; }
    finally { working = false; updateBulkControls(); }
  });
})();
