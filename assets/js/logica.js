// --- Constantes y Variables Globales ---

// --- CONSTANTES DE CÁLCULO ---
const TARIFA_MINIMA_VIAJE_CORTO = 12000;
const FACTOR_CALCULO_KM = 2.2;
const PRECIO_BASE_KM = 1600; // precio nafta
const DESCUENTO_LARGA_DISTANCIA = 0.85; // -15% entre 7 a 15 kilometros

const COSTO_AYUDA = 5000;
const COSTO_EXTRA_ASCENSOR_POR_CARGA = 1000;    // <-- Costo de $1000 por cada carga si hay ascensor
const COSTO_EXTRA_ESCALERAS_POR_CARGA = 2000; // <-- Costo de $2000 por cada carga si hay escaleras
const COSTO_POR_CARGA_ADICIONAL = 1000; // <-- Costo de $1000 por cada carga


let addressInputA = null; // Asumiendo que tienes un input para la dirección A
let suggestionsContainerA = null; // Asumiendo que tienes un contenedor para las sugerencias de A

// Si tienes dos inputs (A y B) para las direcciones, necesitarás dos pares
let addressInputB = null;
let suggestionsContainerB = null;


let mapModal, mapRoute, temporaryMarker, currentPointType;
let routingControl = null;

const confirmedPoints = {
    A: { lat: null, lng: null, address: null, marker: null },
    B: { lat: null, lng: null, address: null, marker: null }
};

let temporarySelection = { lat: null, lng: null, address: null };

// --- Referencias a Elementos del DOM ---
const mapModalElement = document.getElementById('mapModal');
const calculateButton = document.getElementById('calculate-cost-btn');
const resultsSection = document.getElementById('results-section');
const routeMapContainer = document.getElementById('route-map');
const distanceOutput = document.getElementById('distance-output');
const costOutput = document.getElementById('cost-output');
const errorMessageDiv = document.querySelector('.error-message');
const loadingDiv = document.querySelector('.loading');
const actionButtonsContainer = document.getElementById('action-buttons-container');
const addressAInput = document.getElementById('addressA-input');
const addressBInput = document.getElementById('addressB-input');
const geocodeAButton = document.getElementById('geocode-A-btn');
const geocodeBButton = document.getElementById('geocode-B-btn');
const quotationFormContainer = document.getElementById('quotation-form-container');

// --- Funciones Principales ---

function initializeMapModal() {
    const tucumanCoordinates = [-26.83, -65.22];
    mapModal = L.map('map-modal-container').setView(tucumanCoordinates, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapModal);

    mapModal.on('click', handleMapModalClick);
}

function handleMapModalClick(event) {
    const clickedLatLng = event.latlng;
    temporarySelection.lat = clickedLatLng.lat;
    temporarySelection.lng = clickedLatLng.lng;

    if (!temporaryMarker) {
        temporaryMarker = L.marker(clickedLatLng, { draggable: true }).addTo(mapModal);
    } else {
        temporaryMarker.setLatLng(clickedLatLng);
    }
    
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickedLatLng.lat}&lon=${clickedLatLng.lng}`)
        .then(response => response.json())
        .then(data => {
            temporarySelection.address = data.display_name || 'Ubicación seleccionada';
            
            // --- CAMBIO 1: ACTUALIZAR EL INPUT DENTRO DEL MODAL ---
            const mapSearchInput = document.getElementById('map-search-input');
            if(mapSearchInput) mapSearchInput.value = temporarySelection.address;
        })
        .catch(error => {
            console.error("Error al obtener la dirección:", error);
            temporarySelection.address = `Lat: ${clickedLatLng.lat.toFixed(4)}, Lng: ${clickedLatLng.lng.toFixed(4)}`;
        });
}

function confirmPointSelection() {
    if (temporaryMarker) {
        const finalLatLng = temporaryMarker.getLatLng();
        temporarySelection.lat = finalLatLng.lat;
        temporarySelection.lng = finalLatLng.lng;
    }

    if (temporarySelection.lat && temporarySelection.lng) {
        confirmedPoints[currentPointType] = { ...temporarySelection };

        // **CRÍTICO: Asegurarse de que el input visible y el oculto se actualicen**
        document.getElementById(`address${currentPointType}-input`).value = confirmedPoints[currentPointType].address;
        document.getElementById(`lat${currentPointType}`).value = confirmedPoints[currentPointType].lat;
        document.getElementById(`lng${currentPointType}`).value = confirmedPoints[currentPointType].lng;
        
        const displayAddressInput = document.getElementById(`display-address${currentPointType}`);
        if (displayAddressInput) {
            displayAddressInput.value = confirmedPoints[currentPointType].address; // ¡Esto dispara el MutationObserver!
        }
    }
}

async function geocodeAddress(address) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=ar`);
        const data = await response.json();
        if (data && data.length > 0) {
            const firstResult = data[0];
            return {
                lat: parseFloat(firstResult.lat),
                lng: parseFloat(firstResult.lon),
                address: firstResult.display_name
            };
        }
    } catch (error) {
        console.error("Error al geocodificar la dirección:", error);
    }
    return null;
}

async function handleGeocodeButtonClick(pointType) {
    const inputElement = document.getElementById(`address${pointType}-input`);
    const address = inputElement.value.trim();

    if (!address) {
        showError('Por favor, ingresa una dirección para buscar.');
        return;
    }

    loadingDiv.innerText = `Buscando ${pointType}...`;
    loadingDiv.style.display = 'block';
    hideMessages();

    const result = await geocodeAddress(address);

    loadingDiv.style.display = 'none';

    if (result) {
        confirmedPoints[pointType] = result;
        document.getElementById(`lat${pointType}`).value = result.lat;
        document.getElementById(`lng${pointType}`).value = result.lng;
        
        const displayAddressInput = document.getElementById(`display-address${pointType}`);
        if(displayAddressInput){
            displayAddressInput.value = result.address; // ¡Esto también dispara el MutationObserver!
        }
    } else {
        showError(`No se pudo encontrar la dirección para el Punto ${pointType}.`);
    }
}

function initializeRouteMap() {
    if (!mapRoute) {
        mapRoute = L.map(routeMapContainer.id).setView([-26.83, -65.22], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRoute);
    }
}

function showError(message) {
    errorMessageDiv.innerText = message;
    errorMessageDiv.style.display = 'block';
}

function hideMessages() {
    errorMessageDiv.style.display = 'none';
    loadingDiv.style.display = 'none';
}

function validateForm() {
    const latA = document.getElementById('latA').value;
    const latB = document.getElementById('latB').value;
    const nombre = document.getElementById('nombrePersona').value;
    const cargas = document.getElementById('cantidadCargas').value;
    
    if (!nombre.trim()) {
        showError('Por favor, ingresa tu nombre completo.');
        return false;
    }
    if (!latA || !latB) {
        showError('Debes seleccionar un punto de origen y uno de destino.');
        return false;
    }
    if (!cargas || parseInt(cargas) < 1) {
        showError('La cantidad de cargas debe ser al menos 1.');
        return false;
    }
    return true;
}

function resetQuote() {
    resultsSection.style.display = 'none';
    quotationFormContainer.style.display = 'block';
    if (routingControl && mapRoute) {
        mapRoute.removeControl(routingControl);
        routingControl = null;
    }
    // Opcional: Limpiar los campos de dirección al reiniciar
    document.getElementById('addressA-input').value = '';
    document.getElementById('addressB-input').value = '';
    document.getElementById('latA').value = '';
    document.getElementById('lngA').value = '';
    document.getElementById('latB').value = '';
    document.getElementById('lngB').value = '';
    document.getElementById('display-addressA').value = ''; // ¡También limpiar el hidden!
    document.getElementById('display-addressB').value = ''; // ¡También limpiar el hidden!
    // y resetear los geocode buttons si quieres:
    geocodeAButton.textContent = 'Punto A (Origen)';
    geocodeBButton.textContent = 'Punto B (Destino)';
}

// VALORES PARA LOS INPUTS DE ESCALERAS (SI/NO)
const escalerasSiRadio = document.getElementById('escalerasSi');
const escalerasNoRadio = document.getElementById('escalerasNo');
const pisosEscaleraGroup = document.getElementById('pisosEscaleraGroup');
const pisosEscaleraInput = document.getElementById('pisosEscalera');

let pisosEscalera = 0; // Variable global para almacenar el número de pisos

// Inicialmente, oculta el campo de pisos
if (pisosEscaleraGroup) {
    // Si escalerasNoRadio está chequeado al cargar, oculta el grupo
    if (escalerasNoRadio && escalerasNoRadio.checked) {
        pisosEscaleraGroup.style.display = 'none';
        pisosEscaleraInput.removeAttribute('required');
        pisosEscaleraInput.value = '';
        pisosEscalera = 0;
    } else {
        // Si no está chequeado (o 'Sí' lo está por default), asegura que esté visible
        pisosEscaleraGroup.style.display = 'block';
        pisosEscaleraInput.setAttribute('required', 'required');
        // Inicializa pisosEscalera con el valor actual del input o 0 si está vacío/no numérico
        pisosEscalera = parseInt(pisosEscaleraInput.value) || 0; 
    }
}

if (escalerasSiRadio) {
    escalerasSiRadio.addEventListener('change', function() {
        if (this.checked) {
            pisosEscaleraGroup.style.display = 'block';
            pisosEscaleraInput.setAttribute('required', 'required'); // Hacerlo requerido
            pisosEscalera = parseInt(pisosEscaleraInput.value) || 1; // Asigna el valor inicial o 1
        }
    });
}

if (escalerasNoRadio) {
    escalerasNoRadio.addEventListener('change', function() {
        if (this.checked) {
            if (pisosEscaleraGroup) pisosEscaleraGroup.style.display = 'none';
            if (pisosEscaleraInput) {
                pisosEscaleraInput.removeAttribute('required'); // Quitar requerido
                pisosEscaleraInput.value = ''; // Limpiar el valor
            }
            pisosEscalera = 0; // Resetear la variable a 0
        }
    });
}

if (pisosEscaleraInput) {
    pisosEscaleraInput.addEventListener('input', function() {
        // CAMBIO CRÍTICO: Actualizar la variable al cambiar el input
        pisosEscalera = parseInt(this.value) || 0; 
    });
}

// Lógica para mostrar/ocultar campos de fecha y hora
const programarFechaCheckbox = document.getElementById('programarFecha');
const fechaGroup = document.getElementById('fechaGroup');
const horaGroup = document.getElementById('horaGroup');
const fechaInput = document.getElementById('fecha');
const horaInput = document.getElementById('hora');

// Inicialmente, oculta los campos de fecha y hora
if (fechaGroup && horaGroup) {
    fechaGroup.style.display = 'none';
    horaGroup.style.display = 'none';
}

if (programarFechaCheckbox) {
    programarFechaCheckbox.addEventListener('change', function() {
        if (this.checked) {
            if (fechaGroup) fechaGroup.style.display = 'block';
            if (horaGroup) horaGroup.style.display = 'block';
            if (fechaInput) fechaInput.setAttribute('required', 'required');
            if (horaInput) horaInput.setAttribute('required', 'required');
        } else {
            if (fechaGroup) fechaGroup.style.display = 'none';
            if (horaGroup) horaGroup.style.display = 'none';
            if (fechaInput) {
                fechaInput.removeAttribute('required');
                fechaInput.value = '';
            }
            if (horaInput) {
                horaInput.removeAttribute('required');
                horaInput.value = '';
            }
        }
    });
}


async function handleConfirmTrip() {
    const quoteDetails = {
        nombre: document.getElementById('nombrePersona').value,
        origen: document.getElementById('addressA-input').value || confirmedPoints.A.address,
        destino: document.getElementById('addressB-input').value || confirmedPoints.B.address,
        distancia: document.getElementById('distance-output').textContent,
        costo: document.getElementById('cost-output').textContent,
        cantidadCargas: document.getElementById('cantidadCargas').value,
        ayudaCargar: document.getElementById('ayudaCargarSi').checked ? 'Sí' : 'No',
        ascensor: document.getElementById('ascensorSi').checked ? 'Sí' : 'No',
        escaleras: document.getElementById('escalerasSi').checked ? 'Sí' : 'No',
        pisosEscalera: document.getElementById('pisoaEscaleras').value, // Asegúrate de obtener el valor correcto
        
        fecha: document.getElementById('programarFecha').checked ? `${document.getElementById('fecha').value} a las ${document.getElementById('hora').value}` : 'Ahora mismo',
        descripcion: document.getElementById('descripcionAdicional').value || 'Sin descripción.'
    };

    const datosParaGuardar = new FormData();
    datosParaGuardar.append('nombre', quoteDetails.nombre);
    datosParaGuardar.append('origen', quoteDetails.origen);
    datosParaGuardar.append('destino', quoteDetails.destino);
    datosParaGuardar.append('distancia', quoteDetails.distancia);
    datosParaGuardar.append('costo', quoteDetails.costo);
    datosParaGuardar.append('fecha', quoteDetails.fecha);
    datosParaGuardar.append('timestamp', new Date().toISOString());
    datosParaGuardar.append('descripcion_adicional', quoteDetails.descripcion);

    try {
        const response = await fetch('assets/php/guardar_viaje.php', {
            method: 'POST',
            body: datosParaGuardar
        });
        const result = await response.json();

        if (result.status === 'success') {
            console.log('Viaje guardado en el servidor exitosamente:', result.message);
        } else {
            console.error('Error del servidor al guardar el viaje:', result.message);
        }
    } catch (error) {
        console.error('Error de conexión o al procesar la respuesta al intentar guardar el viaje:', error);
    }

    const message = `
¡Hola Fletes-Mudanza! Quisiera solicitar el siguiente servicio:
--------------------------------------
*Nombre:* ${quoteDetails.nombre}
*Origen:* ${quoteDetails.origen}
*Destino:* ${quoteDetails.destino}
*Distancia:* ${quoteDetails.distancia}
*Costo Estimado:* ${quoteDetails.costo}
--------------------------------------
*Detalles Adicionales:*
- Cargas: ${quoteDetails.cantidadCargas}
- Ayuda Carga: ${quoteDetails.ayudaCargar}
- Ascensor: ${quoteDetails.ascensor}
- Escaleras: ${quoteDetails.escaleras}
- Pisos: ${quoteDetails.pisosEscalera}
- Cuándo: ${quoteDetails.fecha}
- Descripción: ${quoteDetails.descripcion}
--------------------------------------
Por favor, contáctenme para coordinar. ¡Gracias!
    `.trim().replace(/^\s+/gm, '');

    const numeroWhatsApp = '5493815088924';
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// --- Event Listeners y Lógica de Carga Inicial ---
document.addEventListener('DOMContentLoaded', function() {
    initializeRouteMap();

    mapModalElement.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget;
        currentPointType = button.getAttribute('data-point-type');
        
        document.getElementById('mapModalLabel').innerText = `Seleccionar Punto ${currentPointType}`;
        
        const mapSearchInput = document.getElementById('map-search-input');
        if (mapSearchInput) {
            mapSearchInput.value = '';
        }
        
        temporarySelection = { lat: null, lng: null, address: null };

        if (!mapModal) {
            initializeMapModal();
        }
        mapModal.setView([-26.83, -65.22], 13);
        if (temporaryMarker) {
            temporaryMarker.remove();
            temporaryMarker = null;
        }
    });

    mapModalElement.addEventListener('shown.bs.modal', function() {
        if (mapModal) {
            mapModal.invalidateSize();
        }
    });

    document.getElementById('confirm-selection-btn').addEventListener('click', confirmPointSelection);
    geocodeAButton.addEventListener('click', () => handleGeocodeButtonClick('A'));
    geocodeBButton.addEventListener('click', () => handleGeocodeButtonClick('B'));
    
    // **Calculo de Viaje - Event Listener Único y Corregido**
    calculateButton.addEventListener('click', function() {
        hideMessages();
        
        if (!validateForm()) return;

        loadingDiv.innerText = 'Calculando ruta...';
        loadingDiv.style.display = 'block';

        if (routingControl && mapRoute) {
            mapRoute.removeControl(routingControl);
            routingControl = null;
        }

        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(confirmedPoints.A.lat, confirmedPoints.A.lng),
                L.latLng(confirmedPoints.B.lat, confirmedPoints.B.lng)
            ],
            router: L.Routing.osrmv1({ serviceUrl: `https://router.project-osrm.org/route/v1` }),
            routeWhileDragging: false,
            addWaypoints: false,
            show: false,
            createMarker: function(i, waypoint, n) {
                const markerLabel = i === 0 ? 'Punto A (Origen)' : 'Punto B (Destino)';
                return L.marker(waypoint.latLng, {
                    draggable: false,
                    icon: L.icon({
                        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                        shadowSize: [41, 41]
                    })
                }).bindPopup(`<b>${markerLabel}</b>`);
            }
        }).addTo(mapRoute);
        
        routingControl.on('routesfound', function(e) {
            loadingDiv.style.display = 'none';
            const summary = e.routes[0].summary;
            const distanceKm = summary.totalDistance / 1000;
            
            quotationFormContainer.style.display = 'none';
            resultsSection.style.display = 'block';
            mapRoute.fitBounds(e.routes[0].coordinates);
            mapRoute.invalidateSize();
            
            setTimeout(() => {
                resultsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
            
            if (distanceKm > 15) {
                distanceOutput.innerText = `${distanceKm.toFixed(2)} km`;
                costOutput.innerHTML = `<p class="lead strong2 text-center fw-bold ">Viaje especial con más de 15 kilómetros, ¡escribinos!</p>`;
                
                const specialMessage = "Hola, quisiera cotizar un viaje especial.";
                const whatsappUrl = `https://api.whatsapp.com/send?phone=5493815088924&text=${encodeURIComponent(specialMessage)}`;

                actionButtonsContainer.innerHTML = `
                    <a href="${whatsappUrl}" target="_blank" class="btn btn-success btn-lg mb-2 w-100">Contactar por Viaje Especial</a>
                    <button type="button" id="reset-trip-btn" class="btn btn-secondary btn-lg w-100">Reiniciar Viaje</button>
                `;
                document.getElementById('reset-trip-btn').addEventListener('click', resetQuote);

            } else {
                let costosAdicionales = 0;

                const cantidadCargas = parseInt(document.getElementById('cantidadCargas').value) || 1;
                const pisos = parseInt(document.getElementById('pisoaEscaleras').value) || 1;

                costosAdicionales += cantidadCargas * COSTO_POR_CARGA_ADICIONAL;

                if (document.getElementById('ayudaCargarSi').checked) costosAdicionales += COSTO_AYUDA;
                if (document.getElementById('ascensorSi').checked) costosAdicionales += (cantidadCargas * COSTO_EXTRA_ASCENSOR_POR_CARGA);
                if (document.getElementById('escalerasSi').checked) costosAdicionales += (pisos * COSTO_EXTRA_ESCALERAS_POR_CARGA);

                let costoViaje = 0;
                let calculoDescuento = 0;
                let totalCost = 0;
                let incremento_especial = costosAdicionales - COSTO_POR_CARGA_ADICIONAL;

                if (distanceKm < 4) {
                    
                    if (cantidadCargas == 1) {
                        if (incremento_especial != 0) {
                            totalCost = TARIFA_MINIMA_VIAJE_CORTO + incremento_especial;
                            
                        }else{
                            totalCost = TARIFA_MINIMA_VIAJE_CORTO;
                        }
                        
                    }else{
                        totalCost = (TARIFA_MINIMA_VIAJE_CORTO - 1000) + costosAdicionales;
                    }
                    
                } else if (distanceKm > 4 && distanceKm < 8) {
                    costoViaje = distanceKm * FACTOR_CALCULO_KM * PRECIO_BASE_KM;
                    totalCost = costoViaje + costosAdicionales;
                } else if (distanceKm > 8 && distanceKm < 15) {
                    costoViaje = distanceKm * FACTOR_CALCULO_KM * PRECIO_BASE_KM;
                    let costoTotalSinDescuento = costoViaje + costosAdicionales;
                    calculoDescuento = costoTotalSinDescuento * DESCUENTO_LARGA_DISTANCIA;
                    totalCost = calculoDescuento;
                }
                
                const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
                distanceOutput.innerText = `${distanceKm.toFixed(2)} km`;
                costOutput.innerText = formatter.format(totalCost);
                
                actionButtonsContainer.innerHTML = `
                    <button type="button" id="confirm-trip-btn" class="btn btn-primary btn-lg me-2">Solicitar Servicio</button>
                    <button type="button" id="reset-trip-btn" class="btn btn-secondary btn-lg">Reiniciar Viaje</button>
                `;
                
                document.getElementById('reset-trip-btn').addEventListener('click', resetQuote);
                document.getElementById('confirm-trip-btn').addEventListener('click', handleConfirmTrip);
            }
        });
        
        routingControl.on('routingerror', function(e) {
            loadingDiv.style.display = 'none';
            showError('No se pudo encontrar una ruta. Intenta con otras ubicaciones.');
            console.error("Error de enrutamiento:", e);
        });
    });

    hideMessages();

    // --- INICIO: Lógica de Autocompletado para Inputs Principales ---
    // Asegúrate de que esta función auxiliar esté definida en un ámbito accesible
// La hemos adaptado para que funcione bien con los resultados de Google Places
function formatAddressForDisplay(placeResult, includeCityAndDept = true) { // Default a true para Google Maps para asegurar detalles
    let formattedParts = [];

    // Priorizamos los componentes de dirección de Google Places
    // https://developers.google.com/maps/documentation/javascript/reference/places-service#PlaceResult
    const addressComponents = placeResult.address_components || [];
    let streetName = '';
    let houseNumber = '';
    let city = '';
    let department = ''; // Equivalente a county en Nominatim
    let state = '';
    let country = '';

    for (const component of addressComponents) {
        if (component.types.includes('street_number')) {
            houseNumber = component.long_name;
        } else if (component.types.includes('route')) {
            streetName = component.long_name;
        } else if (component.types.includes('locality')) { // Ciudad
            city = component.long_name;
        } else if (component.types.includes('administrative_area_level_2')) { // Departamento/Condado
            department = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) { // Provincia/Estado
            state = component.long_name;
        } else if (component.types.includes('country')) {
            country = component.long_name;
        }
    }

    if (streetName) {
        formattedParts.push(streetName);
    }
    if (houseNumber) {
        formattedParts.push(houseNumber);
    }

    // Añadir ciudad y departamento si se solicita o si no se pudo formar una dirección de calle
    if (includeCityAndDept || formattedParts.length === 0) {
        let locationDetails = [];

        // Prioriza San Miguel de Tucumán
        if (city.toLowerCase() === 'san miguel de tucumán') {
            locationDetails.push('San Miguel de Tucumán');
        } else if (city) {
            locationDetails.push(city);
        }

        // Prioriza Departamento Capital (Google lo da como 'administrative_area_level_2')
        if (department.toLowerCase() === 'departamento capital') {
            if (!locationDetails.includes('Departamento Capital')) { // Evitar duplicados
                locationDetails.push('Departamento Capital');
            }
        } else if (department) {
            locationDetails.push(department);
        }

        if (state.toLowerCase() === 'tucumán' && !locationDetails.includes('Tucumán')) {
            locationDetails.push('Tucumán');
        }
        if (country.toLowerCase() === 'argentina' && !locationDetails.includes('Argentina')) {
             // locationDetails.push('Argentina'); // Generalmente no es necesario mostrar el país si ya estamos filtrando por ello
        }
        
        if (locationDetails.length > 0) {
            formattedParts = formattedParts.concat(locationDetails.filter(p => !formattedParts.includes(p)));
        }
    }
    
    // Si aún no hay partes formateadas, usamos formatted_address de Google Places como fallback
    return formattedParts.filter(p => p).join(', ') || placeResult.formatted_address || 'Dirección sin formato';
}


// --- NUEVA Versión de initializeMainAutocomplete para Google Maps ---
function initializeMainAutocomplete(inputId, containerId, latId, lngId, displayId) {
    const addressInput = document.getElementById(inputId);
    const suggestionsContainer = document.getElementById(containerId);
    const latInput = document.getElementById(latId);
    const lngInput = document.getElementById(lngId);
    const displayInput = document.getElementById(displayId); // Este es el input oculto o display donde se guarda la dirección formateada.

    // Inicializar el servicio de Autocomplete de Google Maps
    // Restringimos la búsqueda a Argentina y establecemos un sesgo geográfico hacia Tucumán.
    const autocompleteOptions = {
        componentRestrictions: { country: 'ar' },
        types: ['address'], // Sugerir principalmente direcciones
        bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(-26.883, -65.324), // Suroeste de Tucumán
            new google.maps.LatLng(-26.78, -65.166)  // Noreste de Tucumán
        ),
        strictBounds: false // false permite sugerencias fuera del bound si son muy relevantes. true las restringe estrictamente.
    };
    
    // Creamos el objeto Autocomplete que se adjunta al input principal
    const autocomplete = new google.maps.places.Autocomplete(addressInput, autocompleteOptions);

    // No necesitamos el evento 'input' ni el debounce aquí, Google Maps lo maneja internamente.
    // Solo escuchamos el evento 'place_changed'.
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace(); // Obtiene los detalles completos del lugar seleccionado.

        if (!place.geometry) {
            // El usuario no seleccionó un lugar de las sugerencias,
            // o el lugar seleccionado no tiene información geográfica.
            console.log("No details available for input: '" + place.name + "'");
            suggestionsContainer.innerHTML = ''; // Ocultar sugerencias si no se encontró nada válido
            return;
        }

        // --- 1. FILTRADO ESTRICTO EN EL CLIENTE (MÁS AGRESIVO) ---
        // Aunque Google Maps es mejor, mantendremos este filtro como una capa de seguridad.
        // Google Places API proporciona address_components que son muy útiles aquí.

        const addressComponents = place.address_components || [];
        let city = '';
        let department = ''; // administrative_area_level_2
        let state = '';
        let country = '';
        let displayNameLower = (place.formatted_address || place.name || '').toLowerCase(); // Usar formatted_address para el display_name general

        for (const component of addressComponents) {
            if (component.types.includes('locality')) { // Ciudad
                city = component.long_name.toLowerCase();
            } else if (component.types.includes('administrative_area_level_2')) { // Departamento/Condado
                department = component.long_name.toLowerCase();
            } else if (component.types.includes('administrative_area_level_1')) { // Provincia/Estado
                state = component.long_name.toLowerCase();
            } else if (component.types.includes('country')) {
                country = component.long_name.toLowerCase();
            }
        }

        // Criterio de INCLUSIÓN: Debe ser de San Miguel de Tucumán O Departamento Capital
        const isInTargetArea = 
            city.includes('san miguel de tucumán') || 
            department.includes('departamento capital') ||
            displayNameLower.includes('san miguel de tucumán') ||
            displayNameLower.includes('departamento capital');

        // Criterio de EXCLUSIÓN: Lista de ubicaciones no deseadas
        const excludedLocations = [
            'simoca', 'villa de chicligasta', 'concepción', 'monteros',
            'leales', 'graneros', 'barrio oeste norte', 'famaillá', 'lules',
            'yerba buena', 'tafí viejo', 'lastenia', 'banda del río salí', 'burruyacú',
            'san pablo', 'villa nougués', 'san javier', 'el manantial',
            'aguilares', 'juan bautista alberdi', 'chicligasta' // Puedes añadir más si descubres que se cuelan
        ];
        
        const isExcluded = excludedLocations.some(term =>
            displayNameLower.includes(term) ||
            city.includes(term) ||
            department.includes(term)
        );

        // Asegurarse de que sea de Tucumán (provincia) y Argentina
        const isTucumanArgentina = state.includes('tucumán') && country.includes('argentina');

        // Solo procesar si el lugar cumple con nuestros criterios
        if (isInTargetArea && !isExcluded && isTucumanArgentina) {
            // --- ACTUALIZAR LOS CAMPOS ---
            const selectedFormattedAddress = formatAddressForDisplay(place, true); // Formatear para display
            
            addressInput.value = selectedFormattedAddress; // El input visible
            displayInput.value = selectedFormattedAddress; // El input de display/oculto
            latInput.value = place.geometry.location.lat();
            lngInput.value = place.geometry.location.lng();

            // Actualizar confirmedPoints con la dirección formateada
            const pointType = inputId === 'addressA-input' ? 'A' : 'B';
            if (window.confirmedPoints) {
                window.confirmedPoints[pointType] = { 
                    lat: place.geometry.location.lat(), 
                    lng: place.geometry.location.lng(), 
                    address: selectedFormattedAddress // Usar la dirección formateada
                };
            }
            // No es necesario vaciar suggestionsContainer aquí, Google Autocomplete lo hace automáticamente.

        } else {
            // Si el lugar seleccionado no cumple los filtros, limpiar el input y los datos.
            addressInput.value = '';
            displayInput.value = '';
            latInput.value = '';
            lngInput.value = '';
            const pointType = inputId === 'addressA-input' ? 'A' : 'B';
            if (window.confirmedPoints && window.confirmedPoints[pointType]) {
                delete window.confirmedPoints[pointType]; // Limpiar si no cumple el filtro
            }
            console.warn("La dirección seleccionada no cumple los criterios de filtro y fue rechazada:", place.formatted_address || place.name);
            // Opcional: mostrar un mensaje al usuario
            // alert("Por favor, selecciona una dirección válida dentro de San Miguel de Tucumán o Departamento Capital.");
        }
    });

    // Para el contenedor de sugerencias (suggestionsContainer), en el caso de Google Maps
    // no lo llenamos nosotros con <a> tags. Google Maps genera sus propias sugerencias
    // directamente debajo del input.
    // Podrías usar este contenedor para otros propósitos o eliminarlo si solo dependes de Google Autocomplete.
    // Si aún quieres un comportamiento similar a Nominatim (mostrar lista HTML personalizada),
    // tendrías que usar el servicio Places Autocomplete (Service) en lugar del Widget (Autocomplete class),
    // pero eso es más complejo y generalmente no es necesario con Google Maps.

    // El evento 'click' fuera del input tampoco es necesario con Google Maps Autocomplete.
    // La UI de Google maneja esto por sí misma.
}
    initializeMainAutocomplete(
        'addressA-input', 
        'suggestions-A-container', 
        'latA', 
        'lngA', 
        'display-addressA'
    );

    initializeMainAutocomplete(
        'addressB-input', 
        'suggestions-B-container', 
        'latB', 
        'lngB', 
        'display-addressB'
    );
    // --- FIN: Lógica de Autocompletado ---


    // --- INICIO: Lógica del MutationObserver ---
    const displayAddressA = document.getElementById('display-addressA');
    const displayAddressB = document.getElementById('display-addressB');

    if (displayAddressA && geocodeAButton) {
        const observerA = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    const newAddress = displayAddressA.value;
                    if (newAddress && newAddress !== 'Ubicación seleccionada') {
                        geocodeAButton.textContent = newAddress;
                    } else {
                        geocodeAButton.textContent = 'Punto A (Origen)';
                    }
                }
            }
        });
        observerA.observe(displayAddressA, { attributes: true });
    } else {
        console.warn("Elemento 'display-addressA' o 'geocode-A-btn' no encontrado.");
    }

    if (displayAddressB && geocodeBButton) {
        const observerB = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    const newAddress = displayAddressB.value;
                    if (newAddress && newAddress !== 'Ubicación seleccionada') {
                        geocodeBButton.textContent = newAddress;
                    } else {
                        geocodeBButton.textContent = 'Punto B (Destino)';
                    }
                }
            }
        });
        observerB.observe(displayAddressB, { attributes: true });
    } else {
        console.warn("Elemento 'display-addressB' o 'geocode-B-btn' no encontrado.");
    }
    // --- FIN: Lógica del MutationObserver ---


    // Referencias a los elementos de búsqueda del modal
    const mapSearchInput = document.getElementById('map-search-input');
    const mapSearchBtn = document.getElementById('map-search-btn');
    const modalSuggestionsContainer = document.getElementById('suggestions-container'); // Renombrado para evitar confusión

    let selectionFromSuggestions = null;

    const geocodeAndCenterInModal = async () => {
        const addressQuery = mapSearchInput.value.trim();
        if (!addressQuery) {
            alert('Por favor, ingresa una dirección.');
            return;
        }

        let result = null;
        if (selectionFromSuggestions) {
            // Usar la selección previa si existe
            result = selectionFromSuggestions;
            selectionFromSuggestions = null; // Resetear después de usar
        } else {
            // Realizar una nueva geocodificación
            const loadingModalDiv = document.getElementById('loading-modal'); // Asume que tienes un div de carga en tu modal
            if (loadingModalDiv) loadingModalDiv.style.display = 'block';

            // Aquí asumo que geocodeAddress devuelve un objeto con al menos display_name, lat, lon
            // Si solo devuelve una cadena, esta parte necesitará más lógica
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}, Tucumán, Argentina&format=json&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                const place = data[0];
                result = {
                    lat: parseFloat(place.lat),
                    lng: parseFloat(place.lon),
                    address: formatAddressForDisplay(place) // Formatea la dirección aquí
                };
            } else {
                result = null;
            }

            if (loadingModalDiv) loadingModalDiv.style.display = 'none';
        }

        if (result && mapModal) {
            mapModal.setView([result.lat, result.lng], 16);
            if (!temporaryMarker) {
                temporaryMarker = L.marker([result.lat, result.lng], { draggable: true }).addTo(mapModal);
            } else {
                temporaryMarker.setLatLng([result.lat, result.lng]);
            }
            temporarySelection.lat = result.lat;
            temporarySelection.lng = result.lng;
            temporarySelection.address = result.address;

            // Actualiza el input del modal con la dirección formateada
            mapSearchInput.value = result.address;
        } else {
            alert('No se encontró la dirección. Intenta ser más específico.');
        }
    };

    if (mapSearchBtn) {
        mapSearchBtn.addEventListener('click', geocodeAndCenterInModal);
    }
    // Evento para Enter en el campo de búsqueda del modal
    if (mapSearchInput) {
        mapSearchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Evita el envío del formulario
                geocodeAndCenterInModal();
            }
        });

        // Lógica de autocompletado para el campo de búsqueda del modal
        let debounceModalTimeout;
        mapSearchInput.addEventListener('input', () => {
            clearTimeout(debounceModalTimeout);
            const query = mapSearchInput.value.trim();

            if (query.length < 2) {
                modalSuggestionsContainer.innerHTML = '';
                return;
            }

            debounceModalTimeout = setTimeout(async () => {
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}, Tucumán, Argentina&format=json&limit=5`;
                try {
                    const response = await fetch(url);
                    const data = await response.json();

                    modalSuggestionsContainer.innerHTML = '';
                    data.forEach(place => {
                        const item = document.createElement('a');
                        item.href = '#';
                        item.className = 'list-group-item list-group-item-action';
                        // *** APLICA EL FORMATO AQUÍ PARA LAS SUGERENCIAS DEL MODAL ***
                        item.textContent = formatAddressForDisplay(place);

                        item.addEventListener('click', (e) => {
                            e.preventDefault();
                            // *** Y AQUÍ AL SELECCIONAR LA SUGERENCIA DEL MODAL ***
                            const selectedFormattedAddress = formatAddressForDisplay(place);
                            mapSearchInput.value = selectedFormattedAddress;
                            
                            selectionFromSuggestions = {
                                lat: parseFloat(place.lat),
                                lng: parseFloat(place.lon),
                                address: selectedFormattedAddress // Guardar la dirección formateada
                            };
                            modalSuggestionsContainer.innerHTML = '';
                            geocodeAndCenterInModal(); // Centra el mapa con la selección
                        });

                        modalSuggestionsContainer.appendChild(item);
                    });
                } catch (error) {
                    console.error('Error al obtener sugerencias del modal:', error);
                }
            }, 350);
        });

        // Ocultar sugerencias del modal si se hace clic fuera
        document.addEventListener('click', function(event) {
            if (!mapSearchInput.contains(event.target) && !modalSuggestionsContainer.contains(event.target)) {
                modalSuggestionsContainer.innerHTML = '';
            }
        });
    }
});