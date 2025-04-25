import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Platform } from '@ionic/angular';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { ApiService } from './api.service';
// Asegúrate de importar ApiService

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  private isTokenSaved = false;

  constructor(
    private router: Router,
    private apiService: ApiService // Inyectamos el servicio para enviar notificaciones
  ) {}

  initPush() {
    if (Capacitor.isNativePlatform()) {
      this.registerPush();
    }
  }

  private registerPush() {
    PushNotifications.requestPermissions().then(async (permissions) => {
      if (permissions.receive === 'granted') {
        console.log('[Push] Permiso concedido');
        await PushNotifications.register();
      } else {
        console.error('[Push] Permiso denegado para notificaciones push');
      }
    });

    // Listener: Registro exitoso, obtener el token
    PushNotifications.addListener('registration', async (token) => {
      console.log('[Push] Token FCM:', token.value);

      // Guardar token en Firestore si el usuario está autenticado
      const auth = getAuth();
      const user = auth.currentUser;

      if (user && !this.isTokenSaved) {
        const db = getFirestore();
        const userRef = doc(db, 'users', user.uid);

        await setDoc(userRef, {
          fcmToken: token.value
        }, { merge: true });

        console.log('[Push] Token guardado en Firestore');
        this.isTokenSaved = true;
      }
    });

    // Listener: Error en el registro
    PushNotifications.addListener('registrationError', async (error: any) => {
      console.error('[Push] Error en registro:', JSON.stringify(error));
    });

    // Listener: Notificación recibida con la app abierta
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('[Push] Notificación recibida:', JSON.stringify(notification));
      const data = notification.notification;
      console.log('[Push] Datos:', data);

      // Ejemplo: redirigir
      this.router.navigate(['/redirect-notification']);
    });

    // Listener: Usuario hizo clic en la notificación
    PushNotifications.addListener('pushNotificationActionPerformed', async (notification) => {
      console.log('[Push] Acción desde notificación:', JSON.stringify(notification));
      const data = notification.notification;
      console.log('[Push] Datos:', data);

      this.router.navigate(['/redirect-notification']);
    });
  }

  // Método para enviar notificación push
  async sendCallNotification(userFrom: string, userTo: string, meetingId: string) {
    const payload = {
      token: 'FCM_TOKEN_DEL_DESTINO', // Este token debe obtenerse de Firestore o el servicio de notificaciones
      notification: {
        title: 'Llamada entrante',
        body: `${userFrom} te está llamando`
      },
      android: {
        priority: 'high',
        data: {
          userId: userTo,
          meetingId: meetingId, // ID único para la llamada
          type: 'incoming_call',
          name: userFrom,
          userFrom: userFrom
        }
      }
    };

    // Llamar al servicio para enviar la notificación push
    this.apiService.sendNotification(payload).then((response: any) => {
      console.log('Notificación enviada', response);
    }).catch((error: any) => {
      console.error('Error al enviar la notificación', error);
    });
  }
}
