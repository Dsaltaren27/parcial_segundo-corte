import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuController, AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ContactService } from 'src/app/shared/services/contact.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { take, Subscription } from 'rxjs';
import { User } from 'src/app/interfaces/user';
import { Contact } from 'src/app/interfaces/contact';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, OnDestroy {
  contactos: Contact[] = [];
  userData: User | null = null;
  userSubscription: Subscription | null = null;
  contactosSubscription: Subscription | null = null;

  constructor(
    private menuCtrl: MenuController,
    private firestore: AngularFirestore,
    private contactService: ContactService,
    private authService: AuthService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Suscripción al usuario autenticado
    this.userSubscription = this.contactService.getUser().pipe(take(1)).subscribe({
      next: async (user: firebase.User | null) => {
        if (user) {
          const uid = user.uid;

          // Obtener datos del usuario
          this.firestore.doc(`users/${uid}`).valueChanges().subscribe({
            next: (data: any) => {
              this.userData = { ...data, email: user.email };
            },
            error: (err) => {
              console.error('Error al obtener datos del usuario:', err);
            }
          });

          // Obtener los contactos del usuario desde Firestore
          this.contactosSubscription = this.firestore.collection<Contact>(`users/${uid}/contacts`, ref => ref.orderBy('name'))
            .valueChanges({ idField: 'id' })
            .subscribe({
              next: (contactos: Contact[]) => {
                this.contactos = contactos;
                console.log('Contactos cargados:', this.contactos);
              },
              error: (err) => {
                console.error('Error al cargar los contactos:', err);
              }
            });
        }
      },
      error: (err) => {
        console.error('Error al obtener el usuario:', err);
      }
    });
  }

  // Método para abrir el menú
  openMenu() {
    this.menuCtrl.open('main-menu');
  }

  // Método para cerrar sesión
  async logout() {
    const alert = await this.alertController.create({
      header: 'Confirmación',
      message: '¿Estás seguro de que quieres salir?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, salir',
          handler: () => {
            this.authService.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  // Limpieza de suscripciones cuando el componente se destruye
  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.contactosSubscription) {
      this.contactosSubscription.unsubscribe();
    }
  }
}
