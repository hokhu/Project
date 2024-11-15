const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('error')) {
    const errorType = urlParams.get('error');
    let title, text;

    switch (errorType) {
        case 'incorrect-password':
            title = '¡Contraseña Incorrecta!';
            text = 'Inténtalo otra vez.';
            break;
        case 'user-not-found':
            title = 'Email no encontrado';
            text = 'Inténtalo otra vez.';
            break;
        case 'email-registered':
            title = 'Email ya registrado';
            text = 'Inténtalo con otro email.';
            break;
        default:
            title = 'Error';
            text = 'Ocurrió un problema.';
    }

    Swal.fire({
        title: title,
        text: text,
        icon: 'error',
        confirmButtonText: 'Ok'
    });
}