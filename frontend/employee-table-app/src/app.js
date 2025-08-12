const API_BASE = 'http://localhost:3001';
const EMP_URL = `${API_BASE}/empleados`;

// --- Router SPA (hash-based) ---
function showView(hash) {
  const views = ['lista','agregar','importar'];
  const target = hash?.replace('#','') || 'lista';
  views.forEach(v => {
    document.getElementById(`vista-${v}`).classList.toggle('hidden', v !== target);
    document.getElementById(`tab-${v}`).classList.toggle('active', v === target);
  });
  if (target === 'lista') fetchEmployeeData();
}

window.addEventListener('hashchange', () => showView(location.hash));
document.addEventListener('DOMContentLoaded', () => {
  if (!location.hash) location.hash = '#lista';
  showView(location.hash);
  wireEvents();
});

// --- Lista ---
async function fetchEmployeeData() {
  const msg = document.getElementById('lista-msg');
  msg.textContent = '';
  try {
    const res = await fetch(EMP_URL);
    if (!res.ok) throw new Error('Error al cargar empleados');
    const data = await res.json();
    populateTable(data);
  } catch (err) {
    console.error(err);
    msg.textContent = 'No se pudo cargar la lista.';
    msg.className = 'msg error';
  }
}

function populateTable(employees) {
  const tbody = document.getElementById('employee-table-body');
  tbody.innerHTML = '';
  employees.forEach(emp => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${emp.id_empleados}</td>
      <td>${emp.name}</td>
      <td>${emp.lastname}</td>
      <td>${emp.email}</td>
      <td>
        <button class="btn-edit" data-id="${emp.id_empleados}" data-name="${emp.name}" data-lastname="${emp.lastname}" data-email="${emp.email}">Editar</button>
        <button class="btn-delete" data-id="${emp.id_empleados}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.id));
  });
  // Wire edit buttons
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const emp = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        lastname: btn.dataset.lastname,
        email: btn.dataset.email,
      };
      setFormMode('edit', emp);
    });
  });

}

async function handleDelete(id) {
  if (!confirm('¿Seguro que deseas eliminar este empleado?')) return;
  try {
    const res = await fetch(`${EMP_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error eliminando');
    alert('Empleado eliminado');
    fetchEmployeeData();
  } catch (err) {
    console.error(err);
    alert('No se pudo eliminar');
  }
}

// --- Agregar individual ---
function wireEvents() {
  document.getElementById('btn-recargar').addEventListener('click', fetchEmployeeData);

  const form = document.getElementById('employee-form');
  const formMsg = document.getElementById('form-msg');
  // Cancelar edición
  document.getElementById('btn-cancel').addEventListener('click', () => {
    setFormMode('create');
    location.hash = '#lista';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formMsg.textContent = '';
    const payload = {
      name: form.name.value.trim(),
      lastname: form.lastname.value.trim(),
      email: form.email.value.trim(),
    };
    if (!payload.name || !payload.lastname || !payload.email) {
      formMsg.textContent = 'Todos los campos son obligatorios.';
      formMsg.className = 'msg error';
      return;
    }
    try {
      let res;
      if (form.empId) {
        res = await fetch(`${EMP_URL}/${form.empId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        formMsg.textContent = 'Empleado actualizado';
      } else {
        res = await fetch(EMP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        formMsg.textContent = `Empleado creado (id ${data.id}).`;
      }
      formMsg.className = 'msg ok';
      setFormMode('create');
      location.hash = '#lista';
    } catch (err) {
      console.error(err);
      formMsg.textContent = form.empId ? 'Error actualizando empleado' : 'Error creando empleado';
      formMsg.className = 'msg error';
    }
  });

  // --- Importar CSV ---
  const csvForm = document.getElementById('csv-form');
  const csvMsg = document.getElementById('csv-msg');
  csvForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    csvMsg.textContent = '';
    const fileInput = document.getElementById('file');
    if (!fileInput.files.length) {
      csvMsg.textContent = 'Selecciona un archivo .csv';
      csvMsg.className = 'msg error';
      return;
    }
    const fd = new FormData();
    fd.append('file', fileInput.files[0]);
    try {
      const res = await fetch(`${EMP_URL}/import`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      csvMsg.textContent = `Importación OK. total=${data.total}, insertados=${data.inserted}, duplicados_ignorados=${data.skipped}`;
      csvMsg.className = 'msg ok';
      csvForm.reset();
      location.hash = '#lista';
    } catch (err) {
      console.error(err);
      csvMsg.textContent = 'Error importando CSV';
      csvMsg.className = 'msg error';
    }
  });
}


// --- Helpers: switch form mode (create/update) ---
function setFormMode(mode, emp = null) {
  const title = document.getElementById('form-title');
  const btnSave = document.getElementById('btn-save');
  const btnCancel = document.getElementById('btn-cancel');
  const form = document.getElementById('employee-form');
  if (mode === 'edit' && emp) {
    title.textContent = 'Editar empleado';
    btnSave.textContent = 'Actualizar';
    btnCancel.classList.remove('hidden');
    form.empId = emp.id; // custom property
    document.getElementById('emp-id').value = emp.id;
    form.name.value = emp.name;
    form.lastname.value = emp.lastname;
    form.email.value = emp.email;
    location.hash = '#agregar';
  } else {
    title.textContent = 'Agregar empleado';
    btnSave.textContent = 'Guardar';
    btnCancel.classList.add('hidden');
    form.empId = null;
    document.getElementById('emp-id').value = '';
    form.reset();
  }
}
