import { Component, OnDestroy, OnInit, Input } from "@angular/core";
import { ModalController, AlertController } from "@ionic/angular";
import { NgForm, FormsModule } from "@angular/forms"; 
import { Subject, Subscription } from "rxjs";
import { takeUntil, take } from 'rxjs/operators'; 

import { Auth, user, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, collection, query, where, getDocs, doc, setDoc } from '@angular/fire/firestore';

import { Contact } from 'src/app/core/interfaces/contact';
import { User } from 'src/app/core/interfaces/user';

@Component({
  selector: 'app-add-contact',
  templateUrl: './add-contact.component.html',
  styleUrls: ['./add-contact.component.scss'],
  standalone: false 

})
export class AddContactComponent implements OnInit, OnDestroy {
  @Input() loggedInUserUID!: string; // Recibir el UID del usuario logueado como Input

  name!: string;
  lastname!: string;
  phone!: string; 

  private destroy$ = new Subject<void>();
  private authStateSubscription!: Subscription; 

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private auth: Auth,       
    private firestore: Firestore 
  ) {}

  ngOnInit() {
    // Asegurarse de que el loggedInUserUID se reciba correctamente
    if (!this.loggedInUserUID) {
      console.warn("AddContactComponent: loggedInUserUID no fue proporcionado inicialmente. Intentando obtenerlo...");
      this.authStateSubscription = user(this.auth).pipe(
        take(1), 
        takeUntil(this.destroy$)
      ).subscribe(firebaseUser => {
        if (firebaseUser) {
          this.loggedInUserUID = firebaseUser.uid;
        } else {
          console.error("AddContactComponent: No hay usuario autenticado al iniciar el modal.");
          this.showErrorMessage("Debe estar autenticado para agregar contactos.");
          this.closeModal(); 
        }
      });
    }
  }

  closeModal(contactAdded: boolean = false, contactData?: Contact) {
    this.modalController.dismiss({ success: contactAdded, contact: contactData });
  }

async addContact(form: NgForm) {
    if (!form.valid || !this.name.trim() || !this.lastname.trim() || !this.phone.trim()) {
      await this.showErrorMessage("Por favor, complete todos los campos correctamente.");
      return;
    }

    if (!this.loggedInUserUID) {
      console.error("Usuario no autenticado para agregar contacto.");
      await this.showErrorMessage("Debe estar autenticado para agregar contactos.");
      return;
    }

    try {
      console.log("Usuario autenticado UID:", this.loggedInUserUID);
      console.log("Buscando usuario con el número:", this.phone);

      const usersCollectionRef = collection(this.firestore, "users");

      const phoneQuery = query(usersCollectionRef, where("phone", "==", this.phone.trim())); // ASUMIMOS que el teléfono en Firestore es un STRING

      const querySnapshot = await getDocs(phoneQuery);
      
      if (querySnapshot.empty) {
        console.error("No se encontró usuario con ese número.");
        await this.showErrorMessage("No se encontró usuario con ese número. No se puede agregar el contacto.");
        return;
      }

      const foundUserDoc = querySnapshot.docs[0];
      const foundUserData = foundUserDoc.data() as User;
      

      if (foundUserData.uid === this.loggedInUserUID) {
        await this.showErrorMessage("No puedes agregarte a ti mismo como contacto.");
        return;
      }

      console.log("Usuario con el número encontrado:", foundUserData.uid, foundUserData.name);

      const contactToSave: Contact = {
        id: foundUserData.uid,
        name: foundUserData.name,
        lastname: foundUserData.lastname,
        phone: String(foundUserData.phone), 
      };

      const userContactDocRef = doc(this.firestore, `users/${this.loggedInUserUID}/contacts/${contactToSave.id}`);
      await setDoc(userContactDocRef, contactToSave, { merge: true });

      console.log("Contacto guardado bajo el usuario autenticado con UID:", contactToSave.id);
      await this.showSuccessMessage("Contacto guardado exitosamente.");
      this.closeModal(true, contactToSave);

      form.resetForm();
    } catch (error: any) {
      console.error("Error al agregar contacto:", error);
      const errorMessage = error?.message || "Error desconocido";
      await this.showErrorMessage(`Error: ${errorMessage}`);
    }
  }

  async showSuccessMessage(message: string) {
    const alert = await this.alertController.create({
      header: "¡Éxito!",
      message: message,
      buttons: ["Aceptar"]
    });
    await alert.present();
  }

  async showErrorMessage(message: string) {
    const alert = await this.alertController.create({
      header: "Error",
      message: message,
      buttons: ["Aceptar"]
    });
    await alert.present();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.authStateSubscription) {
      this.authStateSubscription.unsubscribe();
    }
  }
}
