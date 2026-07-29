import { acusaciones, sentenciasCulpable, sentenciasInocente, randomItem } from './data.js';
import { registrarVisita, getStats, createCase, getCase, resolveCase } from './firebase.js';

let currentCaseId = null;
let currentCaseData = null;

// CORRECCIÓN: Función reparada para cambiar de pantallas sin que queden en blanco
const switchScreen = (id, bgClass = '') => {
    // 1. Ocultar todas las pantallas asegurándonos de limpiar las clases
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    
    // 2. Mostrar únicamente la pantalla destino
    const screen = document.getElementById(id);
    screen.classList.remove('hidden');
    screen.classList.add('active');
    
    // Cambiar fondo de la pantalla de resolución si aplica
    if(bgClass) {
        document.getElementById('screen-resolution').className = `screen active ${bgClass}`;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // Registramos la visita en Firebase (se crea el documento si no existe)
    await registrarVisita();
    
    // Llenar selector de acusaciones
    const select = document.getElementById('acusacion');
    for (const [id, data] of Object.entries(acusaciones)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = data.titulo;
        select.appendChild(option);
    }

    // Router: Comprobar si alguien entra por link de WhatsApp
    const urlParams = new URLSearchParams(window.location.search);
    const casoId = urlParams.get('id');

    if (casoId) {
        currentCaseId = casoId;
        currentCaseData = await getCase(casoId);
        
        if (currentCaseData) {
            document.getElementById('accused-id').textContent = casoId.toUpperCase();
            document.getElementById('accused-name').textContent = currentCaseData.acusado;
            switchScreen('screen-accused');
        } else {
            alert('Caso no encontrado');
            window.location.href = '/';
        }
    } else {
        // Cargar y mostrar estadísticas globales
        const stats = await getStats();
        document.getElementById('stat-visitantes').textContent = stats.visitantes || 0;
        document.getElementById('stat-cargos').textContent = stats.cargos_presentados || 0;
        document.getElementById('stat-resoluciones').textContent = (stats.sentencias_culpables || 0) + (stats.sentencias_inocentes || 0);
    }
});

// EVENTO: Botón de inicio para presentar cargos
document.getElementById('btn-start').addEventListener('click', () => switchScreen('screen-form'));

// EVENTO: Enviar formulario de cargos
document.getElementById('charge-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-charge');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    const denunciante = document.getElementById('denunciante').value;
    const acusado = document.getElementById('acusado').value;
    const acusacionId = document.getElementById('acusacion').value;

    const caseId = await createCase(denunciante, acusado, acusacionId);
    
    if (caseId) {
        document.getElementById('share-id').textContent = caseId.toUpperCase();
        document.getElementById('share-denunciante').textContent = denunciante;
        document.getElementById('share-acusado').textContent = acusado;
        
        // Preparar WhatsApp
        const link = `https://juanterere.github.io/amigos-acusados/?id=${caseId}`;
        const msg = `¡Ups!\n${acusado}...\nTu amigo ${denunciante} acaba de presentar cargos contra vos en *Amigos Acusados* 😅\n\n¿Sos culpable o vas a defender tu honor?\nEntrá y descubrí de qué te acusan.\n${link}`;
        
        document.getElementById('btn-whatsapp').onclick = () => {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
        };

        switchScreen('screen-share');
    } else {
        alert("Hubo un problema al crear el caso. Intenta de nuevo.");
        btn.disabled = false;
        btn.textContent = 'Presentar cargos';
    }
});

// EVENTO: Acusado - Ver expediente
document.getElementById('btn-view-dossier').addEventListener('click', () => {
    const ac = acusaciones[currentCaseData.acusacion];
    document.getElementById('dossier-acusado').textContent = currentCaseData.acusado;
    document.getElementById('dossier-cargo-titulo').textContent = ac.titulo.toUpperCase();
    document.getElementById('dossier-resumen').textContent = ac.resumen;
    document.getElementById('dossier-img').src = ac.img;
    document.getElementById('dossier-evidencia-texto').textContent = ac.evidencia_texto;
    document.getElementById('dossier-t1').textContent = `"${ac.testimonio_1}"`;
    document.getElementById('dossier-t2').textContent = `"${ac.testimonio_2}"`;
    switchScreen('screen-dossier');
});

document.getElementById('btn-back-accused').addEventListener('click', () => switchScreen('screen-accused'));

// EVENTO: Acusado - Resoluciones
const setResolution = async (tipo) => {
    const ac = acusaciones[currentCaseData.acusacion];
    document.getElementById('res-id').textContent = currentCaseId.toUpperCase();
    document.getElementById('res-name').textContent = currentCaseData.acusado;
    document.getElementById('res-cargo').textContent = ac.titulo;
    
    if (tipo === 'culpable') {
        document.getElementById('res-stamp').src = 'assets/sello_culpable.png';
        document.getElementById('res-text').textContent = randomItem(sentenciasCulpable);
        switchScreen('screen-resolution', 'bg-culpable');
    } else {
        document.getElementById('res-stamp').src = 'assets/sello_inocente.png';
        document.getElementById('res-text').textContent = randomItem(sentenciasInocente);
        switchScreen('screen-resolution', 'bg-inocente');
    }
    
    await resolveCase(currentCaseId, tipo);
};

document.getElementById('btn-plead-guilty').addEventListener('click', () => setResolution('culpable'));
document.getElementById('btn-plead-innocent').addEventListener('click', () => setResolution('inocente'));

// EVENTO: Descargar PNG
document.getElementById('btn-download').addEventListener('click', () => {
    const btn = document.getElementById('btn-download');
    btn.textContent = 'Generando imagen...';
    html2canvas(document.getElementById('capture-area'), {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Resolucion-${currentCaseId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        btn.textContent = 'Descargar resolución';
    });
});
