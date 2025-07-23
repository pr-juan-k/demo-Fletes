<?php
session_start(); // Inicia la sesión para almacenar mensajes de error o el estado de login

// Rutas de los archivos
$userFile = 'users.txt';
$successPage = 'dashboard.php'; // Página a la que se redirige si el login es exitoso
$loginPage = '../../user/index.php'; // Página de login si falla

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $inputUsername = $_POST['username'] ?? '';
    $inputPassword = $_POST['password'] ?? '';

    $authenticated = false;

    // Verificar si el archivo de usuarios existe
    if (file_exists($userFile)) {
        $users = file($userFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($users as $line) {
            list($storedUsername, $storedPassword) = explode(':', $line, 2); // Divide solo en 2 partes
            
            // Trim para eliminar espacios en blanco alrededor de usuario/contraseña
            $storedUsername = trim($storedUsername);
            $storedPassword = trim($storedPassword);

            // Comparar credenciales
            if ($inputUsername === $storedUsername && $inputPassword === $storedPassword) {
                $authenticated = true;
                break; // Usuario encontrado, salimos del bucle
            }
        }
    }

    if ($authenticated) {
        // Credenciales correctas, redirigir a la página de éxito
        $_SESSION['loggedin'] = true; // Establecer una variable de sesión
        $_SESSION['username'] = $inputUsername;
        header("Location: " . $successPage);
        exit();
    } else {
        // Credenciales incorrectas, redirigir de vuelta al formulario de login con un error
        $_SESSION['login_error'] = "Usuario o contraseña incorrectos.";
        header("Location: " . $loginPage);
        exit();
    }
} else {
    // Si se intenta acceder directamente a procesar_login.php sin enviar el formulario
    header("Location: " . $loginPage);
    exit();
}
?>