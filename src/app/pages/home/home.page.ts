import { Component, OnInit } from '@angular/core';
import { AlertController, MenuController, ModalController } from '@ionic/angular';
import { Contact } from 'src/app/core/interfaces/contact';
import { User } from 'src/app/core/interfaces/user';
import { AuthService } from 'src/app/core/services/auth.service';
import { ContactService } from 'src/app/core/services/contact.service';
import { AddContactComponent } from 'src/app/shared/components/add-contact/add-contact.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  contacts: Contact[] = []; // Lista de contactos
  userData: User | null = null;

  constructor(
    private menuCtrl: MenuController,
    private contactService: ContactService,
    private modalCtrl: ModalController,
    private authService: AuthService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  /**
   * Cargar datos del usuario antes de obtener sus contactos
   */
  loadUserData() {
    this.authService.getUser().subscribe(user => {
      if (user?.uid) {
        this.userData = user;
        this.loadContacts();
      } else {
        console.error("Usuario no autenticado.");
      }
    });
  }

  /**
   * Cargar los contactos desde Firestore y actualizar la lista
   */
  loadContacts() {
    if (!this.userData?.uid) {
      console.error('No se puede cargar contactos sin un UID válido.');
      return;
    }

    this.contactService.getContacts(this.userData.uid).subscribe(
      (contacts) => {
        this.contacts = contacts;
      },
      (error) => {
        console.error('Error al cargar contactos:', error);
      }
    );
  }

  /**
   * Método para abrir el menú lateral
   */
  openMenu() {
    this.menuCtrl.open('main-menu');
  }

  /**
   * Método para cerrar sesión con confirmación
   */
  async logout() {
    const alert = await this.alertController.create({
      header: 'Confirmación',
      message: '¿Estás seguro de que quieres salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Sí, salir', handler: () => this.authService.logout() }
      ]
    });

    await alert.present();
  }

  /**
   * Abrir el modal para agregar contacto y actualizar la lista si se agrega correctamente
   */
  async openAddContactModal() {
    const modal = await this.modalCtrl.create({
      component: AddContactComponent
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.success && data.contact) {
      this.updateContactList(data.contact);
    } else {
      console.log("No se pudo agregar el contacto.");
    }
  }

  /**
   * Actualizar la lista de contactos en pantalla
   */
  updateContactList(contact: Contact) {
    this.contacts.push(contact);
  }
}