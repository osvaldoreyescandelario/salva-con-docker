import { municipiosPorProvincia } from './mgiscripts.js';

let filtroActivo = { scope: null, value: null };

async function exportarSeccionActivaAPDF() {
  const seccion = document.querySelector('.std-section:not(.std-hidden)');
  if (!seccion) {
    alert('No hay sección visible para exportar');
    return;
  }

  /* =====================================================
     0. window.scrollTo(0,0) + EXPANDIR tablas AGRESIVO
  ===================================================== */
  window.scrollTo(0, 0); // ← CRÍTICO: viewport arriba
  
  const tablasScroll = seccion.querySelectorAll('.tabla-scroll');
  const estadosTablas = [];

  tablasScroll.forEach(el => {
    estadosTablas.push({
      el,
      maxHeight: el.style.maxHeight,
      overflowY: el.style.overflowY,
      scrollTop: el.scrollTop
    });

    // ← MÁS AGRESIVO: fuerza VISIBILIDAD TOTAL
    el.style.cssText = `
      max-height: none !important;
      overflow-y: visible !important;
      height: auto !important;
      position: static !important;
    `;
    el.scrollTop = 0;
  });

  /* =====================================================
     1. Forzar gráficos ECharts (resize doble)
  ===================================================== */
  seccion.querySelectorAll('div[style*="height"]').forEach(el => {
    if (el.offsetWidth === 0) el.style.width = '100%';
    if (el.offsetHeight === 0) el.style.height = '350px';
    
    const chart = echarts.getInstanceByDom(el);
    if (chart) {
      chart.resize({ animation: false });
      setTimeout(() => chart.resize({ animation: false }), 100); // ← DOBLE RESIZE
    }
  });

  // Esperar MÁS tiempo para reflow + render
  await new Promise(r => setTimeout(r, 800));

  /* =====================================================
     2. html2canvas MEJORADO para scroll
  ===================================================== */
  const canvas = await html2canvas(seccion, {
    scale: 1.5, // ↑ CALIDAD
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
    width: seccion.scrollWidth,  // ← CAPTURA ANCHO COMPLETO
    height: seccion.scrollHeight, // ← CAPTURA ALTO COMPLETO
    ignoreElements: el =>
      el.tagName === 'IFRAME' ||
      el.tagName === 'VIDEO' ||
      (el.tagName === 'CANVAS' && (el.width === 0 || el.height === 0))
  });

  // Restaurar INMEDIATAMENTE
  estadosTablas.forEach(e => {
    e.el.style.maxHeight = e.maxHeight;
    e.el.style.overflowY = e.overflowY;
    e.el.scrollTop = e.scrollTop;
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92); // ↑ CALIDAD

  /* =====================================================
     3. PDF multi-página (igual que original)
  ===================================================== */
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginTop = 15, marginBottom = 15, marginLeft = 12, marginRight = 12;
  const usableWidth = pageWidth - marginLeft - marginRight;
  const usableHeight = pageHeight - marginTop - marginBottom;
  const imgHeight = (canvas.height * usableWidth) / canvas.width;
  let heightLeft = imgHeight, positionY = marginTop;

  // Primera página
  pdf.addImage(imgData, 'JPEG', marginLeft, positionY, usableWidth, imgHeight);
  heightLeft -= usableHeight;

  // Páginas adicionales
  while (heightLeft > 0) {
    pdf.addPage();
    positionY = marginTop - (imgHeight - heightLeft);
    pdf.addImage(imgData, 'JPEG', marginLeft, positionY, usableWidth, imgHeight);
    heightLeft -= usableHeight;
  }

  const scopeName = filtroActivo?.scope?.toLowerCase() || 'general';
  pdf.save(`estadisticas_${scopeName}.pdf`);
}


window.exportarSeccionActivaAPDF = exportarSeccionActivaAPDF;
// ****************** FETCH **************************
async function getEdullevelCounts(prov, mun) {
  const response = await fetch(`${window.config.apiUrl}/stats/edulevel-counts-prov-mun`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      province: prov,
      municipality: mun
    })
  });

  if (!response.ok) {
    throw new Error('Error al obtener estadísticas por nivel educativo');
  }

  const data = await response.json();
  return data; 
}

async function fetchEduLevelByProvince() {
  const res = await fetch(
    `${window.config.apiUrl}/stats/edulevel-by-province`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await res.json();

  if (!data.success) {
    throw new Error('Error obteniendo estadísticas');
  }

  return data;
}


async function fetchEduLevelByMunicipality({ province }) {
  const res = await fetch(
    `${window.config.apiUrl}/stats/edulevel-by-municipality`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ province })
    }
  );

  const data = await res.json();

  if (!data.success) {
    throw new Error('Error obteniendo estadísticas por municipio');
  }

  return data;
}
// -----------------
async function getEduLevelAge(prov, mun) {
  const response = await fetch(
    `${window.config.apiUrl}/stats/edulevel-age-prov-mun`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ province: prov, municipality: mun })
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error('Error obteniendo edades predominantes');
  }

  return data; // { ages: [..] }
}

async function fetchEduLevelAgeByMunicipality({ province }) {
  if (!province) {
    throw new Error('province es obligatoria');
  }

  const res = await fetch(
    `${window.config.apiUrl}/stats/edulevel-age-by-municipality`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ province })
    }
  );

  if (!res.ok) {
    throw new Error('Error HTTP obteniendo edades por municipio');
  }

  const data = await res.json();

  if (!data.success) {
    throw new Error('Error obteniendo edades predominantes por municipio');
  }

  /*
    data = {
      success: true,
      municipalities: [ 'Arroyo Naranjo', 'Boyeros', ... ],
      data2D: [
        [edadPI, edadEP, edadSB, edadIPU, edadETP, edadEO],
        ...
      ]
    }
  */

  return data;
}

async function fetchEduLevelAgeByProvince() {
  const res = await fetch(
    `${window.config.apiUrl}/stats/edulevel-age-by-province`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!res.ok) {
    throw new Error('Error HTTP obteniendo edades por provincia');
  }

  const data = await res.json();

  if (!data.success) {
    throw new Error('Error obteniendo edades predominantes por provincia');
  }

  /*
    data = {
      success: true,
      provinces: [ 'Artemisa', 'La Habana', ... ],
      data2D: [
        [edadPI, edadEP, edadSB, edadIPU, edadETP, edadEO],
        ...
      ]
    }
  */

  return data;
}

async function getTotalSex(prov, mun) {
  const response = await fetch(
    `${window.config.apiUrl}/stats/total-sex-prov-mun`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ province: prov, municipality: mun })
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error('Error obteniendo conteos por sexo');
  }

  return data; // { sexF: número, sexM: número }
}

async function fetchTotalSexByMunicipality({ province }) {
  if (!province) {
    throw new Error('province es obligatoria');
  }

  const res = await fetch(
    `${window.config.apiUrl}/stats/total-sex-by-municipality`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ province })
    }
  );

  if (!res.ok) {
    throw new Error('Error HTTP obteniendo conteos sexo por municipio');
  }

  const data = await res.json();

  if (!data.success) {
    throw new Error('Error obteniendo conteos sexo por municipio');
  }

  /*
    data = {
      success: true,
      municipalities: [ 'Arroyo Naranjo', 'Boyeros', ... ],
      data2D: [
        [sexF, sexM],  // Arroyo Naranjo
        [sexF, sexM],  // Boyeros
        ...
      ]
    }
  */

  return data;
}

async function fetchTotalSexByProvince() {
  const res = await fetch(
    `${window.config.apiUrl}/stats/total-sex-by-province`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!res.ok) {
    throw new Error('Error HTTP obteniendo conteos sexo por provincia');
  }

  const data = await res.json();

  if (!data.success) {
    throw new Error('Error obteniendo conteos sexo por provincia');
  }

  /*
    data = {
      success: true,
      provinces: [ 'Artemisa', 'La Habana', ... ],
      data2D: [
        [sexF, sexM],  // Artemisa
        [sexF, sexM],  // La Habana
        ...
      ]
    }
  */

  return data;
}

async function getTotalSkinColor(prov, mun) {
  const response = await fetch(
    `${window.config.apiUrl}/stats/total-skincolor-prov-mun`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ province: prov, municipality: mun })
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error('Error obteniendo conteos por color de piel');
  }

  return data; // { counts: [blanca, mestiza, negra] }
}

async function fetchTotalSkinColorByMunicipality({ province }) {
  if (!province) throw new Error('province es obligatoria');

  const res = await fetch(`${window.config.apiUrl}/stats/total-skincolor-by-municipality`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ province })
  });

  if (!res.ok) throw new Error('Error HTTP obteniendo skincolor por municipio');
  const data = await res.json();
  if (!data.success) throw new Error('Error obteniendo skincolor por municipio');

  return data; // { municipalities: [...], data2D: [[blanca,mestiza,negra], ...] }
}

async function fetchTotalSkinColorByProvince() {
  const res = await fetch(`${window.config.apiUrl}/stats/total-skincolor-by-province`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!res.ok) throw new Error('Error HTTP obteniendo skincolor por provincia');
  const data = await res.json();
  if (!data.success) throw new Error('Error obteniendo skincolor por provincia');

  return data; // { provinces: [...], data2D: [[blanca,mestiza,negra], ...] }
}

async function getZoneCounts(prov, mun) {
  const response = await fetch(
    `${window.config.apiUrl}/stats/zone-counts-prov-mun`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ province: prov, municipality: mun })
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error('Error obteniendo conteos por zona');
  }

  return data; // { urbana: número, rural: número }
}

async function fetchZoneByMunicipality({ province }) {
  if (!province) throw new Error('province es obligatoria');

  const res = await fetch(`${window.config.apiUrl}/stats/zone-by-municipality`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ province })
  });

  if (!res.ok) throw new Error('Error HTTP obteniendo zonas por municipio');
  const data = await res.json();
  if (!data.success) throw new Error('Error obteniendo zonas por municipio');

  return data; // { municipalities: [...], data2D: [[urbana,rural], ...] }
}

async function fetchZoneByProvince() {
  const res = await fetch(`${window.config.apiUrl}/stats/zone-by-province`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!res.ok) throw new Error('Error HTTP obteniendo zonas por provincia');
  const data = await res.json();
  if (!data.success) throw new Error('Error obteniendo zonas por provincia');

  return data; // { provinces: [...], data2D: [[urbana,rural], ...] }
}

async function getEconomicSituation(prov, mun) {
  const response = await fetch(
    `${window.config.apiUrl}/stats/economic-situation-prov-mun`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ province: prov, municipality: mun })
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error('Error obteniendo situación económica');
  }

  return data; // { counts: [muy_buena, buena, regular, mala, muy_mala] }
}

async function fetchEconomicSituationByMunicipality({ province }) {
  if (!province) throw new Error('province es obligatoria');

  const res = await fetch(`${window.config.apiUrl}/stats/economic-situation-by-municipality`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ province })
  });

  if (!res.ok) throw new Error('Error HTTP obteniendo situación económica por municipio');
  const data = await res.json();
  if (!data.success) throw new Error('Error obteniendo situación económica por municipio');

  return data; // { municipalities: [...], data2D: [[muy_buena,buena,regular,mala,muy_mala], ...] }
}

async function fetchEconomicSituationByProvince() {
  const res = await fetch(`${window.config.apiUrl}/stats/economic-situation-by-province`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  if (!res.ok) throw new Error('Error HTTP obteniendo situación económica por provincia');
  const data = await res.json();
  if (!data.success) throw new Error('Error obteniendo situación económica por provincia');

  return data; // { provinces: [...], data2D: [[muy_buena,buena,regular,mala,muy_mala], ...] }
}

async function getFieldLevel(prov, mun, field) {
  const response = await fetch(
    `${window.config.apiUrl}/stats/field-level-prov-mun`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ province: prov, municipality: mun, field })
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Error obteniendo datos ${field}`);
  }

  return data; // { counts: [alto, medio, bajo] }
}

async function fetchFieldLevelByMunicipality({ province, field }) {
  if (!province) throw new Error('province es obligatoria');
  if (!field) throw new Error('field es obligatorio');

  const res = await fetch(`${window.config.apiUrl}/stats/field-level-by-municipality`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ province, field })
  });

  if (!res.ok) throw new Error(`Error HTTP obteniendo ${field} por municipio`);
  const data = await res.json();
  if (!data.success) throw new Error(`Error obteniendo ${field} por municipio`);

  return data; // { success: true, municipalities: [...], data2D: [[alto,medio,bajo], ...] }
}

// const dataF11 = await fetchFieldLevelByMunicipality({province: window.currentUser.province, field: 'f11'});

async function fetchFieldLevelByProvince({ field }) {
  const res = await fetch(`${window.config.apiUrl}/stats/field-level-by-province`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field })
  });

  if (!res.ok) throw new Error(`Error HTTP obteniendo ${field} por provincia`);
  const data = await res.json();
  if (!data.success) throw new Error(`Error obteniendo ${field} por provincia`);

  return data; // { provinces: [...], data2D: [[alto,medio,bajo], ...] }
}

async function getTeacherTraining(prov, mun) {
  const response = await fetch(
    `${window.config.apiUrl}/stats/teacher-training-prov-mun`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ province: prov, municipality: mun })
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error('Error obteniendo formación docente');
  }

  return data; // { counts: [licenciado, master, doctor] }
}

async function fetchTeacherTrainingByMunicipality({ province }) {
  if (!province) throw new Error('province es obligatoria');

  const res = await fetch(`${window.config.apiUrl}/stats/teacher-training-by-municipality`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ province })
  });

  if (!res.ok) throw new Error('Error HTTP obteniendo formación docente por municipio');
  const data = await res.json();
  if (!data.success) throw new Error('Error obteniendo formación docente por municipio');

  return data; // { success: true, municipalities: [...], data2D: [[licenciado,master,doctor], ...] }
}

async function fetchTeacherTrainingByProvince() {
  const res = await fetch(`${window.config.apiUrl}/stats/teacher-training-by-province`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  if (!res.ok) throw new Error('Error HTTP obteniendo formación docente por provincia');
  const data = await res.json();
  if (!data.success) throw new Error('Error obteniendo formación docente por provincia');

  return data; // { provinces: [...], data2D: [[licenciado,master,doctor], ...] }
}

// const dataF11 = await fetchFieldLevelByProvince({ field: 'f11' });

// ***************************************************
let stdChart = null;
let stdTable = null;
let stdSubtituloNivel = null;

function agregarLeyenda(sectionId, htmlTexto) {
  const section = document.getElementById(sectionId);
  if (!section || !htmlTexto) return;

  // eliminar leyenda previa si existe
  const oldLegend = section.querySelector('.std-legend');
  if (oldLegend) oldLegend.remove();

  const legend = document.createElement('div');
  legend.className = 'std-legend';
  legend.innerHTML = htmlTexto;

  section.appendChild(legend);
}

function setMensajeNivelEducativo(texto) {
  if (stdSubtituloNivel) {
    stdSubtituloNivel.textContent = texto;
  }
}

// DRAG
const sidebar = document.querySelector('.std-sidebar');
const resizer = document.querySelector('.std-sidebar-resizer');

let isResizing = false;

function configurarPermisosScope() {
  if (window.tieneRol('admin') || window.tieneRol('superadmin') || window.puede('estadistica_nacion')) {
    filtroActivo.scope = 'PAIS';
    filtroActivo.value = null;
  } else {
    if (window.tieneRol('superv') || window.puede('estadistica_provincia')) {
      filtroActivo.scope = 'PROVINCIA';
      filtroActivo.value = currentUser.province;
    } else {
      if (window.tieneRol('user') || window.tieneRol('userextra') || window.puede('estadistica_cdo')) {
        filtroActivo.scope = 'CDO';
        filtroActivo.value = currentUser.municipality;
      } else {
        filtroActivo.scope = null;
        filtroActivo.value = null;
      }
    }
  }
}

resizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  document.body.style.cursor = 'ew-resize';
  document.addEventListener('mousemove', resizeSidebar);
  document.addEventListener('mouseup', stopResize);
});

function resizeSidebar(e) {
  if (!isResizing) return;

  const newWidth = e.clientX - sidebar.getBoundingClientRect().left;

  if (newWidth < 60) {
    sidebar.style.width = '40px';
    sidebar.classList.add('collapsed');
  } else {
    sidebar.style.width = `${Math.min(newWidth, 400)}px`;
    sidebar.classList.remove('collapsed');
  }

  resizeCharts();
}

function stopResize() {
  isResizing = false;
  document.body.style.cursor = 'default';
  document.removeEventListener('mousemove', resizeSidebar);
  document.removeEventListener('mouseup', stopResize);
}

function resizeCharts() {
  document.querySelectorAll('.grafico3d-wrapper').forEach(wrapper => {
    const chart = echarts.getInstanceByDom(wrapper);
    if (chart) chart.resize();
  });
}

/* ===================== MODAL ===================== */
$(document).on("estadevent", async function () {
  configurarPermisosScope();
  console.log({ filtroActivo });
  document.getElementById('stdModalOverlay').classList.add('mostrar');


  // Mostrar imagen por defecto en la primera sección
  const primeraSeccion = document.querySelector('.std-content .std-section');
  if (primeraSeccion) {
    primeraSeccion.classList.remove('std-hidden');  // Asegura que sea visible
    primeraSeccion.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; padding: 20px; text-align: center; background: #f8f9fa;">
        <img src="./images/estadisticas.webp" alt="Estadísticas" style="max-width: 90%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <p style="margin-top: 15px; color: #666; font-size: 16px;">Selecciona una sección en el listado a la izquierda para ver los datos</p>
      </div>
    `;
  }
});

function stdCerrarModal() {
  document.getElementById('stdModalOverlay').classList.remove('mostrar');

  document
    .querySelectorAll('.std-section')
    .forEach(sec => sec.classList.add('std-hidden'));

  if (btnExportarPDF) btnExportarPDF.style.display = 'none';
}


document.getElementById('stdBtnCerrar').onclick = stdCerrarModal;
document.getElementById('stdBtnCerrarFooter').onclick = stdCerrarModal;

/* ===================== SIDEBAR CLICK ===================== */
let section = null;
document.querySelectorAll('.std-sidebar-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.std-sidebar-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    section = item.dataset.section;
    stdMostrarSeccion(section);
  });
});


// Después de los event listeners existentes del sidebar
document.querySelectorAll('.std-sidebar-parent').forEach(parent => {
  parent.addEventListener('click', function(e) {
    e.stopPropagation();
    const group = this.closest('.std-sidebar-group, .std-sidebar-group-item');
    const sublist = this.nextElementSibling;
    group.classList.toggle('open');
    if (sublist) sublist.style.display = group.classList.contains('open') ? 'block' : 'none';
  });
});

/* ===================== MOSTRAR SECCIÓN ===================== */
const btnExportarPDF = document.getElementById('btnExportarPDF');

function actualizarVisibilidadBotonPDF() {
  const seccionVisible = document.querySelector('.std-section:not(.std-hidden)');
  btnExportarPDF.style.display = seccionVisible ? 'inline-flex' : 'none';
}

function stdMostrarSeccion(section) {
  // Ocultar todas
  document.querySelectorAll('.std-section').forEach(sec => sec.classList.add('std-hidden'));

  
  const targetId = `std-section-${section}`;
  const target = document.getElementById(targetId);

  // Limpiar imagen por defecto si existe
  const imgDefault = target.querySelector('img[alt="Estadísticas"]');
  if (imgDefault) imgDefault.closest('div').remove();
  
  if (!target) {
    console.error(`No existe el panel: ${targetId}`);
    return;
  }

  // Mostrar primero
  target.classList.remove('std-hidden');
  // Inicializar después de mostrar
  switch (section) {
      case "general-nivel-educativo":
        setTimeout(() => renderGeneral(target, getEduLevelData), 50);
        break;
      case "general-edad-identificacion":
        setTimeout(() => renderGeneral(target, getAgeData, false), 50);
        break; 
      case "general-sexo-identificacion":
        setTimeout(() => renderGeneral(target, getSexData), 50);
        break; 
      case "general-colorpiel-identificacion":
        setTimeout(() => renderGeneral(target, getSkinColorData), 50);
        break;
      case "general-zona-identificacion": 
        setTimeout(() => renderGeneral(target, getZoneData), 50);
        break;
      case "general-situacion-economica": 
        setTimeout(() => renderGeneral(target, getEconomicData), 50);
        break;
      case "general-potenciar-desarrollo": 
        // setTimeout(() => renderGeneral(target, getPotDesData), 50);
        break;
      case "indicador11": 
        setTimeout(() => renderGeneral(target, () => getPotDesData('f11')), 50);
        break;
      case "indicador12": 
        setTimeout(() => renderGeneral(target, () => getPotDesData('f12')), 50);
        break;
      case "indicador21": 
        setTimeout(() => renderGeneral(target, () => getPotDesData('f21')), 50);
        break;
      case "indicador22": 
        setTimeout(() => renderGeneral(target, () => getPotDesData('f22')), 50);
        break;
      case "indicador31": 
        setTimeout(() => renderGeneral(target, () => getPotDesData('f31')), 50);
        break;
      case "indicador32": 
        setTimeout(() => renderGeneral(target, () => getPotDesData('f32')), 50);
        break;
      case "indicador41": 
        setTimeout(() => renderGeneral(target, () => getPotDesData('f41')), 50);
        break;
      case "indicador42": 
        setTimeout(() => renderGeneral(target, () => getPotDesData('f42')), 50);
        break;
      case "indicador51": 
        setTimeout(() => renderGeneral(target, () => getPotDesData('f51')), 50);
        break;
      case "indicador52": 
        setTimeout(() => renderGeneral(target, () => getPotDesData('f52')), 50); 
        break;
    case "general-formacion-maestro": 
        setTimeout(() => renderGeneral(target, getTeacherData), 50);
        break;
  }
    
  actualizarVisibilidadBotonPDF();
}

const scopeSelect = document.createElement('select');
const provinceSelect = document.createElement('select');


function inicializarScopeSelect(scopeWrapper) {

  // Limpiar SOLO el contenido dinámico
  scopeWrapper.innerHTML = '';

  /* =====================================================
     MUNICIPIO / CDO
  ===================================================== */
  const municipioWrapper = document.createElement('div');
  municipioWrapper.style.display = 'flex';
  municipioWrapper.style.alignItems = 'center';
  municipioWrapper.style.gap = '8px';

  const municipioLabel = document.createElement('label');
  municipioLabel.textContent = 'CDO:';
  municipioLabel.style.fontWeight = 'bold';

  scopeSelect.innerHTML = '';
  scopeSelect.className = 'form-select';
  scopeSelect.style.width = '240px';

  const provinciaUsuario = window.currentUser.province;
  const municipios = municipiosPorProvincia[provinciaUsuario] || [];

  municipios.forEach(municipio => {
    const opt = document.createElement('option');
    opt.value = municipio;
    opt.textContent = municipio;
    scopeSelect.appendChild(opt);
  });
 
  // Selección inicial del CDO cuando el scope es PAIS
  if (filtroActivo.scope === 'PAIS' && window.currentUser.municipality) {
    scopeSelect.value = window.currentUser.municipality;
  }

  if (filtroActivo.scope === 'CDO' && filtroActivo.value) {
    scopeSelect.value = filtroActivo.value;
    scopeSelect.disabled = true;
  } else {
    scopeSelect.disabled = false;
  }

  scopeSelect.onchange = async (e) => {
    filtroActivo.value = e.target.value;

    let res = null;
    let dataValues = null;
     console.log('section:', section);
    switch (section) {
      case "general-nivel-educativo":
        res = await getEdullevelCounts(provinceSelect.value, scopeSelect.value);
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b']);
        break;
      case "general-edad-identificacion":
        res = await getEduLevelAge(provinceSelect.value, scopeSelect.value);
        res.counts = res.ages;
        delete res.ages;
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b']);
        break; 
      case "general-sexo-identificacion":
        res = await getTotalSex(provinceSelect.value, scopeSelect.value);
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#d62728']);
        break; 
      case "general-colorpiel-identificacion":
        res = await getTotalSkinColor(provinceSelect.value, scopeSelect.value);
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4', '#2ca02c', '#d62728']);
        break;
      case "general-zona-identificacion": 
        res = await getZoneCounts(provinceSelect.value, scopeSelect.value);
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4', '#d62728']);
        break;
      case "general-situacion-economica": 
        res = await getEconomicSituation(provinceSelect.value, scopeSelect.value);
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        console.log({ dataValues });
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd']);
        break; 
      case "indicador11": 
        res = await getFieldLevel(provinceSelect.value, scopeSelect.value, 'f11');
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        console.log({ dataValues });
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd']);
        break;
      case "indicador12": 
        res = await getFieldLevel(provinceSelect.value, scopeSelect.value, 'f12');
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        console.log({ dataValues });
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd']);
        break;
      case "indicador21": 
        res = await getFieldLevel(provinceSelect.value, scopeSelect.value, 'f21');
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        console.log({ dataValues });
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd']);
        break;
      case "indicador22": 
        res = await getFieldLevel(provinceSelect.value, scopeSelect.value, 'f22');
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        console.log({ dataValues });
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd']);
        break;
      case "indicador31": 
        res = await getFieldLevel(provinceSelect.value, scopeSelect.value, 'f31');
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        console.log({ dataValues });
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd']);
        break;
      case "indicador32": 
        res = await getFieldLevel(provinceSelect.value, scopeSelect.value, 'f32');
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        console.log({ dataValues });
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd']);
        break;
      case "indicador41": 
        res = await getFieldLevel(provinceSelect.value, scopeSelect.value, 'f41');
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        console.log({ dataValues });
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd']);
        break;
      case "indicador42": 
        res = await getFieldLevel(provinceSelect.value, scopeSelect.value, 'f42');
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        console.log({ dataValues });
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd']);
        break;
      case "indicador51": 
        res = await getFieldLevel(provinceSelect.value, scopeSelect.value, 'f51');
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        console.log({ dataValues });
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd']);
        break;
      case "indicador52": 
        res = await getFieldLevel(provinceSelect.value, scopeSelect.value, 'f52');
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        console.log({ dataValues });
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd']);
        break;
      case "general-formacion-maestro": 
        res = await getTeacherTraining(provinceSelect.value, scopeSelect.value);
        dataValues = Array.isArray(res?.counts) ? res.counts : [];
        console.log({ dataValues });
        if (stdTable) updateGeneralTabla(stdTable, dataValues);
        if (stdChart) updateGeneralGrafico(stdChart, dataValues, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd']);
        break;
    }
  };

  municipioWrapper.appendChild(municipioLabel);
  municipioWrapper.appendChild(scopeSelect);
  scopeWrapper.appendChild(municipioWrapper);
  /* =====================================================
     PROVINCIA (SOLO PAÍS)
  ===================================================== */
  if (filtroActivo.scope !== 'PAIS') return;

  const provinciaWrapper = document.createElement('div');
  provinciaWrapper.style.display = 'flex';
  provinciaWrapper.style.alignItems = 'center';
  provinciaWrapper.style.gap = '8px';
  provinciaWrapper.style.marginLeft = '20px';

  const provinciaLabel = document.createElement('label');
  provinciaLabel.textContent = 'Provincia:';
  provinciaLabel.style.fontWeight = 'bold';

  provinceSelect.innerHTML = '';
  provinceSelect.className = 'form-select';
  provinceSelect.style.width = '240px';

  Object.keys(municipiosPorProvincia).forEach(provincia => {
    const opt = document.createElement('option');
    opt.value = provincia;
    opt.textContent = provincia;
    if (provincia === provinciaUsuario) opt.selected = true;
    provinceSelect.appendChild(opt);
  });

  provinceSelect.onchange = () => {
    const nuevaProvincia = provinceSelect.value;

    scopeSelect.innerHTML = '';
    (municipiosPorProvincia[nuevaProvincia] || []).forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      scopeSelect.appendChild(opt);
    });

    filtroActivo.value = null;
    scopeSelect.disabled = false;

    const changeEvent = new Event('change', { bubbles: true });
    scopeSelect.dispatchEvent(changeEvent);
  };

  provinciaWrapper.appendChild(provinciaLabel);
  provinciaWrapper.appendChild(provinceSelect);
  scopeWrapper.appendChild(provinciaWrapper);
}


/* ===================== RENDER GENERAL NIVEL EDUCATIVO CDO===================== */
let title = null;
let niveles = null;
let headerTableCDO = null;
let dataset1 = null;
let dataset2 = null;
let dataset3 = null;

async function getEduLevelData() {
  niveles = ['PI', 'EP', 'SB', 'IPU', 'ETP', 'EO'];
  headerTableCDO = ['Nivel educativo', 'Cantidad'];
  title = 'Nivel educativo con mayor cantidad de educandos atendidos';
  dataset1 = await getEdullevelCounts(window.currentUser.province, window.currentUser.municipality);
  dataset2 = await fetchEduLevelByMunicipality({ province: window.currentUser.province });
  dataset3 = await fetchEduLevelByProvince();
}

async function getAgeData() {
  niveles = ['PI', 'EP', 'SB', 'IPU', 'ETP', 'EO'];
  headerTableCDO = ['Nivel educativo', 'Edad'];
  title = 'Edad de identificación que predomina para cada una de las NEE';
  dataset1 = await getEduLevelAge(window.currentUser.province, window.currentUser.municipality);
  dataset2 = await fetchEduLevelAgeByMunicipality({ province: window.currentUser.province });
  dataset3 = await fetchEduLevelAgeByProvince();
  dataset1.counts = dataset1.ages;
  delete dataset1.ages;
}

async function getSexData() {
  niveles = ['Femenino', 'Masculino'];
  headerTableCDO = ['Sexo', 'Cantidad'];
  title = 'Relación entre educandos identificados y sexo';
  dataset1 = await getTotalSex(window.currentUser.province, window.currentUser.municipality);
  dataset2 = await fetchTotalSexByMunicipality({ province: window.currentUser.province });
  dataset3 = await fetchTotalSexByProvince();
}

async function getSkinColorData() {
  niveles = ['Blanca', 'Mestiza', 'Negra'];
  headerTableCDO = ['Piel', 'Cantidad'];
  title = 'Relación entre educandos identificados y color de la piel';
  dataset1 = await getTotalSkinColor(window.currentUser.province, window.currentUser.municipality);
  dataset2 = await fetchTotalSkinColorByMunicipality({ province: window.currentUser.province });
  dataset3 = await fetchTotalSkinColorByProvince();
  console.log({ dataset1 });
  console.log({ dataset2 });
  console.log({ dataset3 });
}

async function getZoneData() {
  niveles = ['Urbana', 'Rural'];
  headerTableCDO = ['Zona', 'Cantidad'];
  title = 'Relación entre educandos identificados y zona';
  dataset1 = await getZoneCounts(window.currentUser.province, window.currentUser.municipality);
  dataset2 = await fetchZoneByMunicipality({ province: window.currentUser.province });
  dataset3 = await fetchZoneByProvince();
  console.log({ dataset1 });
  console.log({ dataset2 });
  console.log({ dataset3 });
}

async function getEconomicData() {
  niveles = ['Muy buena', 'Buena', 'Regular', 'Mala', 'Muy mala'];
  headerTableCDO = ['Situación económica', 'Cantidad'];
  title = 'Relación entre educandos identificados y situación económica';
  dataset1 = await getEconomicSituation(window.currentUser.province, window.currentUser.municipality);
  dataset2 = await fetchEconomicSituationByMunicipality({ province: window.currentUser.province });
  dataset3 = await fetchEconomicSituationByProvince();
}

// Función helper que retorna los datos correctos
async function getPotDesData(field) {
  dataset1 = await getFieldLevel(window.currentUser.province, window.currentUser.municipality, field);
  dataset2 = await fetchFieldLevelByMunicipality({ province: window.currentUser.province, field });
  dataset3 = await fetchFieldLevelByProvince({ field });
  
  // Variables que renderGeneral necesita globalmente
  niveles = ['Alto', 'Medio', 'Bajo'];
  title = `Indicador ${field.toUpperCase()}`;
  headerTableCDO = [`Indicador ${field.toUpperCase()}`, 'Cantidad'];
}

async function getTeacherData() {
  niveles = ['Habilitado', 'Nivel medio', 'Estudiando la Licenciatura', 'Licenciado', 'Máster', 'Doctor'];
  headerTableCDO = ['Formación maestro', 'Cantidad'];
  title = 'Relación entre educandos que no evolucionan y la formación del maestro';
  dataset1 = await getTeacherTraining(window.currentUser.province, window.currentUser.municipality);
  dataset2 = await fetchTeacherTrainingByMunicipality({ province: window.currentUser.province });
  dataset3 = await fetchTeacherTrainingByProvince();
}


async function renderGeneral(container, getData, showFooter = true) {
  await getData();
  container.innerHTML = '';

  // ----- TÍTULO PRINCIPAL -----
  const titulo = document.createElement('h3');
  titulo.textContent = title;
  titulo.style.textAlign = 'center';
  titulo.style.marginBottom = '15px';
  container.appendChild(titulo);

  const dataValues = dataset1;

  // ===================================================
  // --------------- CASO CDO ---------------------------
  // ===================================================
  if (filtroActivo.scope === 'CDO' || filtroActivo.scope === 'PAIS') {
    console.log(filtroActivo);

    const scopeWrapper = document.createElement('div');
    scopeWrapper.style.display = 'flex';
    scopeWrapper.style.alignItems = 'center';
    scopeWrapper.style.gap = '10px';
    scopeWrapper.style.marginBottom = '10px';

    const scopeLabel = document.createElement('label');
    scopeLabel.textContent = 'CDO:';
    scopeLabel.style.fontWeight = 'bold';

    scopeWrapper.appendChild(scopeLabel);
    scopeWrapper.appendChild(scopeSelect);
    container.appendChild(scopeWrapper);

    inicializarScopeSelect(scopeWrapper);

    // Calcular total y máximo para footer condicional
    const counts = Array.isArray(dataValues?.counts) ? dataValues.counts : [];
    const maxValue = Math.max(...counts);
    console.log('counts: ', counts);
    console.log('niveles: ', niveles);
    // Filas de datos
    let tbodyContent = counts.map((v, i) => {
      const nivel = niveles[i];
      if (v === maxValue) {
        return `<tr style="color:red; font-weight:bold;"><td>${nivel}</td><td>${v}</td></tr>`;
      }
      return `<tr><td>${nivel}</td><td>${v}</td></tr>`;
    }).join('');

    // ✅ FOOTER CONDICIONAL
    if (showFooter) {
      const total = counts.reduce((a,b)=>a+b,0);
      tbodyContent += `<tr><td><strong>TOTAL</strong></td><td><strong>${total}</strong></td></tr>`;
    }
    console.log('headerTableCDO: ', headerTableCDO);
    // ------------------- Tabla -------------------
    const tabla = document.createElement('table');  
    tabla.classList.add('display');
    stdTable = tabla;
    tabla.innerHTML = `
      <thead>
        <tr>
          ${headerTableCDO.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>${tbodyContent}</tbody>
    `;

    tabla.querySelectorAll('td').forEach(td => td.style.fontSize = '12px');

    // DATOS PARA PDF
    window.tablaDataEdu = {
      scope: 'CDO',
      headers: headerTableCDO,
      body: counts.map((v, i) => [niveles[i], v])
    };

    // Layout tabla + gráfico (sin cambios)
    const grafico = document.createElement('div');
    grafico.style.height = '315px';
    grafico.style.width = '100%';

    const fila = document.createElement('div');
    fila.style.display = 'flex';
    fila.style.gap = '20px';
    fila.style.alignItems = 'flex-start';

    const tablaWrapper = document.createElement('div');
    tablaWrapper.style.flex = '1';
    const tablaScrollWrapper = document.createElement('div');
    tablaScrollWrapper.classList.add('tabla-scroll');
    tablaScrollWrapper.style.maxHeight = '240px';
    tablaScrollWrapper.style.overflowY = 'auto';
    tablaScrollWrapper.style.border = '1px solid #ddd';
    tablaScrollWrapper.appendChild(tabla);
    tablaWrapper.appendChild(tablaScrollWrapper);

    const graficoWrapper = document.createElement('div');
    graficoWrapper.style.flex = '2';
    graficoWrapper.appendChild(grafico);

    fila.appendChild(tablaWrapper);
    fila.appendChild(graficoWrapper);
    container.appendChild(fila);

    $(tabla).DataTable({ paging:false, searching:false, info:false, ordering:false });

    const colores = counts.map(v => v === maxValue ? '#d62728' : '#1f77b4');
    const seriesData = counts.map((valor, idx) => ({
      value: valor,
      itemStyle: { color: colores[idx] }
    }));

    const chart = echarts.init(grafico);
    chart.setOption({
      tooltip: {},
      xAxis: { type: 'category', data: niveles },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: seriesData }]
    });
    stdChart = chart;
    setTimeout(() => chart.resize(), 200);
  }

  // ===================================================
  // --------------- CASO PROVINCIA ---------------------
  // ===================================================
  if (filtroActivo.scope === 'PROVINCIA') {
    const res = dataset2;
    const cdoList = res.municipalities;
    const data2D = res.data2D;

    const colores = ['#1f77b4','#ff7f0e','#2ca02c','#22B14C','#9467bd','#8c564b'];
    const colorMax = '#d62728';

    const totales = niveles.map((_, colIndex) => data2D.reduce((acc,row) => acc + row[colIndex],0));
    const maxTotal = Math.max(...totales);
    const maxColIndex = totales.indexOf(maxTotal);

    const tabla2 = document.createElement('table');
    tabla2.classList.add('display');

    let tbodyHTML = '';
    data2D.forEach((fila, i) => {
      const maxFila = Math.max(...fila);
      tbodyHTML += `<tr>
        <td>${cdoList[i]}</td>
        ${fila.map((v, j) => 
          v === maxFila 
            ? `<td style="color:red; font-weight:bold;">${v}</td>`
            : `<td>${v}</td>`).join('')}
      </tr>`;
    });

    // ✅ FOOTER CONDICIONAL
    if (showFooter) {
      tbodyHTML += `<tr>
        <td><strong>TOTAL</strong></td>
        ${totales.map((v, j) => 
          j === maxColIndex 
            ? `<td style="background-color:#d62728; color:white; font-weight:bold;">${v}</td>`
            : `<td style="font-weight:bold;">${v}</td>`
        ).join('')}
      </tr>`;
    }

    tabla2.innerHTML = `
      <thead>
        <tr><th>CDO</th>${niveles.map(n => `<th>${n}</th>`).join('')}</tr>
      </thead>
      <tbody>${tbodyHTML}</tbody>
    `;
    tabla2.querySelectorAll('td').forEach(td=>td.style.fontSize='12px');

    // Layout tabla + gráfico 3D (sin cambios)
    const grafico3DWrapper = document.createElement('div');
    grafico3DWrapper.style.height = '350px';
    grafico3DWrapper.style.width = '100%';

    const fila3D = document.createElement('div');
    fila3D.classList.add('std-pair-block');
    fila3D.style.display = 'flex';
    fila3D.style.gap = '20px';
    fila3D.style.alignItems = 'stretch';

    const tablaWrapper = document.createElement('div');
    tablaWrapper.style.flex = '1';
    const tablaScrollWrapper = document.createElement('div');
    tablaScrollWrapper.classList.add('tabla-scroll');
    tablaScrollWrapper.style.maxHeight = '240px';
    tablaScrollWrapper.style.overflowY = 'auto';
    tablaScrollWrapper.style.border = '1px solid #ddd';
    tablaScrollWrapper.appendChild(tabla2);
    tablaWrapper.appendChild(tablaScrollWrapper);

    const graficoWrapper = document.createElement('div');
    graficoWrapper.style.flex = '2';
    graficoWrapper.appendChild(grafico3DWrapper);

    fila3D.appendChild(tablaWrapper);
    fila3D.appendChild(graficoWrapper);
    container.appendChild(fila3D);

    $(tabla2).DataTable({ paging:false, searching:false, info:false, ordering:false });

    const data3DColored = [];
    cdoList.forEach((cdo,i)=>{
      niveles.forEach((nivel,j)=>{
        const valor = data2D[i][j];
        const color = (j===maxColIndex) ? colorMax : colores[j % colores.length];
        data3DColored.push({ value:[j,i,valor], itemStyle:{ color } });
      });
    });

    const chart3D = echarts.init(grafico3DWrapper);
    chart3D.setOption({
      tooltip: {},
      xAxis3D: { type: 'category', data: niveles },
      yAxis3D: { type: 'category', data: cdoList },
      zAxis3D: { type: 'value' },
      grid3D: {
        boxWidth: 150,
        boxDepth: 120,
        viewControl: { rotateSensitivity: 1, zoomSensitivity: 1 },
        light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } }
      },
      series: [{ type: 'bar3D', data: data3DColored, shading: 'lambert', barSize: 12 }]
    });
    setTimeout(()=>{ chart3D.resize(); setTimeout(()=>chart3D.resize(), 100); },300);
  }

  // ===================================================
  // --------------- CASO PAÍS --------------------------
  // ===================================================
  if (filtroActivo.scope === 'PAIS') {
    const res = dataset3;
    const provinciaList = res.provinces;
    const data2D = res.data2D;

    const colores = ['#1f77b4','#ff7f0e','#2ca02c','#22B14C','#9467bd','#8c564b'];
    const colorMax = '#d62728';

    const totales = niveles.map((_, colIndex) => data2D.reduce((acc,row) => acc + row[colIndex],0));
    const maxTotal = Math.max(...totales);
    const maxColIndex = totales.indexOf(maxTotal);

    const tablaPais = document.createElement('table');
    tablaPais.classList.add('display');

    let tbodyHTML = '';
    provinciaList.forEach((provincia, i) => {
      const fila = Array.isArray(data2D[i]) ? data2D[i] : [0, 0, 0, 0, 0, 0];
      const maxFila = Math.max(...fila);

      tbodyHTML += `<tr>
        <td>${provincia}</td>
        ${fila.map((v, j) =>
          v === maxFila && maxFila > 0
            ? `<td style="color:red; font-weight:bold;">${v}</td>`
            : `<td>${v}</td>`
        ).join('')}
      </tr>`;
    });

    // ✅ FOOTER CONDICIONAL
    if (showFooter) {
      tbodyHTML += `<tr>
        <td><strong>TOTAL</strong></td>
        ${totales.map((v, j) =>
          j === maxColIndex
            ? `<td style="background-color:#d62728; color:white; font-weight:bold;">${v}</td>`
            : `<td style="font-weight:bold;">${v}</td>`
        ).join('')}
      </tr>`;
    }

    tablaPais.innerHTML = `
      <thead>
        <tr><th>Provincia</th>${niveles.map(n => `<th>${n}</th>`).join('')}</tr>
      </thead>
      <tbody>${tbodyHTML}</tbody>
    `;
    tablaPais.querySelectorAll('td').forEach(td=>td.style.fontSize='12px');

    // Layout tabla + gráfico 3D (sin cambios)
    const grafico3DWrapperPais = document.createElement('div');
    grafico3DWrapperPais.style.height = '350px';
    grafico3DWrapperPais.style.width = '100%';
    grafico3DWrapperPais.style.marginTop = '-50px';
    grafico3DWrapperPais.style.alignSelf = 'flex-start';

    const fila3DPais = document.createElement('div');
    fila3DPais.style.display = 'flex';
    fila3DPais.style.gap = '20px';
    fila3DPais.style.alignItems = 'flex-start';

    const tablaWrapperPais = document.createElement('div');
    tablaWrapperPais.style.flex = '1';
    const tablaScrollWrapper = document.createElement('div');
    tablaScrollWrapper.classList.add('tabla-scroll');
    tablaScrollWrapper.style.maxHeight = '240px';
    tablaScrollWrapper.style.maxWidth = '500px'; //nuevo
    tablaScrollWrapper.style.overflowX = 'auto'; //nuevo
    tablaScrollWrapper.style.overflowY = 'auto';
    tablaScrollWrapper.style.border = '1px solid #ddd';

    tablaPais.style.whiteSpace = 'nowrap';//nuevo
    tablaPais.style.width = 'max-content';//nuevo

    tablaScrollWrapper.appendChild(tablaPais);
    tablaWrapperPais.appendChild(tablaScrollWrapper);

    const graficoWrapperPais = document.createElement('div');
    graficoWrapperPais.style.flex = '2';
    graficoWrapperPais.appendChild(grafico3DWrapperPais);

    fila3DPais.appendChild(tablaWrapperPais);
    fila3DPais.appendChild(graficoWrapperPais);
    container.appendChild(fila3DPais);

    $(tablaPais).DataTable({ paging:false, searching:false, info:false, ordering:false });

    const data3DColoredPais = [];
    provinciaList.forEach((provincia, i) => {
      const fila = Array.isArray(data2D[i]) ? data2D[i] : [0, 0, 0, 0, 0, 0];
      niveles.forEach((nivel, j) => {
        const valor = fila[j] ?? 0;
        const color = (j === maxColIndex) ? colorMax : colores[j % colores.length];
        data3DColoredPais.push({ value: [j, i, valor], itemStyle: { color } });
      });
    });

    const chart3DPais = echarts.init(grafico3DWrapperPais);
    chart3DPais.setOption({
      tooltip: {},
      xAxis3D: { type: 'category', data: niveles },
      yAxis3D: { type: 'category', data: provinciaList },
      zAxis3D: { type: 'value' },
      grid3D: {
        boxWidth: 150,
        boxDepth: 120,
        viewControl: { rotateSensitivity: 1, zoomSensitivity: 1 },
        light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } }
      },
      series: [{ type: 'bar3D', data: data3DColoredPais, shading: 'lambert', barSize: 12 }]
    });
    setTimeout(()=>{ chart3DPais.resize(); setTimeout(()=>chart3DPais.resize(), 100); },300);
  }
    /* ===================== LEYENDA ===================== */
  if (section === 'indicador11') {
    agregarLeyenda(
      container.id,
      `
      Indicador F11: Nivel de conocimiento sobre el nivel de desarrollo de sus hijos según la etapa del desarrollo<br>
      `
    );
  }

  if (section === 'indicador12') {
    agregarLeyenda(
      container.id,
      `
      Indicador F12: Nivel de conocimiento de las particularidades de sus hijos
      `
    );
  }

  if (section === 'indicador21') {
    agregarLeyenda(
      container.id,
      `
      Indicador F21: Nivel de voluntad para elevar sus recursos cognitivos, afectivos y actitudinales
      `
    );
  }

  if (section === 'indicador22') {
    agregarLeyenda(
      container.id,
      `
      Indicador F22: Nivel de funcionamiento de roles
      `
    );
  }

  if (section === 'indicador31') {
    agregarLeyenda(
      container.id,
      `
      Indicador F31: Nivel de funcionamiento de comunicación intrafamiliar
      `
    );
  }

  if (section === 'indicador32') {
    agregarLeyenda(
      container.id,
      `
      Indicador F32: Nivel de funcionamiento de comunicación con los hijos
      `
    );
  }

  if (section === 'indicador41') {
    agregarLeyenda(
      container.id,
      `
      Indicador F41: Nivel de funcionamiento de los límites
      `
    );
  }

  if (section === 'indicador42') {
    agregarLeyenda(
      container.id,
      `
      Indicador F42: Nivel de funcionamiento de los métodos educativos
      `
    );
  }

  if (section === 'indicador51') {
    agregarLeyenda(
      container.id,
      `
      Indicador F51: Nivel de cumplimiento de las orientaciones de los especialistas
      `
    );
  }

  if (section === 'indicador52') {
    agregarLeyenda(
      container.id,
      `
      Indicador F52: Nivel de habilidades para ofrecer oportunamente la ayuda a sus hijos
      `
    );
  }
}


/* =================== ACTUALIZA TABLA PARA UN CDO==================== */

function updateGeneralTabla(tabla, dataValues) {
  const tbody = tabla.querySelector('tbody');

  // Calcula el valor máximo
  const maxValue = Math.max(...dataValues);
  // Genera las filas con estilo
  tbody.innerHTML = dataValues.map((v, i) => {
    const estilo = v === maxValue ? 'color:red; font-weight:bold;' : '';
    return `<tr style="${estilo}"><td>${niveles[i]}</td><td>${v}</td></tr>`;
  }).join('') + `
    <tr>
      <td><strong>TOTAL</strong></td>
      <td><strong>${dataValues.reduce((a,b)=>a+b,0)}</strong></td>
    </tr>
  `;

  // Reaplica tamaño de fuente a todas las celdas
  tbody.querySelectorAll('td').forEach(td => td.style.fontSize = '12px');
}

function updateGeneralGrafico(chart, dataValues, colores) {
  // const colores = ['#1f77b4','#d62728'];

  chart.setOption({
    series: [{
      data: dataValues.map((valor, idx) => ({
        value: valor,
        itemStyle: { color: colores[idx] }
      }))
    }]
  });
}