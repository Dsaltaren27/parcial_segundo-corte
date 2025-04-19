import { Injectable, inject, Inject } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Contact } from '../interfaces/contact';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  private contacts: Contact[] = [];
  constructor(

    @Inject(AngularFirestore) private firestore: AngularFirestore
  ) {

    this.loadContacts(); // Cargar contactos desde localStorage al iniciar el servicio
  }




  loadContacts() {
    const storedContacts = localStorage.getItem('contacts');
    this.contacts = storedContacts ? JSON.parse(storedContacts) : [];
  }

  getContacts() {
    return this.contacts;
  }

  getContactById(contactId: string) {
    return this.contacts.find(contact => contact.id === contactId);
  }

  addContact(contact: any) {
    this.contacts.push(contact);
    this.saveContacts();
  }
  saveContacts() {
    localStorage.setItem('contacts', JSON.stringify(this.contacts));
  }

updateContactList(contactId: string, updatedContact: any) {
  const index = this.contacts.findIndex(contact => contact.id === contactId);
  if (index !== -1) {
    this.contacts[index] = { ...updatedContact, id: contactId };
    this.saveContacts();
  }
}



  // Función para buscar un contacto por teléfono
  getContactsByPhone(userId: string, phone: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.firestore
        .collection('users')
        .doc(userId)
        .collection('contacts', ref => ref.where('phone', '==', phone))
        .get()
        .subscribe(snapshot => {
          if (snapshot.empty) {
            resolve(false); // No existe un contacto con este teléfono
          } else {
            resolve(true); // Ya existe un contacto con este teléfono
          }
        }, error => {
          reject(error);
        });
    });
  }
}