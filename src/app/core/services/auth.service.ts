import { Injectable } from '@angular/core';
// CAMBIO: Importar desde @angular/fire/auth y @angular/fire/firestore
import { Auth, signInWithEmailAndPassword, signOut, User as FirebaseUser, user, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc, docData, collectionData, collection } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { User } from '../interfaces/user'; // Asegúrate de que esta interfaz esté definida

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private auth: Auth, // CAMBIO: Inyectar 'Auth' en lugar de 'AngularFireAuth'
    private router: Router,
    private alertController: AlertController,
    private firestore: Firestore // CAMBIO: Inyectar 'Firestore' en lugar de 'AngularFirestore'
  ) {
    // Escuchar cambios en el estado de autenticación de Firebase para mantener currentUserSubject actualizado
    // Usar 'user' de @angular/fire/auth para obtener el usuario autenticado
    user(this.auth).pipe(
      switchMap(firebaseUser => {
        if (firebaseUser) {
          // Si hay un usuario autenticado, intenta cargar sus datos de Firestore
          const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
          return docData(userDocRef).pipe(
            map((userData: any) => {
              if (userData) {
                return { ...userData, uid: firebaseUser.uid } as User; // Asegúrate de que el UID esté en el objeto User
              } else {
                return null; // No se encontraron datos de usuario en Firestore
              }
            })
          );
        } else {
          return from([null]); // No hay usuario autenticado
        }
      }),
      catchError(error => {
        console.error('Error al escuchar authState/firestore:', error);
        return from([null]);
      })
    ).subscribe(userProfile => {
      this.setCurrentUser(userProfile);
    });
  }

  /**
   * Registra un nuevo usuario en Firebase Authentication y almacena sus datos en Firestore.
   * @param email Correo del usuario
   * @param password Contraseña del usuario
   * @param name Nombre del usuario
   * @param lastname Apellido del usuario
   * @param phone Teléfono del usuario
   * @returns Objeto con usuario y datos almacenados en Firestore
   */
  async register(email: string, password: string, name: string, lastname: string, phone: string): Promise<{ user: FirebaseUser | null; userData: User }> {
    try {
      // Usar la función modular 'createUserWithEmailAndPassword'
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      if (!user?.uid) {
        throw new Error('No se pudo obtener información del usuario después del registro.');
      }

      const userData: User = {
        uid: user.uid,
        email,
        name,
        lastname,
        phone: Number(phone)
      };

      // Usar funciones modulares para Firestore
      const userDocRef = doc(this.firestore, 'users', user.uid);
      await setDoc(userDocRef, userData);

      this.setCurrentUser(userData); // Actualiza el usuario actual en el servicio
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
    // Usar la función 'signInWithEmailAndPassword' modular
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      catchError((error) => {
        console.error('Error al iniciar sesión:', error);
        return throwError(() => new Error(error.message || 'Error al iniciar sesión.'));
      })
    );
  }

  /**
   * Obtiene el UID del usuario actualmente autenticado como un Observable.
   * @returns Observable que emite el UID del usuario (string) o null si no hay usuario.
   */
  getCurrentUserId(): Observable<string | null> {
    // Usar 'user' de @angular/fire/auth
    return user(this.auth).pipe(
      map(firebaseUser => firebaseUser ? firebaseUser.uid : null)
    );
  }

  private loadInitialUser() {
    // Esto es para localStorage, que no usa Firebase directamente, se mantiene igual
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
   * Cierra sesión del usuario.
   */
  async signOut(): Promise<void> {
    // Usar la función 'signOut' modular
    return signOut(this.auth);
  }

  /**
   * Cierra sesión del usuario y redirige al login con confirmación.
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
          handler: async () => { // Usar async aquí para el await de signOut
            try {
              await this.signOut(); // Llama al método signOut modular
              this.router.navigate(['/login']);
              this.setCurrentUser(null);
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Obtiene el estado de autenticación del usuario actual (objeto completo de Firebase User).
   * @returns Observable del estado de autenticación
   */
  getUser(): Observable<FirebaseUser | null> { // CAMBIO: Tipo de retorno FirebaseUser
    return user(this.auth); // Usar 'user' de @angular/fire/auth
  }

  /**
   * Obtiene el usuario autenticado como una Promise.
   * @returns Promise que resuelve con el objeto de usuario o rechaza si no hay usuario.
   */
  async getCurrentUser(): Promise<FirebaseUser | null> { // CAMBIO: Tipo de retorno FirebaseUser
    return new Promise((resolve, reject) => {
      user(this.auth).pipe(take(1)).subscribe(firebaseUser => { // Usar take(1) para resolver la Promise una vez
        if (firebaseUser) {
          resolve(firebaseUser);
        } else {
          reject('No hay usuario autenticado');
        }
      });
    });
  }
}
