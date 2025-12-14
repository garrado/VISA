(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    q: $("q"),
    btnClear: $("btnClear"),
    status: $("status"),
    results: $("results"),

    detailPanel: $("detailPanel"),
    btnCloseDetail: $("btnCloseDetail"),

    dTitle: $("dTitle"),
    dSub: $("dSub"),
    dCodigo: $("dCodigo"),
    dDoc: $("dDoc"),
    dEnd: $("dEnd"),
    dBairro: $("dBairro"),

    dAlvNum: $("dAlvNum"),
    dAlvEmi: $("dAlvEmi"),
    dAlvVal: $("dAlvVal"),
    dAlvSta: $("dAlvSta"),

    dAtividades: $("dAtividades"),
    dInspecoes: $("dInspecoes"),

    modal: $("modal"),
    modalBackdrop: $("modalBackdrop"),
    btnModalClose: $("btnModalClose"),
    mTitle: $("mTitle"),
    mSub: $("mSub"),
    mBody: $("mBody"),
  };

  const state = {
    index: [],
    indexLoaded: false,
    currentCodigo: null,
    currentReg: null,
    lastQuery: "",
  };

  // --- helpers ---
  const norm = (s) =>
    (s ?? "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const pad2 = (n) => String(n).padStart(2, "0");
  const pad5 = (n) => String(n).padStart(5, "0");

  // prefixo: 2 primeiros dígitos do código normalizado 5 dígitos
  const regPrefix = (codigo) => pad5(codigo).slice(0, 2);

  // bucket: ndoc % 100, 00..99
  const hisBucket = (ndoc) => pad2((Number(ndoc) || 0) % 100);

  const fmtDate = (iso) => {
    if (!iso || iso === "null") return "—";
    return iso; // já vem YYYY-MM-DD do Delphi; mantém assim para auditoria
  };

  const safe = (v) => (v === null || v === undefined || v === "" ? "—" : String(v));

  const fetchJson = async (path) => {
    // anti-cache leve (iOS às vezes segura JSON)
    const url = `${path}?v=${Date.now()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${path}`);
    return await r.json();
  };

  // --- UI render ---
  const setStatus = (msg) => (els.status.textContent = msg);

  const clearResults = () => (els.results.innerHTML = "");

  const renderResults = (rows) => {
    clearResults();
    if (!rows.length) {
      els.results.innerHTML = `<div class="small">Nenhum resultado.</div>`;
      return;
    }

    const frag = document.createDocumentFragment();
    for (const r of rows) {
      const div = document.createElement("div");
      div.className = "result";
      div.dataset.codigo = r.codigo;

      const title = r.razao || r.fantasia || `Código ${r.codigo}`;
      const sub = [
        r.fantasia ? `Fantasia: ${r.fantasia}` : "",
        r.cnpj ? `CNPJ: ${r.cnpj}` : r.cpf ? `CPF: ${r.cpf}` : "",
        r.logradouro ? `End.: ${r.logradouro}` : "",
        Number.isFinite(r.bairro_codigo) ? `Bairro (cód.): ${r.bairro_codigo}` : "",
      ].filter(Boolean).join(" • ");

      div.innerHTML = `
        <div class="result__top">
          <div>
            <div class="result__title">${escapeHtml(title)}</div>
            <div class="result__sub">${escapeHtml(sub)}</div>
          </div>
          <div class="tag">Cód. ${escapeHtml(String(r.codigo))}</div>
        </div>
      `;

      div.addEventListener("click", () => openRegulado(r.codigo));
      frag.appendChild(div);
    }
    els.results.appendChild(frag);
  };

  const escapeHtml = (s) =>
    (s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[c]));

  const showDetail = (show) => {
    els.detailPanel.hidden = !show;
    if (!show) {
      state.currentCodigo = null;
      state.currentReg = null;
    }
  };

  const renderDetail = (reg) => {
    state.currentReg = reg;
    showDetail(true);

    els.dTitle.textContent = reg.razao || reg.fantasia || `Código ${reg.codigo}`;
    els.dSub.textContent = reg.fantasia ? `Fantasia: ${reg.fantasia}` : "—";

    els.dCodigo.textContent = safe(reg.codigo);

    const doc = reg.cnpj || reg.cpf || "—";
    els.dDoc.textContent = doc;

    const end = [
      reg.endereco?.logradouro ?? "",
      reg.endereco?.complemento ?? "",
      reg.endereco?.cep ? `CEP: ${reg.endereco.cep}` : "",
    ].filter(Boolean).join(" • ");
    els.dEnd.textContent = end || "—";

    const bairro = reg.bairro?.nome
      ? `${reg.bairro.nome} (cód. ${reg.bairro.codigo})`
      : (reg.bairro?.codigo ? `Cód. ${reg.bairro.codigo}` : "—");
    els.dBairro.textContent = bairro;

    // alvará último válido (pode ser null)
    if (!reg.alvara_ultimo) {
      els.dAlvNum.textContent = "—";
      els.dAlvEmi.textContent = "—";
      els.dAlvVal.textContent = "—";
      els.dAlvSta.textContent = "SEM ALVARÁ VÁLIDO";
    } else {
      els.dAlvNum.textContent = safe(reg.alvara_ultimo.numero);
      els.dAlvEmi.textContent = fmtDate(reg.alvara_ultimo.dt_emite);
      els.dAlvVal.textContent = reg.alvara_ultimo.dt_validade ? fmtDate(reg.alvara_ultimo.dt_validade) : "—";
      els.dAlvSta.textContent = safe(reg.alvara_ultimo.status);
    }

    // atividades
    const atvs = Array.isArray(reg.atividades) ? reg.atividades : [];
    if (!atvs.length) {
      els.dAtividades.innerHTML = `<div class="small">Sem atividades cadastradas.</div>`;
    } else {
      els.dAtividades.innerHTML = atvs.map((a) => {
        const titulo = a.atividade ? a.atividade : "Atividade (sem descrição)";
        const sub = [
          a.subclasse ? `Subclasse: ${a.subclasse}` : "",
          a.cae_codigo ? `CAE: ${a.cae_codigo}` : "",
          a.equipe ? `Equipe: ${a.equipe}` : "",
          a.complexidade ? `Complexidade: ${a.complexidade}` : "",
        ].filter(Boolean).join(" • ");
        return `
          <div class="item">
            <div class="item__top">
              <div class="item__title">${escapeHtml(titulo)}</div>
              <div class="tag">${escapeHtml(a.subclasse || "—")}</div>
            </div>
            <div class="item__sub">${escapeHtml(sub || "—")}</div>
          </div>
        `;
      }).join("");
    }

    // inspeções
    const ins = Array.isArray(reg.inspecoes) ? reg.inspecoes : [];
    if (!ins.length) {
      els.dInspecoes.innerHTML = `<div class="small">Nenhuma inspeção encontrada para este regulado.</div>`;
    } else {
      els.dInspecoes.innerHTML = ins.map((v) => {
        const dt = v.dt_visita ? fmtDate(v.dt_visita) : "—";
        const ndoc = v.ndoc;
        return `
          <div class="item" data-ndoc="${escapeHtml(String(ndoc))}">
            <div class="item__top">
              <div class="item__title">Inspeção • NDOC ${escapeHtml(String(ndoc))}</div>
              <div class="tag">${escapeHtml(dt)}</div>
            </div>
            <div class="item__sub">Clique para abrir histórico (memo).</div>
          </div>
        `;
      }).join("");

      // handlers
      els.dInspecoes.querySelectorAll(".item[data-ndoc]").forEach((el) => {
        el.addEventListener("click", () => {
          const ndoc = el.getAttribute("data-ndoc");
          if (ndoc) openHistorico(Number(ndoc));
        });
      });
    }

    // rola para o painel (útil no iOS)
    els.detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // --- data logic ---
  const openRegulado = async (codigo) => {
    try {
      setStatus(`Carregando regulado ${codigo}...`);
      const pfx = regPrefix(codigo);
      const path = `./data/reg/${pfx}/${codigo}.json`;
      const reg = await fetchJson(path);
      state.currentCodigo = codigo;
      renderDetail(reg);
      setStatus(`Pronto. Regulados: índice carregado. (Cód. ${codigo})`);
    } catch (e) {
      console.error(e);
      setStatus(`Falha ao carregar regulado ${codigo}. Verifique o JSON em data/reg/...`);
      alert(`Erro ao carregar regulado ${codigo}.\n\n${e.message}`);
    }
  };

  const openHistorico = async (ndoc) => {
    try {
      els.modal.hidden = false;
      els.mTitle.textContent = `Histórico (NDOC ${ndoc})`;
      els.mSub.textContent = "Carregando...";
      els.mBody.textContent = "Carregando...";

      const bucket = hisBucket(ndoc);
      const path = `./data/his/${bucket}/${ndoc}.json`;
      const h = await fetchJson(path);

      els.mSub.textContent = `Arquivo: his/${bucket}/${ndoc}.json`;
      els.mBody.textContent = (h && typeof h.decr === "string" && h.decr.trim() !== "")
        ? h.decr
        : "(Sem conteúdo no histórico / DECR vazio)";
} catch (e) {
  console.warn("Histórico não disponível:", e);

  els.mSub.textContent = "Histórico indisponível";
  els.mBody.textContent =
    "O conteúdo detalhado desta inspeção não está disponível nesta versão pública do sistema.\n\n" +
    "Essas informações são de uso institucional e podem ser liberadas futuramente, conforme autorização.";
}

  };

  const closeModal = () => {
    els.modal.hidden = true;
    els.mBody.textContent = "";
  };

  const search = (q) => {
    const nq = norm(q);
    state.lastQuery = nq;

    if (!state.indexLoaded) return;

    if (nq.length < 3) {
      clearResults();
      setStatus("Digite ao menos 3 caracteres para pesquisar.");
      return;
    }

    // busca simples (volume 20k: ok). Limita para não travar render.
    const out = [];
    for (const r of state.index) {
      if (r._blob.includes(nq)) out.push(r);
      if (out.length >= 80) break;
    }
    setStatus(`${out.length} resultado(s) (limitado a 80).`);
    renderResults(out);
  };

  const loadIndex = async () => {
    try {
      setStatus("Carregando índice...");
      const data = await fetchJson("./data/index_regulados.json");

      const rows = Array.isArray(data?.dados) ? data.dados : [];
      // pré-computa blob normalizado para busca rápida
      state.index = rows.map((r) => {
        const blob = [
          r.codigo,
          r.razao,
          r.fantasia,
          r.cnpj,
          r.cpf,
          r.logradouro,
          r.bairro_codigo,
        ].filter(Boolean).join(" ");
        return {
          ...r,
          _blob: norm(blob),
        };
      });

      state.indexLoaded = true;
      setStatus(`Índice carregado. Regulados ativos: ${state.index.length}.`);
    } catch (e) {
      console.error(e);
      setStatus("Falha ao carregar índice. Verifique ./data/index_regulados.json");
      alert(`Erro ao carregar índice de regulados.\n\n${e.message}`);
    }
  };

  // --- events ---
  let t = null;
  els.q.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => search(els.q.value), 180);
  });

  els.btnClear.addEventListener("click", () => {
    els.q.value = "";
    clearResults();
    setStatus(state.indexLoaded ? `Índice carregado. Regulados ativos: ${state.index.length}.` : "—");
    showDetail(false);
    els.q.focus();
  });

  els.btnCloseDetail.addEventListener("click", () => showDetail(false));
  els.btnModalClose.addEventListener("click", closeModal);
  els.modalBackdrop.addEventListener("click", closeModal);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.modal.hidden) closeModal();
  });

  // init
  loadIndex();
})();

