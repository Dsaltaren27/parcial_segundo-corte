import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { from, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from '../interfaces/user';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  // Registro de nuevo usuario
  async register(email: string, password: string, name: string, lastname: string, phone: string): Promise<{ user: any; userData: User }> {
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (!user || !user.uid) {
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
      const errorMessage = error.message || 'Error desconocido al registrar el usuario.';
      throw new Error(errorMessage);
    }
  }

  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
      catchError((error) => {
        console.error('Error al iniciar sesión:', error);
        return throwError(() => new Error(error.message || 'Error al iniciar sesión.'));
      })
    );
  }

  logout(): void {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']);
    }).catch(error => {
      console.error('Error al cerrar sesión:', error);
    });
  }

  getUser(): Observable<any> {
    return this.afAuth.authState;
  }
}
