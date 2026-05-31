import { municipiosPorProvincia } from "./mgiscripts.js";
import { roles } from "./definitions.js";
import { PERMISSIONS } from "./rolscripts.js";

/*=========================================================
   CONSTANTES
========================================================= */
const especialidades = [
  "Psicología",
  "Psicopedagogía",
  "Logopedia",
  "Psicometría",
  "Pedagogía"
];

/* =========================================================
   ESTADO
========================================================= */
let userTable;
let userEnableEdit = true;
let userHasChanges = false;
let originalRows = [];
let nextId = 1;

/* =========================================================
   FUNCIÓN PÚBLICA
========================================================= */
// FRONTEND
async function fetchPermisosPorRol() {
  const resp = await fetch(`${window.config.apiUrl}/permisosrol`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!resp.ok) {
    throw new Error("Error al obtener permisos por rol");
  }

  return await resp.json();
}

const permissionsRols = await fetchPermisosPorRol();

/* =========================================================
   CARGA DE USUARIOS
========================================================= */
async function loadUsersToOriginalRows() {
  try {
    const resp = await fetch(`${window.config.apiUrl}/users/load`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      // body: JSON.stringify({
      //   userid: window.currentUser?.userid || 'system'
      // })

      body: JSON.stringify({
        userid: window.currentUser?.userid || "system",
        role: window.currentUser?.rols?.[0] || "",
        province: window.currentUser?.province || ""
      })
    });

    const result = await resp.json();

    if (!resp.ok || result.success === false) {
      throw new Error(result.message || "Error cargando usuarios");
    }

    originalRows = result.rows.map((r, i) => ({
      id: i + 1,
      userid: r.usuario,
      usuario: r.usuario,
      password: r.password,
      correo: r.correo,
      provincia: r.provincia,
      cdo: r.cdo,
      nombre: r.nombre,
      especialidad: r.especialidad,
      activo: r.activo,
      pendiente: r.aprobado,
      rols: r.rols || [r.rol || "user"],
      // permisos: solo extras, los del rol vienen de permissionsRols
      permisos: r.permissions || []
    }));
  } catch (err) {
    console.error("❌ Error cargando usuarios:", err.message);
    alert("Error al cargar usuarios");
  }
}

/* =========================================================
   DIÁLOGO
========================================================= */
async function showUserDialog(enableEdit, scope, area) {
  userEnableEdit = enableEdit;
  userHasChanges = false;
  disableSave();
  $("#user-modal-overlay").removeClass("hidden");

  if (!userEnableEdit) $("#user-btn-save").hide();
  else $("#user-btn-save").show();

  await loadUsersToOriginalRows();

  let filteredData = originalRows;
  if (scope === "Provincia")
    filteredData = originalRows.filter((u) => u.provincia === area);
  if (scope === "CDO")
    filteredData = originalRows.filter((u) => u.cdo === area);

  nextId = originalRows.length + 1;
  initTable(filteredData.length ? filteredData : originalRows);
}

/* =========================================================
   DATATABLE
========================================================= */
function initTable(data) {
  if (userTable) userTable.destroy();

  // Footer con inputs
  if ($("#user-table tfoot").length === 0) {
    const footer = $("<tfoot><tr></tr></tfoot>");
    $("#user-table thead th").each(() =>
      footer
        .find("tr")
        .append('<th><input type="text" placeholder="Filtrar..."></th>')
    );
    $("#user-table").append(footer);
  }

  const buttonsConfig = [
    {
      extend: "excelHtml5",
      text: "📊 Excel",
      title: "Lista_Usuarios_" + new Date().toLocaleDateString("es-ES"),
      exportOptions: {
        columns: ":visible",
        format: {
          body: function (data, rowIdx, colIdx, node) {
            if (colIdx === 10) {
              // Permisos
              const $wrapper = $(node).find(".perm-dropdown-wrapper");
              const hiddenVal = $wrapper.find(".user-permisos").val();
              if (hiddenVal) {
                try {
                  const permisos = JSON.parse(hiddenVal);
                  return permisos.join(", ");
                } catch (e) {
                  return $(node).text().trim();
                }
              }
              return "0 permisos";
            }
            return $(node).find("input,select").length
              ? $(node).find("input,select").val() || $(node).text().trim()
              : $(node).text().trim() || "";
          }
        }
      }
    },
    {
      extend: "pdfHtml5",
      text: "📄 PDF",
      orientation: "landscape",
      pageSize: "A4",
      title: "Lista_Usuarios_" + new Date().toLocaleDateString("es-ES"),
      exportOptions: {
        columns: ":visible",
        format: {
          body: function (data, rowIdx, colIdx, node) {
            if (colIdx === 10) {
              const $wrapper = $(node).find(".perm-dropdown-wrapper");
              const hiddenVal = $wrapper.find(".user-permisos").val();
              if (hiddenVal) {
                try {
                  const permisos = JSON.parse(hiddenVal);
                  return permisos.join("\n");
                } catch (e) {
                  return $(node).text().trim();
                }
              }
              return "0 permisos";
            }
            return $(node).find("input,select").length
              ? $(node).find("input,select").val() || $(node).text().trim()
              : $(node).text().trim() || "";
          }
        }
      }
    }
  ];

  if (userEnableEdit) {
    buttonsConfig.push({
      text: "➕ Adicionar",
      className: "user-btn",
      action: function () {
        const newRow = {
          id: nextId++,
          usuario: "",
          password: "",
          correo: "",
          provincia: "",
          cdo: "",
          nombre: "",
          especialidad: "Psicología",
          activo: "No",
          pendiente: "No",
          rols: ["user"],
          permisos: []
        };
        userTable.row.add(newRow).draw(false);
        userHasChanges = true;
        enableSave();
      }
    });
  }

  userTable = $("#user-table").DataTable({
    data,
    pageLength: 5,
    columns: [
      { data: "usuario", render: { display: renderUsuario }, width: "6%" },
      { data: "password", render: { display: renderPassword }, width: "8%" },
      { data: "correo", render: { display: renderCorreo }, width: "10%" },
      { data: "provincia", render: { display: renderProvincia }, width: "10%" },
      { data: "cdo", render: { display: renderCDO }, width: "10%" },
      { data: "nombre", render: { display: renderText }, width: "12%" },
      {
        data: "especialidad",
        render: { display: renderEspecialidad },
        width: "8%"
      },
      { data: "activo", render: { display: renderSiNo }, width: "5%" },
      { data: "pendiente", render: { display: renderSiNo }, width: "5%" },
      { data: "rols", render: { display: renderRol }, width: "7%" },
      {
        data: "permisos",
        render: {
          display: function (data, type, row) {
            return renderPermisos(data, row);
          }
        },
        width: "22%",
        // ⭐ NUEVO: Custom filter que busca DENTRO del dropdown
        filter: function (data, searchStr, rowData, node) {
          if (!searchStr) return true;

          const $node = $(node);
          const rolActual = Array.isArray(rowData.rols)
            ? rowData.rols[0]
            : rowData.rols || "user";
          const permisosRol = permissionsRols[rolActual] || [];

          // Buscar en permisos del rol
          const matchRol = permisosRol.some((p) =>
            p.toLowerCase().includes(searchStr)
          );

          // Buscar en todos los checkboxes del dropdown (checked o no)
          const $checkboxes = $node.find('input[type="checkbox"]');
          const matchCheckboxes = $checkboxes
            .toArray()
            .some((cb) => cb.value.toLowerCase().includes(searchStr));

          return matchRol || matchCheckboxes;
        }
      }
    ],
    autoWidth: false,
    language: {
      processing: "Procesando...",
      lengthMenu: "Mostrar _MENU_ registros por página",
      zeroRecords: "No se encontraron resultados",
      emptyTable: "No hay datos disponibles en la tabla",
      info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
      infoEmpty: "Mostrando 0 a 0 de 0 registros",
      infoFiltered: "(filtrado de _MAX_ total registros)",
      search: "Buscar:",
      paginate: {
        first: "Primero",
        last: "Último",
        next: "Siguiente",
        previous: "Anterior"
      }
    },
    dom: "Bfrtip",
    buttons: buttonsConfig
  });

  // FILTROS
  userTable.columns().every(function (colIdx) {
    const column = this;
    const input = $("input", column.footer());

    input.off("keyup change").on("keyup change", function () {
      if (colIdx === 10) {
        // COLUMNA PERMISOS
        const val = $(this).val().toLowerCase().trim();
        // ⭐ CAMBIAR: usar search() normal, no con regex
        column.search(val).draw();
      } else {
        if (column.search() !== this.value) {
          column.search(this.value).draw();
        }
      }
    });
  });
}

/* =========================================================
   LECTURA
========================================================= */
function readRow(row) {
  const $row = $(row);
  const data = userTable.row($row).data();

  // ⭐ CAMBIO: Leer checkboxes habilitados que estén CHECKED
  let permisos = [];
  $row
    .find(
      '.perm-dropdown-wrapper input[type="checkbox"]:checked:not(:disabled)'
    )
    .each(function () {
      permisos.push($(this).val());
    });

  return {
    id: data.id,
    usuario: $row.find(".user-usuario").val() || "",
    password: $row.find(".user-password").val() || "",
    correo: $row.find(".user-correo").val() || "",
    provincia: $row.find(".user-provincia").val() || "",
    cdo: $row.find(".user-cdo").val() || "",
    nombre:
      $row.find("input:not(.user-usuario,.user-password,.user-correo)").val() ||
      "",
    especialidad: $row.find("select").eq(2).val() || "",
    activo: $row.find("select").eq(3).val() || "",
    pendiente: $row.find("select").eq(4).val() || "",
    rols: [$row.find("select").eq(5).val()].filter(Boolean),
    userid: data.userid,
    permisos // Ahora contiene SOLO extras habilitados y marcados ✓
  };
}

/* =========================================================
   EVENTOS GENERALES
========================================================= */
$(document).on("change input", ".user-input,.user-select", () => {
  userHasChanges = true;
  enableSave();
});

$("#user-btn-close").on("click", () => {
  if (userHasChanges && !confirm("Hay cambios sin guardar. Se perderán."))
    return;
  $("#user-modal-overlay").addClass("hidden");
});

/* =========================================================
   GUARDADO
========================================================= */
async function saveUsers(rowsToSave) {
  if (!rowsToSave || !rowsToSave.length) return;

  const payload = rowsToSave.map((row) => ({
    userid: row.userid || "",
    userpass: row.password || "",
    useremail: row.correo || "",
    userspec: row.especialidad || "Ninguno",
    fullname: row.nombre || "",
    active: row.activo === "Sí" ? 1 : 0,
    registeredpend: row.pendiente === "Sí" ? 1 : 0,
    municipality: row.cdo || "",
    province: row.provincia || "",
    rols: row.rols || ["user"],
    permisos: row.permisos || [],
    usuario: row.usuario
  }));

  try {
    const resp = await fetch(`${window.config.apiUrl}/users/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: payload,
        username: window.currentUser?.userid || "desconocido"
      })
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || "Error al guardar usuarios");
    console.log("✔ Usuarios guardados:", result);
    alert("Usuarios guardados correctamente");
  } catch (err) {
    console.error("❌ Error guardando usuarios:", err.message);
    alert("Error al guardar usuarios: " + err.message);
  }
}

/* =========================================================
   BOTÓN GUARDAR
========================================================= */
$("#user-btn-save").on("click", async () => {
  const { valid } = validateTableData();
  if (!valid) {
    alert("Hay errores en el formulario. Revise los campos marcados en rojo.");
    return;
  }

  const tableRows = [];
  userTable.rows().every(function () {
    tableRows.push(readRow(this.node()));
  });

  const idMax = Math.max(...tableRows.map((r) => r.id));
  const rowsToSave = [];

  for (let id = 1; id <= idMax; id++) {
    const currentRow = tableRows.find((r) => r.id === id);
    const originalRow = originalRows.find((r) => r.id === id);
    if (!currentRow) continue;

    const copy = { ...currentRow };
    delete copy.id;

    if (!originalRow) {
      copy.userid = "";
      rowsToSave.push(copy);
      continue;
    }

    const fields = [
      "password",
      "correo",
      "provincia",
      "cdo",
      "nombre",
      "especialidad",
      "activo",
      "pendiente",
      "rols",
      "permisos"
    ];
    let changed = false;
    for (const f of fields) {
      const v1 = JSON.stringify(currentRow[f] ?? []); // ⭐ Array → string para comparar
      const v2 = JSON.stringify(originalRow[f] ?? []); // ⭐ Array → string para comparar
      if (v1 !== v2) {
        changed = true;
        break;
      }
    }
    if (currentRow.usuario !== originalRow.userid) changed = true;

    if (changed) {
      copy.userid = originalRow.userid;
      rowsToSave.push(copy);
    }
  }

  if (!rowsToSave.length) {
    alert("No hay cambios");
    return;
  }

  await saveUsers(rowsToSave);

  originalRows = JSON.parse(JSON.stringify(tableRows));
  userHasChanges = false;
  disableSave();
  $("#user-modal-overlay").addClass("hidden");
  alert("Guardado correcto");
});

/* =========================================================
   RENDERERS
========================================================= */
function renderUsuario(d) {
  return userEnableEdit
    ? `<input value="${d || ""}" class="user-input user-usuario">`
    : d;
}
function renderPassword(d) {
  return userEnableEdit
    ? `<input type="text" value="${d || ""}" class="user-input user-password">`
    : d;
}
function renderCorreo(d) {
  return userEnableEdit
    ? `<input type="email" value="${d || ""}" class="user-input user-correo">`
    : d;
}
function renderProvincia(d) {
  return renderSelect(Object.keys(municipiosPorProvincia), d, "user-provincia");
}
function renderCDO(d, t, row) {
  return renderSelect(
    municipiosPorProvincia[row.provincia] || [],
    d,
    "user-cdo"
  );
}
function renderEspecialidad(d) {
  return renderSelect(especialidades, d);
}
function renderSiNo(d) {
  return renderSelect(["Sí", "No"], d);
}
function renderRol(d) {
  const val = Array.isArray(d) ? d[0] : d;
  return renderSelect(roles, val);
}
function renderText(d) {
  return userEnableEdit ? `<input value="${d || ""}" class="user-input">` : d;
}
function renderSelect(opts, selected, cls = "") {
  if (!userEnableEdit) return selected || "";
  return `<select class="user-select ${cls}"><option value=""></option>${opts
    .map(
      (o) =>
        `<option value="${o}" ${o === selected ? "selected" : ""}>${o}</option>`
    )
    .join("")}</select>`;
}

/**
 * PERMISOS
 * - Marca como disabled los permisos del rol actual (permissionsRols[rol])
 * - Permite marcar/desmarcar solo los extras
 */
function renderPermisos(selected, rowData) {
  if (!userEnableEdit) {
    const count = Array.isArray(selected) ? selected.length : 0;
    return count > 0 ? `${count} seleccionados` : "0 seleccionados";
  }

  const rolActual = Array.isArray(rowData.rols)
    ? rowData.rols[0]
    : rowData.rols || "user";
  const permisosRol = permissionsRols[rolActual] || [];
  const permisosRolSet = new Set(permisosRol);

  const allPermissions = PERMISSIONS.map((p) => p.name);
  const selectedSet = new Set(selected || []);

  const totalMarcados = allPermissions.filter(
    (p) => permisosRolSet.has(p) || selectedSet.has(p)
  ).length;

  const optionsHtml = allPermissions
    .map((p) => {
      const esDelRol = permisosRolSet.has(p);
      const estaSeleccionado = esDelRol || selectedSet.has(p);
      return `
      <label class="perm-item">
        <input type="checkbox"
              value="${p}"
              ${estaSeleccionado ? "checked" : ""}
              ${esDelRol ? "disabled" : ""}
              data-es-del-rol="${esDelRol ? "true" : "false"}"
        >
        ${p} ${esDelRol ? "🔒" : ""}
      </label>
    `;
    })
    .join("");

  const extras = [...selectedSet].filter((p) => !permisosRolSet.has(p));

  return `
  <div class="perm-dropdown-wrapper">
    <div class="perm-display">
      <span class="perm-count">${totalMarcados}</span> seleccionados
    </div>
    <div class="perm-menu hidden">${optionsHtml}</div>
    <input type="hidden" class="user-permisos" value='${JSON.stringify(
      extras
    )}'>
  </div>
  `;
}

/* =========================================================
   EVENTOS PERMISOS
========================================================= */
$(document).on("click", ".perm-display", function (e) {
  e.stopPropagation();
  const $menu = $(this).siblings(".perm-menu");
  $(".perm-menu").not($menu).addClass("hidden");
  $menu.toggleClass("hidden");
});

$(document).on("click", function () {
  $(".perm-menu").addClass("hidden");
});

$(document).on("click", ".perm-item input[type=checkbox]", function (e) {
  e.stopPropagation();

  // No permitir cambiar los del rol
  if ($(this).prop("disabled")) {
    return false;
  }

  const $wrapper = $(this).closest(".perm-dropdown-wrapper");

  // ⭐ NUEVO: Recalcular TOTAL (permisos del rol + extras activos)
  const rolActual = $wrapper.closest("tr").find("select").eq(5).val() || "user";
  const permisosRol = permissionsRols[rolActual] || [];
  const permisosRolSet = new Set(permisosRol);

  // Contar todos los checkboxes activos (incluyendo los del rol que están disabled pero checked)
  const totalMarcados = $wrapper.find("input[type=checkbox]:checked").length;

  // Solo extras (habilitados) para guardar en hidden
  const selected = [];
  $wrapper
    .find("input[type=checkbox]:checked:not(:disabled)")
    .each(function () {
      selected.push($(this).val());
    });

  // Actualizar hidden con solo extras
  $wrapper.find(".user-permisos").val(JSON.stringify(selected));

  // ⭐ ACTUALIZAR CONTADOR TOTAL
  $wrapper.find(".perm-count").text(totalMarcados);

  userHasChanges = true;
  enableSave();
});

/* =========================================================
   CUANDO CAMBIA EL ROL → REGENERAR PERMISOS
========================================================= */
$(document).on("change", ".user-select", function () {
  const $row = $(this).closest("tr");
  const colIdx = $(this).closest("td").index();

  // columna Roles (según tu definición es la 9, índice base 0)
  if (colIdx === 9) {
    const rowIdx = userTable.row($row).index();
    const rowData = userTable.row($row).data();

    // reconstruir permisos con el nuevo rol; mantenemos extras actuales
    const hiddenVal = $row.find(".user-permisos").val();
    let extras = [];
    if (hiddenVal) {
      try {
        extras = JSON.parse(hiddenVal);
      } catch (e) {}
    }

    rowData.rols = [$row.find("select").eq(5).val()].filter(Boolean);
    rowData.permisos = extras;

    userTable.row(rowIdx).data(rowData); // actualiza data
    userTable.row(rowIdx).invalidate().draw(false); // fuerza render de la celda permisos
  }

  userHasChanges = true;
  enableSave();
});

/* =========================================================
   UTILIDADES
========================================================= */
function enableSave() {
  $("#user-btn-save").prop("disabled", false).removeClass("user-btn-disabled");
}
function disableSave() {
  $("#user-btn-save").prop("disabled", true).addClass("user-btn-disabled");
}

$(document).ready(function () {
  $("#user-btn-open").on("click", async () => {
    showUserDialog(true, "", "");
  });
});

$(document).on("change", ".user-provincia", function () {
  const $row = $(this).closest("tr");
  const provincia = $(this).val();
  const municipios = municipiosPorProvincia[provincia] || [];
  const $cdoSelect = $row.find(".user-cdo");
  let options = '<option value=""></option>';
  municipios.forEach((m) => {
    options += `<option value="${m}">${m}</option>`;
  });
  $cdoSelect.html(options);
  userHasChanges = true;
  enableSave();
});

function clearFieldErrors() {
  $("#user-errors").addClass("hidden").empty();
  $(".user-input-error").removeClass("user-input-error");
  $(".user-select-error").removeClass("user-select-error");
}

function validateTableData() {
  clearFieldErrors();
  const usuarios = [];
  let valid = true;
  const messages = [];

  userTable.rows().every(function () {
    const node = this.node();
    const rowData = readRow(node);
    const $row = $(node);

    const {
      usuario,
      password,
      correo,
      provincia,
      cdo,
      nombre,
      especialidad,
      activo,
      pendiente,
      rols
    } = rowData;

    const $usuario = $row.find(".user-usuario");
    if (!usuario.trim()) {
      valid = false;
      messages.push("El campo 'Usuario' no puede estar vacío.");
      $usuario.addClass("user-input-error");
    } else if (usuarios.includes(usuario.trim())) {
      valid = false;
      messages.push(`El usuario '${usuario}' está repetido.`);
      $usuario.addClass("user-input-error");
    } else {
      usuarios.push(usuario.trim());
    }

    const $password = $row.find(".user-password");
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passRegex.test(password)) {
      valid = false;
      messages.push(
        `Contraseña inválida para '${usuario || "(sin usuario)"}'.`
      );
      $password.addClass("user-input-error");
    }

    const $correo = $row.find(".user-correo");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      valid = false;
      messages.push(`El correo '${correo || "(vacío)"}' no es válido.`);
      $correo.addClass("user-input-error");
    }

    const $provincia = $row.find(".user-provincia");
    const $cdo = $row.find(".user-cdo");
    const $especialidad = $row.find("select").eq(2);
    const $activo = $row.find("select").eq(3);
    const $pendiente = $row.find("select").eq(4);
    const $rol = $row.find("select").eq(5);

    if (!provincia.trim()) {
      valid = false;
      $provincia.addClass("user-select-error");
    }
    if (!cdo.trim()) {
      valid = false;
      $cdo.addClass("user-select-error");
    }
    if (!especialidad) {
      valid = false;
      $especialidad.addClass("user-select-error");
    }
    if (!activo) {
      valid = false;
      $activo.addClass("user-select-error");
    }
    if (!pendiente) {
      valid = false;
      $pendiente.addClass("user-select-error");
    }
    if (!rols || !rols[0]) {
      valid = false;
      $rol.addClass("user-select-error");
    }

    const $nombre = $row.find(
      "input:not(.user-usuario,.user-password,.user-correo)"
    );
    if (!nombre.trim()) {
      valid = false;
      messages.push(
        `El campo 'Nombre' está vacío para '${usuario || "(nuevo)"}'.`
      );
      $nombre.addClass("user-input-error");
    }
  });

  if (!valid) {
    $("#user-errors").removeClass("hidden").html(messages.join("<br>"));
    disableSave();
  } else {
    $("#user-errors").addClass("hidden").empty();
    if (userHasChanges) enableSave();
    else disableSave();
  }

  return { valid, messages };
}

$(document).on("bckofficeusersevent", () => {
  const enableEdit = window.puede("usuario_editar");
  const scope = window.tieneRol("superv")
    ? "Provincia"
    : window.tieneRol("user")
    ? "CDO"
    : window.tieneRol("admin") || window.tieneRol("superadmin")
    ? ""
    : "";
  const area =
    scope === "Provincia"
      ? window.currentUser.province
      : scope === "CDO"
      ? window.currentUser.municipality
      : window.tieneRol("admin") || window.tieneRol("superadmin")
      ? ""
      : "";

  showUserDialog(enableEdit, scope, area);
});
