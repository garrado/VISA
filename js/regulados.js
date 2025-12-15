/* =========================
   Regulados • CVS (GitHub Pages)
   Compatível com Regulados.html atual (Opção A)
========================= */

(() => {
  const DATA_BASE = "./data";

  // --- refs do HTML (IDs do seu Regulados.html)
  const elQ = document.getElementById("q");
  const elClear = document.getElementById("btnClear");
  const elStatus = document.getElementById("status");
  const elResults = document.getElementById("results");

  const elDetail = document.getElementById("detailPanel");
  const elDTitle = document.getElementById("dTitle");
  const elDSub = document.getElementById("dSub");
  const elCloseDetail = document.getElementById("btnCloseDetail");

  const elDCodigo = document.getElementById("dCodigo");
  const elDDoc = document.getElementById("dDoc");
  const elDEnd = document.getElementById("dEnd");
  const elDBairro = document.getElementById("dBairro");

  const elDAlvNum = document.getElementById("dAlvNum");
  const elDAlvEmi = document.getElementById("dAlvEmi");
  const elDAlvVal = document.getElementById("dAlvVal");

  const elBtnAtv = document.getElementById("btnAtividades");
  const elBtnInsp = document.getElementById("btnInspecoes");

  const elBackdrop = document.getElementById("modalBackdrop");
  const elModal = document.getElementById("modal");
  const elMTitle = document.getElementById("mTitle");
  const elMSub = document.getElementById("mSub");
  const elMBody = document.getElementById("mBody");
  const elCloseModal = document.getElementById("btnModalClose");

  // --- estado
  let INDEX = [];
  let CURRENT = null;

  // --- utils
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function norm(s) {
    return (s || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function pad5(n) {
    return String(n).padStart(5, "0");
  }

  function bucketFromNdoc(ndoc) {
    return pad2(Number(ndoc) % 100);
  }

  function setStatus(msg) {
    elStatus.textContent = msg;
  }

  function showDetail(show) {
    elDetail.hidden = !show;
  }

  function openModal(title, sub, html) {
    elMTitle.textContent = title || "—";
    elMSub.textContent = sub || "—";
    // mBody é <pre>, mas pode receber HTML e renderizar botões; mantém layout.
    elMBody.innerHTML = html || "";
    elBackdrop.hidden = false;
  }

  function closeModal() {
    elBackdrop.hidden = true;
    elMBody.innerHTML = "";
  }

  // --- fetch com anti-cache (iOS / GH Pages)
  async function fetchJson(path) {
    const url = `${path}?v=${Date.now()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${path}`);
    return await r.json();
  }

  // --- carrega índice
  async function loadIndex() {
    setStatus("Carregando índice...");
    const j = await fetchJson(`${DATA_BASE}/index_regulados.json`);
    INDEX = Array.isArray(j?.dados) ? j.dados : [];
    setStatus(`Índice carregado: ${INDEX.length.toLocaleString("pt-BR")} regulados.`);
  }

  // --- render lista de resultados
  function renderResults(list) {
    elResults.innerHTML = "";

    if (!list.length) {
      elResults.innerHTML = `<div class="empty">Nenhum resultado.</div>`;
      return;
    }

    for (const r of list) {
      const div = document.createElement("button");
      div.type = "button";
      div.className = "card";
      div.innerHTML = `
        <div class="card__title">${escapeHtml(r.razao || "—")}</div>
        <div class="card__sub">${escapeHtml(r.fantasia || "")}</div>
        <div class="card__meta">
          <span>#${escapeHtml(String(r.codigo))}</span>
          <span>${escapeHtml(r.documento || "")}</span>
        </div>
      `;
      div.addEventListener("click", () => loadRegulado(r.codigo));
      elResults.appendChild(div);
    }
  }

  // --- busca no índice
  function searchIndex(term) {
    const t = norm(term);
    if (t.length < 2) return [];

    return INDEX.filter((r) => {
      const codigo = String(r.codigo || "");
      return (
        norm(r.razao).includes(t) ||
        norm(r.fantasia).includes(t) ||
        norm(r.documento).includes(t) ||
        codigo.includes(t)
      );
    }).slice(0, 200); // evita render infinito
  }

  // --- carrega regulado (com fallback p/ nome antigo sem padding)
  async function loadRegulado(codigo) {
    setStatus(`Carregando regulado #${codigo}...`);
    showDetail(false);

    const cod = Number(codigo);
    const pfx = pad5(cod).slice(0, 2);
    const fileNew = `${DATA_BASE}/reg/${pfx}/${pad5(cod)}.json`;
    const fileOld = `${DATA_BASE}/reg/${pfx}/${cod}.json`; // fallback se ainda existir

    try {
      CURRENT = await fetchJson(fileNew);
    } catch (e1) {
      // fallback (estrutura antiga)
      try {
        CURRENT = await fetchJson(fileOld);
      } catch (e2) {
        setStatus(`Falha ao carregar o regulado #${codigo}.`);
        console.error(e1, e2);
        return;
      }
    }

    renderDetail();
    setStatus(`Regulado #${codigo} carregado.`);
  }

  // --- render painel detalhe
  function renderDetail() {
    if (!CURRENT) return;

    const c = CURRENT;
    const doc = c.cnpj || c.cpf || "";

    elDTitle.textContent = c.razao || "—";
    elDSub.textContent = c.fantasia || "—";

    elDCodigo.textContent = String(c.codigo ?? "—");
    elDDoc.textContent = doc || "—";

    // endereço: logradouro + complemento + fone/celular
    const end = [];
    const log = c?.endereco?.logradouro || "";
    const comp = c?.endereco?.complemento || "";
    const fone = c?.endereco?.fone || "";
    const cel = c?.endereco?.celular || "";

    if (log) end.push(log);
    if (comp) end.push(comp);

    const contatos = [];
    if (fone) contatos.push(`Fone: ${fone}`);
    if (cel) contatos.push(`Celular: ${cel}`);
    if (contatos.length) end.push(contatos.join(" • "));

    elDEnd.textContent = end.length ? end.join(" — ") : "—";
    elDBairro.textContent = c?.bairro?.nome || "—";

    // alvará (na sua unit final: dt_validade + exercicio)
    // Seu HTML ainda mostra “Alvará nº / Emissão / Validade”
    // Para não parecer “quebrado”, vamos:
    // - colocar EXERCÍCIO em dAlvNum
    // - deixar dAlvEmi como “—”
    // - colocar dt_validade em dAlvVal
    const alv = c.alvara_ultimo;
    if (alv && alv.dt_validade) {
      elDAlvNum.textContent = (alv.exercicio != null && alv.exercicio !== 0) ? String(alv.exercicio) : "—";
      elDAlvEmi.textContent = "—";
      elDAlvVal.textContent = alv.dt_validade;
    } else {
      elDAlvNum.textContent = "—";
      elDAlvEmi.textContent = "—";
      elDAlvVal.textContent = "—";
    }

    // habilita botões conforme conteúdo
    const atvCount = Array.isArray(c.atividades) ? c.atividades.length : 0;
    const inspCount = Array.isArray(c.inspecoes) ? c.inspecoes.length : 0;

    elBtnAtv.disabled = atvCount === 0;
    elBtnInsp.disabled = inspCount === 0;

    showDetail(true);
  }

  // --- modal: atividades
  function showAtividades() {
    if (!CURRENT) return;

    const list = Array.isArray(CURRENT.atividades) ? CURRENT.atividades : [];
    if (!list.length) {
      openModal("Atividades", `Regulado #${CURRENT.codigo}`, "Nenhuma atividade encontrada.");
      return;
    }

    const lines = list.map((a, idx) => {
      const atividade = a.atividade || "—";
      const subclasse = a.subclasse || "—";
      const tipo = a.tipo || "—";
      const equipe = a.equipe || "—";
      const comp = a.complexidade || "—";
      return `
<div style="margin-bottom:10px;">
  <b>${idx + 1}.</b> ${escapeHtml(atividade)}
  <div style="opacity:.85;margin-top:2px;">
    Subclasse: ${escapeHtml(subclasse)} • Tipo: ${escapeHtml(tipo)}<br>
    Equipe: ${escapeHtml(equipe)} • Complexidade: ${escapeHtml(comp)}
  </div>
</div>`;
    });

    openModal("Atividades", `Regulado #${CURRENT.codigo}`, lines.join(""));
  }

  // --- modal: inspeções + botão "Histórico"
  function showInspecoes() {
    if (!CURRENT) return;

    const list = Array.isArray(CURRENT.inspecoes) ? CURRENT.inspecoes : [];
    if (!list.length) {
      openModal("Inspeções", `Regulado #${CURRENT.codigo}`, "Nenhuma inspeção encontrada.");
      return;
    }

    const lines = list.map((i, idx) => {
      const dt = i.dt_visita || "—";
      const tipo = i.tipo || "—";
      const numer = i.numer || "—";
      const pz = (i.pz_retorno != null) ? String(i.pz_retorno) : "—";
      const ndoc = i.ndoc;

      const btn = (ndoc && Number(ndoc) > 0)
        ? `<button type="button" class="miniBtn" data-ndoc="${ndoc}">Abrir histórico</button>`
        : `<span style="opacity:.7;">(sem NDOC)</span>`;

      return `
<div style="margin-bottom:12px;">
  <div><b>${idx + 1}.</b> ${escapeHtml(tipo)} • Nº ${escapeHtml(numer)} • ${escapeHtml(dt)}</div>
  <div style="opacity:.85;margin-top:2px;">Prazo retorno: ${escapeHtml(pz)} dia(s) • NDOC: ${escapeHtml(String(ndoc || "—"))}</div>
  <div style="margin-top:6px;">${btn}</div>
</div>`;
    });

    openModal("Inspeções", `Regulado #${CURRENT.codigo}`, lines.join(""));

    // bind dos botões dentro do modal
    elMBody.querySelectorAll("button[data-ndoc]").forEach((b) => {
      b.addEventListener("click", async () => {
        const ndoc = Number(b.getAttribute("data-ndoc"));
        await openHistorico(ndoc);
      });
    });
  }

  // --- abre histórico (his/bucket/ndoc.json)
  async function openHistorico(ndoc) {
    try {
      const bucket = bucketFromNdoc(ndoc);
      const j = await fetchJson(`${DATA_BASE}/his/${bucket}/${ndoc}.json`);
      const memo = (j && (j.decr || j.descr)) ? (j.decr || j.descr) : "";

      openModal(
        `Histórico NDOC ${ndoc}`,
        `his/${bucket}/${ndoc}.json`,
        escapePre(memo || "(vazio)")
      );
    } catch (e) {
      console.error(e);
      openModal(
        `Histórico NDOC ${ndoc}`,
        "Erro ao carregar",
        `Não foi possível abrir his/${bucketFromNdoc(ndoc)}/${ndoc}.json`
      );
    }
  }

  // --- escape helpers (evitar quebrar HTML)
  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // para <pre> (mantém quebras, mas escapado)
  function escapePre(s) {
    return escapeHtml(s).replaceAll("\n", "<br>");
  }

  // --- limpar
  function clearAll() {
    elQ.value = "";
    elResults.innerHTML = "";
    setStatus(`Índice carregado: ${INDEX.length.toLocaleString("pt-BR")} regulados.`);
    CURRENT = null;
    showDetail(false);
    elQ.focus();
  }

  // --- init
  async function init() {
    try {
      await loadIndex();
      showDetail(false);
    } catch (e) {
      console.error(e);
      setStatus("Erro ao carregar o índice. Verifique o caminho ./data/index_regulados.json");
      return;
    }

    let lastTerm = "";
    elQ.addEventListener("input", () => {
      const term = elQ.value || "";
      if (term === lastTerm) return;
      lastTerm = term;

      const list = searchIndex(term);
      renderResults(list);
    });

    elClear.addEventListener("click", clearAll);
    elCloseDetail.addEventListener("click", () => {
      CURRENT = null;
      showDetail(false);
    });

    elBtnAtv.addEventListener("click", showAtividades);
    elBtnInsp.addEventListener("click", showInspecoes);

    elCloseModal.addEventListener("click", closeModal);
    elBackdrop.addEventListener("click", (ev) => {
      // fecha clicando fora da caixa
      if (ev.target === elBackdrop) closeModal();
    });

    // melhora UX: Enter para buscar/filtrar (já filtra no input, mas mantém)
    elQ.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") clearAll();
    });
  }

  // start
  document.addEventListener("DOMContentLoaded", init);
})();
