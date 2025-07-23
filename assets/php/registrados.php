<?php
// PHP para guardar los datos de registro en 'user/registrados.txt' y luego redirigir

// Desactivar caché (solo para desarrollo)
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Verificar si la solicitud es un POST y si los datos necesarios están presentes
if ($_SERVER['REQUEST_METHOD'] === 'POST' && 
    isset($_POST['nombre']) && 
    isset($_POST['apellido']) && 
    isset($_POST['email']) && 
    isset($_POST['telefono']) && 
    isset($_POST['tipoCliente'])) {
    
    // Sanear y obtener los datos
    $nombre = htmlspecialchars($_POST['nombre']);
    $apellido = htmlspecialchars($_POST['apellido']);
    $email = htmlspecialchars($_POST['email']);
    $telefono = htmlspecialchars($_POST['telefono']);
    $tipoCliente = htmlspecialchars($_POST['tipoCliente']);

    // Generar un timestamp para el registro
    $timestamp = date('Y-m-d H:i:s');

    // Formatear la línea a guardar en el archivo
    $log_line = "{$timestamp}|||{$nombre}|||{$apellido}|||{$email}|||{$telefono}|||{$tipoCliente}\n";

    // --- RUTA AL ARCHIVO DE REGISTROS ---
    // La ruta 'user/registrados.txt' es relativa al SCRIPT PHP que se ejecuta.
    // Si 'registrados.php' está en la raíz de tu web y quieres que el .txt esté en 'user/',
    // entonces 'user/registrados.txt' es correcto.
    $file_path = __DIR__ . '../../../user/registrados.txt'; // Usar __DIR__ para ruta absoluta y más robusta

    // Asegúrate de que la carpeta 'user' exista y tenga permisos de escritura.
    $dir = dirname($file_path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true); // Crea la carpeta con permisos 0755 (dueño rwx, grupo rx, otros rx)
    }

    // Intentar escribir en el archivo
    if (file_put_contents($file_path, $log_line, FILE_APPEND | LOCK_EX) !== false) {
        // Redirigir de vuelta a la página principal con un mensaje de éxito
        header("Location: ../../index.php"); // Asumiendo que tu página principal es index.html
        exit(); // Termina la ejecución del script
    } else {
        // Redirigir de vuelta con un mensaje de error
        header("Location: ../../index.php");
        exit();
    }
} else {
    // Si no es un POST o faltan datos, redirigir con un error
    header("Location: ../../index.php");
    exit();
}
?>