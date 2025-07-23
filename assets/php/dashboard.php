<?php
session_start(); // Asegúrate de que esta sea la única llamada a session_start() en este script

// Verifica si el usuario está logueado
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    // Si no está logueado, redirige a la página de login
    header("Location: ../../user/index.html");
    exit();
}

// Asegúrate de que la zona horaria esté configurada correctamente para evitar problemas con las fechas
date_default_timezone_set('America/Argentina/Tucuman');

// Ruta al archivo de texto de viajes realizados
// ¡Asegúrate de que esta ruta sea correcta desde la ubicación de dashboard.php!
// Por ejemplo, si dashboard.php está en la raíz y realizados.txt en assets/php/, la ruta sería 'assets/php/realizados.txt'
$archivoTxt = 'realizados.txt'; 

$informeMensual = []; // Array para almacenar los datos por mes y sus viajes

if (file_exists($archivoTxt)) {
    $viajes = file($archivoTxt, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($viajes as $line) {
        $datos = preg_split('/\s*\|\s*/', $line);

        // Asegúrate de que la línea tenga el formato esperado (al menos timestamp y costo)
        // Formato: timestamp | nombre | origen | destino | distancia | costo | fecha_servicio | descripcion
        if (count($datos) >= 8) { // Ahora necesitamos 8 elementos para tener todos los datos del viaje
            $timestampOriginal = $datos[0];
            $nombre = $datos[1];
            $origen = $datos[2];
            $destino = $datos[3];
            $distancia = $datos[4];
            $costoRaw = $datos[5]; // Guarda el costo original para depuración si es necesario
            $fechaServicio = $datos[6];
            $descripcion = $datos[7];

            // Limpia el costo y lo convierte a float
           // 1. Quitar '$', ' ARS' y espacios extra alrededor.
           preg_match('/[0-9.,]+/', $costoRaw, $matches);
           $costo_limpio = isset($matches[0]) ? $matches[0] : '0';

           // 2. Elimina los separadores de miles (puntos).
           $costo_limpio = str_replace('.', '', $costo_limpio); 
           
           // 3. Reemplaza la coma decimal por un punto decimal.
           $costo_limpio = str_replace(',', '.', $costo_limpio); 

           $costo = floatval($costo_limpio);

            try {
                $fechaRegistro = new DateTime($timestampOriginal);
                $mesAnioKey = $fechaRegistro->format('Y-m'); // Clave para agrupar por año-mes (ej. "2025-07")
                $mesAnioNombre = $fechaRegistro->format('F Y'); // Nombre legible del mes y año (ej. "July 2025")
                
                // Traducir el nombre del mes
                $meses = [
                    'January' => 'Enero', 'February' => 'Febrero', 'March' => 'Marzo',
                    'April' => 'Abril', 'May' => 'Mayo', 'June' => 'Junio',
                    'July' => 'Julio', 'August' => 'Agosto', 'September' => 'Septiembre',
                    'October' => 'Octubre', 'November' => 'Noviembre', 'December' => 'Diciembre'
                ];
                $mesAnioNombre = strtr($mesAnioNombre, $meses);

                // Inicializar el mes si no existe en el informe
                if (!isset($informeMensual[$mesAnioKey])) {
                    $informeMensual[$mesAnioKey] = [
                        'nombre' => $mesAnioNombre,
                        'total' => 0,
                        'viajes' => [] // Ahora almacenaremos los detalles de cada viaje aquí
                    ];
                }

                // Sumar el costo al total del mes
                $informeMensual[$mesAnioKey]['total'] += $costo;
                
                // Agregar los detalles del viaje al array de viajes de este mes
                $informeMensual[$mesAnioKey]['viajes'][] = [
                    'timestamp_registro' => $timestampOriginal,
                    'nombre' => $nombre,
                    'origen' => $origen,
                    'destino' => $destino,
                    'distancia' => $distancia,
                    'costo' => $costo, // Usar el costo ya parseado como float
                    'fecha_servicio' => $fechaServicio,
                    'descripcion' => $descripcion
                ];

            } catch (Exception $e) {
                // error_log("Error parseando fecha en dashboard.php: " . $e->getMessage() . " - Línea: " . $line);
            }
        }
    }
    // Ordenar los meses de forma descendente (del más reciente al más antiguo)
    krsort($informeMensual);
}


// --- NUEVA LÓGICA PHP PARA LEER REGISTROS ---
$archivoRegistros = '../../user/registrados.txt'; // Ruta al archivo de registros
$registros = []; // Array para almacenar los datos de los registros

if (file_exists($archivoRegistros)) {
    $lineasRegistros = file($archivoRegistros, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($lineasRegistros as $linea) {
        // Formato: 2025-07-15 17:18:51|||juan|||ruiz|||nombeusuar@gmail.com|||2323232323|||Cliente Habitual
        $datosRegistro = explode('|||', $linea); // Usamos explode con '|||' como delimitador

        if (count($datosRegistro) >= 6) { // Asegúrate de que haya al menos 6 campos
            try {
                $timestampRegistro = $datosRegistro[0];
                $nombreRegistro = $datosRegistro[1];
                $apellidoRegistro = $datosRegistro[2];
                $emailRegistro = $datosRegistro[3];
                $telefonoRegistro = $datosRegistro[4];
                $tipoClienteRegistro = $datosRegistro[5];

                $fechaHoraRegistro = new DateTime($timestampRegistro);
                
                $registros[] = [
                    'fecha_hora' => $fechaHoraRegistro->format('d/m/Y H:i:s'),
                    'nombre' => htmlspecialchars($nombreRegistro),
                    'apellido' => htmlspecialchars($apellidoRegistro),
                    'email' => htmlspecialchars($emailRegistro),
                    'telefono' => htmlspecialchars($telefonoRegistro),
                    'tipo_cliente' => htmlspecialchars($tipoClienteRegistro)
                ];
            } catch (Exception $e) {
                // Puedes loguear el error si es necesario, pero no detener la ejecución
                // error_log("Error parseando línea de registro: " . $e->getMessage() . " - Línea: " . $linea);
            }
        }
    }
    // Opcional: Ordenar los registros, por ejemplo, por fecha más reciente primero
    usort($registros, function($a, $b) {
        $dateA = DateTime::createFromFormat('d/m/Y H:i:s', $a['fecha_hora']);
        $dateB = DateTime::createFromFormat('d/m/Y H:i:s', $b['fecha_hora']);
        return $dateB <=> $dateA; // Orden descendente (más reciente primero)
    });

}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Control - Informe Detallado</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <style>
           .accordion-item .accordion-button {
            background-color: #f8f9fa; /* Light background for accordion headers */
            font-weight: bold;
            color: #343a40;
            border-bottom: 1px solid rgba(0,0,0,.125);
        }
        .accordion-item .accordion-button:not(.collapsed) {
            color: #0d6efd; /* Primary color when active */
            background-color: #e9ecef;
            box-shadow: inset 0 -1px 0 rgba(0,0,0,.125);
        }
        .accordion-body .table {
            margin-bottom: 0; /* Remove bottom margin from table inside accordion body */
        }


        .accordion-item .accordion-button {
            background-color: #f8f9fa; /* Light background for accordion headers */
            font-weight: bold;
            color: #343a40;
            border-bottom: 1px solid rgba(0,0,0,.125);
        }
        .accordion-item .accordion-button:not(.collapsed) {
            color: #0d6efd; /* Primary color when active */
            background-color: #e9ecef;
            box-shadow: inset 0 -1px 0 rgba(0,0,0,.125);
        }
        .accordion-body .table {
            margin-bottom: 0; /* Remove bottom margin from table inside accordion body */
        }
    </style>
</head>
<body class="bg-light">
    <div class="container py-5">
        <div class="card shadow-sm p-4 mb-5">
            <h1 class="mb-4">Bienvenido, <?php echo htmlspecialchars($_SESSION['username']); ?>!</h1>
            <p class="lead">Has iniciado sesión correctamente en el panel de control.</p>
            <hr>
            <div class="card shadow-sm p-4">
            <h2 class="mb-4">📋 Informe Detallado de Viajes Realizados</h2>
            <p class="text-muted">Despliega cada mes para ver los detalles de los viajes y el total generado.</p>

            <?php if (empty($informeMensual)): ?>
                <div class="alert alert-info text-center" role="alert">
                    No hay datos de viajes realizados para generar el informe detallado.
                </div>
            <?php else: ?>
                <div class="accordion" id="informeAccordion">
                    <?php 
                    $totalGlobal = 0; // Para el total de todos los meses

                    // Para asignar IDs únicos a cada acordeón
                    $accordionIdCounter = 0; 
                    
                    foreach ($informeMensual as $mesKey => $data): 
                        $totalGlobal += $data['total'];
                        $accordionIdCounter++;
                        $collapseId = "collapse-" . $accordionIdCounter;
                        $headingId = "heading-" . $accordionIdCounter;
                    ?>
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="<?php echo $headingId; ?>">
                                <button class="accordion-button <?php echo ($accordionIdCounter === 1) ? '' : 'collapsed'; ?>" type="button" data-bs-toggle="collapse" data-bs-target="#<?php echo $collapseId; ?>" aria-expanded="<?php echo ($accordionIdCounter === 1) ? 'true' : 'false'; ?>" aria-controls="<?php echo $collapseId; ?>">
                                    <?php echo htmlspecialchars($data['nombre']); ?> 
                                    <span class="ms-auto me-3 text-primary">Total: $ <?php echo number_format($data['total'], 2, ',', '.'); ?> ARS</span>
                                </button>
                            </h2>
                            <div id="<?php echo $collapseId; ?>" class="accordion-collapse collapse <?php echo ($accordionIdCounter === 1) ? 'show' : ''; ?>" aria-labelledby="<?php echo $headingId; ?>" data-bs-parent="#informeAccordion">
                                <div class="accordion-body p-0">
                                    <div class="table-responsive">
                                        <table class="table table-sm table-hover mb-0">
                                            <thead class="table-secondary">
                                                <tr>
                                                    <th scope="col">Fecha Registro</th>
                                                    <th scope="col">Cliente</th>
                                                    <th scope="col">Trayecto</th>
                                                    <th scope="col">Distancia</th>
                                                    <th scope="col" class="text-end">Costo  </th>
                                                    <th scope="col">Notas</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <?php foreach ($data['viajes'] as $viaje): 
                                                    // Procesar la fecha de registro para mostrarla
                                                    $fechaHoraRegistro = new DateTime($viaje['timestamp_registro']);
                                                    $displayFecha = $fechaHoraRegistro->format('d/m/Y H:i');

                                                    // Simplificar trayecto
                                                    $origen_corto = strtok($viaje['origen'], ',');
                                                    $destino_corto = strtok($viaje['destino'], ',');
                                                    $trayectoDisplay = htmlspecialchars($origen_corto) . ' a ' . htmlspecialchars($destino_corto);
                                                ?>
                                                    <tr>
                                                        <td><?php echo $displayFecha; ?></td>
                                                        <td><?php echo htmlspecialchars($viaje['nombre']); ?></td>
                                                        <td><?php echo $trayectoDisplay; ?></td>
                                                        <td><?php echo htmlspecialchars($viaje['distancia']); ?></td>
                                                        <td class="text-end">$ <?php echo number_format($viaje['costo'], 2, ',', '.'); ?> ARS  </td>
                                                        <td><?php echo htmlspecialchars($viaje['descripcion']); ?></td>
                                                    </tr>
                                                <?php endforeach; ?>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div><?php endforeach; ?>
                    
                    <div class="card bg-info-subtle text-info-emphasis mt-3 py-3 px-4 rounded-3 shadow-sm">
                        <div class="d-flex justify-content-between align-items-center">
                            <h4 class="mb-0">Total Global de Ingresos:</h4>
                            <h4 class="mb-0"><strong>$ <?php echo number_format($totalGlobal, 2, ',', '.'); ?> ARS</strong></h4>
                        </div>
                    </div>

                </div><?php endif; ?>
        </div>

        <div class="card shadow-sm p-4 mt-5"> <h2 class="mb-4">👤 Registros de Clientes</h2>
            <p class="text-muted">Aquí se muestran todos los registros de clientes capturados por el formulario.</p>

            <?php if (empty($registros)): ?>
                <div class="alert alert-info text-center" role="alert">
                    No hay registros de clientes disponibles.
                </div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table table-sm table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th scope="col">Fecha/Hora</th>
                                <th scope="col">Nombre</th>
                                <th scope="col">Apellido</th>
                                <th scope="col">Email</th>
                                <th scope="col">Teléfono</th>
                                <th scope="col">Tipo de Cliente</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($registros as $registro): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($registro['fecha_hora']); ?></td>
                                    <td><?php echo htmlspecialchars($registro['nombre']); ?></td>
                                    <td><?php echo htmlspecialchars($registro['apellido']); ?></td>
                                    <td><?php echo htmlspecialchars($registro['email']); ?></td>
                                    <td><?php echo htmlspecialchars($registro['telefono']); ?></td>
                                    <td><?php echo htmlspecialchars($registro['tipo_cliente']); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>

            <a href="logout.php" class="btn btn-danger">Cerrar Sesión</a>
        </div>

        


    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
</body>
</html>