import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, updateDoc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Tu configuración real de Firebase
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

// Actualizar visitantes al entrar (crea el doc si no existe)
export const registrarVisita = async () => {
    const statsRef = doc(db, "estadisticas", "global");
    await setDoc(statsRef, { visitantes: increment(1) }, { merge: true }).catch(e => console.error("Error stats:", e));
};

// Leer estadísticas
export const getStats = async () => {
    const docSnap = await getDoc(doc(db, "estadisticas", "global"));
    return docSnap.exists() ? docSnap.data() : { visitantes: 0, cargos_presentados: 0, sentencias_culpables: 0, sentencias_inocentes: 0 };
};

// Crear caso y actualizar contador
export const createCase = async (denunciante, acusado, acusacionId) => {
    try {
        const docRef = await addDoc(collection(db, "casos"), {
            denunciante,
            acusado,
            acusacion: acusacionId,
            fecha: new Date().toLocaleDateString(),
            estado: "Pendiente",
            resolucion: null
        });
        
        // Sumar cargo con setDoc para evitar crasheos si está vacío
        await setDoc(doc(db, "estadisticas", "global"), {
            cargos_presentados: increment(1)
        }, { merge: true });

        return docRef.id;
    } catch (error) {
        console.error("Error creando el caso:", error);
        return null;
    }
};

// Obtener caso para la página del acusado
export const getCase = async (id) => {
    const docSnap = await getDoc(doc(db, "casos", id));
    return docSnap.exists() ? docSnap.data() : null;
};

// Resolver caso y actualizar estadísticas
export const resolveCase = async (id, tipo) => {
    await updateDoc(doc(db, "casos", id), {
        estado: "Resuelto",
        resolucion: tipo
    });
    
    const campo = tipo === 'culpable' ? 'sentencias_culpables' : 'sentencias_inocentes';
    
    // Sumar sentencia con setDoc
    await setDoc(doc(db, "estadisticas", "global"), {
        [campo]: increment(1)
    }, { merge: true });
};
