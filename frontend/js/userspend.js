let usuarios = [];

let usuarioSeleccionado = null;

function aplicarPermisosRadiosRegp() {
  const adminRadio = document.querySelector('input[value="Administrador"]');
  const superAdminRadio = document.querySelector(
    'input[value="Super Administrador"]'
  );

  // Resetear disabled por si acaso
  if (adminRadio) adminRadio.disabled = false;
  if (superAdminRadio) superAdminRadio.disabled = false;

  if (window.tieneRol("superv")) {
    if (adminRadio) adminRadio.disabled = true;
    if (superAdminRadio) superAdminRadio.disabled = true;
  } else if (window.tieneRol("admin")) {
    if (superAdminRadio) superAdminRadio.disabled = true;
  }
}

$(document).on("bckofficeusersregpevent", async () => {
  usuarios = await loadPendingUsers();
  cargarUsuarios();
  abrirModalRegp(); // Ya incluye permisos ahora
});

document
  .getElementById("btn-cerrar-regp")
  .addEventListener("click", cerrarModalRegp);

/* ABRIR / CERRAR */
function abrirModalRegp() {
  // Resetear radios antes de aplicar permisos
  document.querySelectorAll('input[name="regp-rol"]').forEach((r) => {
    r.checked = false;
    r.disabled = false;
  });
  aplicarPermisosRadiosRegp();
  document.getElementById("regp-modal").classList.add("mostrar");
  validarBoton();
}

function cerrarModalRegp() {
  document.getElementById("regp-modal").classList.remove("mostrar");
}

async function loadPendingUsers() {
  try {
    const response = await fetch(`${window.config.apiUrl}/userspending`, {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error("Error al cargar usuarios pendientes");
    }

    const data = await response.json();

    return Array.isArray(data.userIds) ? data.userIds : [];
  } catch (err) {
    console.error("❌ Error fetch pending users:", err);
    return [];
  }
}

/* RENDER LISTA */
function cargarUsuarios() {
  const contenedor = document.getElementById("regp-lista-usuarios");
  contenedor.innerHTML = "";

  usuarios.forEach((nombre) => {
    const item = document.createElement("div");
    item.className = "regp-usuario";

    // limitar a 15 caracteres
    item.textContent = nombre.slice(0, 15);

    item.onclick = () => {
      document
        .querySelectorAll(".regp-usuario")
        .forEach((el) => el.classList.remove("seleccionado"));

      item.classList.add("seleccionado");
      usuarioSeleccionado = nombre;

      validarBoton();
    };

    contenedor.appendChild(item);
  });
}

/* VALIDAR BOTÓN */
function validarBoton() {
  const rol = document.querySelector('input[name="regp-rol"]:checked');
  const btn = document.getElementById("regp-btn-aprobar");

  if (usuarioSeleccionado && rol) {
    btn.disabled = false;
    btn.classList.add("activo");
  } else {
    btn.disabled = true;
    btn.classList.remove("activo");
  }
}

/* EVENTOS RADIO */
document.addEventListener("change", (e) => {
  if (e.target.name === "regp-rol") {
    validarBoton();
  }
});

async function aprobarUsuario(userid, rolId) {
  try {
    const response = await fetch(`${window.config.apiUrl}/users/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userid: userid,
        rolId: rolId
      })
    });

    if (!response.ok) {
      throw new Error("Error al aprobar usuario");
    }

    const data = await response.json();

    return data;
  } catch (err) {
    console.error("❌ Error:", err);
    return null;
  }
}

/* CLICK APROBAR */
document.getElementById("regp-btn-aprobar").onclick = async () => {
  const rol = document.querySelector('input[name="regp-rol"]:checked').value;
  let validRol = 3;

  switch (rol) {
    case "Tutor":
      validRol = 1;
      break;
    case "Maestro":
      validRol = 2;
      break;
    case "Usuario":
      validRol = 3;
      break;
    case "Supervisor":
      validRol = 4;
      break;
    case "Administrador":
      validRol = 5;
      break;
    case "Super administrador":
      validRol = 6;
      break;
  }

  if (!usuarioSeleccionado || !rol) return;

  await aprobarUsuario(usuarioSeleccionado, validRol);

  alert(`Usuario: ${usuarioSeleccionado}\nRol: ${validRol}`);

  // 🔥 eliminar usuario del array
  const index = usuarios.indexOf(usuarioSeleccionado);
  if (index !== -1) {
    usuarios.splice(index, 1);
  }

  // reset selección
  usuarioSeleccionado = null;

  // limpiar radios
  document
    .querySelectorAll('input[name="regp-rol"]')
    .forEach((r) => (r.checked = false));

  // 🔄 recargar lista
  cargarUsuarios();

  // 🔒 desactivar botón
  validarBoton();
};
