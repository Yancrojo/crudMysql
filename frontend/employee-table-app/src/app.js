const apiUrl = 'http://localhost:3000/empleados';

async function fetchEmployeeData() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        populateTable(data);
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function populateTable(employees) {
    const tableBody = document.getElementById('employee-table-body');
    tableBody.innerHTML = '';

    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.id_empleados}</td>
            <td>${employee.name}</td>
            <td>${employee.lastname}</td>
            <td>${employee.email}</td>
            <td>
                <button onclick="actualizarEmpleado(${employee.id_empleados})">Actualizar</button>
                <button onclick="eliminarEmpleado(${employee.id_empleados})">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Actualizar empleado (ejemplo: solo muestra un alert, puedes expandir para enviar datos)
window.actualizarEmpleado = async function(id) {
    // Aquí podrías abrir un formulario para editar, por ahora solo ejemplo de fetch PUT
    try {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ /* datos actualizados aquí */ })
        });
        if (!response.ok) throw new Error('Error actualizando empleado');
        alert('Empleado actualizado');
        fetchEmployeeData();
    } catch (error) {
        alert('Error al actualizar empleado');
        console.error(error);
    }
}

// Eliminar empleado
window.eliminarEmpleado = async function(id) {
    if (!confirm('¿Seguro que deseas eliminar este empleado?')) return;
    try {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error eliminando empleado');
        alert('Empleado eliminado');
        fetchEmployeeData();
    } catch (error) {
        alert('Error al eliminar empleado');
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', fetchEmployeeData);