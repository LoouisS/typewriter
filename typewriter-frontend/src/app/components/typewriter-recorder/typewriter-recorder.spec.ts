import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypewriterRecorder } from './typewriter-recorder';

describe('TypewriterRecorder', () => {
  let component: TypewriterRecorder;
  let fixture: ComponentFixture<TypewriterRecorder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypewriterRecorder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypewriterRecorder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
