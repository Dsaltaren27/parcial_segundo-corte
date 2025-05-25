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
        this.isAuthReady = true;
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