let timeout; 
        const warningTime = 400000;  //recordar devolverlos a 40000 y 60000
        const logoutTime = 600000; 

        function resetTimer() {
            clearTimeout(timeout); 
            timeout = setTimeout(showWarning, warningTime); 
        }

        function showWarning() {
            Swal.fire({
                title: 'Inactividad',
                text: 'Has estado inactivo durante 40 segundos. Se cerrará la sesión en 20 segundos.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Cerrar sesión ahora',
                cancelButtonText: 'Seguir conectado'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/logout'; 
                } else {
                    resetTimer(); 
                }
            });

            
            setTimeout(() => {
                Swal.fire({
                    title: 'Cerrando sesión',
                    text: 'Se ha cerrado la sesión por inactividad.',
                    icon: 'info'
                }).then(() => {
                    window.location.href = '/logout'; 
                });
            }, 20000); 
        }

        
        window.onload = resetTimer; 
        window.onmousemove = resetTimer; 
        window.onkeypress = resetTimer; 