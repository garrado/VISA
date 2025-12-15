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

    btnAtividades: $("btnAtividades"),
    btnInspecoes: $("btnInspecoes"),

    modal: $("modal"),
    modalBackdrop: $("modalBackdrop"),
    btnModalClose: $("btnModalClose"),
    mTitle: $("mTitle"),
    mSub: $("mSub"),
    mBody: $("mBody"),
  };

  const state = {
    indexLoaded: false,
    index: [],
    currentReg: null,
  };

  const setStatus = (msg) => {
    if (els.status) els.status.textContent = msg || "";
  };

  const safe = (v) => (v === null || v === undefined ? "" : String(v));

  const norm = (s) =>
    safe(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const debounce = (fn, ms = 150) => {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const fetchJson = async (path) => {
    // anti-cache leve (Safari/iOS costuma segurar)
    const url = `${path}?v=${Date.now()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${path}`);
    return await r.json();
  };

  const code5 = (codigo) => String(codigo).padStart(5, "0");
  const regPrefix = (codigo) => code5(codigo).slice(0, 2);
  const hisBucket = (ndoc) => String(Number(ndoc) % 100).padStart(2, "0");

  const normalizeIndexToObjects = (data) => {
    // Formato atual: { meta:{...}, dados:[ {codigo, razao, fantasia, documento}, ... ] }
    if (Array.isArray(data?.dados)) {
      return data.dados.map((r) => {
        const codigo = r.codigo;
        const razao = r.razao || "";
        const fantasia = r.fantasia || "";
        const documento = r.documento || "";
        const blob = [codigo, razao, fantasia, documento].filter(Boolean).join(" ");
        return { codigo, razao, fantasia, documento, _blob: norm(blob) };
      });
    }

    // Compat: array puro [ [codigo, razao, fantasia, documento], ... ]
    if (Array.isArray(data)) {
      return data.map((r) => {
        const codigo = r?.[0];
        const razao = r?.[1] || "";
        const fantasia = r?.[2] || "";
        const documento = r?.[3] || "";
        const blob = [codigo, razao, fantasia, documento].filter(Boolean).join(" ");
        return { codigo, razao, fantasia, documento, _blob: norm(blob) };
      });
    }

    return [];
  };

  const loadIndex = async () => {
    try {
      setStatus("Carregando índice...");
      const data = await fetchJson("./data/index_regulados.json");
      state.index = normalizeIndexToObjects(data);
      state.indexLoaded = true;
      setStatus(`Índice carregado. Regulados ativos: ${state.index.length}.`);
    } catch (e) {
      console.error(e);
      state.indexLoaded = false;
      state.index = [];
      setStatus("Falha ao carregar índice. Verifique caminho/formato do JSON.");
      alert(`Falha ao carregar índice.\n\n${e.message}`);
    }
  };

  const showDetail = (show) => {
    if (!els.detailPanel) return;
    els.detailPanel.hidden = !show;
  };

  const openModal = () => {
    if (els.modalBackdrop) els.modalBackdrop.hidden = false;
    if (els.modal) els.modal.hidden = false;
  };

  const closeModal = () => {
    if (els.modalBackdrop) els.modalBackdrop.hidden = true;
    if (els.modal) els.modal.hidden = true;
    if (els.mBody) {
      els.mBody.textContent = "";
      // caso tenha virado HTML antes:
      els.mBody.innerHTML = "";
    }
  };

  const clearResults = () => {
    if (els.results) els.results.innerHTML = "";
    showDetail(false);
    state.currentReg = null;
  };

  const renderResults = (arr) => {
    if (!els.results) return;

    els.results.innerHTML = "";

    if (!arr || arr.length === 0) {
      els.results.innerHTML = `<div class="empty">Nenhum resultado.</div>`;
      return;
    }

    const frag = document.createDocumentFragment();

    arr.slice(0, 200).forEach((r) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "resultItem";
      const titulo = r.fantasia ? `${r.fantasia}` : (r.razao || `Código ${r.codigo}`);
      const sub = [r.razao, r.documento].filter(Boolean).join(" • ");

      btn.innerHTML = `
        <div class="riTitle">${safe(titulo)}</div>
        <div class="riSub">${safe(sub)}</div>
      `;

      btn.addEventListener("click", () => openRegulado(r.codigo));
      frag.appendChild(btn);
    });

    els.results.appendChild(frag);
  };

  const renderDetail = (reg) => {
    state.currentReg = reg;
    showDetail(true);

    const titulo = reg.razao || reg.fantasia || `Código ${reg.codigo}`;
    els.dTitle.textContent = titulo;
    els.dSub.textContent = reg.fantasia ? `Fantasia: ${reg.fantasia}` : "—";

    els.dCodigo.textContent = safe(reg.codigo);

    const doc = reg.documento || reg.cnpj || reg.cpf || "—";
    els.dDoc.textContent = doc;

    const endParts = [
      reg.endereco?.logradouro ?? "",
      reg.endereco?.complemento ?? "",
      reg.endereco?.fone ? `Fone: ${reg.endereco.fone}` : "",
      reg.endereco?.celular ? `Celular: ${reg.endereco.celular}` : "",
    ].filter(Boolean);
    els.dEnd.textContent = endParts.length ? endParts.join(" • ") : "—";

    els.dBairro.textContent = reg.bairro?.nome ? reg.bairro.nome : "—";

    // Alvará (no JSON atual: { dt_validade, exercicio })
    if (!reg.alvara_ultimo) {
      els.dAlvNum.textContent = "—";
      els.dAlvEmi.textContent = "—";
      els.dAlvVal.textContent = "—";
    } else {
      els.dAlvNum.textContent = reg.alvara_ultimo.exercicio ? String(reg.alvara_ultimo.exercicio) : "—";
      els.dAlvEmi.textContent = "—"; // não existe no JSON atual
      els.dAlvVal.textContent = reg.alvara_ultimo.dt_validade || "—";
    }

    if (els.btnAtividades) els.btnAtividades.onclick = () => openAtividades(reg);
    if (els.btnInspecoes) els.btnInspecoes.onclick = () => openInspecoes(reg);
  };

  const openRegulado = async (codigo) => {
    try {
      setStatus(`Carregando regulado ${codigo}...`);

      const pfx = regPrefix(codigo);
      const c5 = code5(codigo);

      const path = `./data/reg/${pfx}/${c5}.json`;
      const reg = await fetchJson(path);

      // Injeta documento do índice caso não esteja no reg.json
      if (!reg.documento) {
        const idx = state.index.find((x) => x.codigo === codigo);
        if (idx?.documento) reg.documento = idx.documento;
      }

      setStatus(`Regulado ${codigo} carregado.`);
      renderDetail(reg);
    } catch (e) {
      console.error(e);
      setStatus(`Falha ao carregar regulado ${codigo}. Verifique data/reg/...`);
      alert(`Erro ao carregar regulado ${codigo}.\n\n${e.message}`);
    }
  };

  const openAtividades = (reg) => {
    try {
      openModal();
      els.mTitle.textContent = "Atividades (CNAE)";
      els.mSub.textContent = reg.codigo ? `Regulado: ${reg.codigo}` : "";

      const arr = Array.isArray(reg.atividades) ? reg.atividades : [];
      if (arr.length === 0) {
        els.mBody.textContent = "Nenhuma atividade encontrada.";
        return;
      }

      const lines = arr.map((a) => {
        const sub = a.subclasse ? `Subclasse: ${a.subclasse}` : "";
        const tipo = a.tipo ? `Tipo: ${a.tipo}` : "";
        const atv = a.atividade ? `Atividade: ${a.atividade}` : "";
        const eq = a.equipe ? `Equipe: ${a.equipe}` : "";
        const comp = a.complexidade ? `Complexidade: ${a.complexidade}` : "";
        return [sub, tipo, atv, eq, comp].filter(Boolean).join(" | ");
      });

      els.mBody.textContent = lines.join("\n");
    } catch (e) {
      console.error(e);
      alert(`Erro ao abrir atividades.\n\n${e.message}`);
    }
  };

  const openInspecoes = (reg) => {
    try {
      openModal();
      els.mTitle.textContent = "Inspeções";
      els.mSub.textContent = reg.codigo ? `Regulado: ${reg.codigo}` : "";

      const arr = Array.isArray(reg.inspecoes) ? reg.inspecoes : [];
      if (arr.length === 0) {
        els.mBody.textContent = "Nenhuma inspeção encontrada.";
        return;
      }

      // Como o mBody é <pre>, vamos usar HTML simples com botões (funciona mesmo em <pre>)
      const html = `
        <div style="white-space:normal">
          <div style="margin-bottom:10px">Clique em <b>Abrir histórico</b> para ver o texto do NDOC.</div>
          ${arr
            .map((i) => {
              const ndoc = i.ndoc;
              const dt = i.dt_visita ? `Data: ${i.dt_visita}` : "";
              const tipo = i.tipo ? `Tipo: ${i.tipo}` : "";
              const num = i.numer ? `Nº: ${i.numer}` : "";
              const pz = Number.isFinite(i.pz_retorno) ? `Prazo: ${i.pz_retorno} dia(s)` : "";
              const head = [dt, tipo, num, pz].filter(Boolean).join(" • ");

              const btn = Number.isFinite(ndoc) || /^\d+$/.test(String(ndoc))
                ? `<button type="button" data-ndoc="${ndoc}" style="margin-left:8px">Abrir histórico</button>`
                : "";

              return `
                <div style="padding:8px 0;border-top:1px solid rgba(255,255,255,.08)">
                  <div><b>NDOC:</b> ${safe(ndoc)} ${btn}</div>
                  <div style="opacity:.9">${safe(head)}</div>
                </div>
              `;
            })
            .join("")}
        </div>
      `;

      els.mBody.innerHTML = html;

      // bind dos botões
      els.mBody.querySelectorAll("button[data-ndoc]").forEach((b) => {
        b.addEventListener("click", () => {
          const ndoc = Number(b.getAttribute("data-ndoc"));
          if (!Number.isFinite(ndoc)) return;
          openHistorico(ndoc);
        });
      });
    } catch (e) {
      console.error(e);
      alert(`Erro ao abrir inspeções.\n\n${e.message}`);
    }
  };

  const openHistorico = async (ndoc) => {
    try {
      els.mTitle.textContent = `Histórico (NDOC ${ndoc})`;
      els.mSub.textContent = "Carregando...";
      els.mBody.textContent = "Carregando...";

      const bucket = hisBucket(ndoc);
      const path = `./data/his/${bucket}/${ndoc}.json`;

      const h = await fetchJson(path);

      els.mSub.textContent = `Arquivo: his/${bucket}/${ndoc}.json`;

      const txt =
        (h && typeof h.decr === "string" && h.decr.trim() !== "")
          ? h.decr
          : (h && typeof h.descr === "string" && h.descr.trim() !== "")
            ? h.descr
            : "";

      els.mBody.textContent = txt !== "" ? txt : "(Sem conteúdo no histórico / campo vazio)";
    } catch (e) {
      console.warn("Histórico não disponível:", e);
      els.mSub.textContent = "Histórico indisponível";
      els.mBody.textContent =
        "Não foi possível carregar o histórico desta inspeção.\n\n" +
        "Verifique se o arquivo existe em data/his/<bucket>/<ndoc>.json e se o GitHub Pages publicou a pasta.";
    }
  };

  const search = (q) => {
    const nq = norm(q);

    if (!state.indexLoaded) return;

    if (nq.length < 2) {
      clearResults();
      setStatus("Digite ao menos 2 caracteres para pesquisar.");
      return;
    }

    const hits = state.index.filter((r) => r._blob.includes(nq));
    setStatus(`Resultados: ${hits.length}`);
    renderResults(hits);
  };

  // Eventos
  if (els.q) {
    els.q.addEventListener("input", debounce(() => search(els.q.value), 120));
    els.q.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        els.q.value = "";
        clearResults();
        setStatus(state.indexLoaded ? "Digite para pesquisar." : "Carregando índice...");
      }
    });
  }

  if (els.btnClear) {
    els.btnClear.addEventListener("click", () => {
      if (els.q) els.q.value = "";
      clearResults();
      setStatus(state.indexLoaded ? "Digite para pesquisar." : "Carregando índice...");
    });
  }

  if (els.btnCloseDetail) {
    els.btnCloseDetail.addEventListener("click", () => {
      showDetail(false);
      state.currentReg = null;
    });
  }

  if (els.btnModalClose) els.btnModalClose.addEventListener("click", closeModal);
  if (els.modalBackdrop) els.modalBackdrop.addEventListener("click", closeModal);

  // init
  loadIndex();
})();
