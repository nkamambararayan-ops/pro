/* ============================================================
   PhotoRetouch Pro — Service Commandes (Firestore + Storage)
   Module ES centralisant tout l'accès aux données "orders" :
   création, lecture, mise à jour, suppression, upload photos.
   ============================================================ */

import { db, storage } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref,
  uploadString,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const ORDERS_COLLECTION = "orders";

/**
 * Upload une image (File ou data URL base64) vers Firebase Storage
 * et retourne son URL de téléchargement publique.
 * @param {File|string} fileOrDataUrl
 * @param {string} path - chemin de destination dans le bucket, ex: "orders/xxx/client.jpg"
 */
export async function uploadOrderPhoto(fileOrDataUrl, path) {
  const storageRef = ref(storage, path);
  if (typeof fileOrDataUrl === "string") {
    // data URL (base64) issue de FileReader
    await uploadString(storageRef, fileOrDataUrl, "data_url");
  } else {
    // objet File natif
    await uploadBytes(storageRef, fileOrDataUrl);
  }
  return await getDownloadURL(storageRef);
}

/**
 * Crée une nouvelle commande dans Firestore.
 * La photo client (data URL) est d'abord uploadée vers Firebase Storage ;
 * seule l'URL résultante est stockée dans le document Firestore
 * (Firestore limite un document à 1 Mo, inadapté au stockage d'images en base64).
 */
export async function createOrder(orderPayload) {
  const { photo_data, photo_name, ...rest } = orderPayload;

  // 1) Création du document (sans photo) pour obtenir un ID
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...rest,
    photo_url: "",
    photo_name: photo_name || "",
    retouched_photo_url: "",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  // 2) Upload de la photo client vers Storage puis mise à jour du document
  let photoUrl = "";
  if (photo_data) {
    photoUrl = await uploadOrderPhoto(photo_data, `orders/${docRef.id}/client_${photo_name || "photo.jpg"}`);
    await updateDoc(doc(db, ORDERS_COLLECTION, docRef.id), { photo_url: photoUrl });
  }

  return { id: docRef.id, ...rest, photo_url: photoUrl, photo_name: photo_name || "" };
}

/**
 * Récupère toutes les commandes, triées par date de création (plus récentes en premier).
 */
export async function listOrders() {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      created_at: data.created_at?.toMillis ? data.created_at.toMillis() : (data.created_at || null)
    };
  });
}

/**
 * Met à jour partiellement une commande (statut, méthode de paiement, notes admin...).
 */
export async function updateOrder(orderId, patch) {
  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    ...patch,
    updated_at: serverTimestamp()
  });
}

/**
 * Upload la photo retouchée par l'admin et met à jour la commande avec son URL.
 */
export async function attachRetouchedPhoto(orderId, dataUrlOrFile, fileName) {
  const url = await uploadOrderPhoto(dataUrlOrFile, `orders/${orderId}/retouched_${fileName || "photo.jpg"}`);
  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    retouched_photo_url: url,
    updated_at: serverTimestamp()
  });
  return url;
}

/**
 * Supprime une commande de Firestore.
 * (Les fichiers déjà uploadés dans Storage restent en place ; à nettoyer
 * manuellement ou via une Cloud Function si nécessaire.)
 */
export async function deleteOrder(orderId) {
  await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
}
