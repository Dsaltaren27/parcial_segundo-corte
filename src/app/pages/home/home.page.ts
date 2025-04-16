import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ContactService } from 'src/app/shared/services/contact.service';
import firebase from 'firebase/compat/app';
import { Firestore } from 'firebase/firestore';
import { take } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  contactos: any[] = [];

  constructor(
    private menuCtrl: MenuController,
    private firestore: AngularFirestore,
    private contactService: ContactService
  ) {}
  ngOnInit() {
    this.contactService.getUser().pipe(
      take(1) // Solo obtener el usuario una vez
    ).subscribe((user: firebase.User | null) => {
      if (user) {
        const uid = user.uid;
        this.firestore.collection(`users/${uid}/contacts`).valueChanges({ idField: 'id' }).subscribe((contactos: any[]) => {
          this.contactos = contactos;
          console.log('Contactos cargados:', this.contactos); 
        });
      }
    });
  }
  

  openMenu() {
    this.menuCtrl.open('main-menu');
  }
}
