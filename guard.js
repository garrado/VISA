// guard.js — proteção de páginas internas (cliente)
// Ajustes rápidos:
const INDEX_URL = "index.html";
const SESSION_MAX_MIN = 8 * 60;   // 8 horas
const IDLE_MAX_MIN    = 20;       // 20 minutos

const AUTHORIZED_EMAILS = new Set([
  "ps.visa@anapolis.go.gov.br",
  "jotadaguas@gmail.com",
  "geraldoedsonrosa@gmail.com",
  "patycdmes@gmail.com",
  "ariannefvieira@hotmail.com",
  "marinaperillo@hotmail.com",
  "visa@anapolis.go.gov.br",
  "mariaedwiges@anapolis.go.gov.br",
  "tathnut@hotmail.com",
  "simonegrossi@anapolis.go.gov.br",
  "kamillarolim@gmail.com",
  "lulucieneepais@gmail.com",
  "adrianepereira@anapolis.go.gov.br",
  "claudio@anapolis.go.gov.br",
  "silviamarques@anapolis.go.gov.br",
  "mhg.rodovalho@gmail.com",
  "medwiges@gmail.com",
  "lindaenila@gmail.com",
  "wanessab412@gmail.com",
  "juliocteles@anapolis.go.gov.br",
  "fabiolappmarques@gmail.com",
  "lidianesimoes@anapolis.go.gov.br",
  "educacao.esportes@anapolis.go.gov.br",
  "crbferreira81@gmail.com",
  "profajulianakenia@gmail.com",
  "dani.visaanapolis@gmail.com",
  "medicamentos@anapolis.go.gov.br",
  "cesio@anapolis.go.gov.br",
  "gubio@anapolis.go.gov.br",
  "marciorodovalho@anapolis.go.gov.br",
  "edsonarantes@anapolis.go.gov.br",
  "981217644pedro@gmail.com",
  "julianafviturino@gmail.com",
  "thaysasouza97@gmail.com",
  "farm.castro78@gmail.com",
  "viniciuscassiano@anapolis.go.gov.br",
  "thiagogomesgobo@gmail.com",
  "liviabr.visa@gmail.com",
  "wanessa05@gmail.com",
  "santosrat@gmail.com",
  "vivianemiyada@gmail.com",
  "angelavet2@gmail.com",
  "diasbrito1515@gmail.com",
  "ademargatu86@gmail.com",
  "cidalinacoelho@anapolis.go.gov.br",
  "lauraeleuza@gmail.com",
  "portaria344@anapolis.go.gov.br",
  "mens.agitat.molem.cns@gmail.com"
]);

function normEmail(s){ return String(s || "").toLowerCase().trim(); }

function nowMs(){ return Date.now(); }
function minutesToMs(m){ return m * 60 * 1000; }

function setSessionMarks(){
  const now = nowMs();
  if (!sessionStorage.getItem("visa_session_start")) {
    sessionStorage.setItem("visa_session_start", String(now));
  }
  sessionStorage.setItem("visa_last_active", String(now));
}

function touchActivity(){
  sessionStorage.setItem("visa_last_active", String(nowMs()));
}

function isSessionExpired(){
  const start = Number(sessionStorage.getItem("visa_session_start") || "0");
  const last  = Number(sessionStorage.getItem("visa_last_active") || "0");
  const now   = nowMs();

  if (!start || !last) return false;

  const maxExceeded  = (now - start) > minutesToMs(SESSION_MAX_MIN);
  const idleExceeded = (now - last)  > minutesToMs(IDLE_MAX_MIN);

  return maxExceeded || idleExceeded;
}

function attachIdleListeners(){
  const events = ["mousemove","mousedown","keydown","touchstart","scroll","click"];
  events.forEach(ev => window.addEventListener(ev, touchActivity, { passive:true }));
  window.addEventListener("visibilitychange", () => {
    if (!document.hidden) touchActivity();
  });
}

function startExpiryTimer(signOutFn){
  setInterval(async () => {
    if (isSessionExpired()){
      try { await signOutFn(); } catch(e){}
      sessionStorage.removeItem("visa_session_start");
      sessionStorage.removeItem("visa_last_active");
      alert("Sessão expirada por tempo/inatividade. Faça login novamente.");
      location.href = INDEX_URL;
    }
  }, 10_000); // checa a cada 10s
}

// Função principal: chama dentro de cada página interna
export async function protectPage({ firebaseConfig, onAuthorized }){
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } =
    await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

  const app  = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // força persistência local (evita pedir login toda hora)
  try { await setPersistence(auth, browserLocalPersistence); } catch(e){}

  setSessionMarks();
  attachIdleListeners();

  onAuthStateChanged(auth, async (user) => {
    if (!user){
      location.href = INDEX_URL;
      return;
    }

    const email = normEmail(user.email);
    if (!AUTHORIZED_EMAILS.has(email)){
      try { await signOut(auth); } catch(e){}
      alert("Acesso não autorizado. Solicite liberação ao administrador.");
      location.href = INDEX_URL;
      return;
    }

    // autorizado
    setSessionMarks();
    startExpiryTimer(() => signOut(auth));
    if (typeof onAuthorized === "function") onAuthorized({ user, auth });
  });
}
