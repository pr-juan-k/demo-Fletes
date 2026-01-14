document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const userInput = document.getElementById('username').value;
    const passInput = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');

    // --- BASE DE DATOS DE PRUEBA (Hardcoded) ---
    const usuariosPermitidos = [
        { user: "admin", pass: "1234" },
        { user: "juan", pass: "flete2024" },
        { user: "tucuman", pass: "mudanza2025" }
    ];
    // -------------------------------------------

    // Buscamos si el usuario y contraseña coinciden
    const encontrado = usuariosPermitidos.find(u => u.user === userInput && u.pass === passInput);

    if (encontrado) {
        // Guardamos el nombre para el saludo
        localStorage.setItem('usuarioLogueado', encontrado.user);
        
        // Redirigir
        window.location.href = 'usuario.html';
    } else {
        // Mostrar error y limpiar contraseña
        errorDiv.style.display = 'block';
        document.getElementById('password').value = "";
        
        // Animación de sacudida opcional (feedback visual)
        const card = document.querySelector('.login-card');
        card.style.animation = 'shake 0.5s';
        setTimeout(() => card.style.animation = '', 500);
    }
});