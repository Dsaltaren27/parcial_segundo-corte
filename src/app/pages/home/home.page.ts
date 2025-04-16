import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { ContactService } from 'src/app/shared/services/contact.service';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';



@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage {
  contactos: any[] = []; // Declare the 'contactos' property

  constructor( 
    private menuCtrl: MenuController,
    private firestore: Firestore,
    private contactService: ContactService,
    
  ) { }



  openMenu() {
    this.menuCtrl.open('main-menu'); 
  }
  
  ngOnInit() {
    this.contactService.getUser().subscribe(user => {
      if (user) {
        const uid = user.uid;
        const contactsCollection = collection(this.firestore, `Users/${uid}/contacts`);
        collectionData(contactsCollection, { idField: 'id' }).subscribe(contactos => {
          this.contactos = contactos;
        });
      }
    });
  }
}
