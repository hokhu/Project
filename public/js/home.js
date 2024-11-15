document.addEventListener('DOMContentLoaded', () => {
    cargarTareas();

    const modal = document.getElementById("createTaskModal");
    const newTaskButton = document.querySelector(".new_task");
    const closeButton = document.querySelector(".close-button");

    // Mostrar el modal para crear una nueva tarea
    newTaskButton.addEventListener("click", () => {
        modal.style.display = "block";
    });

    // Cerrar el modal y resetear el formulario
    closeButton.addEventListener("click", () => {
        resetForm();
        modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target == modal) {
            resetForm();
            modal.style.display = "none";
        }
    });

    // Función para resetear el formulario
    function resetForm() {
        const form = document.getElementById('createTaskForm');
        const modalTitle = document.getElementById('modalTitle');
        const submitButton = document.getElementById('submitButton');
        
        form.reset();
        document.getElementById('taskId').value = '';
        modalTitle.textContent = 'Crear Nueva Tarea';
        submitButton.textContent = 'Crear';
    }

    // Agregar el event listener al formulario de crear tarea
    const createTaskForm = document.getElementById("createTaskForm");
    if (createTaskForm) {
        createTaskForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const name = document.getElementById("taskName").value;
            const description = document.getElementById("taskDescription").value;
            const dueDate = document.getElementById("dueDate").value;
            const taskId = document.getElementById("taskId").value; // Obtener el ID de la tarea

            try {
                let response;
                if (taskId) {
                    
                    response = await fetch(`/api/editarTareas/${taskId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ name, description, dueDate }),
                    });
                } else {
                    // Crear nueva tarea
                    response = await fetch("/api/tareas", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ name, description, dueDate }),
                    });
                }

                if (response.ok) {
                    await cargarTareas();
                    Swal.fire({
                        icon: "success",
                        title: "Tarea guardada",
                        showConfirmButton: false,
                        timer: 1500,
                    });
                    modal.style.display = "none";
                } else {
                    throw new Error("Error al guardar la tarea");
                }
            } catch (error) {
                console.error("Error:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo guardar la tarea",
                });
            }
        });
    } else {
        console.error("El formulario createTaskForm no se encontró en el DOM.");
    }
});



async function eliminarTarea(id) {
    try {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const response = await fetch(`/api/tareas/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Error al eliminar la tarea');
            }

            await cargarTareas(); // Recargar la tabla
            Swal.fire(
                'Eliminada',
                'La tarea ha sido eliminada.',
                'success'
            );
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar la tarea'
        });
    }
}

async function cargarTareas() {
    console.log('Cargando tareas...');
    try {
        const response = await fetch('/api/admin/tareas');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tareas = await response.json();
        console.log('Tareas recibidas:', tareas);

        const tbody = document.getElementById('tareas-tbody');
        tbody.innerHTML = '';

        tareas.forEach(tarea => {
            const fechaInicio = new Date(tarea.creation_date).toLocaleDateString('es-ES');
            const fechaFin = new Date(tarea.due_date).toLocaleDateString('es-ES');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tarea.id}</td>
                <td>${tarea.first_name}</td>
                <td>${tarea.last_name}</td>
                <td>${tarea.name || '-'}</td>
                <td>${tarea.description || '-'}</td>
                <td>${fechaInicio}</td>
                <td>${fechaFin}</td>
                <td class="acciones">
                    <button onclick="editarTarea(${tarea.id})" class=" btn-editar" title="Editar tarea">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="eliminarTarea(${tarea.id})" class="btn-estado btn-eliminar" title="Eliminar tarea">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error cargando las tareas:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las tareas. Por favor, intenta de nuevo más tarde.'
        });
    }
}
async function editarTarea(id) {
    try {
       
        const response = await fetch(`/api/tareas/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tarea = await response.json();

       
        const modal = document.getElementById('createTaskModal');
        const modalTitle = document.getElementById('modalTitle');
        const submitButton = document.getElementById('submitButton');

       
        modalTitle.textContent = 'Editar Tarea';
        submitButton.textContent = 'Actualizar';

       
        document.getElementById('taskId').value = id;
        document.getElementById('taskName').value = tarea.name;
        document.getElementById('taskDescription').value = tarea.description;
        
     
        const dueDate = new Date(tarea.due_date);
        document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];

        modal.style.display = 'block';

    } catch (error) {
        console.error('Error al cargar la tarea:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la tarea para editar'
        });
    }
}

