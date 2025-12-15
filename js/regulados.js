/* ===============================
   CONFIG
================================ */
const DATA_BASE = './data';

/* ===============================
   ESTADO
================================ */
let INDEX = [];
let CURRENT = null;

/* ===============================
   UTIL
================================ */
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return [...document.querySelectorAll(sel)]; }

function norm(t){
  return (t||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function bucketFromNdoc(ndoc){
  return String(ndoc % 100).padStart(2,'0');
}

function fileFromCodigo(codigo){
  const s = String(codigo).padStart(5,'0');
  return `reg/${s.slice(0,2)}/${s}.json`;
}

/* ===============================
   LOAD INDEX
================================ */
async function loadIndex(){
  const r = await fetch(`${DATA_BASE}/index_regulados.json`, { cache:'no-store' });
  const j = await r.json();
  INDEX = j.dados || [];
}

/* ===============================
   BUSCA
================================ */
function searchIndex(term){
  const t = norm(term);
  return INDEX.filter(r =>
    norm(r.razao).includes(t) ||
    norm(r.fantasia).includes(t) ||
    norm(r.documento||'').includes(t) ||
    String(r.codigo).includes(t)
  );
}

/* ===============================
   RENDER RESULTADOS
================================ */
function renderResults(list){
  const box = qs('#results');
  box.innerHTML = '';

  if(!list.length){
    box.innerHTML = `<div class="small">Nenhum resultado encontrado.</div>`;
    return;
  }

  list.forEach(r=>{
    const div = document.createElement('div');
    div.className = 'result';
    div.innerHTML = `
      <div class="result__top">
        <div>
          <div class="result__title">${r.razao}</div>
          <div class="result__sub">${r.fantasia || ''}</div>
        </div>
        <span class="tag">#${r.codigo}</span>
      </div>
    `;
    div.onclick = ()=> loadRegulado(r.codigo);
    box.appendChild(div);
  });
}

/* ===============================
   LOAD REGULADO
================================ */
async function loadRegulado(codigo){
  const file = fileFromCodigo(codigo);
  const r = await fetch(`${DATA_BASE}/${file}`, { cache:'no-store' });
  CURRENT = await r.json();
  renderRegulado();
}

/* ===============================
   RENDER REGULADO
================================ */
function renderRegulado(){
  if(!CURRENT) return;

  qs('#detalhe').hidden = false;

  qs('#r_razao').textContent = CURRENT.razao;
  qs('#r_fantasia').textContent = CURRENT.fantasia || '-';

  qs('#r_doc').textContent = CURRENT.cnpj || CURRENT.cpf || '-';
  qs('#r_logradouro').textContent = CURRENT.endereco.logradouro || '-';
  qs('#r_complemento').textContent = CURRENT.endereco.complemento || '-';
  qs('#r_fone').textContent = CURRENT.endereco.fone || '-';
  qs('#r_celular').textContent = CURRENT.endereco.celular || '-';
  qs('#r_bairro').textContent = CURRENT.bairro.nome || '-';

  renderAtividades();
  renderAlvara();
  renderInspecoes();
}

/* ===============================
   ATIVIDADES
================================ */
function renderAtividades(){
  const box = qs('#atividades');
  box.innerHTML = '';

  if(!CURRENT.atividades.length){
    box.innerHTML = '<div class="small">Nenhuma atividade encontrada.</div>';
    return;
  }

  CURRENT.atividades.forEach(a=>{
    const d = document.createElement('div');
    d.className = 'item';
    d.innerHTML = `
      <div class="item__title">${a.atividade || '-'}</div>
      <div class="item__sub">
        Subclasse: ${a.subclasse || '-'}<br>
        Tipo: ${a.tipo || '-'}<br>
        Equipe: ${a.equipe || '-'} | Complexidade: ${a.complexidade || '-'}
      </div>
    `;
    box.appendChild(d);
  });
}

/* ===============================
   ALVARÁ
================================ */
function renderAlvara(){
  const box = qs('#alvara');
  box.innerHTML = '';

  if(!CURRENT.alvara_ultimo){
    box.innerHTML = '<div class="small">Nenhum alvará válido.</div>';
    return;
  }

  box.innerHTML = `
    <div class="kv">
      <div class="kv__k">Validade</div>
      <div class="kv__v">${CURRENT.alvara_ultimo.dt_validade}</div>
      <div class="kv__k">Exercício</div>
      <div class="kv__v">${CURRENT.alvara_ultimo.exercicio || '-'}</div>
    </div>
  `;
}

/* ===============================
   INSPEÇÕES
================================ */
function renderInspecoes(){
  const box = qs('#inspecoes');
  box.innerHTML = '';

  if(!CURRENT.inspecoes.length){
    box.innerHTML = '<div class="small">Nenhuma inspeção registrada.</div>';
    return;
  }

  CURRENT.inspecoes.forEach(i=>{
    const d = document.createElement('div');
    d.className = 'item';
    d.innerHTML = `
      <div class="item__top">
        <div>
          <div class="item__title">${i.tipo || '-'}</div>
          <div class="item__sub">
            Data: ${i.dt_visita || '-'}<br>
            Número: ${i.numer || '-'}<br>
            Prazo retorno: ${i.pz_retorno} dias
          </div>
        </div>
        <button class="btn btn--ghost" onclick="openHistorico(${i.ndoc})">Histórico</button>
      </div>
    `;
    box.appendChild(d);
  });
}

/* ===============================
   HISTÓRICO (MODAL)
================================ */
async function openHistorico(ndoc){
  const bucket = bucketFromNdoc(ndoc);
  const r = await fetch(`${DATA_BASE}/his/${bucket}/${ndoc}.json`, { cache:'no-store' });
  const j = await r.json();

  qs('#modalMemo').textContent = j.decr || '';
  qs('#modal').hidden = false;
}

function closeModal(){
  qs('#modal').hidden = true;
}

/* ===============================
   INIT
================================ */
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadIndex();

  qs('#search').addEventListener('input', e=>{
    const v = e.target.value.trim();
    if(v.length < 2){
      qs('#results').innerHTML = '';
      return;
    }
    renderResults(searchIndex(v));
  });
});
