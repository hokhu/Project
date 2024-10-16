
document.getElementById('registroForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const telefono = document.getElementById('telefono').value;
    const email = document.getElementById('correo').value;
    const contraseña = document.getElementById('contraseña').value;

    axios.post('/register', {
        nombre: nombre,
        apellido: apellido,
        telefono: telefono,
        email: email,
        contraseña: contraseña
    })
    .then(response => {
        Swal.fire({
            title: '¡Registro exitoso!',
            text: response.data.message || 'Bienvenido al sistema.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        }).then(() => {
            window.location.href = '/home'; 
        });
    })
    .catch(error => {
        if (error.response) {
           
            Swal.fire({
                title: 'Error en el registro',
                text: error.response.data.message,
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        } else {
            console.error('Error en la solicitud:', error);
        }
    });
});
