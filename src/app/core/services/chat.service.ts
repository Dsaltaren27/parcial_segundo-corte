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
  doc,
  getDoc,
  where
} from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

import { Userprofile } from 'src/app/core/interfaces/userprofile';


@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private firestore: Firestore) {}

  private getAppIdForFirestore(): string {
    return environment.firebase.projectId;
  }

  async getUserPhoneNumber(uid: string): Promise<string | null> {
    if (!uid) {
      console.warn('UID es nulo o vacío para getUserPhoneNumber.');
      return null;
    }
    const userDocRef = doc(this.firestore, `users/${uid}`);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as Userprofile;
        return userData.phone || null;
      } else {
        console.warn(`No se encontró el documento de usuario para UID: ${uid}`);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener el teléfono del usuario ${uid}:`, error);
      return null;
    }
  }

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

  async sendMessage(chatId: string, senderId: string, text: string = '', options?: any): Promise<void> {
    if (!text.trim() && !options) {
      return Promise.resolve();
    }

    const messagesCollectionRef = collection(
      this.firestore,
      `artifacts/${this.getAppIdForFirestore()}/public/data/chats/${chatId}/messages`
    );

    let messageData: any = {
      senderId: senderId,
      timestamp: serverTimestamp(),
    };

    if (options && typeof options === 'object') {
      Object.assign(messageData, options);
      if (!messageData.text && text.trim()) {
        messageData.text = text.trim();
      } else if (!messageData.text && !text.trim()) {
        messageData.text = '';
      }
    } else {
      messageData.text = text.trim();
      messageData.type = 'text';
    }

    try {
      await addDoc(messagesCollectionRef, messageData);
      console.log("Mensaje enviado exitosamente.");
    } catch (error) {
      console.error("Error al enviar mensaje en ChatService:", error);
      throw error;
    }
  }

  async uploadFile(file: File): Promise<string> {
    const storage = getStorage();
    const filePath = `chat_files/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Archivo subido exitosamente:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      throw error;
    }
  }
}
