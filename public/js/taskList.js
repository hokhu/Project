document.addEventListener('DOMContentLoaded', () => {
    cargarTareas();

    const modal = document.getElementById("createTaskModal");
    const newTaskButton = document.querySelector(".new_task");
    const closeButton = document.querySelector(".close-button");

    
    newTaskButton.addEventListener("click", () => {
        modal.style.display = "block";
    });

   
    closeButton.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });

  
    const createTaskForm = document.getElementById("createTaskForm");
    if (createTaskForm) {
        createTaskForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const name = document.getElementById("taskName").value;
            const description = document.getElementById("taskDescription").value;
            const dueDate = document.getElementById("dueDate").value;

            try {
                let response;
                    response = await fetch("/api/tareas", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ name, description, dueDate }),
                    });

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

            await cargarTareas(); 
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
        const response = await fetch('/api/tareas');
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
                <td>${tarea.name || '-'}</td>
                <td>${tarea.description || '-'}</td>
                <td>${fechaInicio}</td>
                <td>${fechaFin}</td>
                <td class="acciones">
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
