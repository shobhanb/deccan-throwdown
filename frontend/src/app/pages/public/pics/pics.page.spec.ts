import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PicsPage } from './pics.page';

describe('PicsPage', () => {
  let component: PicsPage;
  let fixture: ComponentFixture<PicsPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PicsPage],
      providers: [provideHttpClient(), provideRouter([])],
    });
    fixture = TestBed.createComponent(PicsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
