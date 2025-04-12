import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { IonHeader } from "@ionic/angular/standalone";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class HeaderComponent  implements OnInit {

  @Input() backRoute: string = '/start'; 
  @Input() title: string = 'Mi App de llamadas';
  
  constructor(private router:Router) { }

  goBack() {
    this.router.navigate([this.backRoute]);
  }

  ngOnInit() {}

}
