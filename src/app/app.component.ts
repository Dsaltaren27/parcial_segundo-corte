import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { FcmService } from './core/services/fcm.service';
import { initializeApp } from 'firebase/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private platform: Platform, private fcmservice: FcmService) {

    this.initializeApp(); // Inicializa la aplicación Firebase
  }

  initializeApp() {
    this.platform.ready().then(() => {  
    
      this.fcmservice.initPush(); // Inicializa el servicio de FCM
});

}
}
