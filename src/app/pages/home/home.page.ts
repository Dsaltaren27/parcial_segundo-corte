import { Component, OnInit } from '@angular/core';
import { AlertController, MenuController, ModalController } from '@ionic/angular';
import { Contact } from 'src/app/core/interfaces/contact';
import { User } from 'src/app/core/interfaces/user';
import { AuthService } from 'src/app/core/services/auth.service';
import { ContactService } from 'src/app/core/services/contact.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})

export class HomePage implements OnInit {
  contacts: Contact[] = [];
  userData: User | null = null;


  constructor(
    private menuCtrl: MenuController,
    private contactService: ContactService,
    private modalCtrl: ModalController,
    private authService: AuthService,
    private alertController: AlertController,

  ) {}

  ngOnInit() {

  
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

}





