import { Component } from "@angular/core";
import { ModalController, AlertController } from "@ionic/angular";
import { getFirestore, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { initializeApp } from '@angular/fire/app';
import { environment } from 'src/environments/environment';
import { NgForm } from "@angular/forms";

@Component({
  selector: 'app-add-contact',
  templateUrl: './add-contact.component.html',
  styleUrls: ['./add-contact.component.scss'],
  standalone: false
})
export class AddContactComponent {
  
  name!: string;
  lastname!: string;
  phone!: string;

  private app = initializeApp(environment.firebase);
  private db = getFirestore(this.app);

  constructor(private modalController: ModalController, private alertController: AlertController) {}

  /**
   * Cierra el modal
   */
  closeModal() {
    this.modalController.dismiss();
  }

  /**
   * Agrega un contacto si el usuario existe en Firestore
   */
  async addContact(form: NgForm) {
    if (!form.valid) {
      console.error("El formulario no es válido.");
      return;
    }

    try {
      const userRef = doc(this.db, "users", this.phone);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const contactRef = doc(collection(userRef, "contacts"), this.phone);
        await setDoc(contactRef, {
          name: this.name,
          lastname: this.lastname,
          phone: this.phone
        });

        console.log("Contacto agregado exitosamente.");

        // Mostrar mensaje de éxito
        await this.showSuccessMessage();

        // Cerrar el modal enviando el contacto agregado a Home
        this.modalController.dismiss({ success: true, contact: { name: this.name, lastname: this.lastname, phone: this.phone } });

        // Limpiar los campos
        this.clearForm(form);

      } else {
        console.error("El usuario no existe.");
        await this.showErrorMessage();
        this.modalController.dismiss({ success: false });
      }
    } catch (error: any) {
      console.error("Error al agregar contacto:", error.message);
    }
  }

  /**
   * Muestra un mensaje de éxito
   */
  async showSuccessMessage() {
    const alert = await this.alertController.create({
      header: "¡Éxito!",
      message: "El contacto ha sido agregado correctamente.",
      buttons: ["Aceptar"]
    });

    await alert.present();
  }

  /**
   * Muestra un mensaje de error
   */
  async showErrorMessage() {
    const alert = await this.alertController.create({
      header: "Error",
      message: "El usuario no existe en Firestore.",
      buttons: ["Aceptar"]
    });

    await alert.present();
  }

  /**
   * Limpia los campos del formulario
   */
  clearForm(form: NgForm) {
    form.reset();
  }
}