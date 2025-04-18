import { Component } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { Router } from "@angular/router";
import { getAuth, createUserWithEmailAndPassword, User as FirebaseUser } from "firebase/auth";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { initializeApp } from '@angular/fire/app';
import { environment } from 'src/environments/environment';
import { NgForm } from "@angular/forms";
import { User } from "src/app/core/interfaces/user";

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage {
  
  // Variables para capturar datos del formulario
  name!: string;
  lastname!: string;
  email!: string;
  phone!: number;
  password!: string;

  // Inicialización de Firebase
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);
  private db = getFirestore(this.app);

  constructor(private alertController: AlertController, private router: Router) {}

  /**
   * Método para registrar un nuevo usuario en Firebase Authentication y guardar su información en Firestore.
   * @param form - Formulario de registro validado
   */
  async registerUser(form: NgForm): Promise<void> {
    if (!form.valid) {
      console.error("El formulario no es válido.");
      return;
    }

    const userData: User = {
      uid: "", // Se asignará después del registro
      email: this.email,
      name: this.name,
      lastname: this.lastname,
      phone: this.phone
    };

    try {
      // Registro del usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(this.auth, userData.email, this.password);
      const firebaseUser: FirebaseUser = userCredential.user;
      userData.uid = firebaseUser.uid; // Asigna el UID generado por Firebase

      console.log("Usuario registrado en Authentication:", firebaseUser.uid);

      // Guarda los datos adicionales en Firestore
      const userDocRef = doc(collection(this.db, "users"), firebaseUser.uid);
      await setDoc(userDocRef, { ...userData });

      console.log("Datos adicionales guardados en Firestore para el usuario:", firebaseUser.uid);
      
      // Muestra alerta y redirige al login
      this.showSuccessMessage();

    } catch (error: any) {
      console.error("Error al registrar el usuario:", error.message);
    }
  }

  /**
   * Muestra un mensaje de éxito y redirige a la página de login.
   */
  async showSuccessMessage() {
    const alert = await this.alertController.create({
      header: "Registro Exitoso",
      message: "El usuario ha sido registrado correctamente.",
      buttons: [
        {
          text: "Aceptar",
          handler: () => {
            this.router.navigate(["/login"]); // Redirección al login
          }
        }
      ]
    });

    await alert.present();
  }
}