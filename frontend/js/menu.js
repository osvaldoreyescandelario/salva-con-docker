import { childrenData } from "./definitions.js";
import { createMGIpdf } from "./pdf.js";
import { openVersionModal } from "./version.js";

async function checkAppVersion() {
  try {
    // Apuntamos al archivo estático que sirve el backend
    const response = await fetch(`${window.config.apiUrl}/build-info.json`);
    if (!response.ok) return;

    const buildInfo = await response.json();

    // Lo guardamos en una variable global o en localStorage
    window.appVersion = buildInfo;
    console.log(
      `Versión actual: ${buildInfo.version} (Commit: ${buildInfo.commit})`
    );

    // 🔥 OPCIONAL: Comparar versiones para forzar recarga si hay actualización
    const localVersion = localStorage.getItem("lastKnownVersion");
    if (localVersion && localVersion !== buildInfo.commit) {
      console.log("Nueva versión detectada, recargando...");
      localStorage.setItem("lastKnownVersion", buildInfo.commit);
      window.location.reload(true); // Fuerza recarga del servidor sin caché
    } else {
      localStorage.setItem("lastKnownVersion", buildInfo.commit);
    }
  } catch (err) {
    console.error("No se pudo verificar la versión:", err);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const header = document.querySelector("header");

  /* ============================================================
     OCULTAR MENÚ EN ACERCA-DE Y CONTACTO
  ============================================================ */
  const currentPath = window.location.pathname.toLowerCase();
  const currentFile = currentPath.split("/").pop();

  const hideMenuPages = [
    "acerca.html",
    "acercade.html",
    "acerca-de.html",
    "contacto.html",
    "contact.html"
  ];

  if (hideMenuPages.some((page) => currentFile.includes(page))) {
    if (header) header.style.display = "none";
    if (navMenu) navMenu.style.display = "none";
    if (menuToggle) menuToggle.style.display = "none";
    return;
  }

  /* ============================================================
     MENÚ HAMBURGUESA
  ============================================================ */
  if (menuToggle) {
    menuToggle.addEventListener("click", () =>
      navMenu.classList.toggle("active")
    );
  }

  /* ============================================================
     🔥 BLOQUEO GLOBAL DE NAVEGACIÓN NO AUTORIZADA
  ============================================================ */
  document.addEventListener("click", function (e) {
    const el = e.target.closest("a");
    if (!el) return;

    const href = el.getAttribute("href");
    if (!href) return;

    const hrefLower = href.toLowerCase();
    if (hrefLower.startsWith("#")) return;

    const fileName = hrefLower.split("/").pop();
    const allowed = ["acerca-de.html", "contacto.html", "abc.html"];
    if (!allowed.includes(fileName)) {
      e.preventDefault();
      if (navMenu) navMenu.classList.remove("active");
    }
  });

  /* ============================================================
     MARCAR ENLACE ACTIVO
  ============================================================ */
  const navLinks = document.querySelectorAll(".nav-link");
  const currentPage = window.location.pathname;
  navLinks.forEach((link) => {
    if (
      link.getAttribute("href") === currentPage ||
      (currentPage === "/" && link.getAttribute("href") === "index.html")
    ) {
      link.classList.add("active");
    }
  });

  /* ============================================================
     DROPDOWNS CLICKABLES EN DESKTOP Y MÓVIL
  ============================================================ */
  const dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".dropdown-toggle");

    if (toggle) {
      toggle.addEventListener("click", function (e) {
        // e.preventDefault();
        // e.stopPropagation();

        dropdown.classList.toggle("show");

        dropdowns.forEach((d) => {
          if (d !== dropdown) d.classList.remove("show");
        });
      });
    }
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".dropdown")) {
      dropdowns.forEach((d) => d.classList.remove("show"));
    }
  });

  /* ============================================================
     BOTÓN LOGIN/LOGOUT
  ============================================================ */
  const loginBtn = document.getElementById("menuloginregister");
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      $(document).trigger("loginregisterevent");
    });
  }

  /* ============================================================
     GESTIÓN MENÚ BACKOFFICE SEGÚN ROL
  ============================================================ */
  const backofficeMenu = Array.from(
    document.querySelectorAll(".nav-item.dropdown")
  ).find((item) => {
    const link = item.querySelector(".nav-link.dropdown-toggle");
    return link && link.textContent.trim().toLowerCase() === "backoffice";
  });

  /* ============================================================
   EVALUACIÓN INDIVIDUAL DE CADA ITEM BACKOFFICE
=========================================================== */

  function evaluarItemsIndividual() {
    if (!backofficeMenu) return;

    // 1. TODAS las variables PRIMERO
    const todosItems = backofficeMenu.querySelectorAll("li");
    const separadores = backofficeMenu.querySelectorAll(".dropdown-separator");
    const liBackup = backofficeMenu.querySelector(".perm-backup");
    const liCleanDB = backofficeMenu.querySelector(".perm-cleandb");
    const liAuditar = backofficeMenu.querySelector(".perm-auditar");
    const liRols = backofficeMenu.querySelector(".perm-rols");
    const liUsersregp = backofficeMenu.querySelector(".perm-users-pending");
    const liUsers = backofficeMenu.querySelector(".perm-users");
    const liSubjects = backofficeMenu.querySelector(".perm-subjects");
    const liAlarms = backofficeMenu.querySelector(".perm-alarms");
    const liStat = backofficeMenu.querySelector(".perm-stat");

    const primerSeparador = separadores[0];
    const segundoSeparador = separadores[1];
    const tercerSeparador = separadores[2];
    const cuartoSeparador = separadores[3];

    // 2. Ocultar todo
    todosItems.forEach((li) => (li.style.display = "none"));

    // 3. BACKUP
    if (liBackup && window.puede("bd_backup")) {
      liBackup.style.display = "block";
    }

    // 4. CLEAN DB
    if (liCleanDB && window.puede("bd_vaciar")) {
      liCleanDB.style.display = "block";
    }

    // 5. AUDITAR ✅ CORREGIDO
    if (
      liAuditar &&
      (window.puede("auditar_trazas") || window.puede("borrar_trazas"))
    ) {
      liAuditar.style.display = "block";
    }

    // 6. ROLES (admin/superadmin)
    if (
      liRols &&
      (window.tieneRol("superadmin") ||
        window.tieneRol("admin") ||
        window.tieneRol("superv"))
    ) {
      liRols.style.display = "block";
      if (primerSeparador) primerSeparador.style.display = "block";
    }

    // 7. USUARIOS (admin/superadmin)

    if (
      liUsersregp &&
      (window.puede("usuario_editar") || window.puede("usuario_ver"))
    ) {
      liUsersregp.style.display = "block";
    }

    if (
      liUsers &&
      (window.puede("usuario_editar") || window.puede("usuario_ver"))
    ) {
      liUsers.style.display = "block";
    }

    if (liSubjects) {
      liSubjects.style.display = "block";
    }

    // 8. ✅ SEPARADOR 2 - DECLARADO ANTES
    let hayRolsUsers = false;
    if (liRols && liRols.style.display !== "none") hayRolsUsers = true;
    if (liUsersregp && liUsersregp.style.display !== "none")
      hayRolsUsers = true;
    if (liUsers && liUsers.style.display !== "none") hayRolsUsers = true;
    if (segundoSeparador && hayRolsUsers)
      segundoSeparador.style.display = "block";

    // 9. ALARMAS (solo superadmin)
    // if (liAlarms && window.tieneRol('superadmin')) {
    //     liAlarms.style.display = 'block';
    //     if (segundoSeparador) segundoSeparador.style.display = 'block';
    // }

    // 10. ESTADÍSTICAS
    if (
      window.puede("estadistica_cdo") ||
      window.puede("estadistica_provincia") ||
      window.puede("estadistica_nacion")
    ) {
      liStat.style.display = "block";
      if (tercerSeparador) tercerSeparador.style.display = "block";
    }
    cuartoSeparador.style.display = "block";
  }

  evaluarItemsIndividual();

  function updateBackofficeMenu() {
    if (!backofficeMenu) return;

    // 🚫 TU CONDICIÓN ORIGINAL: Ocultar TODO el backoffice si NO tiene permisos básicos
    const tienePermisosBasicos =
      window.tieneRol("superv") ||
      window.tieneRol("admin") ||
      window.tieneRol("superadmin") ||
      window.puede("bd_backup") ||
      window.puede("bd_vaciar") ||
      window.puede("auditar_trazas") ||
      window.puede("borrar_trazas") ||
      window.puede("usuario_editar") ||
      window.puede("usuario_ver");
    window.puede("estadistica_cdo") ||
      window.puede("estadistica_provincia") ||
      window.puede("estadistica_nacion");
    if (!tienePermisosBasicos) {
      backofficeMenu.style.display = "none";
      return; // ← IMPORTANTE: No evaluar items si no hay permisos básicos
    }

    // ✅ SI LLEGA AQUÍ: Tiene permisos básicos → Mostrar menú y evaluar items
    backofficeMenu.style.display = "block";
    evaluarItemsIndividual();
  }

  updateBackofficeMenu();
  $(document).on("newuserevent userlogoutevent", updateBackofficeMenu);

  /* ============================================================
     ACCIONES ESPECÍFICAS DE ITEM DEL MENÚ
  ============================================================ */
  const menuActions = [
    {
      selector: '.dropdown-item[href="pages/seleccionar-sujeto.html"]',
      action: () => {
        if (!window.currentUser) {
          alert("⚠️ Debe iniciar sesión primero");
          return;
        }
        document.dispatchEvent(new Event("selectsubjectsevent"));
      }
    },
    {
      selector: '.dropdown-item[href="pages/generar-pdf.html"]',
      action: async () => {
        if (!window.currentUser) {
          alert("⚠️ Debe iniciar sesión primero");
          return;
        }
        if (childrenData.dni === "") {
          alert("✋ Debe seleccionar un sujeto primero.");
          return;
        }
        await createMGIpdf();
      }
    },
    {
      selector: '.dropdown-item[href="pages/nuevo-estudio.html"]',
      action: async () => {
        if (!window.currentUser) {
          alert("⚠️ Debe iniciar sesión primero");
          return;
        }
        if (childrenData.dni === "") {
          alert("✋ Debe seleccionar un sujeto primero.");
          return;
        }

        // Seleccionar el último <th> (el único que tiene permitido abrir el menú)
        const ultimoTh = document.querySelector(
          "#test-header-sub th:last-child"
        );
        if (!ultimoTh) return;

        // Crear un evento contextmenu simulado
        const fakeRightClick = new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          clientX: ultimoTh.getBoundingClientRect().right,
          clientY: ultimoTh.getBoundingClientRect().bottom
        });

        ultimoTh.dispatchEvent(fakeRightClick);
      }
    },
    {
      selector: '.dropdown-item[href="pages/nueva-foto.html"]',
      action: async () => {
        if (!window.currentUser) {
          alert("⚠️ Debe iniciar sesión primero");
          return;
        }
        if (childrenData.dni === "") {
          alert("✋ Debe seleccionar un sujeto primero.");
          return;
        }
        document.getElementById("photoimg").click();
      }
    },
    {
      selector: 'a.nav-link[href="pages/alarmas.html"]',
      action: async () => {
        if (!window.currentUser) {
          alert("⚠️ Debe iniciar sesión primero");
          return;
        }

        $(document).trigger("bckofficealarmevent");
      }
    },
    {
      selector: '.dropdown-item[href="pages/ABC.html"]',
      action: () => {
        if (!window.currentUser) {
          alert("⚠️ Debe iniciar sesión primero");
          return;
        }
        document.dispatchEvent(new Event("ABCTestevent"));
        alert("ABC");
      }
    },
    {
      selector: '.dropdown-item[href="pages/backoffice-backup.html"]',
      action: async () => {
        await backupDB();
      }
    },
    {
      selector: '.dropdown-item[href="pages/backoffice-cleandb.html"]',
      action: async () => {
        await cleanDB();
      }
    },
    {
      selector: '.dropdown-item[href="pages/backoffice-auditar.html"]',
      action: async () => {
        const modal = document.getElementById("audit-modal");
        if (modal) modal.style.display = "flex";
        await loadAuditData();
      }
    },
    {
      selector: '.dropdown-item[href="pages/backoffice-rols.html"]',
      action: async () => {
        $(document).trigger("bckofficerolsevent");
      }
    },
    {
      selector: '.dropdown-item[href="pages/backoffice-users-pending.html"]',
      action: async () => {
        $(document).trigger("bckofficeusersregpevent");
      }
    },
    {
      selector: '.dropdown-item[href="pages/backoffice-users.html"]',
      action: async () => {
        $(document).trigger("bckofficeusersevent");
      }
    },

    {
      selector: '.dropdown-item[href="pages/backoffice-subjects.html"]',
      action: async () => {
        document.dispatchEvent(new Event("subjectspanelevent"));
      }
    },
    {
      selector: '.dropdown-item[href="pages/backoffice-estadisticas.html"]',
      action: async () => {
        $(document).trigger("estadevent");
      }
    },
    {
      selector: '.dropdown-item[href="pages/ayuda.html"]',
      action: () => {
        console.log("Click en Ayuda");
        window.open("../pdf/tutorial.pdf", "_blank");
      }
    },
    {
      selector: '.dropdown-item[href="pages/version.html"]',
      action: async () => {
        console.log("Click en Version");
        await checkAppVersion();
        openVersionModal({
          version: `v${window.appVersion.version}`,
          fecha: new Date(window.appVersion.buildDate).toLocaleDateString(
            "es-ES"
          ),
          entorno: "Desarrollo",
          descripcion: `Commit ${window.appVersion.commit}`
        });
      }
    }
  ];

  /* ============================================================
     SUBMENUES Y ACCIONES DE MENÚ
  ============================================================ */
  function closeAllSubmenus(except = null) {
    document.querySelectorAll(".dropdown-submenu.open").forEach((el) => {
      if (el !== except) el.classList.remove("open");
    });
  }

  document.body.addEventListener("click", function (e) {
    // Toggle submenú
    const toggle = e.target.closest(".submenu-toggle");
    if (toggle) {
      e.preventDefault();
      e.stopPropagation();

      const parentLi = toggle.closest(".dropdown-submenu");
      if (!parentLi) return;

      closeAllSubmenus(parentLi);
      parentLi.classList.toggle("open");
    }

    // ✅ NUEVO: captura dropdown-item Y nav-link
    const link = e.target.closest(".dropdown-item, a.nav-link");
    if (link) {
      const action = menuActions.find((a) => {
        const href = link.getAttribute("href");
        return (
          a.selector === `.dropdown-item[href="${href}"]` ||
          a.selector === `a.nav-link[href="${href}"]`
        );
      });

      if (action) {
        e.preventDefault(); // ← BLOQUEA navegación
        e.stopPropagation();
        action.action(); // ← SOLO ejecuta acción
        closeAllSubmenus();
      }
    }
  });

  // Cerrar submenús al hacer clic fuera
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".dropdown-submenu")) {
      closeAllSubmenus();
    }
  });

  // Cerrar con ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAllSubmenus();
  });

  /* ============================================================
     CARRUSEL
  ============================================================ */
  initCarousel();

  /* ============================================================
     FUNCIÓN DESCARGAR BACKUP
  ============================================================ */
  async function descargarBackup() {
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    progressContainer.style.display = "block";
    progressText.style.display = "inline";
    progressBar.style.width = "0%";
    progressText.textContent = "Iniciando...";

    try {
      const userId = window.currentUser?.userid || "desconocido";
      // Pasamos el userid como parámetro
      const url = `${window.config.apiUrl}/backup?userid=${encodeURIComponent(
        userId
      )}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al generar el backup");

      const reader = response.body.getReader();
      const contentLength = response.headers.get("content-length");
      const total = contentLength ? Number.parseInt(contentLength, 10) : null;
      let received = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;

        if (total) {
          const percent = ((received / total) * 100).toFixed(2);
          progressBar.style.width = `${percent}%`;
          progressText.textContent = `${percent}%`;
        } else {
          let width = parseFloat(progressBar.style.width) || 0;
          width += 1;
          if (width > 90) width = 0;
          progressBar.style.width = `${width}%`;
          progressText.textContent = `Descargando...`;
        }
      }

      const blob = new Blob(chunks, { type: "application/sql" });
      const backupName = `backup-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.sql`;

      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = backupName;
      downloadLink.click();

      setTimeout(() => URL.revokeObjectURL(downloadLink.href), 100);

      progressBar.style.width = "100%";
      progressText.textContent = "¡Backup listo!";

      setTimeout(() => {
        progressContainer.style.display = "none";
        progressText.style.display = "none";
        progressBar.style.width = "0%";
      }, 1500);
    } catch (err) {
      console.error("No se pudo descargar el backup:", err);
      progressText.textContent = "Error al descargar";
      progressBar.style.background = "red";
      setTimeout(() => {
        progressContainer.style.display = "none";
        progressText.style.display = "none";
        progressBar.style.width = "0%";
        progressBar.style.background =
          "linear-gradient(90deg, #4caf50, #81c784)";
      }, 3000);
    }
  }

  async function descargarBackupProvincia(provincia) {
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    progressContainer.style.display = "block";
    progressText.style.display = "inline";
    progressBar.style.width = "0%";
    progressText.textContent = "Iniciando...";

    try {
      // ← CAMBIO: Usa backup-provincia con parámetro opcional AQUI
      const userId = window.currentUser?.userid || "desconocido";
      const url = `${
        window.config.apiUrl
      }/backup-provincia?provincia=${encodeURIComponent(
        provincia
      )}&userid=${encodeURIComponent(userId)}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${window.config.token}` // Si usas auth
        }
      });

      if (!response.ok) throw new Error("Error al generar el backup");

      const reader = response.body.getReader();
      const contentLength = response.headers.get("content-length");
      const total = contentLength ? Number.parseInt(contentLength, 10) : null;
      let received = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;

        if (total) {
          const percent = ((received / total) * 100).toFixed(2);
          progressBar.style.width = `${percent}%`;
          progressText.textContent = `${percent}% - ${provincia || "Completo"}`;
        } else {
          let width = parseFloat(progressBar.style.width) || 0;
          width += 1;
          if (width > 90) width = 0;
          progressBar.style.width = `${width}%`;
          progressText.textContent = `Descargando ${
            provincia || "completo"
          }...`;
        }
      }

      const blob = new Blob(chunks, { type: "application/sql" });

      // ← CAMBIO: Nombre dinámico según provincia
      const backupName = `backup-${provincia || "completo"}-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.sql`;

      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = backupName;
      downloadLink.click();

      setTimeout(() => URL.revokeObjectURL(downloadLink.href), 100);

      progressBar.style.width = "100%";
      progressText.textContent = `¡Backup ${provincia || "completo"} listo!`;

      setTimeout(() => {
        progressContainer.style.display = "none";
        progressText.style.display = "none";
        progressBar.style.width = "0%";
      }, 2000);
    } catch (err) {
      console.error("No se pudo descargar el backup:", err);
      progressText.textContent = "Error al descargar";
      progressBar.style.background = "red";
      setTimeout(() => {
        progressContainer.style.display = "none";
        progressText.style.display = "none";
        progressBar.style.width = "0%";
        progressBar.style.background =
          "linear-gradient(90deg, #4caf50, #81c784)";
      }, 3000);
    }
  }

  async function backupDB() {
    if (
      window.puede("bd_backup") &&
      !(window.tieneRol("admin") || window.tieneRol("superadmin"))
    ) {
      await descargarBackupProvincia(window.currentUser.province);
    } else if (window.tieneRol("admin") || window.tieneRol("superadmin")) {
      descargarBackup();
    }
  }
});

async function limpiarDatosSelectivos() {
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  // ⚠️ DOUBLE CONFIRM
  if (
    !confirm(
      "⚠️ ¿BORRAR TODOS LOS DATOS excepto auxpermissions, auxrols, auxrolspermissions?"
    )
  )
    return;
  if (
    !confirm(
      "🔴 Mantiene solo: auxpermissions, auxrols, auxrolspermissions y users. ¿Seguro?"
    )
  )
    return;

  progressContainer.style.display = "block";
  progressText.style.display = "inline";
  progressBar.style.width = "0%";
  progressText.textContent = "🧹 Limpiando datos selectivos...";

  try {
    const response = await fetch(
      `${window.config.apiUrl}/limpiar-datos-selectivo`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${window.config.token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const result = await response.json();

    if (result.success) {
      progressBar.style.width = "100%";
      progressText.innerHTML = `✅ ${
        result.message
      }<br>🛡️ Protegidas: ${result.protegidas.join(", ")}`;

      setTimeout(() => {
        progressContainer.style.display = "none";
        progressText.style.display = "none";
        progressBar.style.width = "0%";
        alert(
          `🎉 Limpieza completada!\n\n✅ Limpiadas: ${
            result.limpiadas.length
          } tablas\n🛡️ Protegidas: ${result.protegidas.join(", ")}`
        );
      }, 3000);
    } else {
      throw new Error(result.error || "Error desconocido");
    }
  } catch (err) {
    console.error("Error:", err);
    progressText.textContent = "❌ Error: " + err.message;
    progressBar.style.background = "red";

    setTimeout(() => {
      progressContainer.style.display = "none";
      progressText.style.display = "none";
      progressBar.style.width = "0%";
      progressBar.style.background = "linear-gradient(90deg, #4caf50, #81c784)";
    }, 3000);
  }
}

async function cleanDB() {
  await limpiarDatosSelectivos();
}

function initCarousel() {
  const carousels = document.querySelectorAll(".carousel");

  carousels.forEach((carousel) => {
    const slides = carousel.querySelector(".carousel-slides");
    if (!slides) return;

    const slideCount = slides.children.length;
    let currentIndex = 0;

    function updateCarousel() {
      slides.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    setInterval(() => {
      currentIndex = (currentIndex + 1) % slideCount;
      updateCarousel();
    }, 4000);

    updateCarousel();
  });
}

// ============================================================
// Smooth scroll
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const href = this.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});
