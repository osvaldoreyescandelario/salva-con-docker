// Abrir modal
export function openVersionModal({ version, fecha, entorno, descripcion }) {
  document.getElementById("version-modal").style.display = "flex";

  // Set datos
  document.getElementById("vm-version").textContent = version;
  document.getElementById("vm-version-detail").textContent = version;
  document.getElementById("vm-date").textContent = fecha;
  document.getElementById("vm-env").textContent = entorno;
  document.getElementById("vm-desc").textContent = descripcion;
}

// Cerrar modal
document.getElementById("vm-close").addEventListener("click", () => {
  document.getElementById("version-modal").style.display = "none";
});

// Cerrar haciendo click fuera
document.getElementById("version-modal").addEventListener("click", (e) => {
  if (e.target.id === "version-modal") {
    e.target.style.display = "none";
  }
});

// async function checkAppVersion() {
//   try {
//     // Apuntamos al archivo estático que sirve el backend
//     const response = await fetch("/build-info.json");
//     if (!response.ok) return;

//     const buildInfo = await response.json();

//     // Lo guardamos en una variable global o en localStorage
//     window.appVersion = buildInfo;
//     console.log(
//       `Versión actual: ${buildInfo.version} (Commit: ${buildInfo.commit})`
//     );

//     // 🔥 OPCIONAL: Comparar versiones para forzar recarga si hay actualización
//     const localVersion = localStorage.getItem("lastKnownVersion");
//     if (localVersion && localVersion !== buildInfo.commit) {
//       console.log("Nueva versión detectada, recargando...");
//       localStorage.setItem("lastKnownVersion", buildInfo.commit);
//       window.location.reload(true); // Fuerza recarga del servidor sin caché
//     } else {
//       localStorage.setItem("lastKnownVersion", buildInfo.commit);
//     }
//   } catch (err) {
//     console.error("No se pudo verificar la versión:", err);
//   }
// }

// document.addEventListener("DOMContentLoaded", () => {
//   const btn = document.getElementById("btn-version-demo");

//   if (btn) {
//     btn.addEventListener("click", async () => {
//       await checkAppVersion();

//       openVersionModal({
//         version: `v${window.appVersion.version}`,
//         fecha: new Date(window.appVersion.buildDate).toLocaleDateString(
//           "es-ES"
//         ),
//         entorno: "Producción",
//         descripcion: `Commit ${window.appVersion.commit}`
//       });
//     });
//   }
// });
