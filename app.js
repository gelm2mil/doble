const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5YUmfoizOZkx1RaK1f2wq2WP_RvNdbaLsuwtPtuBtd-CQHjNKDtunQgmp6d9J6nE-xm4IAazZJHaN/pub?gid=103960205&single=true&output=csv";

let registros = [];
let similares = [];
let ultimoFiltro = "";

document.addEventListener("DOMContentLoaded", cargarCSV);

async function cargarCSV() {
  try {
    document.getElementById("estado").textContent = "Cargando datos…";

    const resp = await fetch(DATA_URL, { cache: "no-store" });
    const texto = await resp.text();

    const lineas = texto.split("\n").map(l => l.trim()).filter(l => l);
    const encabezados = lineas[0].split(",").map(h => h.trim().toLowerCase());

    registros = lineas.slice(1).map(l => {
      const c = l.split(",");
      const o = {};
      encabezados.forEach((h, i) => o[h] = c[i] || "");
      return o;
    });

    document.getElementById("estado").textContent =
      "Archivo cargado. Registros: " + registros.length;

  } catch (e) {
    document.getElementById("estado").textContent = "Error cargando datos";
    console.error(e);
  }
}

function normalizar(t) {
  if (!t) return "";
  return String(t).replace(/\s+/g,"").replace(/-/g,"").toUpperCase();
}

function esc(s){
  return String(s||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");
}

function construirTabla(r){
  return `
  <table>
    <tr>
      <th>SERIE</th><th>BOLETA</th><th>FECHA</th><th>HORA</th>
      <th>PLACA</th><th>TIPO</th><th>MARCA</th><th>COLOR</th>
      <th>DIRECCIÓN</th><th>DEPTO</th><th>MUNI</th>
      <th>CONDUCTOR</th><th>LIC</th><th>No. LIC</th>
      <th>ARTÍCULO</th><th>DESCRIPCIÓN</th><th>CHAPA</th>
    </tr>
    <tr>
      <td>${esc(r.serie)}</td>
      <td>${esc(r["no. boleta"])}</td>
      <td>${esc(r.fecha)}</td>
      <td>${esc(r.hora)}</td>
      <td>${esc(r.placas)}</td>
      <td>${esc(r.tipo)}</td>
      <td>${esc(r.marca)}</td>
      <td>${esc(r.color)}</td>
      <td>${esc(r.direccion)}</td>
      <td>${esc(r.departamento)}</td>
      <td>${esc(r.municipio)}</td>
      <td>${esc(r["nombre del conductor"])}</td>
      <td>${esc(r.lic)}</td>
      <td>${esc(r["no. licencia"])}</td>
      <td>${esc(r.articulo)}</td>
      <td>${esc(r.descripcion)}</td>
      <td>${esc(r.chapa)}</td>
    </tr>
  </table>`;
}

function buscar(){
  const t = document.getElementById("busquedaInput").value.trim();
  if(!t) return;

  const q = normalizar(t);
  ultimoFiltro = t;

  const res = registros.filter(r =>
    normalizar(r.placas) === q ||
    normalizar(r["no. boleta"]) === q ||
    normalizar(r["no. licencia"]) === q ||
    normalizar(r.chapa) === q ||
    normalizar(r.descripcion).includes(q)
  );

  if(res.length === 0){
    document.getElementById("resultado-principal").innerHTML =
      `<p>No se encontró <b>${esc(t)}</b></p>`;
    return;
  }

  document.getElementById("resultado-principal").innerHTML =
    construirTabla(res[0]);
}
