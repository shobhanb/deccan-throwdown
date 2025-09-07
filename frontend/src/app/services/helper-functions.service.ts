import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class HelperFunctionsService {
  filterUnique(value: any, index: number, array: any[]) {
    return array.indexOf(value) === index;
  }

  // Custom validator for no whitespace
  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value && typeof value === 'string' && /\s/.test(value)) {
      return { whitespace: true };
    }
    return null;
  }
  constructor() {}
}
