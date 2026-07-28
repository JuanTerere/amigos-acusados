import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDRIt695uY834ctoKJMfRfl1Mbr_XzsDlo",
  authDomain: "amigos-acusados.firebaseapp.com",
  databaseURL: "https://amigos-acusados-default-rtdb.firebaseio.com",
  projectId: "amigos-acusados",
  storageBucket: "amigos-acusados.firebasestorage.app",
  messagingSenderId: "423077155035",
  appId: "1:423077155035:web:a0968857ec686a3326fcfe"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const createCase = async (denunciante, acusado, cargoId) => {
    try {
        const docRef = await addDoc(collection(db, "casos"), {
            denunciante,
            acusado,
            cargoId,
            estado: "Pendiente",
            fecha: new Date().toLocaleDateString(),
            timestamp: Date.now()
        });
        
        // Actualizar contador global
        await updateDoc(doc(db, "estadisticas", "global"), {
            casosCreados: increment(1)
        });
        
        return docRef.id;
    } catch (e) {
        console.error("Error añadiendo el caso: ", e);
        return null;
    }
};

export const getCase = async (caseId) => {
    const docRef = doc(db, "casos", caseId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
};

export const updateCaseResolution = async (caseId, resolutionType) => {
    const docRef = doc(db, "casos", caseId);
    await updateDoc(docRef, {
        estado: "Resuelto",
        resolucion: resolutionType
    });
    
    // Actualizar estadística correspondiente
    const field = resolutionType === 'culpable' ? 'sentenciasCulpables' : 'sentenciasInocentes';
    await updateDoc(doc(db, "estadisticas", "global"), {
        [field]: increment(1),
        resoluciones: increment(1)
    });
};

export const getStats = async () => {
    const docSnap = await getDoc(doc(db, "estadisticas", "global"));
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return { casosCreados: 0, resoluciones: 0 };
};