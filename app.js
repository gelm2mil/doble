// =====================================================
//                ⚡ CONFIGURACIÓN ⚡
// =====================================================
const DATA_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5YUmfoizOZkx1RaK1f2wq2WP_RvNdbaLsuwtPtuBtd-CQHjNKDtunQgmp6d9J6nE-xm4IAazZJHaN/pub?gid=103960205&single=true&output=csv";

let registros = [];
let similares = [];
let ultimoFiltro = "";

// =====================================================
//                 ⚡ INICIO ⚡
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  cargarCSV();
  iniciarReloj();
});

// =====================================================
//              ⚡ CARGAR CSV ⚡
// =====================================================
async function cargarCSV() {
  try {
    const estado = document.getElementById("estado");
    estado.textContent = "Cargando datos...";

    const resp = await fetch(DATA_URL, { cache: "no-store" });
    if (!resp.ok) throw new Error("No se pudo cargar el CSV");

    const texto = await resp.text();

    const lineas = texto
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Encabezados reales
    const headers = lineas[0]
      .split(",")
      .map(h => h.trim().toLowerCase());

    registros = [];

    for (let i = 1; i < lineas.length; i++) {
      const fila = lineas[i].split(",");

      // Ignorar filas que solo son fechas o separadores
      if (fila.length < 3) continue;

      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = fila[idx] ? fila[idx].trim() : "";
      });

      // Si no hay boleta ni placa, ignorar
      if (!obj["no. boleta"] && !obj["placas"] && !obj["chapa"]) continue;

      registros.push(obj);
    }

    estado.textContent =
      "Archivo cargado. Registros: " + registros.length;

  } catch (err) {
    console.error(err);
    document.getElementById("estado").textContent =
      "Error al cargar datos.";
  }
}

// =====================================================
//           ⚡ NORMALIZADOR ⚡
// =====================================================
function normalizar(txt) {
  if (!txt) return "";
  return String(txt)
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .toUpperCase()
    .trim();
}

// =====================================================
//              ⚡ ESCAPE HTML ⚡
// =====================================================
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// =====================================================
//           ⚡ CONSTRUIR TABLA ⚡
// =====================================================
function construirTabla(r) {
  return `
    <table>
      <tr>
        <th>SERIE</th>
        <th>BOLETA</th>
        <th>FECHA</th>
        <th>HORA</th>
        <th>PLACA</th>
        <th>TIPO</th>
        <th>MARCA</th>
        <th>COLOR</th>
        <th>DIRECCIÓN</th>
        <th>DEPTO</th>
        <th>MUNI</th>
        <th>CONDUCTOR</th>
        <th>LIC</th>
        <th>No. LICENCIA</th>
        <th>ARTÍCULO</th>
        <th>DESCRIPCIÓN</th>
        <th>CHAPA</th>
      </tr>
      <tr>
        <td>${esc(r["serie"])}</td>
        <td>${esc(r["no. boleta"])}</td>
        <td>${esc(r["fecha"])}</td>
        <td>${esc(r["hora"])}</td>
        <td>${esc(r["placas"])}</td>
        <td>${esc(r["tipo"])}</td>
        <td>${esc(r["marca"])}</td>
        <td>${esc(r["color"])}</td>
        <td>${esc(r["direccion"])}</td>
        <td>${esc(r["departamento"])}</td>
        <td>${esc(r["municipio"])}</td>
        <td>${esc(r["nombre del conductor"])}</td>
        <td>${esc(r["lic"])}</td>
        <td>${esc(r["no. licencia"])}</td>
        <td>${esc(r["articulo"])}</td>
        <td>${esc(r["descripcion"])}</td>
        <td>${esc(r["chapa"])}</td>
      </tr>
    </table>
  `;
}

// =====================================================
//                ⚡ BUSCAR ⚡
// =====================================================
function buscar() {
  const texto = document.getElementById("busquedaInput").value.trim();
  if (!texto) return;

  const limpio = normalizar(texto);
  ultimoFiltro = texto;

  const divPrincipal = document.getElementById("resultado-principal");
  const divSim = document.getElementById("similares-contenedor");

  divPrincipal.innerHTML = "";
  divSim.innerHTML = "";
  similares = [];

  const coincidencias = [];

  registros.forEach(reg => {
    let p = 0;

    if (normalizar(reg["chapa"]) === limpio) p = 110;
    if (normalizar(reg["placas"]) === limpio) p = 100;
    if (normalizar(reg["no. licencia"]) === limpio) p = 90;
    if (normalizar(reg["no. boleta"]) === limpio) p = 80;
    if (normalizar(reg["descripcion"]).includes(limpio)) p = 60;

    if (p > 0) coincidencias.push({ reg, p });
  });

  if (coincidencias.length === 0) {
    divPrincipal.innerHTML =
      `<p>No se encontró <strong>${esc(texto)}</strong>.</p>`;
    return;
  }

  coincidencias.sort((a, b) => b.p - a.p);

  const principal = coincidencias[0].reg;
  const otros = coincidencias.slice(1).map(c => c.reg);

  divPrincipal.innerHTML = construirTabla(principal);

  if (otros.length > 0) {
    similares = otros;

    let opciones = `<option value="">-- seleccionar --</option>`;
    otros.forEach((r, i) => {
      opciones += `<option value="${i}">
        Placa ${r["placas"] || ""} · Chapa ${r["chapa"] || ""}
      </option>`;
    });

    divSim.innerHTML = `
      <div class="similares-box">
        <label>SIMILARES:</label>
        <select onchange="mostrarSimilar(this.value)">
          ${opciones}
        </select>
      </div>
    `;
  }
}

// =====================================================
//           ⚡ MOSTRAR SIMILAR ⚡
// =====================================================
function mostrarSimilar(i) {
  if (i === "" || isNaN(i)) return;
  document.getElementById("resultado-principal").innerHTML =
    construirTabla(similares[i]);
}

// =====================================================
//                 ⚡ RELOJ ⚡
// =====================================================
function iniciarReloj() {
  setInterval(() => {
    const f = new Date();
    const el = document.getElementById("fechaHora");
    if (el) {
      el.textContent =
        f.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }) +
        " — " +
        f.toLocaleTimeString("es-ES");
    }
  }, 1000);
}

// =====================================================
//        ⚡ BOTONES SUPERIORES ⚡
// =====================================================
function abrirMultas() {
  window.open(
    "https://docs.google.com/spreadsheets/d/16gzaOxMSPcAQQPYx-nyM9-nRidyhheeXjodbdQH6LV4/edit?gid=103960205#gid=103960205",
    "_blank"
  );
}

function abrirOficios() {
  window.open(
    "https://docs.google.com/document/d/1koU-_N3CYCaws8GgiKuTS1EzCFWaDPXfTv6WlEobwZM/edit",
    "_blank"
  );
}

function abrirFormulario() {
  window.open(
    "https://docs.google.com/spreadsheets/d/14_cUOa7N0o6xc0iEgHpx9sJY_IZVzcpU5XVNDSmrWEg/edit?gid=188079205#gid=188079205",
    "_blank"
  );
}
