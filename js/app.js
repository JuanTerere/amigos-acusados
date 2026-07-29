import { acusaciones, sentenciasCulpable, sentenciasInocente, randomItem } from './data.js';
import { registrarVisita, getStats, createCase, getCase, resolveCase } from './firebase.js';

let currentCaseId = null;
let currentCaseData = null;

const switchScreen = (id, bgImage = null) => {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    
    const screen = document.getElementById(id);
    screen.classList.remove('hidden');
    screen.classList.add('active');

    if (bgImage) {
        document.body.style.backgroundImage = `url('assets/${bgImage}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    } else {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = '#f4ebd8';
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await registrarVisita();
    
    const select = document.getElementById('acusacion');
    for (const [id, data] of Object.entries(acusaciones)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = data.titulo;
        select.appendChild(option);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const casoId = urlParams.get('id');

    if (casoId) {
        currentCaseId = casoId;
        currentCaseData = await getCase(casoId);
        
        if (currentCaseData) {
            document.getElementById('accused-id').textContent = casoId.toUpperCase();
            document.getElementById('accused-name').textContent = currentCaseData.acusado;
            switchScreen('screen-accused', 'acusado.png'); 
        } else {
            alert('Caso no encontrado');
            window.location.href = '/';
        }
    } else {
        const stats = await getStats();
        document.getElementById('stat-visitantes').textContent = stats.visitantes || 0;
        document.getElementById('stat-cargos').textContent = stats.cargos_presentados || 0;
        document.getElementById('stat-resoluciones').textContent = (stats.sentencias_culpables || 0) + (stats.sentencias_inocentes || 0);
        
        switchScreen('screen-home', 'fondo_inicio.png'); 
    }
});

document.getElementById('btn-start').addEventListener('click', () => switchScreen('screen-form', 'fondo_presentar_cargos.png'));

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
        document.getElementById('share-acusado').textContent = acusado;
        
        const link = `https://juanterere.github.io/amigos-acusados/?id=${caseId}`;
        const msg = `¡Ups!\n${acusado}...\nTu amigo ${denunciante} acaba de presentar cargos contra vos en *Amigos Acusados* 😅\n\n¿Sos culpable o vas a defender tu honor?\nEntrá y descubrí de qué te acusan.\n${link}`;
        
        document.getElementById('btn-whatsapp').onclick = () => {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
        };

        switchScreen('screen-share', 'fondo_presentar_cargos.png');
    } else {
        alert("Hubo un problema. Intenta de nuevo.");
        btn.disabled = false;
        btn.textContent = 'Presentar cargos';
    }
});

document.getElementById('btn-view-dossier').addEventListener('click', () => {
    const ac = acusaciones[currentCaseData.acusacion];
    document.getElementById('dossier-acusado').textContent = currentCaseData.acusado;
    document.getElementById('dossier-cargo-titulo').textContent = ac.titulo.toUpperCase();
    document.getElementById('dossier-resumen').textContent = ac.resumen;
    document.getElementById('dossier-img').src = 'assets/evidencia.png';
    document.getElementById('dossier-evidencia-texto').textContent = ac.evidencia_texto;
    document.getElementById('dossier-t1').textContent = `"${ac.testimonio_1}"`;
    document.getElementById('dossier-t2').textContent = `"${ac.testimonio_2}"`;
    
    switchScreen('screen-dossier', 'fondo_expediente.png');
});

document.getElementById('btn-back-accused').addEventListener('click', () => switchScreen('screen-accused', 'acusado.png'));

const setResolution = async (tipo) => {
    const ac = acusaciones[currentCaseData.acusacion];
    document.getElementById('res-id').textContent = currentCaseId.toUpperCase();
    document.getElementById('res-name').textContent = currentCaseData.acusado;
    document.getElementById('res-cargo').textContent = ac.titulo;
    
    const captureArea = document.getElementById('capture-area');

    if (tipo === 'culpable') {
        document.getElementById('res-stamp').src = 'assets/sello_culpable.png';
        document.getElementById('res-text').textContent = randomItem(sentenciasCulpable);
        captureArea.style.backgroundImage = "url('assets/fondo_sentencia_culpable.png')";
    } else {
        document.getElementById('res-stamp').src = 'assets/sello_inocente.png';
        document.getElementById('res-text').textContent = randomItem(sentenciasInocente);
        captureArea.style.backgroundImage = "url('assets/fondo_sentencia_inocente.png')";
    }
    
    // Configuramos el fondo directamente en el recuadro para que lo tome al descargar
    captureArea.style.backgroundSize = 'cover';
    captureArea.style.backgroundPosition = 'center';

    // Para la pantalla final limpiamos el fondo general (así no interfiere visualmente)
    switchScreen('screen-resolution', null);
    
    await resolveCase(currentCaseId, tipo);
};

document.getElementById('btn-plead-guilty').addEventListener('click', () => setResolution('culpable'));

document.getElementById('btn-plead-innocent').addEventListener('click', () => {
    switchScreen('screen-blame', 'fondo_presentar_cargos.png');
});

document.getElementById('btn-send-blame').addEventListener('click', async () => {
    const blameName = document.getElementById('blame-name').value.trim();
    if (!blameName) {
        alert("¡Escribí el nombre para salvarte!");
        return;
    }
    const ac = acusaciones[currentCaseData.acusacion];
    const msg = `¡Ey ${blameName}!\nMe acaban de acusar de "${ac.titulo}", pero me declaré inocente ante el juez alegando que actué bajo TU MALA INFLUENCIA. 😅\n\nQuedás formalmente involucrado en el caso.\nEntrá a defenderte o crear tu propia acusación: https://juanterere.github.io/amigos-acusados/`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    await setResolution('inocente');
});

document.getElementById('btn-new-accusation').addEventListener('click', () => {
    window.location.href = window.location.pathname; 
});

document.getElementById('btn-download').addEventListener('click', () => {
    const btn = document.getElementById('btn-download');
    btn.textContent = 'Generando...';
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
