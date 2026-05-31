let auditTable;

// 🔹 Cargar datos de auditoría
async function loadAuditData(filters = {}) {
  try {
    // Añadir actor_id automáticamente
    if (!filters.actor_id) filters.actor_id = window.currentUser?.userid || 'system';

    const params = new URLSearchParams(filters);
    const res = await fetch(`${window.config.apiUrl}/audit?` + params.toString());
    const result = await res.json();

    if (!result.success) {
      alert('❌ Error cargando auditoría: ' + result.message);
      return;
    }

    if (auditTable) {
      auditTable.clear().rows.add(result.data).draw();
    } else {
      auditTable = $('#audit-table').DataTable({
        data: result.data,
        columns: [
          { data: 'created_at', title: 'Fecha/Hora' },
          { data: 'actor_id', title: 'Usuario' },
          { data: 'ip', title: 'IP' },
          { data: 'action', title: 'Acción' },
          { data: 'entity', title: 'Entidad' },
          { data: 'description', title: 'Descripción' }
        ],
        order: [[0, 'desc']],
        language: { url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
        pageLength: 25
      });
    }
  } catch (err) {
    console.error('❌ Error al cargar auditoría:', err);
    alert('❌ Error de conexión al servidor.');
  }
}

// 🔹 Obtener valores de filtros
function getFilterValues() {
  return {
    actor_id: document.getElementById('audit-filter-username')?.value || '',
    entity: document.getElementById('audit-filter-table')?.value || '',
    action: document.getElementById('audit-filter-action')?.value || ''
  };
}

// 🔹 Botón Filtrar
document.getElementById('audit-btn-filter')?.addEventListener('click', () => {
  loadAuditData(getFilterValues());
});

// 🔹 Botón Exportar CSV
document.getElementById('audit-btn-export')?.addEventListener('click', async () => {
  const filters = getFilterValues();
  const params = new URLSearchParams(filters);
  const res = await fetch(`${window.config.apiUrl}/audit/export?` + params.toString());
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'audit_event.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// 🔹 Botón Borrar todas las trazas
document.getElementById('audit-btn-clear')?.addEventListener('click', async () => {
  if (!confirm('⚠️ Esto borrará TODAS las trazas del sistema. ¿Desea continuar?')) return;
  const userid = window.currentUser?.userid || 'system';
  const resp = await fetch(`${window.config.apiUrl}/audit/clearlogs?actor_id=${encodeURIComponent(userid)}`, { method: 'DELETE' });
  const r = await resp.json();
  if (r.success) {
    alert('✅ Todas las trazas han sido borradas correctamente.');
    loadAuditData();
  } else {
    alert('❌ Error: ' + r.message);
  }
});

// 🔹 Botones para cerrar modal
document.getElementById('audit-btn-close')?.addEventListener('click', () => {
  document.getElementById('audit-modal').style.display = 'none';
});
document.getElementById('audit-btn-close-bottom')?.addEventListener('click', () => {
  document.getElementById('audit-modal').style.display = 'none';
});

// 🔹 Cargar auditoría inicial al abrir modal
document.getElementById('audit-btn-open')?.addEventListener('click', () => {
  const cleanDBtn = document.getElementById('audit-btn-clear');

  if (!window.puede('borrar_trazas')) {
    cleanDBtn.style.display = 'none';
  } else {
    cleanDBtn.style.display = 'block';
  }
  document.getElementById('audit-modal').style.display = 'block';
  loadAuditData(); // sin filtros
});

// document.addEventListener('DOMContentLoaded', function () {
//   const cleanDBtn = document.getElementById('audit-btn-clear');
//   if (!window.puede('borrar_trazas')) {
//     cleanDBtn.style.display = 'none';
//   } else {
//     cleanDBtn.style.display = 'block';
//   }
  
// });
