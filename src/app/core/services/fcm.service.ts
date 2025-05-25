// src/app/core/services/fcm.service.ts
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, PushNotificationSchema, ActionPerformed, RegistrationError, PushNotificationToken } from '@capacitor/push-notifications';
import { Platform } from '@ionic/angular';

import { Auth, user as authStateObs } from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc
} from '@angular/fire/firestore';
import { ApiService } from './api.service';
import { Observable, from, firstValueFrom } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { User as AppUser } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class FcmService {

  constructor(
    private router: Router,
    private platform: Platform,
    private auth: Auth,
    private firestore: Firestore,
    private apiService: ApiService,
    private zone: NgZone
  ) {}

  public initPush(): void {
    if (Capacitor.isNativePlatform()) {
      this.registerPush();
    } else {
      console.log('Push Notifications no disponible en esta plataforma.');
    }
  }

  private async registerPush(): Promise<void> {
    try {
      let permStatus = await PushNotifications.requestPermissions();

      if (permStatus.receive === 'granted') {
        console.log('[Push] Permiso concedido');
        await PushNotifications.register();
      } else {
        console.warn('[Push] Permiso denegado para notificaciones push');
        return;
      }

      PushNotifications.addListener('registration', async (token: PushNotificationToken) => {
        console.log('[Push] Token FCM:', token.value);
        this.saveFcmToken(token.value);
      });

      PushNotifications.addListener('registrationError', (error: RegistrationError) => {
        console.error('[Push] Error en registro:', JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('[Push] Notificación recibida en foreground:', JSON.stringify(notification));
        this.handleNotificationData(notification.data);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('[Push] Acción desde notificación:', JSON.stringify(notification));
        this.handleNotificationData(notification.notification.data);
      });

    } catch (error) {
      console.error('[Push] Error al registrar push notifications:', error);
    }
  }

  private async saveFcmToken(token: string): Promise<void> {
    const currentUser = await firstValueFrom(authStateObs(this.auth).pipe(take(1)));

    if (currentUser) {
      const userRef = doc(this.firestore, 'users', currentUser.uid);
      await setDoc(userRef, {
        fcmToken: token,
        updatedAt: new Date()
      }, { merge: true });
      console.log('[Push] Token FCM guardado/actualizado en Firestore para el usuario:', currentUser.uid);
    } else {
      console.warn('[Push] No hay usuario autenticado para guardar el token FCM.');
    }
  }

  private handleNotificationData(data: { [key: string]: any }): void {
    console.log('[Push] Procesando datos de notificación:', data);

    this.zone.run(() => {
      if (data && data['type'] === 'incoming_call' && data['meetingId']) {
        const meetingId = data['meetingId'];
        const userFrom = data['userFrom'] || 'Alguien';

        console.log(`Llamada entrante de ${userFrom} para la reunión: ${meetingId}`);

        this.router.navigate(['/chat', data['userFromId']], {
            queryParams: { incomingCall: true, meetingId: meetingId }
        });

      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  public async sendCallNotification(callerName: string, callerUid: string, recipientUid: string, meetingId: string): Promise<void> {
    try {
      const recipientDocRef = doc(this.firestore, 'users', recipientUid);
      const recipientSnapshot = await getDoc(recipientDocRef);

      if (!recipientSnapshot.exists()) {
        console.error(`No se encontraron datos de usuario para el destinatario: ${recipientUid}`);
        return;
      }

      const recipientData = recipientSnapshot.data() as AppUser;
      const recipientFcmToken = recipientData.fcmToken;

      if (!recipientFcmToken) {
        console.warn(`El usuario ${recipientUid} no tiene un token FCM registrado.`);
        return;
      }

      const payload = {
        token: recipientFcmToken,
        notification: {
          title: '📞 Llamada entrante',
          body: `${callerName} te está llamando...`,
        },
        data: {
          type: 'incoming_call',
          meetingId: meetingId,
          userFromId: callerUid,
          userFromName: callerName,
        },
        android: {
            priority: 'high',
        },
        apns: {
            payload: {
                aps: {
                    alert: {
                        title: '📞 Llamada entrante',
                        body: `${callerName} te está llamando...`,
                    },
                    sound: 'default',
                    'content-available': 1,
                },
                data: {
                    type: 'incoming_call',
                    meetingId: meetingId,
                    userFromId: callerUid,
                    userFromName: callerName,
                }
            }
        },
      };

      const response = await this.apiService.sendNotification(payload);
      console.log('Notificación de llamada enviada', response);

    } catch (error) {
      console.error('Error al enviar la notificación de llamada:', error);
      throw error;
    }
  }
}