import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  constructor(private router: Router) { } // <-- Inyecta Router en el constructor

  initpush() {
    if(Capacitor.isNativePlatform()){
    this.registerPush();
    }
  }

  private registerPush() {
    PushNotifications.requestPermissions().then( async (permissions) => {
      if (permissions.receive === 'granted') {
        await PushNotifications.register();
      } else {
        console.error('Permission not granted for push notifications');
      }
    });

    PushNotifications.addListener('registration', async token => {
      console.log('Push registration success, token: ' + token);
    });

    PushNotifications.addListener('registrationError', async (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', async (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      const data = notification.notification;
      console.log('Data: ', data);
      this.router.navigate(['/redirect-notification']); // Usa la instancia inyectada
    });
  }
}