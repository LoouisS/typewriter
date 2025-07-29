import { TestBed } from '@angular/core/testing';
import { TimerService } from './timer.service';

describe('TimerService', () => {
  let service: TimerService;
  let originalSetInterval: any;
  let originalClearInterval: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimerService);

    // Mock setInterval y clearInterval para tests determinísticos
    originalSetInterval = window.setInterval;
    originalClearInterval = window.clearInterval;
    
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    service.destroy();
    
    // Restaurar funciones originales
    window.setInterval = originalSetInterval;
    window.clearInterval = originalClearInterval;
  });

  describe('Inicialización', () => {
    it('debería crear el servicio correctamente', () => {
      expect(service).toBeTruthy();
    });

    it('debería tener estado inicial correcto', () => {
      // Arrange & Act
      const initialState = service.getCurrentState();

      // Assert
      expect(initialState.totalTime).toBe(0);
      expect(initialState.currentTime).toBe(0);
      expect(initialState.isRunning).toBeFalse();
      expect(initialState.isFinished).toBeFalse();
      expect(initialState.startTime).toBeNull();
    });

    it('debería tener computed signals con valores iniciales', () => {
      // Arrange & Act & Assert
      expect(service.timeRemaining()).toBe(0);
      expect(service.isRunning()).toBeFalse();
      expect(service.isFinished()).toBeFalse();
      expect(service.progress()).toBe(0);
      expect(service.isWarning()).toBeFalse();
    });
  });

  describe('startTimer', () => {
    it('debería iniciar el timer con duración especificada', () => {
      // Arrange
      const duration = 60;

      // Act
      service.startTimer(duration);

      // Assert
      expect(service.timeRemaining()).toBe(duration);
      expect(service.isRunning()).toBeTrue();
      expect(service.isFinished()).toBeFalse();
      expect(service.getTotalTime()).toBe(duration);
    });

    it('no debería reiniciar si ya está corriendo', () => {
      // Arrange
      service.startTimer(60);
      const initialTime = service.timeRemaining();

      // Act
      service.startTimer(30); // Intentar cambiar duración

      // Assert
      expect(service.timeRemaining()).toBe(initialTime);
      expect(service.getTotalTime()).toBe(60); // No debería cambiar
    });

    it('debería hacer countdown correctamente', () => {
      // Arrange
      service.startTimer(5);

      // Act
      jasmine.clock().tick(1000); // Avanzar 1 segundo

      // Assert
      expect(service.timeRemaining()).toBe(4);
      expect(service.getElapsedTime()).toBe(1);
    });
  });

  describe('pauseTimer', () => {
    it('debería pausar el timer correctamente', () => {
      // Arrange
      service.startTimer(60);

      // Act
      service.pauseTimer();

      // Assert
      expect(service.isRunning()).toBeFalse();
      expect(service.timeRemaining()).toBe(60);
      expect(service.isFinished()).toBeFalse();
    });

    it('no debería hacer nada si no está corriendo', () => {
      // Arrange
      service.setDuration(60);

      // Act
      service.pauseTimer();

      // Assert
      expect(service.isRunning()).toBeFalse();
      expect(service.timeRemaining()).toBe(60);
    });

    it('no debería pausar si ya terminó', () => {
      // Arrange
      service.startTimer(1);
      jasmine.clock().tick(1000); // Terminar el timer

      // Act
      service.pauseTimer();

      // Assert
      expect(service.isFinished()).toBeTrue();
      expect(service.isRunning()).toBeFalse();
    });
  });

  describe('resumeTimer', () => {
    it('debería reanudar timer pausado', () => {
      // Arrange
      service.startTimer(60);
      service.pauseTimer();

      // Act
      service.resumeTimer();

      // Assert
      expect(service.isRunning()).toBeTrue();
      expect(service.timeRemaining()).toBe(60);
      expect(service.isFinished()).toBeFalse();
    });

    it('no debería reanudar si ya está corriendo', () => {
      // Arrange
      service.startTimer(60);
      const wasRunning = service.isRunning();

      // Act
      service.resumeTimer();

      // Assert
      expect(service.isRunning()).toBe(wasRunning);
    });

    it('no debería reanudar si ya terminó', () => {
      // Arrange
      service.startTimer(1);
      jasmine.clock().tick(1000);

      // Act
      service.resumeTimer();

      // Assert
      expect(service.isRunning()).toBeFalse();
      expect(service.isFinished()).toBeTrue();
    });
  });

  describe('resetTimer', () => {
    it('debería resetear timer a estado inicial', () => {
      // Arrange
      service.startTimer(60);
      jasmine.clock().tick(10000); // Avanzar 10 segundos

      // Act
      service.resetTimer();

      // Assert
      const state = service.getCurrentState();
      expect(state.totalTime).toBe(0);
      expect(state.currentTime).toBe(0);
      expect(state.isRunning).toBeFalse();
      expect(state.isFinished).toBeFalse();
      expect(state.startTime).toBeNull();
    });
  });

  describe('stopTimer', () => {
    it('debería detener timer sin resetear', () => {
      // Arrange
      service.startTimer(60);
      jasmine.clock().tick(10000); // Avanzar 10 segundos

      // Act
      service.stopTimer();

      // Assert
      expect(service.isRunning()).toBeFalse();
      expect(service.timeRemaining()).toBe(50); // Mantiene tiempo actual
      expect(service.isFinished()).toBeFalse();
    });
  });

  describe('setDuration', () => {
    it('debería establecer nueva duración cuando no está corriendo', () => {
      // Arrange
      const newDuration = 120;

      // Act
      service.setDuration(newDuration);

      // Assert
      expect(service.getTotalTime()).toBe(newDuration);
      expect(service.timeRemaining()).toBe(newDuration);
    });

    it('no debería cambiar duración mientras está corriendo', () => {
      // Arrange
      service.startTimer(60);

      // Act
      service.setDuration(120);

      // Assert
      expect(service.getTotalTime()).toBe(60); // No debería cambiar
    });
  });

  describe('addTime', () => {
    it('debería agregar tiempo al timer', () => {
      // Arrange
      service.startTimer(60);
      const initialTime = service.timeRemaining();

      // Act
      service.addTime(30);

      // Assert
      expect(service.timeRemaining()).toBe(initialTime + 30);
    });

    it('no debería agregar tiempo negativo por debajo de 0', () => {
      // Arrange
      service.startTimer(30);

      // Act
      service.addTime(-60); // Restar más tiempo del disponible

      // Assert
      expect(service.timeRemaining()).toBe(0);
    });

    it('no debería agregar tiempo si ya terminó', () => {
      // Arrange
      service.startTimer(1);
      jasmine.clock().tick(1000);

      // Act
      service.addTime(30);

      // Assert
      expect(service.timeRemaining()).toBe(0);
      expect(service.isFinished()).toBeTrue();
    });
  });

  describe('Finalización automática', () => {
    it('debería finalizar automáticamente cuando llegue a 0', () => {
      // Arrange
      service.startTimer(2);

      // Act
      jasmine.clock().tick(2000); // Avanzar 2 segundos

      // Assert
      expect(service.timeRemaining()).toBe(0);
      expect(service.isRunning()).toBeFalse();
      expect(service.isFinished()).toBeTrue();
    });
  });

  describe('Computed signals', () => {
    it('debería calcular progreso correctamente', () => {
      // Arrange
      service.startTimer(100);

      // Act
      jasmine.clock().tick(25000); // 25% del tiempo

      // Assert
      expect(service.progress()).toBe(25);
    });

    it('debería mostrar advertencia en últimos 10 segundos', () => {
      // Arrange
      service.startTimer(15);

      // Act
      jasmine.clock().tick(6000); // Quedan 9 segundos

      // Assert
      expect(service.isWarning()).toBeTrue();
    });

    it('debería formatear tiempo correctamente', () => {
      // Arrange
      service.startTimer(125); // 2:05

      // Act & Assert
      expect(service.formattedTime()).toBe('2:05');
    });
  });

  describe('Cleanup', () => {
    it('debería limpiar interval al destruir', () => {
      // Arrange
      service.startTimer(60);
      spyOn(window, 'clearInterval');

      // Act
      service.destroy();

      // Assert
      expect(window.clearInterval).toHaveBeenCalled();
    });
  });
}); 