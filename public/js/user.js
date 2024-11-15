document.addEventListener('DOMContentLoaded', async () => {
    const cargarDatosUsuario = async () => {
        try {
            const response = await fetch('/api/users');         
            if (response.status === 200) {
                const user = await response.json();

                console.log(user); 
                document.getElementById('idUser').value = user.id;
                document.getElementById('firstName').value = user.first_name;
                document.getElementById('lastName').value = user.last_name;
                document.getElementById('phone').value = user.phone;
                document.getElementById('email').value = user.email;

            } else {
                console.error('Error al obtener los datos del usuario:', response.status);
                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar los datos',
                    text: 'No se pudieron obtener los datos del usuario.',
                });
            }
        } catch (error) {
            console.error('Error al obtener los datos del usuario:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la información del usuario.',
            });
        }
    };

    cargarDatosUsuario();
    
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        document.getElementById('editProfileModal').style.display = 'block';
        
        document.getElementById('editFirstName').value = document.getElementById('firstName').value;
        document.getElementById('editLastName').value = document.getElementById('lastName').value;
        document.getElementById('editPhone').value = document.getElementById('phone').value;
        document.getElementById('editEmail').value = document.getElementById('email').value;
    });

    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('editProfileModal').style.display = 'none';
    });

    document.getElementById('editProfileForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const updatedUser = {
            firstName: document.getElementById('editFirstName').value,
            lastName: document.getElementById('editLastName').value,
            phone: document.getElementById('editPhone').value,
            email: document.getElementById('editEmail').value,
            password: document.getElementById('editPassword').value,
        };
    
        const id = document.getElementById('idUser').value; // Accede al valor de idUser
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedUser)
            });
    
            const data = await response.json(); // Leer la respuesta del servidor
            
            console.log('Respuesta del servidor:', data); // Para ver la respuesta completa
    
            if (response.status === 200) {
                Swal.fire({
                    icon: 'success',
                    title: 'Perfil actualizado',
                    showConfirmButton: false,
                    timer: 1500,
                });
                
                document.getElementById('editProfileModal').style.display = 'none';
                
                document.getElementById('firstName').value = updatedUser.firstName;
                document.getElementById('lastName').value = updatedUser.lastName;
                document.getElementById('phone').value = updatedUser.phone;
                document.getElementById('email').value = updatedUser.email;
            } else {
                throw new Error(`Error al actualizar los datos: ${data.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `No se pudo actualizar el perfil. ${error.message}`,
            });
        }
    });
    
});

