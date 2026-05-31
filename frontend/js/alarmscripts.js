import { formatearFechaHora } from "./definitions.js";

// ============================
// 🚨 SISTEMA ALARMAS COMPLETO
// ============================

let alarmasData = [];
let pollingInterval;
let alarmaSeleccionadaId = null;

const notifBell = document.getElementById("notifBell");
const notifBadge = document.getElementById("notifBadge");

if (notifBell) {
  notifBell.classList.add("d-none"); // oculto siempre al inicio
}

function aplicarPermisosRadios() {
  const radios = document.querySelectorAll('input[name="scope_type"]');

  radios.forEach((radio) => {
    switch (radio.value) {
      case "self":
        // Solo usuarios con permiso 'alarma_propia' o rol 'user'
        radio.disabled = !(
          window.puede("alarma_propia") || window.tieneRol("user")
        );
        break;

      case "municipio":
        // Solo si tiene permiso 'alarma_cdo' o 'alarma_provincia'
        radio.disabled = !(
          window.puede("alarma_cdo") ||
          window.puede("alarma_provincia") ||
          window.tieneRol("superv") ||
          window.tieneRol("admin") ||
          window.tieneRol("superadmin")
        );
        break;

      case "provincia":
        // Solo si tiene permiso 'alarma_provincia' o rol 'superv'
        radio.disabled = !(
          window.puede("alarma_provincia") ||
          window.tieneRol("superv") ||
          window.tieneRol("admin") ||
          window.tieneRol("superadmin")
        );
        break;

      case "global":
        // Solo administradores y superadmins
        radio.disabled = !(
          window.puede("alarma_nacion") ||
          window.tieneRol("admin") ||
          window.tieneRol("superadmin")
        );
        break;

      case "rol":
        // Solo si tiene permiso 'alarma_superv' o 'alarma_admin'
        radio.disabled = !(
          window.puede("alarma_admin") || window.puede("alarma_superadmin")
        );
        break;

      default:
        // Deshabilitar cualquier valor inesperado
        radio.disabled = true;
        break;
    }
  });

  // Además, si el radio seleccionado es 'rol', controlar el select correspondiente
  const radioRol = document.querySelector(
    'input[name="scope_type"][value="rol"]'
  );
  const selectRol = document.getElementById("al-rol-destino-inline");
  if (radioRol && selectRol) {
    selectRol.disabled = radioRol.disabled || !radioRol.checked;
  }
}

$(document).on("bckofficealarmevent", function () {
  console.log("🎯 Evento backoffice - ABRIENDO MODAL ALARMA");
  abrirModalAlarma();
});

function iniciarSistemaAlarmas() {
  if (!window.currentUser || !window.currentUser.userid) {
    console.log("⛔ Sistema de alarmas NO iniciado (sin login)");
    ocultarCampana();
    return;
  }

  if (puedeCrearAlarmas()) {
    $(".btn-nueva-alarma").removeClass("d-none");
  } else {
    $(".btn-nueva-alarma").addClass("d-none");
  }

  if (puedeAdministrarAlarmas()) {
    cargarContadoresAlarmas();
    $(".btn-admin-alarmas").removeClass("d-none");
  } else {
    $(".btn-admin-alarmas").addClass("d-none");
  }

  console.log("🚀 Iniciando sistema de alarmas...", currentUser.userid);
  cargarContadorNotificaciones();
  cargarNotificaciones();

  // Polling inteligente cada 30s
  pollingInterval = setInterval(() => {
    cargarContadorNotificaciones();
    if ($("#notificationPanel").hasClass("mostrar")) {
      cargarNotificaciones();
    }
  }, 30000);

  // ✅ ROLES DESACTIVADOS - Sin llamada a /api/roles
  console.log("✅ Sistema alarmas iniciado (roles desactivados)");
}

$(document).on("initalarmsystemevent", iniciarSistemaAlarmas);

// 🔔 1. CLICK CAMPANA - Toggle Panel
$(document).on("click", "#notifBell", function (e) {
  e.stopPropagation();
  const $panel = $("#notificationPanel");
  $panel.toggleClass("mostrar");

  if ($panel.hasClass("mostrar")) {
    cargarNotificaciones(); // Cargar al abrir
    // Cerrar al click fuera
    $(document).one("click", function () {
      $panel.removeClass("mostrar");
    });
  }
});

// 📊 2. CONTADOR BADGE
async function cargarContadorNotificaciones() {
  try {
    const resp = await fetch(
      `${window.config.apiUrl}/alarmas/contador?userid=${encodeURIComponent(
        window.currentUser.userid
      )}`
    );
    const json = await resp.json();
    if (!json.success) return;

    const unread = json.unread || 0;

    // Mostrar el badge solo si hay notificaciones sin leer
    $("#notifBadge")
      .text(unread)
      .toggleClass("d-none", unread === 0);
    $(".unread-count").text(`(${unread} nuevas)`);
  } catch (e) {
    console.error("⚠️ Error contador:", e);
  }
}

async function cargarNotificaciones() {
  try {
    const resp = await fetch(
      `${
        window.config.apiUrl
      }/alarmas/lista?limit=10&userid=${encodeURIComponent(
        window.currentUser.userid
      )}`
    );
    const json = await resp.json();
    if (!json.success) return;

    renderizarNotificaciones(json.data);
  } catch (e) {
    console.error("⚠️ Error lista:", e);
    $(".notifications-list").html(
      '<div class="empty-state">Error cargando notificaciones</div>'
    );
  }
}

function renderizarNotificaciones(notifs) {
  const $lista = $(".notifications-list").empty();

  if (!notifs || !notifs.length) {
    $lista.html('<div class="empty-state">📭 Sin notificaciones nuevas</div>');
    return;
  }

  notifs.forEach((notif) => {
    const tipoIcono =
      {
        aviso: "📢",
        recordatorio: "⏰",
        información: "ℹ️"
      }[notif.type] || "📢";

    const $item = $(`
            <div class="notification-item ${
              notif.read ? "read" : "unread"
            }" data-id="${notif.id}">
                <span class="type ${
                  notif.type
                }">${tipoIcono} ${notif.type.toUpperCase()}</span>
                <div class="content">
                    <strong>${escapeHtml(notif.title)}</strong>
                    <p>${escapeHtml(notif.message)}</p>
                    <small>${notif.scope_display || "General"} • ${
      notif.time_ago || "Reciente"
    }</small>
                </div>
                ${
                  !notif.read
                    ? '<button class="mark-read" title="Marcar leído">✓</button>'
                    : ""
                }
            </div>
        `);
    $lista.append($item);
  });
}

function actualizarContadorActivas(num) {
  document.querySelector(".ca-metric.green strong").textContent = num;
}

function actualizarContadorLeidas(num) {
  document.querySelector(".ca-metric.yellow strong").textContent = num; // ajusta selector
}

function actualizarContadorHoy(num) {
  document.querySelector(".ca-metric.blue strong").textContent = num; // ajusta selector
}

function actualizarContadorTotal(num) {
  document.querySelector(".ca-metric.red strong").textContent = num; // ajusta selector
}

async function cargarContadoresAlarmas() {
  try {
    const resp = await fetch(`${window.config.apiUrl}/alarmas/contadores`);
    const json = await resp.json();

    if (json.success) {
      // Actualizar contadores
      actualizarContadorActivas(json.data.activas);
      actualizarContadorLeidas(json.data.leidas);
      actualizarContadorHoy(json.data.hoy);
      actualizarContadorTotal(json.data.activas + json.data.leidas);
    }
  } catch (err) {
    console.error("Error cargando contadores:", err);
  }
}

// ✅ 4. MARCAR COMO LEÍDA
// ✅ Click ✓ - con validación ID
$(document).on("click", ".mark-read, .notification-item", function (e) {
  const $item = $(this).closest(".notification-item");
  if ($item.hasClass("read")) return;

  let id = $item.data("id");

  // ✅ VALIDAR ID sea número
  id = Number.parseInt(id);
  if (Number.isNaN(id) || id <= 0) {
    console.error("❌ ID inválido:", $item.data("id"));
    return;
  }

  fetch(`${window.config.apiUrl}/alarmas/${id}/leer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userid: window.currentUser.userid }) // <-- PASAMOS EL USERID
  })
    .then((resp) => resp.json())
    .then((data) => {
      if (data.success) {
        $item.removeClass("unread").addClass("read");
        $item.find(".mark-read").fadeOut(200, function () {
          $(this).remove();
        });
        actualizarContador();
      }
    })
    .catch((err) => console.error("Error marcar:", err));
});

// ✅ 5. MARCAR TODAS LEÍDAS
$(document).on("click", "#markAllRead", function () {
  fetch(`${window.config.apiUrl}/alarmas/todasleer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userid: window.currentUser.userid }) // <-- PASAMOS EL USERID
  })
    .then((resp) => {
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      return resp.json();
    })
    .then(() => {
      $(".notification-item")
        .removeClass("unread")
        .addClass("read")
        .find(".mark-read")
        .fadeOut(200, function () {
          $(this).remove();
        });

      actualizarContador();
    })
    .catch((err) => console.error("Error todas leídas:", err));
});

// ➕ 6. NUEVA ALARMA - Botón en panel
$(document).on("click", ".btn-nueva-alarma", function () {
  abrirModalAlarma();
});

function setMetricValue(idMetric, value) {
  const strong = document.querySelector(`#${idMetric} strong`);
  if (strong) strong.textContent = value;
}

function setModoEdicionAlarma(isEdit) {
  // Fecha inicio
  $('input[name="startdate"]').prop("disabled", isEdit);

  // Radios alcance
  $('input[name="scope_type"]').prop("disabled", isEdit);

  // Select rol / scope valor
  $('select[name="scope_valor"]').prop("disabled", isEdit);
}

// 🖥️ 7. MODAL EXISTENTE (mejorado)
function abrirModalAlarma() {
  const overlay = $("#al-modal-overlay");

  // Reset formulario
  $("#al-form-alarma")[0].reset();
  setModoEdicionAlarma(false);
  $("#al-rol-destino-group").addClass("d-none");

  // ✅ Reset título y botón
  overlay.find(".al-modal-header h2").text("Nueva Alarma");
  overlay.find("#al-btn-guardar-alarma").text("Crear Alarma");

  // Mostrar modal
  aplicarPermisosRadios();
  overlay.addClass("mostrar");
}

// Cerrar modal
$(document).on("click", "#al-btn-cerrar, .al-btn-cerrar-modal", function (e) {
  $(".al-modal-overlay").removeClass("mostrar");
});

$(document).on("click", ".al-modal-overlay", function (e) {
  if ($(e.target).is(".al-modal-overlay")) {
    $(".al-modal-overlay").removeClass("mostrar");
  }
});

// Toggle rol destino
// $(document).on('change', 'input[name="scope_type"]', function() {
//     const showRoles = this.value === 'rol';
//     $('#al-rol-destino-group').toggleClass('d-none', !showRoles);
//     // ✅ Roles ya están en HTML, no necesita fetch
// });

// 🎫 8. GUARDAR ALARMA (usando tu patrón fetch)
$(document).on("click", "#al-btn-guardar-alarma", async function () {
  const $form = $("#al-form-alarma");

  if (!$form[0].checkValidity()) {
    $form[0].reportValidity();
    return;
  }

  // 🔒 VALIDACIÓN FECHAS
  const startInput = $form.find('input[name="startdate"]')[0];
  const endInput = $form.find('input[name="endingdate"]')[0];

  startInput.setCustomValidity("");
  endInput.setCustomValidity("");

  if (endInput.value) {
    const startDate = new Date(startInput.value);
    const endDate = new Date(endInput.value);

    if (endDate <= startDate) {
      endInput.setCustomValidity(
        "La fecha fin debe ser posterior a la fecha de inicio"
      );
      endInput.reportValidity();
      return;
    }
  }

  const formData = $form.serializeArray();
  const data = {};

  formData.forEach((field) => (data[field.name] = field.value));
  data.username = window.currentUser.userid;

  // Auto-rellenar municipio/provincia del usuario actual
  if (data.scope_type === "municipio") {
    data.scope_valor = window.currentUser.municipality || "";
  } else if (data.scope_type === "provincia") {
    data.scope_valor = window.currentUser.province || "";
  }

  data.endingdate = data.endingdate || null;
  data.scope_valor = data.scope_valor || null;

  // ✅ VALIDACIÓN FRONTEND: si es “Por rol específico”, debe seleccionar un rol
  if (
    data.scope_type === "rol" &&
    (!data.scope_valor || data.scope_valor.trim() === "")
  ) {
    alert(
      'Debes seleccionar un rol destino si el alcance es "Por rol específico".'
    );
    return; // Detener ejecución
  }

  const $btn = $(this);
  $btn.prop("disabled", true).text("Guardando...");

  // **************************************
  let resp, json;

  if (alarmaSeleccionadaId) {
    // =========================
    // ✏️ EDITAR ALARMA
    // =========================
    try {
      resp = await fetch(
        `${window.config.apiUrl}/updatealarmas/${alarmaSeleccionadaId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            msg: data.msg,
            type: data.type,
            endingdate: data.endingdate,
            daysinterval: data.daysinterval,
            username: window.currentUser.userid
          })
        }
      );

      json = await resp.json();

      if (!json.success)
        throw new Error(json.message || "Error al actualizar alarma");

      console.log("✅ Alarma actualizada:", json);
      $(".al-modal-overlay").removeClass("mostrar");

      // ✅ Actualizar datosOriginalesCentroAlarma
      const index = datosOriginalesCentroAlarma.findIndex(
        (a) => a.ida == alarmaSeleccionadaId
      );
      if (index !== -1) {
        datosOriginalesCentroAlarma[index] = {
          ...datosOriginalesCentroAlarma[index],
          title: data.title,
          msg: data.msg,
          type: data.type,
          endingdate: data.endingdate,
          daysinterval: data.daysinterval
        };
      }

      // ✅ Volver a renderizar la tabla filtrada con selección de fila actualizada
      const filtros = {
        tipo: $(".ca-filters select").eq(0).val(),
        estado: $(".ca-filters select").eq(1).val()
      };
      window.renderizarTablaFiltrada(filtros);

      // Seleccionar la fila actualizada
      const $tbody = $("#ca-table-body");
      $tbody.find("tr").removeClass("ca-selected");
      const filaActual = $tbody.find(
        `tr[data-alarm-id='${alarmaSeleccionadaId}']`
      );
      if (filaActual.length) {
        filaActual.addClass("ca-selected");
        alarmaSeleccionadaId = filaActual.data("alarm-id");
        cargarUsuariosNotificados(alarmaSeleccionadaId);
        alarmaSeleccionadaId = null;
      }

      // Actualizar contador y notificaciones
      cargarNotificaciones();
      actualizarContador();
    } catch (err) {
      console.error("❌ Error al actualizar alarma:", err);
      alert("Error al actualizar alarma: " + err.message);
    } finally {
      $btn.prop("disabled", false).text("Actualizar");
    }
  } else {
    // =========================
    // ➕ CREAR ALARMA
    // =========================
    try {
      resp = await fetch(`${window.config.apiUrl}/alarmas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      json = await resp.json();

      if (!json.success)
        throw new Error(json.message || "Error al crear alarma");

      console.log("✅ Alarma creada:", json);
      $(".al-modal-overlay").removeClass("mostrar");

      // Actualizar tabla de alarmas
      cargarNotificaciones();
      actualizarContador();
    } catch (err) {
      console.error("❌ Error al crear alarma:", err);
      alert("Error al crear alarma: " + err.message);
    } finally {
      $btn.prop("disabled", false).text("Crear Alarma");
    }
  }
});

/* =========================
   UTILIDADES
========================= */

function claseTipo(tipo) {
  switch (tipo.toLowerCase()) {
    case "información":
    case "informacion":
      return "ca-tipo-info";
    case "recordatorio":
      return "ca-tipo-warning";
    case "aviso":
      return "ca-tipo-danger";
    default:
      return "ca-tipo-default";
  }
}

function actualizarContador() {
  cargarContadorNotificaciones();
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Cerrar panel
$(document).on("click", ".close-panel", function () {
  $("#notificationPanel").removeClass("mostrar");
});

document.querySelectorAll('input[name="scope_type"]').forEach((radio) => {
  radio.addEventListener("change", function () {
    const selectRol = document.getElementById("al-rol-destino-inline");
    if (!selectRol) return;

    if (this.value === "rol" && !this.disabled) {
      selectRol.classList.remove("d-none");
      selectRol.disabled = false;
    } else {
      selectRol.classList.add("d-none");
      selectRol.disabled = true;
      selectRol.value = "";
    }
  });
});

export function ocultarCampana() {
  $("#notifBadge").addClass("d-none").text("0");
  $("#notificationPanel").removeClass("mostrar");
}

export function mostrarCampana() {
  $("#notifBell").removeClass("d-none");
}

function puedeCrearAlarmas() {
  return (
    window.tieneRol("user") ||
    window.tieneRol("superv") ||
    window.tieneRol("admin") ||
    window.tieneRol("superadmin") ||
    window.puede("alarma_propia") ||
    window.puede("alarma_cdo") ||
    window.puede("alarma_provincia") ||
    window.puede("alarma_nacion") ||
    window.puede("alarma_superv") ||
    window.puede("alarma_admin")
  );
}

function puedeAdministrarAlarmas() {
  return (
    window.tieneRol("superv") ||
    window.tieneRol("admin") ||
    window.tieneRol("superadmin") ||
    window.puede("alarma_administrar")
  );
}

// ============================
// 🚨 SISTEMA CENTRO DE ALARMAS
// ============================

let caPieChart; // Chart.js global
let datosOriginalesCentroAlarma = []; // ✅ DATOS ORIGINALES PARA FILTROS

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("ca-overlay");
  const openBtn = document.querySelector(".btn-admin-alarmas");
  const closeBtns = [
    document.getElementById("ca-close"),
    document.getElementById("ca-close-footer")
  ];

  // Abrir modal
  openBtn.addEventListener("click", async () => {
    overlay.classList.remove("d-none");
    overlay.style.display = "flex";
    cargarDatosCentroAlarma();
  });

  // Cerrar modal
  closeBtns.forEach((btn) =>
    btn.addEventListener("click", () => cerrarModal())
  );
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cerrarModal();
  });

  function cerrarModal() {
    overlay.classList.add("d-none");
    overlay.style.display = "none";
    // destruir chart para no tener error
    if (caPieChart) {
      caPieChart.destroy();
      caPieChart = null;
    }
  }

  // =========================
  // 🎛️ FILTROS FUNCIONALES
  // =========================
  function inicializarFiltros() {
    const filtroTipo = document.querySelector(
      ".ca-filters select:nth-of-type(1)"
    );
    const filtroEstado = document.querySelector(
      ".ca-filters select:nth-of-type(2)"
    );
    // const filtroRol = document.querySelector('.ca-filters select:nth-of-type(3)');

    // Función para aplicar filtros
    function aplicarFiltros() {
      const filtros = {
        tipo: filtroTipo.value,
        estado: filtroEstado.value
        // rol: filtroRol.value
      };
      renderizarTablaFiltrada(filtros);
    }

    // Listeners para cada filtro
    filtroTipo.addEventListener("change", aplicarFiltros);
    filtroEstado.addEventListener("change", aplicarFiltros);
    // filtroRol.addEventListener('change', aplicarFiltros);

    // Reset filtros (doble click en "Filtrar:")
    document
      .querySelector(".ca-filters span")
      .addEventListener("dblclick", () => {
        filtroTipo.value = "Tipo";
        filtroEstado.value = "Estado";
        // filtroRol.value = 'Rol';
        aplicarFiltros();
      });
  }

  // =========================
  // 🔄 RENDERIZAR TABLA FILTRADA
  // =========================
  window.renderizarTablaFiltrada = function (filtros = {}) {
    const tableBody = document.getElementById("ca-table-body");
    const alarmsFiltradas = datosOriginalesCentroAlarma.filter((alarma) => {
      // Filtro Tipo
      if (
        filtros.tipo &&
        filtros.tipo !== "Tipo" &&
        alarma.type !== filtros.tipo
      ) {
        return false;
      }

      // Filtro Estado
      if (
        filtros.estado &&
        filtros.estado !== "Estado" &&
        alarma.state !== filtros.estado
      ) {
        return false;
      }

      return true;
    });

    // Renderizar filas filtradas
    tableBody.innerHTML = alarmsFiltradas
      .map((a) => {
        const mostrarBorrar = a.state !== "Pendiente"; // Solo mostrar delete si no está activa
        return `
        <tr data-alarm-id="${a.ida}">
          <td>${a.title}</td>
          <td>${a.msg}</td>
          <td>
            <span class="ca-tipo ${claseTipo(a.type)}">
              ${a.type}
            </span>
          </td>
          <td>${formatearFechaHora(a.date)}</td>
          <td>${a.state}</td>
          <td>
            <img src="images/icon-edit.png" width="20" style="cursor:pointer">
            ${
              mostrarBorrar
                ? '<img src="images/icon-delete.png" width="20" style="cursor:pointer">'
                : ""
            }
          </td>
        </tr>
      `;
      })
      .join("");

    // ✅ Selección automática
    const primeraFila = tableBody.querySelector("tr");
    if (primeraFila) {
      primeraFila.classList.add("ca-selected");
      alarmaSeleccionadaId = primeraFila.dataset.alarmId;
      cargarUsuariosNotificados(alarmaSeleccionadaId);
      cargarAuditoriaAlarma(alarmaSeleccionadaId);
    }
  };

  async function cargarDatosCentroAlarma() {
    try {
      // ✅ CARGAR DATOS REALES de la API
      const resp = await fetch(`${window.config.apiUrl}/alarmas/admin`);
      const json = await resp.json();

      if (json.success) {
        // ✅ TRANSFORMAR DATOS reales (igual que antes)
        const dataTabla = json.data.map((alarma) => ({
          ida: alarma.ida,
          title: alarma.title,
          msg: alarma.msg,
          type: alarma.type,
          date: alarma.date,
          state: alarma.state
        }));

        // ✅ GUARDAR DATOS ORIGINALES para filtros
        datosOriginalesCentroAlarma = json.data;

        // Renderizar tabla inicial (sin filtros)
        renderizarTablaFiltrada({});

        // Inicializar filtros DESPUÉS de cargar datos
        inicializarFiltros();

        // --- Usuarios Notificados ---
        const usersBody = document.getElementById("ca-users-body");
        const users = [];
        //   { user:'juan', read:'Sí', date:'2026-01-09' },
        //   { user:'ana', read:'No', date:'2026-01-09' }
        // ];
        usersBody.innerHTML = users
          .map(
            (u) => `
          <tr>
            <td>${u.user}</td>
            <td>${u.read}</td>
            <td>${u.date}</td>
          </tr>`
          )
          .join("");

        // --- Historial Auditoría ---
        const auditBody = document.getElementById("ca-audit-body");
        const audits = [];
        //   { date:'2026-01-09', actor:'admin', action:'Creó alarma' },
        //   { date:'2026-01-08', actor:'superv', action:'Marcó leída' }
        // ];
        auditBody.innerHTML = audits
          .map(
            (a) => `
          <tr>
            <td>${a.date}</td>
            <td>${a.actor}</td>
            <td>${a.action}</td>
          </tr>`
          )
          .join("");

        // --- Pie Chart ---
        const ctx = document.getElementById("ca-pie").getContext("2d");
        if (caPieChart) caPieChart.destroy();

        // ✅ CONTADORES DINÁMICOS del response
        const activas = dataTabla.filter((a) => a.state === "Pendiente").length;
        const leidas = dataTabla.filter((a) => a.state === "Leída").length;

        caPieChart = new Chart(ctx, {
          type: "pie",
          data: {
            labels: ["Activas", "Leídas"],
            datasets: [
              {
                data: [activas, leidas],
                backgroundColor: ["#2ecc71", "#3498db"]
              }
            ]
          },
          options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } }
          }
        });
      }
    } catch (err) {
      console.error("Error cargando datos reales:", err);
    }
  }

  window.cargarUsuariosNotificados = async function (ida) {
    try {
      const resp = await fetch(
        `${window.config.apiUrl}/alarmas/${ida}/usuarios`
      );
      const json = await resp.json();

      if (!json.success) return;

      const tbody = document.getElementById("ca-users-body");
      tbody.innerHTML = "";

      tbody.innerHTML = json.data
        .map(
          (u) => `
        <tr>
          <td>${u.userid}</td>
          <td>${u.read}</td>
          <td>${formatearFechaHora(u.readdate)}</td>
        </tr>
      `
        )
        .join("");
    } catch (err) {
      console.error("Error cargando usuarios notificados:", err);
    }
  };

  async function cargarAuditoriaAlarma(ida) {
    try {
      const resp = await fetch(
        `${window.config.apiUrl}/alarmas/${ida}/auditoria`
      );
      const json = await resp.json();
      if (!json.success) return;

      const tbody = document.getElementById("ca-audit-body");
      if (!json.success || !json.data || !json.data.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="3">Sin historial de auditoría</td>
          </tr>
        `;
        return;
      }
      tbody.innerHTML = json.data
        .map(
          (a) => `
        <tr>
          <td>${formatearFechaHora(a.date)}</td>
          <td>${a.actor}</td>
          <td>${a.description}</td>
        </tr>
      `
        )
        .join("");
    } catch (err) {
      console.error("Error cargando auditoría:", err);
    }
  }

  // ************************* EDICION ALARMA DENTRO DEL PANEL

  // =======================
  // Abrir modal al hacer clic en lápiz
  // =======================
  document.addEventListener("click", async (e) => {
    // Buscar la fila más cercana al click dentro de la tabla
    const fila = e.target.closest("#ca-table-body tr");
    if (!fila) return;

    // Quitar selección previa
    document
      .querySelectorAll("#ca-table-body tr")
      .forEach((tr) => tr.classList.remove("ca-selected"));

    // Marcar fila seleccionada
    fila.classList.add("ca-selected");

    // Guardar el ID de la alarma seleccionada
    const ida = fila.dataset.alarmId;
    alarmaSeleccionadaId = ida;

    // Cargar usuarios notificados y auditoría
    cargarUsuariosNotificados(ida);
    cargarAuditoriaAlarma(ida);

    // Detectar clic en el ícono de editar (lápiz)
    // ⚠️ Se asegura que e.target sea una imagen y tenga src definido
    if (
      e.target.matches('img[alt="edit"]') ||
      (e.target.tagName === "IMG" &&
        e.target.src &&
        e.target.src.includes("icon-edit.png"))
    ) {
      abrirModalEditarAlarma(ida);
    }

    // === Borrar ===
    if (
      e.target.matches('img[alt="delete"]') ||
      (e.target.tagName === "IMG" && e.target.src.includes("icon-delete.png"))
    ) {
      if (!confirm("¿Seguro que deseas eliminar esta alarma?")) return;

      try {
        const resp = await fetch(
          `${window.config.apiUrl}/deletealarmas/${ida}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userid: window.currentUser.userid })
          }
        );

        const json = await resp.json();
        if (!json.success)
          throw new Error(json.message || "Error eliminando alarma");

        // ✅ 1. Eliminar de datosOriginalesCentroAlarma
        const index = datosOriginalesCentroAlarma.findIndex(
          (a) => a.ida == ida
        );
        if (index !== -1) datosOriginalesCentroAlarma.splice(index, 1);

        // ✅ 2. Volver a renderizar tabla filtrada (Resumen de Alarmas)
        const filtros = {
          tipo: document.querySelector(".ca-filters select:nth-of-type(1)")
            .value,
          estado: document.querySelector(".ca-filters select:nth-of-type(2)")
            .value
        };
        window.renderizarTablaFiltrada(filtros);

        // ✅ 3. Actualizar contadores y notificaciones
        cargarContadoresAlarmas();
        cargarNotificaciones();

        alarmaSeleccionadaId = null;
        alert("Alarma eliminada correctamente");
      } catch (err) {
        console.error("Error eliminando alarma:", err);
        alert("Error eliminando alarma: " + err.message);
      }
    }
  });

  // =======================
  // Abrir modal y prellenar
  // =======================
  function abrirModalEditarAlarma(ida) {
    const alarma = datosOriginalesCentroAlarma.find((a) => a.ida == ida);
    if (!alarma) {
      console.error("Alarma no encontrada", ida);
      return;
    }

    const overlay = $("#al-modal-overlay");

    // ✅ MOSTRAR MODAL
    aplicarPermisosRadios();
    overlay.addClass("mostrar");

    // Cambiar título y botón
    overlay.find(".al-modal-header h2").text("Editar Alarma");
    overlay.find("#al-btn-guardar-alarma").text("Actualizar");

    setModoEdicionAlarma(true);

    const form = $("#al-form-alarma")[0];

    // Campos
    form.elements["title"].value = alarma.title || "";
    form.elements["msg"].value = alarma.msg || "";
    form.elements["type"].value = alarma.type || "recordatorio";
    form.elements["startdate"].value = alarma.startdate
      ? formatearFechaHoraInput(alarma.startdate)
      : "";
    form.elements["endingdate"].value = alarma.endingdate
      ? formatearFechaHoraInput(alarma.endingdate)
      : "";
    form.elements["daysinterval"].value = alarma.daysinterval || "1";

    // Scope
    const scopeTypeRadios = form.elements["scope_type"];
    if (scopeTypeRadios) {
      for (const radio of scopeTypeRadios) {
        radio.checked = radio.value === alarma.scope_type;
      }
    }

    // Scope valor
    const scopeValorSelect = form.elements["scope_valor"];
    if (scopeValorSelect && alarma.scope_type === "rol") {
      scopeValorSelect.classList.remove("d-none");
      scopeValorSelect.value = alarma.scope_valor || "";
    } else if (scopeValorSelect) {
      scopeValorSelect.classList.add("d-none");
      scopeValorSelect.value = "";
    }
  }

  // =======================
  // Helper para datetime-local
  // =======================
  function formatearFechaHoraInput(fechaHora) {
    const d = new Date(fechaHora);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
  }

  // =======================
  // Cerrar modal
  // =======================
  document
    .querySelectorAll(".al-btn-cerrar, .al-btn-cerrar-modal")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById("al-modal-overlay").classList.add("d-none");
        alarmaSeleccionadaId = null;
      });
    });
});
