import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RedirectNotificationPage } from './redirect-notification.page';

describe('RedirectNotificationPage', () => {
  let component: RedirectNotificationPage;
  let fixture: ComponentFixture<RedirectNotificationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RedirectNotificationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
