import { Injectable, signal, computed, effect } from '@angular/core';

interface TimerState {
  totalTime: number;
  currentTime: number;
  isRunning: boolean;
  isFinished: boolean;
  startTime: number | null;
}

export interface TimerSettings {
  duration: number;
  autoStart: boolean;
  warningThreshold: number;
}

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  // Estado inicial
  private readonly initialState: TimerState = {
    totalTime: 0,
    currentTime: 0,
    isRunning: false,
    isFinished: false,
    startTime: null
  };

  // Estado reactivo con signals
  private timerState = signal<TimerState>(this.initialState);
  private intervalId: number | null = null;
  private readonly warningThreshold = 10; // segundos para mostrar advertencia

  // Computed signals para estado derivado
  timeRemaining = computed(() => this.timerState().currentTime);
  isRunning = computed(() => this.timerState().isRunning);
  isFinished = computed(() => this.timerState().isFinished);
  
  progress = computed(() => {
    const state = this.timerState();
    if (state.totalTime === 0) return 0;
    return ((state.totalTime - state.currentTime) / state.totalTime) * 100;
  });

  isWarning = computed(() => {
    const state = this.timerState();
    return state.currentTime <= this.warningThreshold && 
           state.currentTime > 0 && 
           state.isRunning;
  });

  timeElapsed = computed(() => {
    const state = this.timerState();
    return state.totalTime - state.currentTime;
  });

  formattedTime = computed(() => this.formatTime(this.timeRemaining()));

  // Métodos públicos
  startTimer(duration: number): void {
    if (this.timerState().isRunning) {
      return; // Ya está corriendo
    }

    // Establecer configuración inicial
    this.timerState.set({
      totalTime: duration,
      currentTime: duration,
      isRunning: true,
      isFinished: false,
      startTime: Date.now()
    });

    // Iniciar interval
    this.intervalId = window.setInterval(() => this.tick(), 1000);
  }

  pauseTimer(): void {
    const currentState = this.timerState();
    
    if (!currentState.isRunning || currentState.isFinished) {
      return;
    }

    this.clearInterval();
    
    this.timerState.set({
      ...currentState,
      isRunning: false
    });
  }

  resumeTimer(): void {
    const currentState = this.timerState();
    
    if (currentState.isRunning || currentState.isFinished || currentState.currentTime <= 0) {
      return;
    }

    this.timerState.set({
      ...currentState,
      isRunning: true,
      startTime: Date.now()
    });

    this.intervalId = window.setInterval(() => this.tick(), 1000);
  }

  resetTimer(): void {
    this.clearInterval();
    this.timerState.set(this.initialState);
  }

  stopTimer(): void {
    this.clearInterval();
    
    const currentState = this.timerState();
    this.timerState.set({
      ...currentState,
      isRunning: false
    });
  }

  // Métodos para configuración
  setDuration(duration: number): void {
    if (this.timerState().isRunning) {
      return; // No permitir cambios mientras corre
    }

    this.timerState.set({
      ...this.initialState,
      totalTime: duration,
      currentTime: duration
    });
  }

  addTime(seconds: number): void {
    const currentState = this.timerState();
    
    if (currentState.isFinished) {
      return;
    }

    const newTime = Math.max(0, currentState.currentTime + seconds);
    
    this.timerState.set({
      ...currentState,
      currentTime: newTime,
      totalTime: Math.max(currentState.totalTime, newTime)
    });
  }

  // Métodos privados
  private tick(): void {
    const currentState = this.timerState();
    
    if (!currentState.isRunning) {
      return;
    }

    const newTime = currentState.currentTime - 1;

    if (newTime <= 0) {
      this.handleTimerFinished();
    } else {
      this.timerState.set({
        ...currentState,
        currentTime: newTime
      });
    }
  }

  private handleTimerFinished(): void {
    this.clearInterval();
    
    const currentState = this.timerState();
    this.timerState.set({
      ...currentState,
      currentTime: 0,
      isRunning: false,
      isFinished: true
    });
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Métodos utilitarios
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Métodos para obtener información del estado
  getCurrentState(): TimerState {
    return { ...this.timerState() };
  }

  getTotalTime(): number {
    return this.timerState().totalTime;
  }

  getElapsedTime(): number {
    return this.timeElapsed();
  }

  getProgress(): number {
    return this.progress();
  }

  // Método para cleanup en caso de destrucción del servicio
  destroy(): void {
    this.clearInterval();
  }
} 