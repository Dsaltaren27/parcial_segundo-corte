import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

  // Obtener el usuario autenticado
  getUser(): Observable<firebase.User | null> {
    return this.afAuth.authState;
  }

  // Obtener UID directamente (si lo necesitas en algún otro servicio)
  getUid(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      map(user => user ? user.uid : null)
    );
  }

  // Obtener contactos desde la subcolección `contacts`
  getContacts(): Observable<any[]> {
    return this.getUid().pipe(
      switchMap(uid => {
        if (uid) {
          return this.firestore.collection(`users/${uid}/contacts`).valueChanges({ idField: 'id' });
        } else {
          return from([]); // si no hay usuario autenticado, se retorna un array vacío
        }
      })
    );
  }
}
