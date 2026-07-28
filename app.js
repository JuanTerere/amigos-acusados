import { catalog, getRandomItem } from './data.js';
import { createCase, getCase, updateCaseResolution, getStats } from './firebase.js';

// Utilidad para cambiar pantallas
const showScreen = (screenId) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
};

let currentCaseData = null;
let currentCaseId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Poblar el select de cargos
    const selectCargo = document.getElementById('cargo');
    for (const [id, data] of Object.entries(catalog)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = data.label;
        selectCargo.appendChild(option);
    }

    // Comprobar si es un enlace de acusado (ej: ?caso=ABCD123)
    const urlParams = new URLSearchParams(window.location.search);
    const casoId = urlParams.get('caso');

    if (casoId) {
        currentCaseId = casoId;
        const caseData = await getCase(casoId);
        if (caseData) {
            currentCaseData = caseData;
            document.getElementById('accused-name').textContent = caseData.acusado;
            document.getElementById('accused-denunciante').textContent = caseData.denunciante;
            showScreen('screen-accused');
        } else {
            alert('Expediente no encontrado.');
            showScreen('screen-home');
        }
    } else {
        // Cargar estadísticas en Home
        const stats = await getStats();
        document.getElementById('stat-cases').textContent = stats.casosCreados || 0;
        document.getElementById('stat-resolutions').textContent = stats.resoluciones || 0;
    }
});

// EVENTOS: Home
document.getElementById('btn-start').addEventListener('click', () => {
    showScreen('screen-form');
});

// EVENTOS: Presentar Cargos
document.getElementById('charge-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-charge');
    btn.disabled = true;
    btn.textContent = 'Procesando expediente...';

    const denunciante = document.getElementById('denunciante').value;
    const acusado = document.getElementById('acusado').value;
    const cargoId = document.getElementById('cargo').value;

    const caseId = await createCase(denunciante, acusado, cargoId);
    
    if (caseId) {
        document.getElementById('share-case-id').textContent = caseId.toUpperCase();
        document.getElementById('share-denunciante').textContent = denunciante;
        document.getElementById('share-acusado').textContent = acusado;
        
        // Configurar mensaje de WhatsApp
        const shareLink = `${window.location.origin}${window.location.pathname}?caso=${caseId}`;
        const msg = `🚨 ¡Ups!\n${acusado}...\nTu amigo ${denunciante} acaba de presentar cargos contra vos en Amigos Acusados. 😅\n\n¿Sos culpable o vas a defender tu honor?\nEntrá y descubrí de qué te acusan.\n\n${shareLink}`;
        
        document.getElementById('btn-whatsapp').onclick = () => {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
        };

        showScreen('screen-share');
    }
});

// EVENTOS: Acusado - Ver Cargos
document.getElementById('btn-view-charges').addEventListener('click', () => {
    const cargoData = catalog[currentCaseData.cargoId];
    document.getElementById('dossier-id').textContent = currentCaseId.toUpperCase();
    document.getElementById('dossier-name').textContent = currentCaseData.acusado;
    document.getElementById('dossier-date').textContent = currentCaseData.fecha;
    document.getElementById('dossier-charge').textContent = cargoData.label;
    
    // Generar prueba aleatoria
    document.getElementById('dossier-evidence').textContent = getRandomItem(cargoData.evidences);
    
    showScreen('screen-dossier');
});

document.getElementById('btn-back-accused').addEventListener('click', () => {
    showScreen('screen-accused');
});

// EVENTOS: Acusado - Sentencias
const generateResolution = async (type) => {
    const cargoData = catalog[currentCaseData.cargoId];
    
    document.getElementById('res-id').textContent = currentCaseId.toUpperCase();
    document.getElementById('res-name').textContent = currentCaseData.acusado;
    
    if (type === 'culpable') {
        document.getElementById('res-stamp').src = 'assets/sello-culpable.png';
        document.getElementById('res-title').textContent = 'EL ACUSADO ACEPTA LOS CARGOS';
        document.getElementById('res-text').textContent = `Sentencia dictada: ${getRandomItem(cargoData.sentences)}`;
    } else {
        document.getElementById('res-stamp').src = 'assets/sello-inocente.png';
        document.getElementById('res-title').textContent = 'EL ACUSADO HA SIDO ABSUELTO';
        document.getElementById('res-text').textContent = `Fundamento: ${getRandomItem(cargoData.defenses)}`;
    }

    await updateCaseResolution(currentCaseId, type);
    showScreen('screen-resolution');
};

document.getElementById('btn-plead-guilty').addEventListener('click', () => generateResolution('culpable'));
document.getElementById('btn-plead-innocent').addEventListener('click', () => generateResolution('inocente'));

// EVENTOS: Descargar Resolución
document.getElementById('btn-download').addEventListener('click', () => {
    const btn = document.getElementById('btn-download');
    btn.textContent = 'Generando imagen...';
    
    // Usamos html2canvas sobre el div #resolution-capture
    html2canvas(document.getElementById('resolution-capture'), {
        scale: 2, // Mejor calidad
        backgroundColor: '#FFFFFF'
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Resolucion-${currentCaseId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        btn.textContent = 'Descargar y Compartir';
    });
});