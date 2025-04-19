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
    if (Capacitor.isNativePlatform()) {
      this.registerPush();
    }
  }

  private registerPush() {
    PushNotifications.requestPermissions().then(async (permissions) => {
      if (permissions.receive === 'granted') {
        await PushNotifications.register();
      } else {
        console.error('Permission not granted for push notifications');
      }
    });

    // Listener de registro para obtener el token de FCM
    PushNotifications.addListener('registration', async token => {
      console.log('Push registration success, token: ' + token.value);
      // Aquí se imprime el token en la consola
    });

    // Listener de errores en el registro
    PushNotifications.addListener('registrationError', async (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Listener cuando se recibe una notificación (cuando la app está en primer plano)
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Push notification received: ' + JSON.stringify(notification));
      const data = notification.notification;
      console.log('Notification data: ', data);
      
      // Aquí puedes procesar la notificación recibida, por ejemplo:
      // Mostrar un mensaje en pantalla, actualizar el estado de la app, etc.
      // Si quieres navegar a otra página, puedes hacerlo aquí:
      this.router.navigate(['/redirect-notification']); // Navega a la página de destino
    });

    // Listener de acción realizada sobre la notificación
    PushNotifications.addListener('pushNotificationActionPerformed', async (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      const data = notification.notification;
      console.log('Notification data: ', data);
      
      // Aquí puedes navegar o realizar otra acción dependiendo de la notificación
      this.router.navigate(['/redirect-notification']); // Navega a la página de destino
    });
  }
}
