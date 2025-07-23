<?php
// --- guardar_viaje.php ---

// Responderemos con formato JSON para que JavaScript pueda entenderlo
header('Content-Type: application/json');

// Medida de seguridad: solo permitir peticiones POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
    exit;
}

// Recibir los datos del formulario
$nombre = $_POST['nombre'] ?? 'No especificado';
$origen = $_POST['origen'] ?? 'No especificado';
$destino = $_POST['destino'] ?? 'No especificado';
$distancia = $_POST['distancia'] ?? 'N/A';
$costo = $_POST['costo'] ?? 'N/A';
$fecha_servicio = $_POST['fecha'] ?? 'Ahora'; // Coincide con 'fecha' enviado desde JS
$descripcion_adicional = $_POST['descripcion_adicional'] ?? 'Sin descripción.'; // <-- NUEVO: Recibe este campo
$timestamp = $_POST['timestamp'] ?? date('c'); // Fecha ISO8601 si no se envía

// Definir el nombre del archivo donde se guardarán los datos
// IMPORTANTE: __DIR__ apunta al directorio actual del script PHP (assets/php/)
$archivo_txt = __DIR__ . '/realizados.txt';

// Formatear la línea que se guardará en el archivo.
// Usamos un separador como "|" porque es poco común en direcciones.
$linea = implode(" | ", [
    $timestamp,
    $nombre,
    $origen,
    $destino,
    $distancia,
    $costo,
    $fecha_servicio,
    $descripcion_adicional // <-- NUEVO: Incluye la descripción adicional en la línea
]) . PHP_EOL; // PHP_EOL es un salto de línea compatible con todos los sistemas

// Usar file_put_contents con la bandera FILE_APPEND para añadir la línea sin borrar el contenido anterior.
// Esta función también crea el archivo si no existe.
if (file_put_contents($archivo_txt, $linea, FILE_APPEND | LOCK_EX) !== false) {
    echo json_encode(['status' => 'success', 'message' => 'Datos guardados correctamente en ' . basename($archivo_txt)]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'No se pudo escribir en el archivo. Verifica los permisos del servidor para el directorio: ' . realpath(__DIR__) . ' y el archivo: ' . basename($archivo_txt) . '.']);
}
?>