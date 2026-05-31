import { formatearFechaHora } from "./definitions.js";
import { municipiosPorProvincia } from "./mgiscripts.js";

const childLoader = document.getElementById("child-loader");
let filtroActivo = { scope: null, value: null };

/**
 * Habilita o deshabilita el SELECT de scope
 * @param {boolean} habilitar
 */
function toggleScopeSelect(habilitar) {
  const select = document.getElementById("ts-scope-select");
  if (!select) return;

  select.disabled = !habilitar;
  select.style.opacity = habilitar ? "1" : "0.5";
  select.style.cursor = habilitar ? "pointer" : "not-allowed";
}

/**
 * Asigna opciones al SELECT de scope
 * @param {Array<{value:string,label:string}>} opciones
 */
function asignarOpcionesSelect(opciones) {
  const select = document.getElementById("ts-scope-select");
  if (!select) return;

  select.innerHTML = '<option value="">-- Seleccionar --</option>';

  opciones.forEach((op) => {
    const option = new Option(op.label, op.value);
    select.appendChild(option);
  });
}

/**
 * Llama a esta función cuando cambie el radio,
 * o después de configurarPermisosScope().
 */
function actualizarSelectSegunRadio() {
  const select = document.getElementById("ts-scope-select");
  if (!select || select.disabled) return;

  const radioActivo = document.querySelector('input[name="ts-scope"]:checked');
  if (!radioActivo) {
    asignarOpcionesSelect([]);
    return;
  }

  const scope = radioActivo.value; // 'cdo' | 'provincia' | 'pais'
  const provinciaUsuario = window.currentUser?.province || "";

  // Determinar si tiene permiso de nivel nacional (tercer caso)
  const puedePais =
    window.puede("sujeto_ver_listado_nivel_nacional") ||
    window.puede("sujeto_editar_listado_nivel_nacional");

  const opciones = [];

  if (!puedePais) {
    // Estás en CASO 2 (provincia pero NO país)
    if (scope === "cdo") {
      // CDO: municipios de la provincia del usuario
      const municipios = municipiosPorProvincia[provinciaUsuario] || [];
      municipios.forEach((m) => {
        opciones.push({
          value: m,
          label: m
        });
      });
    } else if (scope === "provincia") {
      // Provincia: solo la provincia del usuario
      if (provinciaUsuario) {
        opciones.push({
          value: provinciaUsuario,
          label: provinciaUsuario
        });
      }
    } else {
      // scope = 'pais' nunca debería estar habilitado aquí, pero por seguridad:
      opciones.push({
        value: "todos",
        label: "Todos"
      });
    }
  } else {
    // Estás en CASO 3 (nivel nacional)
    if (scope === "cdo") {
      // CDO: todos los municipios de todas las provincias,
      // en formato "Provincia - Municipio"
      Object.entries(municipiosPorProvincia).forEach(([prov, municipios]) => {
        municipios.forEach((m) => {
          opciones.push({
            value: `${prov}::${m}`, // value interno, como quieras
            label: `${prov} - ${m}` // lo que se muestra
          });
        });
      });
    } else if (scope === "provincia") {
      // Provincia: todas las provincias del objeto municipiosPorProvincia
      Object.keys(municipiosPorProvincia).forEach((prov) => {
        opciones.push({
          value: prov,
          label: prov
        });
      });
    } else if (scope === "pais") {
      // País: solo "todos"
      opciones.push({
        value: "todos",
        label: "Todos"
      });
    }
  }

  asignarOpcionesSelect(opciones);
}

/**
 * Habilita / deshabilita radios según permisos
 * y marca el que corresponda por defecto.
 */
function configurarPermisosScope() {
  const rCdo = document.querySelector('input[name="ts-scope"][value="cdo"]');
  const rProvincia = document.querySelector(
    'input[name="ts-scope"][value="provincia"]'
  );
  const rPais = document.querySelector('input[name="ts-scope"][value="pais"]');

  const puedeCdo =
    window.puede("sujeto_ver_listado_cdo") ||
    window.puede("sujeto_editar_listado_cdo");

  const puedeProvincia =
    window.puede("sujeto_ver_listado_provincia") ||
    window.puede("sujeto_editar_listado_provincia");

  const puedePais =
    window.puede("sujeto_ver_listado_nivel_nacional") ||
    window.puede("sujeto_editar_listado_nivel_nacional");

  // Reset inicial: deshabilitar todo y desmarcar
  [rCdo, rProvincia, rPais].forEach((r) => {
    if (!r) return;
    r.disabled = true;
    r.checked = false;
  });

  // CASO 1: Solo CDO
  if (puedeCdo && !puedeProvincia && !puedePais) {
    if (rCdo) {
      rCdo.disabled = true;
      rCdo.checked = true;
    }
    toggleScopeSelect(false);
    asignarOpcionesSelect([]);

    filtroActivo = {
      scope: "CDO",
      value: window.currentUser.municipality
    };
    return;
  }

  // CASO 2: Provincia (SIN país) → **PROVINCIA MARCADO + select con provincia**
  if (puedeProvincia && !puedePais) {
    if (rCdo) {
      rCdo.disabled = false;
    }
    if (rProvincia) {
      rProvincia.disabled = false;
      rProvincia.checked = true; // ✅ PROVINCIA MARCADO POR DEFECTO
    }
    if (rPais) {
      rPais.disabled = true;
    }

    toggleScopeSelect(true);

    // ✅ SELECT con window.currentUser.province seleccionado
    actualizarSelectSegunRadio();
    setTimeout(() => {
      const select = document.getElementById("ts-scope-select");
      if (select && window.currentUser.province) {
        select.value = window.currentUser.province;
      }
    }, 100);

    filtroActivo = {
      scope: "Provincia",
      value: window.currentUser.province
    };
    return;
  }

  // CASO 3: País → **PAÍS MARCADO + select con "Todos"**
  if (puedePais) {
    if (rCdo) {
      rCdo.disabled = false;
    }
    if (rProvincia) {
      rProvincia.disabled = false;
    }
    if (rPais) {
      rPais.disabled = false;
      rPais.checked = true; // ✅ PAÍS MARCADO POR DEFECTO
    }

    toggleScopeSelect(true);

    // ✅ SELECT con "Todos" seleccionado
    actualizarSelectSegunRadio();
    setTimeout(() => {
      const select = document.getElementById("ts-scope-select");
      if (select) {
        select.value = "todos";
      }
    }, 100);

    filtroActivo = {
      scope: "Todos",
      value: 0
    };
    return;
  }

  // Default: todo deshabilitado
  toggleScopeSelect(false);
  asignarOpcionesSelect([]);
}

// async function llenarTablaSujetos(allSubjects) {
//   const tbody = document.getElementById('ts-sujetos-body');

//   // 🆕 MOSTRAR BARRA DE PROGRESO
//   const progressContainer = document.getElementById('progressContainer');
//   const progressBar = document.getElementById('progressBar');
//   const progressText = document.getElementById('progressText');

//   progressContainer.style.display = 'block';
//   progressText.style.display = 'inline';
//   progressBar.style.width = '0%';
//   progressText.textContent = 'Cargando nombres...';

//   try {
//     // Agrupar por DNI
//     const sujetosPorDni = {};
//     allSubjects.forEach(sujeto => {
//       if (!sujetosPorDni[sujeto.dni]) {
//         sujetosPorDni[sujeto.dni] = [];
//       }
//       sujetosPorDni[sujeto.dni].push(sujeto);
//     });

//     // Obtener DNIs únicos
//     const dnisUnicos = Object.keys(sujetosPorDni);

//     // 🆕 BARRA DE PROGRESO PARA Promise.all()
//     const total = dnisUnicos.length;
//     let completadas = 0;

//     progressText.textContent = `Obteniendo ${total} nombres... 0%`;

//     const promesas = dnisUnicos.map(async (dni, index) => {
//       try {
//         const nombre = await getFullnameByDni(dni);
//         completadas++;

//         // 🆕 ACTUALIZAR PROGRESO
//         const percent = Math.round((completadas / total) * 100);
//         progressBar.style.width = `${percent}%`;
//         progressText.textContent = `Obteniendo ${total} nombres... ${percent}%`;

//         return nombre;
//       } catch (err) {
//         console.error(`Error DNI ${dni}:`, err);
//         return null;
//       }
//     });

//     const nombresArray = await Promise.all(promesas);

//     // Mapear resultados a objeto
//     const nombres = {};
//     dnisUnicos.forEach((dni, index) => {
//         nombres[dni] = nombresArray[index] || 'Nombre no encontrado';
//     });

//     // 🆕 OCULTAR PROGRESO (éxito)
//     progressBar.style.width = '100%';
//     progressText.textContent = '¡Nombres cargados!';

//     // Generar tabla...
//     generarTablaConNombres(allSubjects, sujetosPorDni, nombres, tbody);

//   } catch (err) {
//     console.error('Error cargando nombres:', err);
//     progressText.textContent = 'Error cargando nombres';
//     progressBar.style.background = 'red';

//     setTimeout(() => {
//       progressContainer.style.display = 'none';
//     }, 2000);
//     return;
//   }

//   // 🆕 LIMPIAR BARRA
//   setTimeout(() => {
//     progressContainer.style.display = 'none';
//     progressText.style.display = 'none';
//     progressBar.style.width = '0%';
//     progressBar.style.background = 'linear-gradient(90deg, #4caf50, #81c784)';
//   }, 1500);
// }

async function llenarTablaSujetos(allSubjects) {
  const tbody = document.getElementById("ts-sujetos-body");

  // 🆕 MOSTRAR BARRA DE PROGRESO
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  progressContainer.style.display = "block";
  progressText.style.display = "inline";
  progressBar.style.width = "0%";
  progressText.textContent = "Cargando nombres...";

  try {
    // Agrupar por DNI
    const sujetosPorDni = {};
    allSubjects.forEach((sujeto) => {
      if (!sujetosPorDni[sujeto.dni]) {
        sujetosPorDni[sujeto.dni] = [];
      }
      sujetosPorDni[sujeto.dni].push(sujeto);
    });

    // Obtener DNIs únicos
    const dnisUnicos = Object.keys(sujetosPorDni);

    const total = dnisUnicos.length;
    let completadas = 0;
    progressText.textContent = `Obteniendo ${total} nombres... 0%`;

    // 🆕 Fetch único usando window.config.apiUrl
    const response = await fetch(`${window.config.apiUrl}/mgifixed/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dnis: dnisUnicos })
    });

    if (!response.ok) throw new Error("Error en la API");

    const data = await response.json(); // [{dni, fullname}, ...]

    // Mapear DNI → fullname
    const nombres = {};
    data.forEach((item) => {
      nombres[item.dni] = item.fullname || "Nombre no encontrado";
    });

    // 🆕 Actualizar barra de progreso mientras procesamos los DNIs
    dnisUnicos.forEach((dni) => {
      completadas++;
      const percent = Math.round((completadas / total) * 100);
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `Obteniendo ${total} nombres... ${percent}%`;
    });

    // Generar tabla con los nombres
    generarTablaConNombres(allSubjects, sujetosPorDni, nombres, tbody);

    // 🆕 OCULTAR PROGRESO (éxito)
    progressBar.style.width = "100%";
    progressText.textContent = "¡Nombres cargados!";
  } catch (err) {
    console.error("Error cargando nombres:", err);
    progressText.textContent = "Error cargando nombres";
    progressBar.style.background = "red";
    setTimeout(() => {
      progressContainer.style.display = "none";
    }, 2000);
    return;
  }

  // 🆕 LIMPIAR BARRA
  setTimeout(() => {
    progressContainer.style.display = "none";
    progressText.style.display = "none";
    progressBar.style.width = "0%";
    progressBar.style.background = "linear-gradient(90deg, #4caf50, #81c784)";
  }, 1500);
}

// 🆕 FUNCIÓN AUXILIAR (extraer lógica tabla)
function generarTablaConNombres(allSubjects, sujetosPorDni, nombres, tbody) {
  let htmlFilas = "";
  let rowspanPorDni = {};

  allSubjects.forEach((sujeto) => {
    const estado = sujeto.hastaDondeLlego === "4.4" ? "Completado" : "En curso";
    const fechaFormateada = formatearFechaHora(sujeto.savedate) || "Sin fecha";
    const dni = sujeto.dni;

    if (!rowspanPorDni[dni]) {
      const totalFilasDni = sujetosPorDni[dni].length;
      rowspanPorDni[dni] = totalFilasDni;

      htmlFilas += `
        <tr>
          <td rowspan="${totalFilasDni}">${dni}</td>
          <td rowspan="${totalFilasDni}">${nombres[dni]}</td>
          <td>${estado}</td>
          <td>${sujeto.hastaDondeLlego}</td>
          <td>${fechaFormateada}</td>
          <td class="ts-actions">
            <img src="images/icon-delete.png" 
                 alt="Eliminar" 
                 class="ts-icon-delete" 
                 title="Eliminar sujeto"
                 data-dni="${dni}"
                 data-mgivarid="${sujeto.mgivarId}">
          </td>
        </tr>
      `;
    } else {
      htmlFilas += `
        <tr>
          <td>${estado}</td>
          <td>${sujeto.hastaDondeLlego}</td>
          <td>${fechaFormateada}</td>
          <td class="ts-actions">
            <img src="images/icon-delete.png" 
                 alt="Eliminar" 
                 class="ts-icon-delete" 
                 title="Eliminar sujeto"
                 data-dni="${dni}"
                 data-mgivarid="${sujeto.mgivarId}">
          </td>
        </tr>
      `;
      rowspanPorDni[dni]--;
    }
  });

  tbody.innerHTML = htmlFilas;

  async function getMgivarCountByDni(dni) {
    try {
      const response = await fetch(
        `${window.config.apiUrl}/mgivar/count-by-dni`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ dni })
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (!data.success) {
        console.error("API error:", data.message);
        return 0;
      }

      return data.count; // Ej: 3 registros para ese DNI
    } catch (err) {
      console.error("Error contando mgivar:", err);
      return 0;
    }
  }

  async function deleteMgivarById(mgivarId) {
    try {
      const response = await fetch(
        `${window.config.apiUrl}/mgivar/${mgivarId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ userid: window.currentUser.userid }) // ✅ SIN **
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Error desconocido");
      }

      console.log("✅ Mgivar eliminado:", data.message);
      return data;
    } catch (err) {
      console.error("❌ Error eliminando mgivar:", err);
      throw err;
    }
  }

  async function deleteMgifixedByDni(mgifixedDni) {
    try {
      const response = await fetch(
        `${window.config.apiUrl}/mgifixed/dni/${mgifixedDni}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ userid: window.currentUser.userid }) // ✅ SIN **
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Error desconocido");
      }

      console.log("✅ Mgifixed eliminado:", data.message);
      return data;
    } catch (err) {
      console.error("❌ Error eliminando mgifixed:", err);
      throw err;
    }
  }

  // Event listeners
  document.querySelectorAll(".ts-icon-delete").forEach((icon) => {
    icon.addEventListener("click", async function () {
      const dni = this.dataset.dni;
      console.log(this.dataset);
      const mgivarId = this.dataset.mgivarid;
      if (confirm(`¿Eliminar ${dni} (ID: ${mgivarId})?`)) {
        const countdni = await getMgivarCountByDni(dni);
        if (countdni > 1) {
          //eliminar solo en mgivar
          try {
            await deleteMgivarById(mgivarId);
            await updateAllData(); // Refresca tabla + gráficos
            console.log("Eliminado:", { dni, mgivarId });
          } catch (err) {
            alert("Error: " + err.message);
          }
        } else {
          // solo hay 1. Eliminar de mgifixed
          try {
            await deleteMgifixedByDni(dni);
            await updateAllData(); // Refresca todo
            console.log("Eliminado:", { dni });
          } catch (err) {
            alert("Error: " + err.message);
          }
        }
      }
    });
  });
}

/**
 * Llena la tabla de desempeño con datos de usermgivar y usermrrp44
 */
async function llenarTablaDesempeno(usermgivar, usermrrp44) {
  const tbody = document.getElementById("ts-desempeno-body");

  // Crear mapa de mrrp44 para búsqueda rápida
  const mrrp44Map = {};
  usermrrp44.forEach((user) => {
    mrrp44Map[user.username] = user.totalDnisDistintos;
  });

  // Generar filas HTML
  let htmlFilas = "";

  usermgivar.forEach((user) => {
    const completas = mrrp44Map[user.username] || 0;
    const casosAtendidos = user.totalDnisDistintos;
    const enCurso = casosAtendidos - completas;

    htmlFilas += `
      <tr>
        <td>${user.username}</td>
        <td>${casosAtendidos}</td>
        <td>${completas}</td>
        <td>${enCurso}</td>
      </tr>
    `;
  });

  tbody.innerHTML = htmlFilas;
}

//  * Deshabilita/Habilita todos los iconos de borrar
//  * @param {boolean} deshabilitar - true = deshabilitar clicks, false = habilitar

function toggleIconosBorrar(deshabilitar) {
  document.querySelectorAll(".ts-icon-delete").forEach((icon) => {
    if (deshabilitar) {
      // ❌ DESHABILITAR
      icon.style.opacity = "0.3";
      icon.style.pointerEvents = "none"; // Bloquea clicks
      icon.style.cursor = "not-allowed";
      icon.title = "Sin permisos para eliminar";
    } else {
      // ✅ HABILITAR
      icon.style.opacity = "";
      icon.style.pointerEvents = "";
      icon.style.cursor = "pointer";
      icon.title = "Eliminar sujeto";
    }
  });
}

async function updateAllData() {
  if (filtroActivo?.scope === "CDO" && filtroActivo.value?.includes("::")) {
    filtroActivo.value = filtroActivo.value.split("::")[1];
  }

  await getMgivarAndMrrp44Stats();

  await getMgivarCagePromedio();

  await getEstudiosPorSujeto();

  const edulevelCounts = await getEdullevelCounts();
  updatePieNivel(edulevelCounts);

  const sexData = await getSexCounts();
  updateBarSexo(sexData);

  const skincolorData = await getSkinColorCounts();
  updateBarPiel(skincolorData);

  const allSubjects = await getEstadoActualPorUsuario();

  await llenarTablaSujetos(allSubjects);

  const usermgivar = await getMgivarUserStats();

  const usermrrp44 = await getMrrp44UserStats();

  await llenarTablaDesempeno(usermgivar, usermrrp44);
}
/**
 * Muestra el modal del Tablero de Sujetos
 */
async function showTsModal() {
  const modal = document.getElementById("ts-overlay");
  if (modal) {
    configurarPermisosScope();
    await updateAllData();

    if (
      window.puede("sujeto_editar_listado_cdo") ||
      window.puede("sujeto_editar_listado_provincia") ||
      window.puede("sujeto_editar_nivel_nacional")
    ) {
      toggleIconosBorrar(false);
    } else {
      toggleIconosBorrar(true);
    }

    modal.classList.remove("d-none");
  }
}

/* =====================================================
   🧠 TABLERO DE SUJETOS – MÓDULO JS
   ===================================================== */

let pieNivelChart = null;
let barCdoChart = null;
let barSexoChart = null;
let barPielChart = null;

/* =====================================================
   INIT
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initCharts();
  bindUI();

  document.addEventListener("subjectspanelevent", async () => {
    await showTsModal();
  });

  childLoader.addEventListener("click", async (event) => {
    await showTsModal();
  });

  // Cada vez que cambie un radio, actualiza el select
  document.querySelectorAll('input[name="ts-scope"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      actualizarSelectSegunRadio();
    });
  });

  // Capturar cambios del select de scope
  const selectScope = document.getElementById("ts-scope-select");
  if (selectScope) {
    selectScope.addEventListener("change", async (e) => {
      const value = e.target.value;
      const radioActivo = document.querySelector(
        'input[name="ts-scope"]:checked'
      );
      filtroActivo.scope = radioActivo
        ? radioActivo.value.toUpperCase()
        : "CDO";
      filtroActivo.value = value;
      await updateAllData(); // 🔁 Actualiza toda la data según el nuevo filtro
    });
  }
});

/* =====================================================
   EVENTOS UI
   ===================================================== */
function bindUI() {
  const closeBtns = [
    document.getElementById("ts-close"),
    document.getElementById("ts-close-footer")
  ];

  closeBtns.forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", closeModal);
    }
  });
}

function closeModal() {
  document.getElementById("ts-overlay")?.classList.add("d-none");
}

/* =====================================================
   INICIALIZACIÓN DE GRÁFICOS
   ===================================================== */
function initCharts() {
  initPieNivel();
  // initBarCdo();
  initBarSexo();
  initBarPiel();
}

/* =====================================================
   PIE – NIVEL EDUCATIVO
   ===================================================== */
async function getEdullevelCounts() {
  try {
    const response = await fetch(
      `${window.config.apiUrl}/stats/edulevel-counts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ filtroActivo }) // 👈 aquí viaja el filtro
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!data.success) {
      console.error("API error");
      return [0, 0, 0, 0, 0, 0];
    }

    return data.counts;
  } catch (err) {
    console.error("Error:", err);
    return [0, 0, 0, 0, 0, 0];
  }
}

async function initPieNivel() {
  const ctx = document.getElementById("ts-pie-nivel");
  if (!ctx) return;

  pieNivelChart = new Chart(ctx, {
    type: "pie", //doughnut
    data: {
      labels: ["PI", "EP", "SB", "PU", "ETP", "EO"],
      datasets: [
        {
          data: await getEdullevelCounts(),
          backgroundColor: [
            "#1abc9c",
            "#3498db",
            "#9b59b6",
            "#f1c40f",
            "#e67e22",
            "#e74c3c"
          ]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          enabled: true,
          callbacks: {
            title: function (context) {
              return "Nivel educativo";
            },
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const sum = context.chart.data.datasets[0].data.reduce(
                (a, b) => a + b,
                0
              );
              // const percentage = ((value / sum) * 100).toFixed(1);

              return `${label}: ${value}`;
            }
            //   footer: function() {
            //     return 'Datos actualizados 2026';
            //   }
          }
        },
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

/* =====================================================
   BARRAS – CDO / PROVINCIA / PAÍS
   ===================================================== */
function initBarCdo() {
  const ctx = document.getElementById("ts-bar-cdo");
  if (!ctx) return;

  barCdoChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["CDO 1", "CDO 2", "CDO 3"],
      datasets: [
        {
          label: "Educandos",
          data: [25, 18, 12],
          backgroundColor: "#3498db"
        }
      ]
    },
    options: baseBarOptions()
  });
}

/* =====================================================
   BARRAS – SEXO
   ===================================================== */

async function getSexCounts() {
  try {
    const response = await fetch(`${window.config.apiUrl}/stats/sex-counts`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ filtroActivo })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!data.success) {
      console.error("API error");
      return [0, 0]; // [Femenino, Masculino]
    }

    return data.counts;
  } catch (err) {
    console.error("Error:", err);
    return [0, 0];
  }
}

async function initBarSexo() {
  const ctx = document.getElementById("ts-bar-sexo");
  if (!ctx) return;
  const sexData = await getSexCounts();
  barSexoChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Femenino", "Masculino"],
      datasets: [
        {
          label: "Educandos",
          data: sexData,
          backgroundColor: ["#e84393", "#0984e3"]
        }
      ]
    },
    options: baseBarOptions()
  });
}

/* =====================================================
   BARRAS – COLOR DE PIEL
   ===================================================== */

async function getSkinColorCounts() {
  try {
    const response = await fetch(
      `${window.config.apiUrl}/stats/skincolor-counts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ filtroActivo })
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!data.success) {
      console.error("API error");
      return [0, 0, 0]; // [Blanca, Mestiza, Negra]
    }

    return data.counts;
  } catch (err) {
    console.error("Error:", err);
    return [0, 0, 0];
  }
}

async function initBarPiel() {
  const ctx = document.getElementById("ts-bar-piel");
  if (!ctx) return;
  const skincolorData = await getSkinColorCounts();
  barPielChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Blanca", "Mestiza", "Negra"],
      datasets: [
        {
          label: "Educandos",
          data: skincolorData,
          backgroundColor: ["#ecf0f1", "#d35400", "#2c3e50"]
        }
      ]
    },
    options: baseBarOptions()
  });
}

/* =====================================================
   OPCIONES BASE PARA BARRAS
   ===================================================== */
function baseBarOptions() {
  return {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };
}

/* =====================================================
   API DE ACTUALIZACIÓN (PARA BACKEND)
   ===================================================== */

/**
 * Actualiza el pie de nivel educativo
 */
function updatePieNivel(dataArray) {
  if (!pieNivelChart || !Array.isArray(dataArray)) return;

  // Asegura que la longitud coincida con la original o recorta/extiende
  const longitudOriginal = pieNivelChart.data.datasets[0].data.length;
  const nuevosDatos = dataArray.slice(0, longitudOriginal); // Recorta si es más largo

  pieNivelChart.data.datasets[0].data = nuevosDatos;

  // Sincroniza etiquetas si existen (ajusta índice si hay múltiples datasets)
  if (
    pieNivelChart.data.labels &&
    pieNivelChart.data.labels.length === longitudOriginal
  ) {
    // Opcionalmente actualiza etiquetas aquí, ej: pieNivelChart.data.labels = nuevasEtiquetas;
  }

  pieNivelChart.update("none"); // 'none' omite animación para actualización instantánea [web:7]
}

/**
 * Actualiza barras por CDO / Provincia / País
 */
function updateBarCdo(labels, dataArray) {
  if (!barCdoChart) return;
  barCdoChart.data.labels = labels;
  barCdoChart.data.datasets[0].data = dataArray;
  barCdoChart.update();
}

/**
 * Actualiza barras por sexo
 */
function updateBarSexo(dataArray) {
  if (!barSexoChart) return;
  barSexoChart.data.datasets[0].data = dataArray;
  barSexoChart.update();
}

/**
 * Actualiza barras por color de piel
 */
function updateBarPiel(dataArray) {
  if (!barPielChart) return;
  barPielChart.data.datasets[0].data = dataArray;
  barPielChart.update();
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("ts-icon-delete")) {
    const row = e.target.closest("tr");
    const dni = row?.children[0]?.textContent;

    console.log("Eliminar sujeto DNI:", dni);

    // Aquí llamas tu API o confirmación
    // confirmarEliminar(dni);
  }
});

async function getMgivarAndMrrp44Stats() {
  try {
    // Enviar filtroActivo al backend
    const response = await fetch(
      `${window.config.apiUrl}/stats/mgivar-mrrp44`,
      {
        method: "POST", // ✅ CAMBIADO A POST para enviar datos
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ filtroActivo }) // ✅ Enviar filtroActivo
      }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error("Error lógico en la API:", data.error);
      return { mgivarCount: 0, mrrp44Count: 0 };
    }

    const { mgivarCount, mrrp44Count } = data;

    // Actualizar DIVs automáticamente
    document.getElementById("ts-metric-completas").textContent = mrrp44Count;
    const enCurso = mgivarCount - mrrp44Count;
    document.getElementById("ts-metric-curso").textContent = enCurso;

    return { mgivarCount, mrrp44Count };
  } catch (err) {
    console.error("Error al obtener estadísticas:", err);

    // Actualizar con 0 en caso de error
    document.getElementById("ts-metric-completas").textContent = 0;
    document.getElementById("ts-metric-curso").textContent = 0;

    return { mgivarCount: 0, mrrp44Count: 0 };
  }
}

async function getMgivarCagePromedio() {
  try {
    // Enviar filtroActivo al backend
    const response = await fetch(
      `${window.config.apiUrl}/stats/mgivar-cage-average`,
      {
        method: "POST", // ✅ CAMBIADO A POST
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ filtroActivo }) // ✅ Enviar filtroActivo
      }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error("Error lógico en la API:", data.error);
      return 0;
    }

    const { cagePromedio } = data;

    // Actualizar DIV específico
    const elemento = document.getElementById("ts-metric-desechadas");
    if (elemento) {
      elemento.textContent = cagePromedio;
    }

    return cagePromedio;
  } catch (err) {
    console.error("Error al obtener promedio de cage:", err);

    // Actualizar con 0 en caso de error
    const elemento = document.getElementById("ts-metric-desechadas");
    if (elemento) {
      elemento.textContent = 0;
    }

    return 0;
  }
}

async function getEstudiosPorSujeto() {
  try {
    // Enviar filtroActivo al backend
    const response = await fetch(
      `${window.config.apiUrl}/stats/estudios-por-sujeto`,
      {
        method: "POST", // ✅ CAMBIADO A POST
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ filtroActivo }) // ✅ Enviar filtroActivo
      }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error("Error lógico en la API:", data.error);
      return 0;
    }

    const { promedioEstudios } = data;

    // Actualizar DIV "tiempo"
    const elemento = document.getElementById("ts-metric-tiempo");
    if (elemento) {
      elemento.textContent = `${promedioEstudios} estudios`;
    }

    return promedioEstudios;
  } catch (err) {
    console.error("Error al obtener promedio estudios:", err);

    // Actualizar con 0 en caso de error
    const elemento = document.getElementById("ts-metric-tiempo");
    if (elemento) {
      elemento.textContent = "0 estudios";
    }

    return 0;
  }
}

async function getEstadoActualPorUsuario() {
  try {
    // Enviar filtroActivo al backend
    const response = await fetch(
      `${window.config.apiUrl}/workflow/estado-actual`,
      {
        method: "POST", // ✅ CAMBIADO A POST
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ filtroActivo }) // ✅ Enviar filtroActivo
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!data.success) {
      console.error("API error:", data.error);
      return [];
    }

    return data.resultados; // ✅ Ya viene mapeado
  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
}

// async function getFullnameByDni(dni) {
//   try {
//     const response = await fetch(`${window.config.apiUrl}/mgifixed/${encodeURIComponent(dni)}`, {
//       method: 'GET',
//       headers: {
//         'Accept': 'application/json'
//       }
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}`);
//     }

//     const data = await response.json();

//     if (!data.success) {
//       console.error('API error:', data.message);
//       return null;
//     }
//     return data.fullname;
//   } catch (err) {
//     console.error('Error al obtener fullname por DNI:', err);
//     return null;
//   }
// }

// === FILTROS DE TABLA DE SUJETOS ===

document.addEventListener("DOMContentLoaded", () => {
  const filterDni = document.getElementById("filter-dni");
  const filterNombre = document.getElementById("filter-nombre");
  const filterEstado = document.getElementById("filter-estado");

  [filterDni, filterNombre, filterEstado].forEach((el) => {
    el.addEventListener("input", filtrarTablaSujetos);
    el.addEventListener("change", filtrarTablaSujetos);
  });
});

function filtrarTablaSujetos() {
  const dniValue = document.getElementById("filter-dni").value.toLowerCase();
  const nombreValue = document
    .getElementById("filter-nombre")
    .value.toLowerCase();
  const estadoValue = document.getElementById("filter-estado").value;

  document.querySelectorAll("#ts-sujetos-body tr").forEach((row) => {
    const celdas = row.querySelectorAll("td");
    const dni = (celdas[0]?.textContent || "").toLowerCase();
    const nombre = (celdas[1]?.textContent || "").toLowerCase();
    const estado = (celdas[2]?.textContent || "").toLowerCase();

    const coincideDni = dni.includes(dniValue);
    const coincideNombre = nombre.includes(nombreValue);
    const coincideEstado =
      !estadoValue || estado.includes(estadoValue.toLowerCase());

    // Si todos los filtros coinciden, mostrar
    if (coincideDni && coincideNombre && coincideEstado) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

// Al final de tu JS existente
[
  document.getElementById("filter-dni"),
  document.getElementById("filter-nombre"),
  document.getElementById("filter-estado")
].forEach((el) => {
  if (el) {
    el.addEventListener("input", filtrarTablaSujetos);
    el.addEventListener("change", filtrarTablaSujetos);
  }
});

/**
 * Obtiene TODOS los usernames únicos de mgivar + cantidad DNIs distintos por username
 */
async function getMgivarUserStats() {
  try {
    const response = await fetch(
      `${window.config.apiUrl}/mgivar/username-stats`,
      {
        method: "POST", // ✅ CAMBIADO A POST
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ filtroActivo }) // ✅ Enviar filtroActivo
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error("API error:", data.message);
      return [];
    }
    return data.stats; // [{username: "juan", totalDnisDistintos: 3}, ...]
  } catch (err) {
    console.error("Error al obtener stats mgivar:", err);
    return [];
  }
}

/**
 * Obtiene TODOS los usernames únicos de mrrp44 + cantidad DNIs distintos por username
 */
async function getMrrp44UserStats() {
  try {
    const response = await fetch(
      `${window.config.apiUrl}/mrrp44/username-stats`,
      {
        method: "POST", // ✅ CAMBIADO A POST
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ filtroActivo }) // ✅ Enviar filtroActivo
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error("API error:", data.message);
      return [];
    }
    return data.stats; // [{username: "maria", totalDnisDistintos: 2}, ...]
  } catch (err) {
    console.error("Error al obtener stats mrrp44:", err);
    return [];
  }
}
