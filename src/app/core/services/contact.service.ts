// En src/app/core/services/contact.service.ts
import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, collection, query, where, getDocs, collectionData, deleteDoc, setDoc } from '@angular/fire/firestore'; // Asegúrate de tener setDoc también
import { Observable, from } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { User } from '../interfaces/user';
import { Contact } from '../interfaces/contact';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  constructor(private firestore: Firestore) {}

  getUserPhoneNumber(uid: string): Observable<{ phone: string | null, name: string | null } | null> {
    const userDocRef = doc(this.firestore, 'users', uid);
    return from(getDoc(userDocRef)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          const userData = snapshot.data() as User;
          const fullName = userData.name ? (userData.lastname ? `${userData.name} ${userData.lastname}` : userData.name) : null;
          return {
            phone: userData.phone ? String(userData.phone) : null,
            name: fullName
          };
        } else {
          console.warn(`No se encontraron datos de usuario en Firestore para el UID: ${uid}`);
          return null;
        }
      }),
      take(1)
    );
  }

  // ESTE ES EL MÉTODO GETCONTACTS QUE DEBE EXISTIR
  getContacts(currentUserId: string): Observable<Contact[]> {
    if (!currentUserId) {
      console.error('getContacts: currentUserId es nulo o vacío.');
      return new Observable<Contact[]>(observer => observer.next([]));
    }
    const contactsCollection = collection(this.firestore, `users/${currentUserId}/contacts`);
    return collectionData(contactsCollection, { idField: 'id' }).pipe(
      map(contacts => contacts as Contact[])
    );
  }

  async findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('phone', '==', phoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data() as User;
      return { uid: querySnapshot.docs[0].id, ...userData };
    }
    return null;
  }

  async addContact(currentUserId: string, contactUser: User): Promise<void> {
    if (!currentUserId || !contactUser || !contactUser.uid) {
      console.error('addContact: Faltan datos necesarios.');
      throw new Error('Datos de usuario o contacto incompletos.');
    }

    const contactDocRef = doc(this.firestore, `users/${currentUserId}/contacts`, contactUser.uid);
    try {
      await setDoc(contactDocRef, {
        id: contactUser.uid,
        name: contactUser.name || 'Sin nombre',
        lastname: contactUser.lastname || '',
        phone: contactUser.phone || '',
        email: contactUser.email || '',
        addedAt: new Date(),
      });
      console.log(`Contacto ${contactUser.uid} añadido para el usuario ${currentUserId}`);
    } catch (error) {
      console.error('Error al añadir contacto:', error);
      throw error;
    }
  }

  async deleteContact(currentUserId: string, contactIdToDelete: string): Promise<void> {
    const contactDocRef = doc(this.firestore, `users/${currentUserId}/contacts`, contactIdToDelete);
    try {
      await deleteDoc(contactDocRef);
      console.log(`Contacto ${contactIdToDelete} eliminado para el usuario ${currentUserId}`);
    } catch (error) {
      console.error('Error al eliminar contacto:', error);
      throw error;
    }
  }
}