import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { async } from 'rxjs';

interface RecordingResult {
  uri?: string;
  recordDataBase64?: string;
  mimeType: string;
  msDuration: number;
}

@Injectable({
  providedIn: 'root'
})
export class MultimediaService {

  // 📷 Capturar imagen desde cámara
  async capturePhoto(): Promise<File | null> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        allowEditing: false
      });

      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      return new File([blob], `photo_${Date.now()}.jpeg`, { type: blob.type });
    } catch (error) {
      console.error('Error capturando foto:', error);
      return null;
    }
  }

  // Seleccionar archivos (imágenes, documentos, videos, etc.)
  async pickFiles(): Promise<{ files: File[] }> {
    try {
      const result = await FilePicker.pickFiles();
      if (!result.files.length) return { files: [] };

      const files: File[] = [];
      for (const file of result.files) {
        const blob = await fetch(file.path!).then(response => response.blob());
        const selectedFile = new File([blob], file.name, { 
          type: blob.type
        });
        files.push(selectedFile);
      }
      return { files };
    } catch (error) {
      console.error('Error seleccionando archivo:', error);
      return { files: [] };
    }
  }

  // Grabar voz
  async recordAudio(): Promise<File> {
    try {
      // Verificar permisos
      const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
      if (!hasPermission) {
        const permission = await VoiceRecorder.requestAudioRecordingPermission();
        if (!permission) {
          throw new Error('Permiso denegado');
        }
      }

      // Configurar y comenzar grabación
      await VoiceRecorder.startRecording({
        directory: 'Documents',
        subDirectory: 'voice_recordings'
      });

      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            const result: any = await VoiceRecorder.stopRecording();
            if (!result) {
              return reject(new Error('Grabación fallida'));
            }

            // Verificar si tenemos URI o base64
            const hasUri = !!result.uri;
            const audioData = hasUri ? result.uri : result.recordDataBase64;
            if (!audioData) {
              return reject(new Error('Grabación fallida'));
            }

            // Crear el blob según el tipo de datos
            let blob: Blob;
            if (hasUri) {
              const response = await fetch(result.uri);
              blob = await response.blob();
            } else {
              const byteCharacters = atob(result.recordDataBase64);
              const byteNumbers = Array.from(byteCharacters, char => 
                char.charCodeAt(0)
              );
              const byteArray = new Uint8Array(byteNumbers);
              blob = new Blob([byteArray], { type: 'audio/m4a' });
            }
            
            // Crear el File object
            const audioFile = new File([blob], `voice_${Date.now()}.m4a`, { 
              type: 'audio/m4a'
            });

            resolve(audioFile);
          } catch (error) {
            reject(error);
          }
        }, 5000);
      });
    } catch (error) {
      console.error('Error en grabación de audio:', error);
      throw error;
    }
  }


}