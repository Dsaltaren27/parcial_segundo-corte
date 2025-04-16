import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  constructor(private firestore: AngularFirestore,
        private afAuth: AngularFireAuth
  ) { }

  
  getContacts(userId: string): Observable<any[]> {
    return this.firestore.collection(`Users/${userId}/contacts`).valueChanges({ idField: 'id' });
  }

    // Obtener estado de autenticación
    getUser(): Observable<any> {
      return this.afAuth.authState;
    }
  
}
