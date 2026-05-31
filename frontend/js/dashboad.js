import { municipiosPorProvincia } from "./mgiscripts.js";

let filtroActivo = { scope: null, value: null };

function configurarPermisosScope() {
  if (
    window.tieneRol("admin") ||
    window.tieneRol("superadmin") ||
    window.puede("sujeto_ver_listado_nivel_nacional")
  ) {
    filtroActivo.scope = "PAIS";
    filtroActivo.value = null;
  } else {
    if (
      window.tieneRol("superv") ||
      window.puede("sujeto_ver_listado_provincia")
    ) {
      filtroActivo.scope = "PROVINCIA";
      filtroActivo.value = currentUser.province;
    } else {
      if (
        window.tieneRol("user") ||
        window.tieneRol("userextra") ||
        window.puede("sujeto_ver_listado_cdo")
      ) {
        filtroActivo.scope = "CDO";
        filtroActivo.value = currentUser.municipality;
      } else {
        filtroActivo.scope = null;
        filtroActivo.value = null;
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const dashFunnel = echarts.init(document.getElementById("dash-funnel-chart"));

  dashFunnel.setOption({
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} casos"
    },
    series: [
      {
        type: "funnel",
        minSize: "10%",
        maxSize: "80%",
        width: "80%",
        sort: "descending",
        gap: 6,
        label: {
          position: "inside",
          fontSize: 10,
          color: "#fff",
          formatter: "{b}: {c}"
        },
        itemStyle: {
          borderRadius: 6
        },
        data: [
          {
            value: 0,
            name: "Registrados",
            itemStyle: {
              color: "#880015"
            }
          },
          {
            value: 0,
            name: "En Eval.",
            itemStyle: {
              color: "#22B14C"
            }
          },
          {
            value: 0,
            name: "Prof. Diag.",
            itemStyle: {
              color: "#0C0ACC"
            }
          },
          {
            value: 0,
            name: "En mRRP",
            itemStyle: {
              color: "#FF7F27"
            }
          },
          {
            value: 0,
            name: "Altas",
            itemStyle: {
              color: "#13632B"
            }
          }
        ]
      }
    ]
  });

  window.addEventListener("resize", () => {
    dashFunnel.resize();
  });

  // Elementos DOM
  const provinceSelect = document.getElementById("dash-province");
  const municipioSelect = document.getElementById("dash-municipio");
  // const dateRangeInput = document.getElementById("dash-date-range");
  const dashSVG = document.getElementById("dash-svg-btn");
  const btnTC = document.getElementById("dash-btnTC");
  const ledTC = document.getElementById("dash-ledTC");

  // Variables de estado del dashboard
  let dashboardReady = false;
  let datosCargados = false;
  let apiRespondio = false;
  let especialistasDisponibles = false;

  // FUNCIONES DE CONTROL
  function habilitarControles() {
    if (!window.currentUser) {
      return;
    }

    const configuracion = {
      CDO: { provincia: true, municipio: true, datepicker: false },
      PROVINCIA: { provincia: true, municipio: false, datepicker: false },
      PAIS: { provincia: false, municipio: false, datepicker: false }
    };

    const config = configuracion[filtroActivo.scope] || configuracion.PAIS;

    // Siempre setear valores
    provinceSelect.value = window.currentUser.province;
    // provinceSelect.dispatchEvent(new Event("change"));//aqui
    municipioSelect.value = window.currentUser.municipality;

    // Aplicar configuración de disabled
    provinceSelect.disabled = config.provincia;
    municipioSelect.disabled = config.municipio;
  }

  // FUNCIÓN PRINCIPAL: Verificar si dashboard está listo
  function verificarDashboardReady() {
    //aqui
    dashboardReady = datosCargados && apiRespondio && especialistasDisponibles;

    if (dashboardReady) {
      // ✅ VERDE - Todo listo
      btnTC.disabled = false;
      ledTC.classList.add("verde");
      ledTC.style.backgroundColor = "#10b981";
      // habilitarControles();
      // console.log("✅ Dashboard listo!");
    } else {
      // ❌ ROJO - Algo falta
      btnTC.disabled = true;
      ledTC.classList.remove("verde");
      ledTC.style.backgroundColor = "#e33c3c";
      // habilitarControles();
      console.log("❌ Dashboard NO listo");
    }
  }

  async function obtenerEspecialistas(provincia, municipio) {
    try {
      const response = await fetch(
        `${window.config
          .apiUrl}/specialists-by-province-municipality/${encodeURIComponent(
          provincia
        )}/${encodeURIComponent(municipio)}`
      );

      const data = await response.json();

      if (data.success) {
        // console.log(`✅ ${data.total_especialistas} especialistas en ${data.province} - ${data.municipality}`);
        return data.total_especialistas;
      } else {
        // console.warn("⚠️ Sin datos:", data.message);
        return 0;
      }
    } catch (error) {
      console.error("❌ Error fetch especialistas:", error);
      return 0;
    }
  }

  async function obtenerEspecialistasPorProvincia(provincia) {
    try {
      const response = await fetch(
        `${window.config.apiUrl}/specialists-by-province/${encodeURIComponent(
          provincia
        )}`
      );

      const data = await response.json();

      if (data.success) {
        // console.log(`✅ ${data.total_especialistas} especialistas en ${provincia}`);
        return data.total_especialistas;
      } else {
        // console.warn("⚠️ Sin datos:", data.message);
        return 0;
      }
    } catch (error) {
      console.error("❌ Error fetch especialistas por provincia:", error);
      return 0;
    }
  }

  async function obtenerCasosMgivar(provincia, municipio) {
    try {
      const response = await fetch(
        `${window.config
          .apiUrl}/casos-mgivar-by-province-municipality/${encodeURIComponent(
          provincia
        )}/${encodeURIComponent(municipio)}`
      );

      const data = await response.json();

      if (data.success) {
        // console.log(`✅ ${data.total_casos} casos en ${data.province} - ${data.municipality}`);
        return data.total_casos;
      } else {
        // console.warn("⚠️ Sin datos:", data.message);
        return 0;
      }
    } catch (error) {
      console.error("❌ Error fetch casos mgivar:", error);
      return 0;
    }
  }

  async function obtenerCasosMgivarPorProvincia(provincia) {
    try {
      const response = await fetch(
        `${window.config.apiUrl}/casos-mgivar-by-province/${encodeURIComponent(
          provincia
        )}`
      );

      const data = await response.json();

      if (data.success) {
        // console.log(`✅ ${data.total_casos} casos en ${data.province}`);
        return data.total_casos;
      } else {
        // console.warn("⚠️ Sin datos:", data.message);
        return 0;
      }
    } catch (error) {
      console.error("❌ Error fetch casos mgivar:", error);
      return 0;
    }
  }

  async function obtenerTopNivelEducativoMgivar(provincia, municipio) {
    try {
      const response = await fetch(
        `${window.config
          .apiUrl}/mgivar-top-nivel-educativo/${encodeURIComponent(
          provincia
        )}/${encodeURIComponent(municipio)}`
      );

      const data = await response.json();

      if (data.success && data.top_nivel) {
        // console.log(`✅ Nivel educativo con más casos: ${data.top_nivel}`);
        return data.top_nivel; // Ej: "Educación Primaria (123)"
      } else {
        console.warn("⚠️ Sin datos de nivel educativo");
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetch top nivel educativo mgivar:", error);
      return null;
    }
  }

  async function obtenerTopNivelEducativoMgivarPorProvincia(provincia) {
    try {
      const response = await fetch(
        `${window.config
          .apiUrl}/mgivar-top-nivel-educativo-provincia/${encodeURIComponent(
          provincia
        )}`
      );

      const data = await response.json();

      if (data.success && data.top_nivel) {
        // console.log(`✅ Nivel educativo con más casos: ${data.top_nivel}`);
        return data.top_nivel; // Ej: "Educación Primaria (123)"
      } else {
        console.warn("⚠️ Sin datos de nivel educativo");
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetch top nivel educativo mgivar:", error);
      return null;
    }
  }

  async function obtenerCasosMrrp44ConMgivar(provincia, municipio) {
    try {
      const response = await fetch(
        `${window.config
          .apiUrl}/casos-mrrp44-mgivar-by-province-municipality/${encodeURIComponent(
          provincia
        )}/${encodeURIComponent(municipio)}`
      );

      const data = await response.json();

      if (data.success) {
        // console.log(`✅ ${data.total_casos} casos en ${data.province} - ${data.municipality}`);
        return data.total_casos;
      } else {
        console.warn("⚠️ Sin datos:", data.message);
        return 0;
      }
    } catch (error) {
      console.error("❌ Error fetch casos mrrp44 con mgivar:", error);
      return 0;
    }
  }

  async function obtenerCasosMrrp44ConMgivarPorProvincia(provincia) {
    try {
      const response = await fetch(
        `${window.config
          .apiUrl}/casos-mrrp44-mgivar-by-province/${encodeURIComponent(
          provincia
        )}`
      );

      const data = await response.json();

      if (data.success) {
        // console.log(`✅ ${data.total_casos} casos en ${data.province}`);
        return data.total_casos;
      } else {
        console.warn("⚠️ Sin datos:", data.message);
        return 0;
      }
    } catch (error) {
      console.error("❌ Error fetch casos mrrp44 con mgivar:", error);
      return 0;
    }
  }

  async function getMe31SinMe34Count(province, municipality) {
    const res = await fetch(
      `${window.config.apiUrl}/stats-funnel-me31-sin-me34`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          province,
          municipality
        })
      }
    );

    const data = await res.json();
    if (!data.success) {
      console.error("Error stats:", data.message);
      return 0;
    }
    return data.total;
  }

  async function getMe34SinMrrp41Count(province, municipality) {
    const res = await fetch(`${window.config.apiUrl}/stats-me34-sin-mrrp41`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        province,
        municipality
      })
    });

    const data = await res.json();
    if (!data.success) {
      console.error("Error stats me34-sin-mrrp41:", data.message);
      return 0;
    }
    return data.total;
  }

  async function getMrrp41SinMrrp44Count(province, municipality) {
    const res = await fetch(`${window.config.apiUrl}/stats-mrrp41-sin-mrrp44`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        province,
        municipality
      })
    });

    const data = await res.json();
    if (!data.success) {
      console.error("Error stats mrrp41-sin-mrrp44:", data.message);
      return 0;
    }
    return data.total;
  }

  async function getMrrp44Count(province, municipality) {
    const res = await fetch(`${window.config.apiUrl}/stats-mrrp44`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        province,
        municipality
      })
    });

    const data = await res.json();
    if (!data.success) {
      console.error("Error stats mrrp44:", data.message);
      return 0;
    }
    return data.total;
  }

  async function getDuracionPromedioMe34(province, municipality = "all") {
    const res = await fetch(
      `${window.config.apiUrl}/stats-duracion-me34-mgivar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          province,
          municipality
        })
      }
    );

    const data = await res.json();
    if (!data.success) {
      console.error("Error duración promedio:", data.message);
      return 0;
    }
    return data.dias_promedio;
  }

  async function getDuracionPromedioMrrp44(province, municipality = "all") {
    const res = await fetch(
      `${window.config.apiUrl}/stats-duracion-mrrp44-mrrp41`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          province,
          municipality
        })
      }
    );

    const data = await res.json();
    if (!data.success) {
      console.error("Error duración promedio MRRP44:", data.message);
      return 0;
    }
    return data.dias_promedio;
  }

  function actualizarTiempos(diasEval, diasResultados, diasTotal) {
    // Actualiza cada <b> por separado
    document.querySelector(
      ".dash-times span:nth-child(1) b"
    ).textContent = `${diasEval} días`;
    document.querySelector(
      ".dash-times span:nth-child(2) b"
    ).textContent = `${diasResultados} días`;
    document.querySelector(
      ".dash-times span:nth-child(3) b"
    ).textContent = `${diasTotal} días`;
  }

  async function updateData() {
    try {
      // 📊 CARGAR DATOS GENERALES
      const especialistas = await obtenerEspecialistas(
        provinceSelect.value,
        municipioSelect.value
      );

      const subreg = await obtenerCasosMgivar(
        provinceSelect.value,
        municipioSelect.value
      );

      const topedulevel = await obtenerTopNivelEducativoMgivar(
        provinceSelect.value,
        municipioSelect.value
      );

      const estudiosterminados = await obtenerCasosMrrp44ConMgivar(
        provinceSelect.value,
        municipioSelect.value
      );

      actualizarKPIs(especialistas, subreg, topedulevel, estudiosterminados);

      // 🚀 FUNNEL - PARALELO para ser más rápido
      const [
        totalEval,
        totalProfDiag,
        totalmRRP,
        totalReady
      ] = await Promise.all([
        getMe31SinMe34Count(provinceSelect.value, municipioSelect.value),
        getMe34SinMrrp41Count(provinceSelect.value, municipioSelect.value),
        getMrrp41SinMrrp44Count(provinceSelect.value, municipioSelect.value),
        getMrrp44Count(provinceSelect.value, municipioSelect.value)
      ]);

      // Actualizar funnel
      dashFunnel.setOption({
        series: [
          {
            data: [
              { value: subreg, name: "Registrados" },
              { value: totalEval, name: "En Eval." },
              { value: totalProfDiag, name: "Prof. Diag." },
              { value: totalmRRP, name: "En mRRP" },
              { value: totalReady, name: "Altas" }
            ]
          }
        ]
      });
      dashFunnel.resize();

      // ⏱️ DURACIONES
      const [evalProm, mrrpProm] = await Promise.all([
        getDuracionPromedioMe34(provinceSelect.value, municipioSelect.value),
        getDuracionPromedioMrrp44(provinceSelect.value, municipioSelect.value)
      ]);
      const diasPromTotal = evalProm + mrrpProm;
      actualizarTiempos(evalProm, mrrpProm, diasPromTotal);

      // 🔥 ✅ AQUÍ: Las APIs TERMINARON de responder
      apiRespondio = true; // ← ENCENDER LUZ 2
      datosCargados = true; // ← ENCENDER LUZ 1
      verificarDashboardReady(); // ← REVISAR SEMÁFORO

      // console.log("✅ updateData() completada!");
    } catch (error) {
      console.error("❌ Error en updateData():", error);

      // Si hay error → APIs NO respondieron
      apiRespondio = false; // ← LUZ 2 ROJA
      verificarDashboardReady(); // ← REVISAR SEMÁFORO
    }
  }

  // FUNCIÓN PARA ACTUALIZAR LOS KPIs
  function actualizarKPIs(especialistas, ninosRegistrados, bajas, cerrados) {
    // Selecciona todos los <strong> dentro de .dash-kpi-row en orden
    const kpiStrongElements = document.querySelectorAll(
      ".dash-kpi-row .dash-kpi strong"
    );

    // Actualiza cada uno por posición (0=Especialistas, 1=Niños, 2=Bajas, 3=Cerrados)
    if (kpiStrongElements[0]) kpiStrongElements[0].textContent = especialistas;
    if (kpiStrongElements[1])
      kpiStrongElements[1].textContent = ninosRegistrados;
    if (kpiStrongElements[2]) kpiStrongElements[2].textContent = bajas;
    if (kpiStrongElements[3]) kpiStrongElements[3].textContent = cerrados;
  }

  // SIMULACIÓN DE CARGA (reemplaza con tus APIs reales)
  async function CargaDatos() {
    if (filtroActivo.scope === "CDO") {
      provinceSelect.value = currentUser.province;
      provinceSelect.dispatchEvent(new Event("change"));
      municipioSelect.value = currentUser.municipality;
      provinceSelect.disabled = true;
      municipioSelect.disabled = true;
      // console.log("CDO");
      await updateData();
    } else if (filtroActivo.scope === "PROVINCIA") {
      provinceSelect.value = currentUser.province;
      provinceSelect.dispatchEvent(new Event("change"));
      municipioSelect.value = currentUser.municipality;
      provinceSelect.disabled = true;
      municipioSelect.disabled = false;
      // console.log("PROVINCA");
      await updateData();
    } else if (filtroActivo.scope === "PAIS") {
      // console.log("PAIS");
      provinceSelect.value = currentUser.province;
      provinceSelect.dispatchEvent(new Event("change"));
      municipioSelect.value = currentUser.municipality;
      provinceSelect.disabled = false;
      municipioSelect.disabled = false;

      await updateData();
    }
  }

  // FUNCIONES SVG
  function updateDashBars(data) {
    const bars = dashSVG.querySelectorAll(".dash-bar");
    bars[0].setAttribute("height", data.registeredHeight);
    bars[1].setAttribute("height", data.evaluationHeight);
    bars[2].setAttribute("height", data.resultsHeight);
  }

  function updateKidsStatus(statusArray) {
    const kids = dashSVG.querySelectorAll(".dash-kid");
    kids.forEach((kid, i) => {
      kid.setAttribute("fill", statusArray[i]);
    });
  }

  function updateSpecialistsStatus(statusArray) {
    const specialists = dashSVG.querySelectorAll(".dash-specialist");
    specialists.forEach((spec, i) => {
      spec.setAttribute("fill", statusArray[i]);
    });
  }

  // Cargar provincias
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "Todas";
  provinceSelect.appendChild(allOption);

  Object.keys(municipiosPorProvincia).forEach(prov => {
    const option = document.createElement("option");
    option.value = prov;
    option.textContent = prov;
    provinceSelect.appendChild(option);
  });

  // Evento al cambiar provincia
  provinceSelect.addEventListener("change", async () => {
    const selected = provinceSelect.value;

    if (selected === "all") {
      municipioSelect.innerHTML = '<option value="all">Todos</option>';
      municipioSelect.disabled = true;

      await updateData(); //aqui

      datosCargados = true;
      verificarDashboardReady();
      return; //aqui
    }

    municipioSelect.disabled = false;
    municipioSelect.innerHTML = '<option value="all">Todos</option>';
    municipiosPorProvincia[selected].forEach(mun => {
      const option = document.createElement("option");
      option.value = mun;
      option.textContent = mun;
      municipioSelect.appendChild(option);
    });
    await updateData();
  });

  municipioSelect.addEventListener("change", async () => {
    await updateData();
    datosCargados = true;
    verificarDashboardReady();
  });

  // Inicializar estados SVG
  updateDashBars({
    registeredHeight: 60,
    evaluationHeight: 70,
    resultsHeight: 50
  });
  updateKidsStatus(["#10b981", "#f59e0b"]);
  updateSpecialistsStatus(["#3b82f6", "#6366f1"]);

  // ESTADO INICIAL: TODO ROJO Y DESHABILITADO
  habilitarControles();
  verificarDashboardReady();
  CargaDatos();

  // EVENTOS JQUERY
  $(document).on("dashboard-newuserevent", async function() {
    configurarPermisosScope();
    habilitarControles();
    datosCargados = true;
    especialistasDisponibles =
      window.tieneRol("superadmin") ||
      window.tieneRol("admin") ||
      window.tieneRol("superv") ||
      window.puede("acceso_tablero_control");
    verificarDashboardReady();
    await CargaDatos();
    await updateData();
  });

  $(document).on("dashboard-userlogoutevent", function() {
    habilitarControles();
    // Resetear estados para próximo login
    datosCargados = false;
    apiRespondio = false;
    especialistasDisponibles = false;
    verificarDashboardReady();
  });

  btnTC.addEventListener("click", function(event) {
    console.log("🚀 ¡Mostrar en Tablero de Control!");
  });
});
