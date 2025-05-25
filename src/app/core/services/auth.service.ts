import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User as FirebaseUser, authState } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {}

  getAuthState(): Observable<FirebaseUser | null> {
    return authState(this.auth);
  }

  async register(email: string, password: string, name: string, lastname: string, phone: string): Promise<User | null> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: name,
          lastname: lastname,
          phone: String(phone),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const userDocRef = doc(this.firestore, 'users', firebaseUser.uid);
        await setDoc(userDocRef, userData, { merge: true });
        console.log('Usuario registrado y datos guardados en Firestore:', userData.uid);
        return userData;
      }
      return null;
    } catch (error: any) {
      console.error('Error al registrar usuario:', error.message);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<FirebaseUser | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Inicio de sesión exitoso:', userCredential.user.uid);
      return userCredential.user;
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error.message);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('Sesión cerrada.');
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error.message);
      throw error;
    }
  }

  getUserDataFromFirestore(uid: string): Observable<User | null> {
    const userDocRef = doc(this.firestore, 'users', uid);
    return from(getDoc(userDocRef)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          return { uid: snapshot.id, ...(snapshot.data() as User) };
        } else {
          console.warn(`No se encontraron datos de usuario en Firestore para el UID: ${uid}`);
          return null;
        }
      })
    );
  }

  async updateFcmToken(uid: string, token: string | null): Promise<void> {
    const userDocRef = doc(this.firestore, 'users', uid);
    try {
      await updateDoc(userDocRef, { fcmToken: token, updatedAt: new Date() });
      console.log(`FCM Token actualizado para el usuario ${uid}`);
    } catch (error) {
      console.error(`Error al actualizar el FCM Token para el usuario ${uid}:`, error);
      throw error;
    }
  }
}