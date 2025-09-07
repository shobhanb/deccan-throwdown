import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AthletesPage } from './athletes.page';

describe('AthletesPage', () => {
  let component: AthletesPage;
  let fixture: ComponentFixture<AthletesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AthletesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
