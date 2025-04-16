import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { from, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router,
  ) { }

 async register(email: string, password: string, nombre: string, apellido: string, telefono: string){
  
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const uid = userCredential.user?.uid;
      if (uid) {
        await this.firestore.collection('users').doc(uid).set({
          nombre,
          apellido,
          telefono,
          email,
        });
      }
      return userCredential; // Return the userCredential if needed
 }

 login(email:string,password:string){

  return this.afAuth.signInWithEmailAndPassword(email,password);

 }

 logout(){

  this.afAuth.signOut();
  this.router.navigate(['/login']);
 }

getUser(){
  return this.afAuth.authState;
}

}


