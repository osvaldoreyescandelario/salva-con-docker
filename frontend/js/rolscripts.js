const PERMISOS_PREDEFINIDOS = {
    1: ['sujeto_solicitar'],
    2: ['sujeto_solicitar'],
    3: ['alarma_propia', 'encuestas', 'sujeto_estudiar', 'usuario_registrarse', 'estadistica_cdo'],
    4: ['acceso_tablero_control', 'sujeto_solicitar', 'alarma_cdo', 'alarma_propia', 'alarma_provincia', 'alarma_administrar', 'sujeto_ver_listado_provincia', 'sujeto_editar_listado_provincia', 'auditar_trazas', 'bd_backup', 'encuestas', 'estadistica_cdo', 'estadistica_provincia', 'sujeto_editar_listado_provincia', 'sujeto_continuar_estudio', 'sujeto_editar_listado_cdo', 'sujeto_estudiar', 'sujeto_ver_listado_cdo', 'usuario_editar', 'usuario_registrarse', 'usuario_ver', 'rol_superv', 'rol_usuarioextra'],
    5: ['acceso_tablero_control', 'sujeto_solicitar', 'sujeto_ver_listado_provincia', 'sujeto_ver_listado_nivel_nacional', 'sujeto_editar_listado_provincia', 'sujeto_editar_nivel_nacional', 'alarma_cdo', 'alarma_nacion', 'alarma_propia', 'alarma_provincia', 'alarma_superv', 'alarma_admin', 'alarma_administrar', 'auditar_trazas', 'bd_backup', 'bd_vaciar', 'borrar_trazas', 'encuestas', 'estadistica_cdo', 'estadistica_nacion', 'estadistica_provincia', 'rol_superv', 'rol_usuarioextra', 'rol_admin', 'sujeto_editar_listado_provincia', 'sujeto_continuar_estudio', 'sujeto_editar_listado_cdo', 'sujeto_estudiar', 'sujeto_ver_listado_cdo', 'usuario_editar', 'usuario_registrarse', 'usuario_ver'],
    6: ['acceso_tablero_control', 'sujeto_ver_listado_provincia', 'sujeto_ver_listado_nivel_nacional', 'sujeto_editar_listado_provincia', 'alarma_admin', 'alarma_cdo', 'alarma_nacion', 'alarma_propia', 'alarma_provincia', 'alarma_superv', 'alarma_administrar', 'auditar_trazas', 'bd_backup', 'bd_vaciar', 'borrar_trazas', 'encuestas', 'estadistica_cdo', 'estadistica_nacion', 'estadistica_provincia', 'rol_admin', 'rol_superadmin', 'rol_superv', 'rol_usuarioextra', 'sujeto_editar_listado_provincia', 'sujeto_continuar_estudio', 'sujeto_editar_listado_cdo', 'sujeto_editar_nivel_nacional', 'sujeto_estudiar', 'sujeto_solicitar', 'sujeto_ver_listado_cdo', 'usuario_editar', 'usuario_registrarse', 'usuario_ver'],
    7: ['alarma_propia', 'encuestas', 'sujeto_estudiar', 'usuario_registrarse', 'estadistica_cdo', 'rol_usuarioextra']
};

const PERMISOS_BLOQUEADOS_SUPERV = [
  'sujeto_editar_nivel_nacional',
  'sujeto_ver_listado_nivel_nacional',
  'bd_vaciar',
  'alarma_nacion',
  'alarma_admin',
  'estadistica_nacion'
];

let ROLS = [];
export let PERMISSIONS = await fetchPermissions();
let rolSeleccionado = null;
let cambiosPendientes = false;
let permisosOriginales = [];
let PERMISOS_POR_ROL = {};          // Copia de trabajo (modificable)
let PERMISOS_POR_ROL_ORIGINAL = {}; // Original BD (inmutable)
let primeraCarga = true;

/* =========================
   FETCH
========================= */
async function fetchRols() {
    const resp = await fetch(`${window.config.apiUrl}/rols`);
    if (!resp.ok) throw new Error("Error al obtener los roles");
    return await resp.json();
}

async function fetchPermissions() {
    const resp = await fetch(`${window.config.apiUrl}/permissions`);
    if (!resp.ok) throw new Error("Error al obtener los permisos");
    return await resp.json();
}

async function fetchPermisosPorRol() {
    const resp = await fetch(`${window.config.apiUrl}/permisos-por-rol`);
    if (!resp.ok) throw new Error("Error al obtener permisos por rol");
    return await resp.json();
}

/* =========================
   UI HELPERS
========================= */
function configurarBotones() {
    const btnCerrar = document.getElementById('rolbtn-cerrar');
    const btnGuardar = document.getElementById('rolbtn-guardar');

    if (btnCerrar) btnCerrar.onclick = cerrarModal;
    if (btnGuardar) btnGuardar.onclick = guardarCambios;
    if (btnGuardar) btnGuardar.disabled = true;
}

function actualizarBotonGuardar() {
    const btn = document.getElementById('rolbtn-guardar');
    if (!btn) return;
    btn.disabled = !cambiosPendientes;
}

/* =========================
   CARGAR ROLES
========================= */
async function cargarRoles() {
    const contenedor = document.querySelector('#lista-roles');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    ROLS = await fetchRols();

    ROLS.forEach(rol => {
        const div = document.createElement('div');
        div.className = 'rol-item';
        div.dataset.rolId = String(rol.idr);
        div.textContent = rol.name;
        div.onclick = () => seleccionarRol(String(rol.idr));
        contenedor.appendChild(div);
    });
}

/* =========================
   SELECCIONAR ROL
========================= */
function seleccionarRol(rolId) {

    // Guardar cambios del rol anterior en la copia
    if (!primeraCarga && rolSeleccionado !== null && rolSeleccionado !== rolId) {
        // ya se actualizó en onchange de los checkboxes
    }

    const elemento = document.querySelector(`[data-rol-id="${rolId}"]`);
    if (!elemento) return;

    document.querySelectorAll('.rol-item')
        .forEach(i => i.classList.remove('seleccionado'));

    elemento.classList.add('seleccionado');

    rolSeleccionado = rolId;
    cargarPermisosRol(rolId);

    cambiosPendientes = cambiosPendientes; // mantiene estado global
    actualizarBotonGuardar();

    primeraCarga = false;
}

async function cargarPermisosRol(rolId) {
    // PERMISSIONS = await fetchPermissions();

    const permisosAsignados = PERMISOS_POR_ROL[rolId] ?? [];
    const permisosOriginalRol = PERMISOS_POR_ROL_ORIGINAL[rolId] ?? [];
    permisosOriginales = [...permisosAsignados];

    const permisosPredefinidosRol = PERMISOS_PREDEFINIDOS[rolId] ?? [];

    const contenedor = document.getElementById('grupos-permisos');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    const grupos = {};
    PERMISSIONS.forEach(p => {
        if (!grupos[p.resource]) grupos[p.resource] = [];
        grupos[p.resource].push(p);
    });

    Object.entries(grupos).forEach(([resource, permisos]) => {
        const grupo = document.createElement('div');
        grupo.className = 'grupo-permisos';
        grupo.innerHTML = `
            <div class="grupo-header">${resource.toUpperCase()}</div>
            <div class="permisos-lista">
                ${permisos.map(p => {
                    const esPredefinido = permisosPredefinidosRol.includes(p.name);
                    const esBloqueadoSuperv =
                        window.tieneRol?.('superv') &&
                        PERMISOS_BLOQUEADOS_SUPERV.includes(p.name);

                    const marcado =
                        (permisosAsignados.includes(p.name) || esPredefinido) &&
                        !esBloqueadoSuperv;

                    return `
                        <div class="checkbox-item">
                            <input type="checkbox"
                                value="${p.name}"
                                ${marcado ? 'checked' : ''}
                                ${(esPredefinido || esBloqueadoSuperv) ? 'disabled' : ''}>
                            <label>${p.name}</label>
                        </div>
                        `;

                }).join('')}
            </div>
        `;
        contenedor.appendChild(grupo);
    });

    // Al cambiar cualquier checkbox, actualizar la copia de trabajo y habilitar Guardar
    document
        .querySelectorAll('input[type="checkbox"]:not(:disabled)')
        .forEach(cb => cb.onchange = () => {
            const todosCheckbox = document.querySelectorAll('input[type="checkbox"]:not(:disabled)');
            const permisosActuales = Array.from(todosCheckbox)
                .filter(input => input.checked)
                .map(input => input.value);

            const permisosFiltrados = permisosActuales.filter(p =>
                !(
                    window.tieneRol?.('superv') &&
                    PERMISOS_BLOQUEADOS_SUPERV.includes(p)
                )
            );

            PERMISOS_POR_ROL[rolSeleccionado] =
                permisosFiltrados.concat(permisosPredefinidosRol);

            cambiosPendientes = true;
            actualizarBotonGuardar();
        });
}

async function saveRolPermissions(username) {
    try {
        const resp = await fetch(`${window.config.apiUrl}/saveRolPermissions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                permisosPorRol: PERMISOS_POR_ROL
            })
        });

        const data = await resp.json();
        if (data.success) {
            alert("Permisos guardados correctamente.");
        } else {
            alert("Error al guardar permisos: " + data.message);
        }

    } catch (err) {
        console.error("❌ Error en fetch saveRolPermissions:", err);
        alert("Error al conectar con el servidor");
    }
}

/* =========================
   GUARDAR / MODAL
========================= */
async function guardarCambios() {
    if (!cambiosPendientes) return;

    // PERMISOS_POR_ROL ya contiene todos los cambios de todos los roles
    PERMISOS_POR_ROL_ORIGINAL = structuredClone(PERMISOS_POR_ROL);

    cambiosPendientes = false;
    actualizarBotonGuardar();
    cerrarModal();
    await saveRolPermissions(window.currentUser.userid);
}

function cerrarModal() {
    if (cambiosPendientes && !confirm('Hay cambios sin guardar. ¿Cerrar?')) return;

    PERMISOS_POR_ROL = structuredClone(PERMISOS_POR_ROL_ORIGINAL);

    const modal = document.getElementById('modal-roles');
    if (modal) modal.classList.remove('mostrar');

    rolSeleccionado = null;
    cambiosPendientes = false;
}

/* =========================
   ABRIR MODAL
========================= */
async function abrirDialogoRoles() {
    PERMISOS_POR_ROL_ORIGINAL = await fetchPermisosPorRol();
    PERMISOS_POR_ROL = structuredClone(PERMISOS_POR_ROL_ORIGINAL);

    const modal = document.getElementById('modal-roles');
    if (modal) modal.classList.add('mostrar');

    rolSeleccionado = null;
    cambiosPendientes = false;
    primeraCarga = true;

    await cargarRoles();
    seleccionarRol("1");
}

configurarBotones();
$(document).on("bckofficerolsevent", abrirDialogoRoles);
/* =========================
   INIT
========================= */
// document.addEventListener('DOMContentLoaded', () => {
//     configurarBotones();
//     $(document).on("bckofficerolsevent", abrirDialogoRoles);
// });
