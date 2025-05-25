import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { User as FirebaseUser } from '@angular/fire/auth';

import { Contact } from 'src/app/core/interfaces/contact';
import { ContactService } from 'src/app/core/services/contact.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { AddContactComponent } from 'src/app/shared/components/add-contact/add-contact.component';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, OnDestroy {
  public contacts: Contact[] = [];
  public currentUserId: string | null = null;
  public loadingContacts: boolean = true;

  private authSubscription!: Subscription;
  private contactsSubscription!: Subscription;

  constructor(
    private router: Router,
    private contactService: ContactService,
    private authService: AuthService,
    private modalController: ModalController,
    private menu: MenuController
  ) {}

  ngOnInit() {
    this.authSubscription = this.authService.getFirebaseUser().pipe(
      map((user: FirebaseUser | null) => user ? user.uid : null)
    ).subscribe(userId => {
      this.currentUserId = userId;
      if (userId) {
        this.loadingContacts = true;
        this.contactsSubscription = this.contactService.getContacts(userId).subscribe({
          next: (contactsData: Contact[]) => {
            this.contacts = contactsData;
            this.loadingContacts = false;
          },
          error: (err: any) => {
            console.error('Error al cargar contactos en HomePage:', err);
            this.loadingContacts = false;
          }
        });
      } else {
        if (this.contactsSubscription) {
          this.contactsSubscription.unsubscribe();
        }
        this.contacts = [];
        console.log('Usuario no autenticado en HomePage, redireccionando...');
        this.router.navigateByUrl('/login');
        this.loadingContacts = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.contactsSubscription) {
      this.contactsSubscription.unsubscribe();
    }
  }

  openChat(contact: Contact) {
    if (contact.id) {
      console.log('Abriendo chat con el ID de contacto (otro usuario UID):', contact.id);
      this.router.navigate(['/chat', contact.id]);
    } else {
      console.warn('El contacto no tiene un ID válido para abrir el chat.');
    }
  }

  async openAddContactModal() {
    const modal = await this.modalController.create({
      component: AddContactComponent,
      componentProps: {
        loggedInUserUID: this.currentUserId
      }
    });
    await modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'added' && data?.contact) {
      console.log('Contacto agregado desde modal:', data.contact);
    }
  }

  goToProfile() {
    this.router.navigateByUrl('/profile');
    this.menu.close('main-menu');
  }

  goToSettings() {
    this.menu.close('main-menu');
    console.log('Navegar a Configuraciones');
  }

  goToHelp() {
    this.menu.close('main-menu');
    console.log('Navegar a Ayuda');
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigateByUrl('/login');
      this.menu.close('main-menu');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}