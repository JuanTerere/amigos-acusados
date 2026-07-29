import { acusaciones, sentenciasCulpable, sentenciasInocente, randomItem } from './data.js';
import { registrarVisita, getStats, createCase, getCase, resolveCase } from './firebase.js';

let currentCaseId = null;
let currentCaseData = null;

// Cambiador de pantallas seguro (evita pantallas en blanco)
const switchScreen = (id, bgClass = '') => {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    
    const screen = document.getElementById(id);
    screen.classList.remove('hidden');
    screen.classList.add('active');
    
    if(bgClass) {
        document.getElementById('screen-resolution').className = `screen active ${bgClass}`;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Registrar visita (crea documento si no existe)
    await registrarVisita();
    
    // 2. Llenar selector
    const select = document.getElementById('acusacion');
    for (const [id, data] of Object.entries(acusaciones)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = data.titulo;
        select.appendChild(option);
    }

    // 3. Revisar URL por si es un acusado entrando
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
        // Cargar estadísticas en inicio
        const stats = await getStats();
        document.getElementById('stat-visitantes').textContent = stats.visitantes || 0;
        document.getElementById('stat-cargos').textContent = stats.cargos_presentados || 0;
        document.getElementById('stat-resoluciones').textContent = (stats.sentencias_culpables || 0) + (stats.sentencias_inocentes || 0);
    }
});

// EVENTO: Ir al formulario
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

// EVENTOS: Leer expediente
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

// FUNCION: Emitir Sentencia
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

// EVENTO: Acusado Culpable (Directo)
document.getElementById('btn-plead-guilty').addEventListener('click', () => setResolution('culpable'));

// EVENTO: Acusado Inocente (Abre pantalla de delatar)
document.getElementById('btn-plead-innocent').addEventListener('click', () => {
    switchScreen('screen-blame');
});

// EVENTO: Enviar culpa al amigo por WA y emitir sentencia
document.getElementById('btn-send-blame').addEventListener('click', async () => {
    const blameName = document.getElementById('blame-name').value.trim();
    
    if (!blameName) {
        alert("¡Tenés que escribir el nombre de tu amigo para salvarte!");
        return;
    }

    const ac = acusaciones[currentCaseData.acusacion];
    const msg = `¡Ey ${blameName}!\nMe acaban de acusar de "${ac.titulo}", pero me declaré inocente ante el juez alegando que actué bajo TU MALA INFLUENCIA. 😅\n\nQuedás formalmente involucrado en el caso.\nEntrá a defenderte o crear tu propia acusación: https://juanterere.github.io/amigos-acusados/`;
    
    // Abre WhatsApp con el texto
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    
    // Recién ahora se resuelve como inocente en el sistema
    await setResolution('inocente');
});

// EVENTO: Volver al inicio para nueva acusación
document.getElementById('btn-new-accusation').addEventListener('click', () => {
    window.location.href = window.location.pathname; // Limpia la URL y recarga
});

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
