import { inject, Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  router=inject(Router);

  constructor() { }
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
      // Aquí puedes manejar la acción de la notificación, como redirigir a una página específica
      const data = notification.notification;
      console.log('Data: ', data);
      // Aquí puedes redirigir a la página deseada usando el router de Angular
      this.router.navigate(['/redirect-notification']);
    });
  }
}
