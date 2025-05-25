import { Injectable } from '@angular/core';
// CAMBIO: Importar desde @angular/fire/firestore (Modular SDK)
import { Firestore, collection, doc, setDoc, query, where, getDocs, collectionData, addDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { Contact } from '../interfaces/contact'; // Asegúrate de que tu interfaz Contact esté definida aquí
import { User } from '../interfaces/user';     // Asegúrate de que tu interfaz User esté definida aquí
import { AuthService } from './auth.service';   // Importa tu AuthService

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  constructor(
    private firestore: Firestore, // CAMBIO: Inyectar 'Firestore' (Modular SDK)
    private authService: AuthService
  ) {}

  /**
   * Obtiene la lista de contactos específicos del usuario autenticado desde Firestore.
   * Emite un Observable que se actualiza en tiempo real.
   * @returns Observable<Contact[]>
   */
  getContacts(): Observable<Contact[]> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          console.warn('ContactService: No hay usuario autenticado, devolviendo contactos vacíos.');
          return of([]);
        }
        // Usar funciones modulares para Firestore
        const contactsCollectionRef = collection(this.firestore, `users/${userId}/contacts`);
        // collectionData mapea el ID del documento al campo 'id' por defecto
        return collectionData(contactsCollectionRef, { idField: 'id' }).pipe(
          map(contacts => contacts as Contact[])
        );
      })
    );
  }

  /**
   * Obtiene la lista de todos los usuarios registrados en la aplicación.
   * Excluye al usuario actualmente autenticado de la lista.
   * @returns Observable<User[]>
   */
  getAllAppUsers(): Observable<User[]> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(currentUserId => {
        // Usar funciones modulares para Firestore
        const usersCollectionRef = collection(this.firestore, 'users');
        return collectionData(usersCollectionRef, { idField: 'uid' }).pipe(
          map(users => {
            // Filtramos para excluir al usuario actual de la lista
            return users.filter(user => user.uid !== currentUserId) as User[];
          })
        );
      })
    );
  }

  /**
   * Añade un nuevo contacto a la colección de contactos del usuario autenticado en Firestore.
   * @param newContact Los datos del nuevo contacto.
   * @param currentUserId El UID del usuario actualmente autenticado.
   * @returns Promise<void>
   */
  async addContactToFirestore(newContact: Partial<Contact>, currentUserId: string): Promise<void> {
    if (!currentUserId) {
      throw new Error('No se puede añadir contacto: Usuario no autenticado.');
    }
    // Usar funciones modulares para Firestore
    const contactsCollectionRef = collection(this.firestore, `users/${currentUserId}/contacts`);
    // addDoc para añadir un documento con un ID generado automáticamente
    return addDoc(contactsCollectionRef, newContact).then(() => { // CAMBIO: addDoc en lugar de .add
      console.log('Contacto añadido a Firestore correctamente');
    }).catch(error => {
      console.error('Error al añadir contacto a Firestore:', error);
      throw error;
    });
  }

  /**
   * Busca un usuario por su número de teléfono en la colección global 'users'.
   * Se utiliza para encontrar el 'otherUserId' de un contacto.
   * @param phone El número de teléfono a buscar.
   * @returns Observable<User[]> Un observable que emite un array de usuarios que coinciden.
   */
  findUserByPhone(phone: string): Observable<User[]> {
    // Usar funciones modulares para Firestore
    const usersCollectionRef = collection(this.firestore, 'users');
    const q = query(usersCollectionRef, where('phone', '==', Number(phone)));
    return collectionData(q, { idField: 'uid' }).pipe(
      map(users => users as User[])
    );
  }

  // Este método ya no es usado por add-contact-component directamente, pero lo mantengo
  // por si lo usas en otro lugar o como referencia.
  getContactExistsInSubcollection(userId: string, phone: string): Promise<boolean> {
    // Usar funciones modulares para Firestore
    const contactsCollectionRef = collection(this.firestore, `users/${userId}/contacts`);
    const q = query(contactsCollectionRef, where('phone', '==', Number(phone)));
    // getDocs devuelve una Promise
    return getDocs(q).then(querySnapshot => { // CAMBIO: getDocs en lugar de .get().subscribe
      return !querySnapshot.empty;
    });
  }

  // Métodos de localStorage (mantener si son necesarios para otra funcionalidad)
  private contactsLocal: Contact[] = [];
  loadContactsLocal() {
    const storedContacts = localStorage.getItem('contacts');
    this.contactsLocal = storedContacts ? JSON.parse(storedContacts) : [];
  }
  getContactsLocal() { return this.contactsLocal; }
  getContactByIdLocal(contactId: string) { return this.contactsLocal.find(contact => contact.id === contactId); }
  addContactLocal(contact: any) { this.contactsLocal.push(contact); this.saveContactsLocal(); }
  saveContactsLocal() { localStorage.setItem('contacts', JSON.stringify(this.contactsLocal)); }
  updateContactListLocal(contactId: string, updatedContact: any) {
    const index = this.contactsLocal.findIndex(contact => contact.id === contactId);
    if (index !== -1) {
      this.contactsLocal[index] = { ...updatedContact, id: contactId };
      this.saveContactsLocal();
    }
  }
}
