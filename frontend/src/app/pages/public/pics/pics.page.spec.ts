import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PicsPage } from './pics.page';

describe('PicsPage', () => {
  let component: PicsPage;
  let fixture: ComponentFixture<PicsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PicsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
