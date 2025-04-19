import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Contact } from 'src/app/core/interfaces/contact';
import { AuthService } from 'src/app/core/services/auth.service';
import { ContactService } from 'src/app/core/services/contact.service';
import { AddContactComponent } from 'src/app/shared/components/add-contact/add-contact.component';
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  contacts: Contact[] = [];
  loggedInUserUID: string | null = null; // Guarda el UID del usuario autenticado

  constructor(
    private contactService: ContactService,
    private authService: AuthService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.getCurrentUserUID();
    setTimeout(() => this.loadContacts(), 500); // Espera para asegurar que el usuario esté autenticado antes de cargar datos
  }

  getCurrentUserUID() {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      this.loggedInUserUID = currentUser.uid;
      console.log("UID del usuario autenticado:", this.loggedInUserUID);
    } else {
      console.error("No hay usuario autenticado.");
    }
  }

  async loadContacts() {
    if (!this.loggedInUserUID) {
      console.error("No se puede cargar contactos sin usuario autenticado.");
      return;
    }

    try {
      const db = getFirestore();
      const contactsCollectionRef = collection(db, `users/${this.loggedInUserUID}/contacts`);
      const querySnapshot = await getDocs(contactsCollectionRef);

      if (querySnapshot.empty) {
        console.log("No se encontraron contactos para este usuario.");
        this.contacts = [];
        return;
      }

      this.contacts = querySnapshot.docs.map(doc => ({
        ...(doc.data() as Contact),
        id: doc.id // Opcionalmente incluir el ID del documento
      }));

      console.log("Contactos cargados:", this.contacts);
    } catch (error) {
      console.error("Error al cargar contactos:", error);
    }
  }

  async openAddContactModal() {
    if (!this.loggedInUserUID) {
      console.error("No se puede agregar contactos sin usuario autenticado.");
      return;
    }

    const modal = await this.modalController.create({
      component: AddContactComponent,
      componentProps: {
        loggedInUserUID: this.loggedInUserUID // Pasamos el UID al modal
      }
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.success && data.contact) {
      this.updateContactList(data.contact);
    }
  }

  updateContactList(newContact: Contact) {
    this.contacts = [...this.contacts, newContact];
  }

  logout() {
    this.authService.logout();
  }
}