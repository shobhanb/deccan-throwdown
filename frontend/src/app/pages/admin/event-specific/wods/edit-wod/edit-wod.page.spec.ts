import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditWodPage } from './edit-wod.page';

describe('EditWodPage', () => {
  let component: EditWodPage;
  let fixture: ComponentFixture<EditWodPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditWodPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
