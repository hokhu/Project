document.getElementById('registroForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const telefono = document.getElementById('telefono').value;
    const email = document.getElementById('correo').value;
    const contraseña = document.getElementById('contraseña').value;

    // Mostrar indicador de carga
    Swal.fire({
        title: 'Registrando usuario',
        text: 'Por favor espere...',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading();
        }
    });

    axios.post('/register', {
        nombre: nombre,
        apellido: apellido,
        telefono: telefono,
        email: email,
        contraseña: contraseña
    })
    .then(response => {
        // Cerrar el indicador de carga
        Swal.close();
        
        // Mostrar mensaje de éxito
        Swal.fire({
            title: '¡Registro exitoso!',
            text: response.data.message || 'Bienvenido al sistema.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        }).then(() => {
            // Redirigir basado en el rol (asumiendo que estás en una sesión no-admin)
            window.location.href = '/taskList';
        });
    })
    .catch(error => {
        // Cerrar el indicador de carga
        Swal.close();

        if (error.response) {
            Swal.fire({
                title: 'Error en el registro',
                text: error.response.data.message || 'Ocurrió un error durante el registro.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        } else {
            Swal.fire({
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor. Por favor, intente nuevamente.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
            console.error('Error en la solicitud:', error);
        }
    });
});