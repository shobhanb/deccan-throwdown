import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WodsPage } from './wods.page';

describe('WodsPage', () => {
  let component: WodsPage;
  let fixture: ComponentFixture<WodsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WodsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
