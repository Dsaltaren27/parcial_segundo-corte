import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { Auth, authState, User } from '@angular/fire/auth';

import { ChatService } from 'src/app/core/services/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone: false
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesEnd') messagesEndRef!: ElementRef;

  public userId: string | null = null;
  public messages: any[] = [];
  public newMessage: string = '';
  public loading: boolean = true;
  public error: string = '';
  public isAuthReady: boolean = false;

  public otherUserId: string = '';
  public otherUserPhone: string | null = null; // <-- NUEVA PROPIEDAD
  public chatId: string = '';

  private authSubscription!: Subscription;
  private messagesSubscription!: Subscription;

  constructor(
    private auth: Auth,
    private route: ActivatedRoute,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const paramOtherUserId = params.get('otherUserId');
      if (paramOtherUserId) {
        this.otherUserId = paramOtherUserId;
        // Llama a la función para obtener el número de teléfono del otro usuario
        this.loadOtherUserPhone(); // <-- NUEVA LLAMADA
      } else {
        this.otherUserId = 'some-default-other-user-id';
        console.warn('No otherUserId provided in route parameters. Using a default.');
      }
      this.setupAuthAndChat();
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  private setupAuthAndChat(): void {
    this.authSubscription = authState(this.auth).subscribe(
      (user: User | null) => {
        if (user) {
          this.userId = user.uid;
          if (this.otherUserId) {
            this.chatId = [this.userId, this.otherUserId].sort().join('-');
            this.isAuthReady = true;
            this.listenForMessages();
          }
        } else {
          // Si usas signInAnonymously, asegúrate de que se complete para que `userId` se establezca.
          // Para esta demostración, asumimos que `user` ya está disponible si el flujo de auth funciona.
          // Si el usuario no está autenticado, signInAnonymously(this.auth);
          // O podrías forzar una redirección a la página de inicio de sesión/registro.
        }
        if (this.isAuthReady && !this.userId) {
          this.loading = false;
        }
      },
      (err: any) => {
        console.error("Error en authState subscription:", err);
        this.error = `Error de autenticación: ${err.message}`;
        this.loading = false;
        this.isAuthReady = true;
      }
    );
  }

  // *** NUEVO MÉTODO PARA CARGAR EL NÚMERO DE TELÉFONO DEL OTRO USUARIO ***
  private async loadOtherUserPhone(): Promise<void> {
    if (this.otherUserId) {
      this.otherUserPhone = await this.chatService.getUserPhoneNumber(this.otherUserId);
      if (!this.otherUserPhone) {
        console.warn(`No se pudo obtener el número de teléfono para ${this.otherUserId}.`);
        // Puedes establecer un valor por defecto o un mensaje de error si lo deseas
      }
    }
  }
  // *******************************************************************

  private listenForMessages(): void {
    if (!this.userId || !this.isAuthReady || !this.chatId) {
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
  }

  public async handleSendMessage(): Promise<void> {
    if (!this.newMessage.trim() || !this.userId || !this.chatId) {
      return;
    }

    try {
      await this.chatService.sendMessage(this.chatId, this.userId, this.newMessage);
      this.newMessage = '';
    } catch (err: any) {
      console.error("Error al enviar mensaje:", err);
      this.error = `Error al enviar mensaje: ${err.message}`;
    }
  }

  public handleCall(): void {
    alert('Simulando una llamada... ¡Aquí se integraría Jitsi!');
  }

  private scrollToBottom(): void {
    if (this.messagesEndRef) {
      this.messagesEndRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
}