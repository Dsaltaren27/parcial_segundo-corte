import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  CollectionReference,
  DocumentData,
  doc, // Importar doc para obtener un documento específico
  getDoc, // Importar getDoc para obtener un documento específico
  where // Necesario si vas a buscar por otros campos en el futuro, pero aquí no directamente por UID
} from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

// Si no la tienes definida, puedes añadirla aquí o en un archivo de interfaces global.
// Es importante que refleje la estructura de tus documentos de usuario en Firestore.
interface UserProfile {
  uid: string;
  name: string;
  lastname: string;
  phone: string; // Asegúrate de que esta propiedad exista en tus documentos 'users'
  // ... cualquier otra propiedad que tengan tus usuarios
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private firestore: Firestore) {}

  private getAppIdForFirestore(): string {
    return environment.firebase.projectId;
  }

  /**
   * Obtiene el número de teléfono de un usuario dado su UID.
   * @param uid El UID del usuario.
   * @returns Una Promise que resuelve con el número de teléfono o null si no se encuentra.
   */
  async getUserPhoneNumber(uid: string): Promise<string | null> {
    if (!uid) {
      console.warn('UID es nulo o vacío para getUserPhoneNumber.');
      return null;
    }
    const userDocRef = doc(this.firestore, `users/${uid}`);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as UserProfile;
        return userData.phone || null; // Devuelve el teléfono o null si no existe
      } else {
        console.warn(`No se encontró el documento de usuario para UID: ${uid}`);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener el teléfono del usuario ${uid}:`, error);
      return null;
    }
  }

  /**
   * Obtiene un Observable de los mensajes de un chat específico en tiempo real.
   * @param chatId El ID único de la conversación de chat.
   * @returns Un Observable que emite un array de mensajes cada vez que hay un cambio.
   */
  getChatMessages(chatId: string): Observable<any[]> {
    const messagesCollectionRef = collection(
      this.firestore,
      `artifacts/${this.getAppIdForFirestore()}/public/data/chats/${chatId}/messages`
    );

    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, {
        next: (snapshot) => {
          const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          observer.next(messages);
        },
        error: (err) => {
          console.error("Error al obtener mensajes en ChatService:", err);
          observer.error(err);
        }
      });
      return { unsubscribe };
    });
  }

  /**
   * Envía un nuevo mensaje a un chat específico.
   * @param chatId El ID único de la conversación de chat.
   * @param senderId El ID del usuario que envía el mensaje.
   * @param text El contenido del mensaje.
   * @returns Una promesa que se resuelve cuando el mensaje ha sido enviado.
   */
  async sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
    if (!text.trim()) {
      return Promise.resolve();
    }

    const messagesCollectionRef = collection(
      this.firestore,
      `artifacts/${this.getAppIdForFirestore()}/public/data/chats/${chatId}/messages`
    );

    try {
      await addDoc(messagesCollectionRef, {
        senderId: senderId,
        text: text,
        type: 'text',
        timestamp: serverTimestamp(),
      });
      console.log("Mensaje enviado exitosamente.");
    } catch (error) {
      console.error("Error al enviar mensaje en ChatService:", error);
      throw error;
    }
  }
}