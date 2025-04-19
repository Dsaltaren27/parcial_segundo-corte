import { Component } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';

declare let window: any;


@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.page.html',
  styleUrls: ['./video-call.page.scss'],
  standalone:false
})
export class VideoCallPage {
  uid: any;
  constructor(private authService: AuthService) {}
  async startCall() {
    try {
      const user = await this.authService.getCurrentUser() as { uid: string };
  
      if (user?.uid) { // Validación segura de usuario
        const options = {
          room: `sala-${user.uid}`,
          serverUrl: 'https://meet.jit.si',
          audioMuted: false,
          videoMuted: false,
        };
  
        if (window.JitsiMeet?.startConference) {
          window.JitsiMeet.startConference(options);
        } else {
          console.error('JitsiMeet no está disponible.');
        }
      } else {
        console.warn('Usuario no autenticado.');
      }
    } catch (error) {
      console.error('Error al obtener el usuario:', error);
    }
  }



  muteAudio(muted: boolean) {
    const event = new CustomEvent('SET_AUDIO_MUTED', { detail: { muted } });
    window.dispatchEvent(event);
  }
  
}