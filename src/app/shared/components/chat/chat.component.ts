import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

import { Auth, authState, User } from '@angular/fire/auth';

import { ChatService } from 'src/app/core/services/chat.service';
import { ContactService } from 'src/app/core/services/contact.service';
import { FcmService } from 'src/app/core/services/fcm.service';
import { AuthService } from 'src/app/core/services/auth.service';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone: false
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesEnd') messagesEndRef!: ElementRef;
  // CORRECCIÓN: Añadida la declaración para fileInput
  @ViewChild('fileInput') fileInput!: ElementRef;

  public currentUserUID: string | null = null;
  public messages: any[] = [];
  public newMessageText: string = '';
  public loading: boolean = true;
  public error: string = '';
  public isAuthReady: boolean = false;

  public otherUserId: string = '';
  public otherUserPhone: string | null = null;
  public otherUserName: string | null = null;
  public chatId: string = '';

  // CORRECCIÓN: Añadidas las declaraciones para la grabación de audio
  public isRecording: boolean = false;
  private mediaRecorder: MediaRecorder | undefined;
  private audioChunks: Blob[] = [];

  private authSubscription!: Subscription;
  private messagesSubscription!: Subscription;
  private destroy$: Subscription = new Subscription();

  constructor(
    private auth: Auth,
    private route: ActivatedRoute,
    private chatService: ChatService,
    private contactService: ContactService,
    private fcmService: FcmService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(take(1)).subscribe(params => {
      const paramOtherUserId = params.get('otherUserId');
      if (paramOtherUserId) {
        this.otherUserId = paramOtherUserId;
        this.setupAuthAndChat();
      } else {
        this.otherUserId = 'some-default-other-user-id';
        console.warn('No se proporcionó otro ID de usuario en los parámetros de ruta. Usando un valor predeterminado.');
        this.setupAuthAndChat();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }

  private setupAuthAndChat(): void {
    this.authSubscription = this.authService.getAuthState().subscribe( // <-- CAMBIO AQUÍ
      (user: User | null) => {
        if (user) {
          this.currentUserUID = user.uid;
          if (this.otherUserId && this.currentUserUID) {
            this.chatId = [this.currentUserUID, this.otherUserId].sort().join('-');
            this.isAuthReady = true;
            this.loadOtherUserPhoneAndName();
            this.listenForMessages();
          }
        } else {
          console.warn("Usuario no autenticado en el chat. Redirigir si es necesario.");
        }
        this.loading = false;
      },
      (err: any) => {
        console.error("Error en la suscripción de authState:", err);
        this.error = `Error de autenticación: ${err.message}`;
        this.loading = false;
        this.isAuthReady = true; // Se establece en true para indicar que el estado de autenticación ha sido procesado, aunque haya un error.
      }
    );
    this.destroy$.add(this.authSubscription);
  }

  private loadOtherUserPhoneAndName(): void {
    if (!this.otherUserId) return;

    this.contactService.getUserPhoneNumber(this.otherUserId).pipe(
      take(1)
    ).subscribe({
      next: (userData) => {
        if (userData) {
          this.otherUserPhone = userData.phone;
          this.otherUserName = userData.name;
          console.log(`Chat con: ${this.otherUserName} (${this.otherUserPhone})`);
        } else {
          console.warn(`No se pudieron obtener los datos para el usuario: ${this.otherUserId}.`);
          this.otherUserPhone = 'Desconocido';
          this.otherUserName = 'Usuario Desconocido';
        }
      },
      error: (err) => {
        console.error('Error al cargar los datos del otro usuario:', err);
        this.otherUserPhone = 'Error';
        this.otherUserName = 'Error';
      }
    });
  }

  private listenForMessages(): void {
    // CORRECCIÓN: La verificación !this.isAuthReady podría ser redundante si solo se llama desde setupAuthAndChat
    // pero se mantiene para robustez si se pudiera llamar de forma independiente.
    if (!this.currentUserUID || !this.isAuthReady || !this.chatId) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.messagesSubscription = this.chatService.getChatMessages(this.chatId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loading = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err: any) => {
        console.error("Error al obtener mensajes en tiempo real:", err);
        this.error = `Error al cargar mensajes: ${err.message}`;
        this.loading = false;
      }
    });
    this.destroy$.add(this.messagesSubscription);
  }

  public async sendMessage(): Promise<void> {
    if (!this.newMessageText.trim() || !this.currentUserUID || !this.chatId) {
      return;
    }

    try {
      await this.chatService.sendMessage(this.chatId, this.currentUserUID, this.newMessageText.trim());
      this.newMessageText = '';
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (err: any) {
      console.error("Error al enviar mensaje:", err);
      this.error = `Error al enviar mensaje: ${err.message}`;
    }
  }

  public async startJitsiCall(): Promise<void> {
    if (!this.chatId || !this.currentUserUID || !this.otherUserId) {
      console.warn("Faltan datos para iniciar la llamada Jitsi o enviar la notificación.");
      return;
    }

    let callerName = 'Usuario Desconocido';
    try {
      const currentUserData = await firstValueFrom(this.authService.getUserDataFromFirestore(this.currentUserUID).pipe(take(1)));
      if (currentUserData) {
        callerName = `${currentUserData.name} ${currentUserData.lastname || ''}`.trim();
      }
    } catch (error) {
      console.error('Error al obtener el nombre del usuario actual para la notificación:', error);
    }

    const jitsiUrl = `https://meet.jit.si/${this.chatId}`;

    try {
      await this.fcmService.sendCallNotification(
        callerName,
        this.currentUserUID,
        this.otherUserId,
        this.chatId
      );
      console.log('Notificación de llamada enviada exitosamente.');
    } catch (error) {
      console.error('No se pudo enviar la notificación de llamada:', error);
    }

    window.open(jitsiUrl, '_blank');
    console.log(`Iniciando llamada Jitsi en: ${jitsiUrl}`);
  }

  // Abrir selector de archivo
  triggerFileSelect(): void {
    // Asegúrate de que fileInput esté disponible antes de intentar clickearlo
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    } else {
      console.error('El elemento fileInput no está disponible.');
    }
  }

  // Manejar archivo seleccionado
  async handleFileInput(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    await this.uploadAndSendFile(file);
    input.value = ''; // limpiar selección
  }

  // Subir archivo y enviar mensaje con info
  private async uploadAndSendFile(file: File): Promise<void> {
    try {
      const fileUrl = await this.chatService.uploadFile(file);
      await this.chatService.sendMessage(this.chatId, this.currentUserUID!, '', {
        type: 'file',
        fileUrl,
        fileName: file.name,
        mimeType: file.type,
      });
      this.scrollToBottom();
    } catch (error) {
      console.error('Error subiendo/enviando archivo:', error);
    }
  }

  // Grabación audio
  async startAudioRecording(): Promise<void> {
    if (this.isRecording) {
      // Si ya está grabando, detener la grabación
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
      this.isRecording = false;
      console.log('Grabación detenida.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
        await this.uploadAndSendFile(audioFile);
        // Detener la pista de audio del micrófono para liberar recursos
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      console.log('Grabación iniciada...');
    } catch (error) {
      console.error('No se pudo acceder al micrófono:', error);
      // CORRECCIÓN: Manejo de error más amigable en lugar de alert()
      this.error = 'No se pudo acceder al micrófono. Por favor, verifica los permisos.';
      // Aquí podrías mostrar un modal o un mensaje de error en la UI
    }
  }

  // Enviar ubicación
  sendLocation(): void {
    if (!navigator.geolocation) {
      console.error('Geolocalización no soportada por el navegador');
      // CORRECCIÓN: Reemplazado alert() con un mensaje en la consola y un error en la UI
      this.error = 'Geolocalización no soportada por su navegador.';
      // Aquí podrías mostrar un modal o un mensaje de error en la UI
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await this.chatService.sendMessage(this.chatId, this.currentUserUID!, '', {
            type: 'location',
            latitude,
            longitude,
          });
          this.scrollToBottom();
        } catch (error) {
          console.error('Error enviando ubicación:', error);
          this.error = 'Error al enviar la ubicación.';
        }
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        // CORRECCIÓN: Reemplazado alert() con un mensaje en la consola y un error en la UI
        this.error = 'No se pudo obtener la ubicación. Por favor, verifica los permisos.';
        // Aquí podrías mostrar un modal o un mensaje de error en la UI
      }
    );
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesEndRef && this.messagesEndRef.nativeElement) {
        this.messagesEndRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.warn('No se pudo hacer scroll al final de los mensajes:', err);
    }
  }
}
