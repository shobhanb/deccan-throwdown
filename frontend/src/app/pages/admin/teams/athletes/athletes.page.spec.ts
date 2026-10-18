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

  it('lets an admin save an email change without phone, date of birth, or waiver', () => {
    component.isEditing.set(true);
    component.editAthlete.set({
      id: 'athlete-1',
      team_id: 'team-1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      sex: 'F',
      email: 'old@example.com',
      phone_number: null,
      date_of_birth: null,
      waiver: false,
      gym: null,
      city: null,
    });
    component.athleteModel.set({
      first_name: 'Ada',
      last_name: 'Lovelace',
      sex: 'F',
      email: 'new@example.com',
      phone_number: '',
      date_of_birth: '',
      waiver: false,
      gym: '',
      city: '',
    });
    fixture.detectChanges();

    expect(component.emailChanged()).toBeTrue();
    expect(component.athleteForm().valid()).toBeTrue();
  });
});
