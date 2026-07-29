import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

const firebaseConfig = {
    // REEMPLAZAR CON TUS DATOS DE FIREBASE
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Actualizar visitantes al entrar
export const registrarVisita = async () => {
    const statsRef = doc(db, "estadisticas", "global");
    await updateDoc(statsRef, { visitantes: increment(1) }).catch(e => console.log("Stats init needed"));
};

export const getStats = async () => {
    const docSnap = await getDoc(doc(db, "estadisticas", "global"));
    return docSnap.exists() ? docSnap.data() : { visitantes: 0, cargos_presentados: 0, sentencias_culpables: 0, sentencias_inocentes: 0 };
};

export const createCase = async (denunciante, acusado, acusacionId) => {
    const docRef = await addDoc(collection(db, "casos"), {
        denunciante,
        acusado,
        acusacion: acusacionId,
        fecha: new Date().toLocaleDateString(),
        estado: "Pendiente",
        resolucion: null
    });
    
    await updateDoc(doc(db, "estadisticas", "global"), {
        cargos_presentados: increment(1)
    });
    return docRef.id;
};

export const getCase = async (id) => {
    const docSnap = await getDoc(doc(db, "casos", id));
    return docSnap.exists() ? docSnap.data() : null;
};

export const resolveCase = async (id, tipo) => {
    await updateDoc(doc(db, "casos", id), {
        estado: "Resuelto",
        resolucion: tipo
    });
    
    const campo = tipo === 'culpable' ? 'sentencias_culpables' : 'sentencias_inocentes';
    await updateDoc(doc(db, "estadisticas", "global"), {
        [campo]: increment(1)
    });
};