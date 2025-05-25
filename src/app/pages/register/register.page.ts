import { Component } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { Router } from "@angular/router";
import { NgForm } from "@angular/forms";

import { AuthService } from "src/app/core/services/auth.service";

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage {

  name!: string;
  lastname!: string;
  email!: string;
  phone!: string;
  password!: string;

  constructor(
    private alertController: AlertController,
    private router: Router,
    private authService: AuthService
  ) {}

  async registerUser(form: NgForm): Promise<void> {
    if (!form.valid) {
      console.error("El formulario no es válido.");
      return;
    }

    try {
      await this.authService.register(
        this.email,
        this.password,
        this.name,
        this.lastname,
        this.phone
      );

      console.log("Usuario registrado y datos guardados usando AuthService.");

      this.showSuccessMessage();

    } catch (error: any) {
      console.error("Error al registrar el usuario:", error.message);
      let errorMessage = "Ocurrió un error al registrar el usuario. Por favor, inténtalo de nuevo.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'El correo electrónico ya está en uso por otra cuenta.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del correo electrónico no es válido.';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
            break;
          default:
            errorMessage = `Error de Firebase: ${error.message}`;
            break;
        }
      }
      this.showErrorMessage(errorMessage);
    }
  }

  async showSuccessMessage() {
    const alert = await this.alertController.create({
      header: "Registro Exitoso",
      message: "El usuario ha sido registrado correctamente.",
      buttons: [
        {
          text: "Aceptar",
          handler: () => {
            this.router.navigate(["/login"]);
          }
        }
      ]
    });
    await alert.present();
  }

  async showErrorMessage(message: string) {
    const alert = await this.alertController.create({
      header: "Error de Registro",
      message: message,
      buttons: ["Aceptar"]
    });
    await alert.present();
  }
}