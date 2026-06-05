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
