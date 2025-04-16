import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { from, Observable } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  // Registro de usuario
  register(email: string, password: string, name: string, lastname: string, phone: string): Observable<any> {
    return from(this.afAuth.createUserWithEmailAndPassword(email, password)).pipe(
      switchMap((userCredential) => {
        const uid = userCredential.user?.uid;
        if (uid) {
          return from(
            this.firestore.collection('users').doc(uid).set({
              name,
              lastname,
              phone,
              email,
            })
          ).pipe(
            catchError((error) => {
              console.error('Error al guardar datos adicionales:', error);
              throw error;
            })
          );
        }
        throw new Error('UID no disponible');
      }),
      catchError((error) => {
        console.error('Error al registrar:', error);
        throw error;
      })
    );
  }
  

  // Inicio de sesión
  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
      catchError((error) => {
        console.error('Error al hacer login:', error);
        throw error;
      })
    );
  }

  // Cierre de sesión
  logout(): void {
    this.afAuth.signOut();
    this.router.navigate(['/login']);
  }

  // Obtener estado de autenticación
  getUser(): Observable<any> {
    return this.afAuth.authState;
  }
}
