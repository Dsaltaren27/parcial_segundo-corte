import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private alertController: AlertController,
    private firestore: AngularFirestore
    
  ) {}

  /**
   * Registra un nuevo usuario en Firebase Authentication y almacena sus datos en Firestore.
   * @param email Correo del usuario
   * @param password Contraseña del usuario
   * @param name Nombre del usuario
   * @param lastname Apellido del usuario
   * @param phone Teléfono del usuario
   * @returns Objeto con usuario y datos almacenados en Firestore
   */
  async register(email: string, password: string, name: string, lastname: string, phone: string): Promise<{ user: any; userData: User }> {
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (!user?.uid) {
        throw new Error('No se pudo obtener información del usuario después del registro.');
      }

      // Crear objeto User
      const userData: User = {
        uid: user.uid,
        email,
        name,
        lastname,
        phone: Number(phone)
      };

      console.log('UID del usuario:', user.uid);
      await this.firestore.collection('users').doc(user.uid).set(userData);
      console.log('Información guardada exitosamente en Firestore');

      return { user, userData };
      
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      throw new Error(error.message || 'Error desconocido al registrar el usuario.');
    }
  }

  /**
   * Inicia sesión con correo y contraseña en Firebase Authentication.
   * @param email Correo del usuario
   * @param password Contraseña del usuario
   * @returns Observable del resultado de autenticación
   */
  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
      catchError((error) => {
        console.error('Error al iniciar sesión:', error);
        return throwError(() => new Error(error.message || 'Error al iniciar sesión.'));
      })
    );
  }

  private loadInitialUser() {

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error al parsear el usuario del almacenamiento local', error);
        this.currentUserSubject.next(null);
      }
    }
  }

  setCurrentUser(user: User | null) {
    this.currentUserSubject.next(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }

  }

  getLoggedInUserName(): Observable<string | null> {
    return this.currentUser$.pipe(map(user => user?.name || null));
  }





  /**
   * Cierra sesión del usuario y redirige al login.
   */
  async logout(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmación',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Salir',
          handler: () => {
            this.afAuth.signOut().then(() => {
              this.router.navigate(['/login']);
              this.setCurrentUser(null); 
              

              
            }).catch(error => {
              console.error('Error al cerrar sesión:', error);
            });
          }
        }
      ]
    });

    await alert.present();
  }



  /**
   * Obtiene el estado de autenticación del usuario actual.
   * @returns Observable del estado de autenticación
   */
  getUser(): Observable<User | null> {
    return this.afAuth.authState as Observable<User | null>;
  }



  
  async getCurrentUser() {
    return new Promise((resolve, reject) => {
      this.afAuth.authState.subscribe(user => {
        if (user) {
          resolve(user);
        } else {
          reject('No hay usuario autenticado');
        }
      });
    });
  }

}