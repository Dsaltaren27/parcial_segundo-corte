import { Component, OnInit, OnDestroy } from '@angular/core'; // Añadimos OnDestroy
import { Auth, user as authStateObs, User as FirebaseUser } from '@angular/fire/auth';
// ¡IMPORTACIÓN CORREGIDA DE FIRESTORE!
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { SupabaseService } from 'src/app/core/services/supabase.service';
import { environment } from 'src/environments/environment';
import { Userprofile } from 'src/app/core/interfaces/userprofile'; // Asegúrate de que la ruta y el nombre sean correctos
import { ActionSheetController, LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-userprofile',
  templateUrl: './userprofile.page.html',
  styleUrls: ['./userprofile.page.scss'],
  standalone: false // Si estás usando Angular 14 o superior, puedes usar standalone components
})
export class UserprofilePage implements OnInit, OnDestroy { // Implementa OnDestroy si usas ngOnDestroy

  currentUser: FirebaseUser | null = null;
  userId: string | null = null;
  userEmail: string | null = null;
  profileName: string = '';
  profileLastname: string = '';
  profilePhone: string = '';
  profilePicUrl: string | null = null;
  profileEmail: string | null = null; // <-- Propiedad profileEmail declarada
  loadingProfile: boolean = true;

  private authSubscription: Subscription | null = null;
  // private appFirestoreId: string = environment.firebase.projectId; // No es estrictamente necesario si ya estás usando Firestore directamente

  constructor(
    private auth: Auth, // Inyectar Auth directamente de @angular/fire
    private firestore: Firestore, // Inyectar Firestore directamente de @angular/fire
    private supabaseService: SupabaseService, // Para usar Supabase Storage
    private authService: AuthService, // Para obtener datos del usuario
    private toastController: ToastController,
    private loadingController: LoadingController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    this.authSubscription = authStateObs(this.auth).subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userId = user.uid;
        this.userEmail = user.email;
        this.loadUserProfile();
      } else {
        this.loadingProfile = false;
        console.log('No hay usuario autenticado.');
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  async loadUserProfile() {
    if (!this.userId) {
      console.warn('loadUserProfile: No hay UID de usuario para cargar el perfil.');
      this.loadingProfile = false;
      return;
    }

    this.loadingProfile = true;
    const userDocRef = doc(this.firestore, `users`, this.userId);

    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const userData = docSnap.data() as Userprofile;
        this.profileName = userData.name || '';
        this.profileLastname = userData.lastname || '';
        this.profilePhone = userData.phone || '';
        this.profilePicUrl = userData.profilePic || null;
        // La propiedad profileEmail se asigna correctamente aquí
        this.profileEmail = userData.email || this.currentUser?.email || '';

        console.log('Perfil de usuario cargado:', userData);
      } else {
        console.log('No se encontraron datos de perfil en Firestore para este usuario. Inicializando con datos de Firebase Auth.');
        // Puedes establecer valores por defecto si no existe un perfil
        this.profileName = this.currentUser?.displayName || '';
        this.profileEmail = this.currentUser?.email || '';
        this.profilePicUrl = this.currentUser?.photoURL || null;
      }
    } catch (error) {
      console.error('Error al cargar el perfil del usuario:', error);
      this.presentToast('Error al cargar el perfil.', 'danger');
    } finally {
      this.loadingProfile = false;
    }
  }

  async handleSaveProfile() {
    if (!this.userId) {
      this.presentToast('No hay usuario para guardar el perfil.', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Guardando perfil...'
    });
    await loading.present();

    const userDocRef = doc(this.firestore, `users`, this.userId);

    try {
      const userDataToSave: Partial<Userprofile> = {
        name: this.profileName,
        lastname: this.profileLastname,
        phone: String(this.profilePhone),
        updatedAt: new Date()
      };

      if (this.profilePicUrl) {
        userDataToSave.profilePic = this.profilePicUrl;
      }

      await setDoc(userDocRef, userDataToSave, { merge: true });
      this.presentToast('Perfil actualizado exitosamente.', 'success');
      console.log('Perfil actualizado en Firestore.');

    } catch (error) {
      console.error('Error al guardar el perfil:', error);
      this.presentToast('Error al guardar el perfil.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async handleChoosePhoto() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccionar imagen',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => {
            this.takePhoto(CameraSource.Camera);
          }
        },
        {
          text: 'Elegir de la galería',
          icon: 'image',
          handler: () => {
            this.takePhoto(CameraSource.Photos);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async takePhoto(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64, // O DataUrl, o Uri
        source: source
      });

      if (image.base64String && this.userId) {
        const loading = await this.loadingController.create({
          message: 'Subiendo imagen...'
        });
        await loading.present();

        try {
          const supabase = this.supabaseService.getSupabase();
          const bucketName = 'call-2cfb6'; // Nombre de tu bucket en Supabase Storage
          const fileName = `${this.userId}/${Date.now()}.jpeg`; // Ruta y nombre del archivo

          const { data, error } = await supabase
            .storage
            .from(bucketName)
            .upload(fileName, this.decodeBase64ToBlob(image.base64String), {
              contentType: 'image/jpeg',
              upsert: false // false para evitar sobrescribir si ya existe
            });

          if (error) {
            console.error('Error al subir imagen a Supabase Storage:', error);
            this.presentToast('Error al subir la imagen.', 'danger');
            return;
          }

          // Obtener la URL pública de la imagen
          const { data: publicUrlData } = supabase
            .storage
            .from('call-2cfb6')
            .getPublicUrl(fileName);

          this.profilePicUrl = publicUrlData.publicUrl;
          this.presentToast('Imagen de perfil subida exitosamente.', 'success');
          console.log('URL de la imagen de perfil:', this.profilePicUrl);

          // Actualizar la URL de la imagen en Firestore
          await setDoc(doc(this.firestore, `users`, this.userId), {
            profilePic: this.profilePicUrl,
            updatedAt: new Date()
          }, { merge: true });
          console.log('URL de la imagen de perfil actualizada en Firestore.');

        } catch (uploadError) {
          console.error('Error durante el proceso de subida de imagen:', uploadError);
          this.presentToast('Error al procesar la imagen.', 'danger');
        } finally {
          await loading.dismiss();
        }
      }
    } catch (error) {
      console.error('Error al tomar/seleccionar la foto:', error);
      // No mostrar toast si el usuario cancela
      if (!(error as any)?.message?.includes('User cancelled photos app')) {
        this.presentToast('No se pudo seleccionar la imagen.', 'warning');
      }
    }
  }

  private decodeBase64ToBlob(base64: string): Blob {
    const byteString = atob(base64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    return new Blob([int8Array], { type: 'image/jpeg' });
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}