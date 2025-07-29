import { Component, HostListener, signal, computed, inject, OnInit, effect, OnDestroy, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { WordGeneratorService } from '../../services/word-generator.service';
import { TimerService } from '../../services/timer.service';
import { TestConfigService } from '../../services/test-config.service';

interface WordState {
  text: string;
  isCompleted: boolean;
  isActive: boolean;
  isCorrect?: boolean;
  absoluteIndex: number; // Índice absoluto global del test
}

interface WordRow {
  id: number; // ID único e inmutable de la fila
  words: WordState[];
  isVisible: boolean;
}

interface TestStatistics {
  wpm: number;
  accuracy: number;
  totalCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  totalWords: number;
  correctWords: number;
  timeElapsed: number;
  testType: string;
  testConfig: {
    includeAccents: boolean;
    includeNumbers: boolean;
    wordCount?: number;
    duration?: number;
  };
  wpmOverTime: { time: number; wpm: number }[];
}

interface WPMDataPoint {
  time: number; // segundos desde el inicio
  wpm: number;
  charactersTyped: number;
}

@Component({
  selector: 'app-typewriter-recorder',
  imports: [
    CommonModule,
    NgApexchartsModule
  ],
  templateUrl: './typewriter-recorder.html',
  styleUrl: './typewriter-recorder.css'
})
export class TypewriterRecorder implements OnInit, OnDestroy {

  // Estado reactivo con signals - Palabras y filas
  private allWords = signal<string[]>([]); // Todas las palabras generadas
  private wordRows = signal<WordRow[]>([]); // Filas inmutables
  private currentAbsoluteIndex = signal<number>(0); // Índice absoluto actual
  readonly completedWords = signal<string[]>([]); // Palabras completadas por el usuario
  
  // Configuración de filas
  private readonly WORDS_PER_ROW = 12; // Palabras fijas por fila
  private readonly VISIBLE_ROWS = 3; // Máximo 3 filas visibles
  private readonly WORDS_AHEAD = 60; // Generar palabras por adelantado
  
  // Input actual
  currentInput = signal<string>('');

  // Estado reactivo con signals - Timer y Test
  testStarted = signal<boolean>(false);
  testFinished = signal<boolean>(false);
  finalStatistics = signal<TestStatistics | null>(null);
  
  // Configuración del timer (ahora viene del servicio de configuración)
  timerSettings = computed(() => this.testConfigService.timerSettings());

  // Flag para evitar bucles infinitos durante la regeneración
  private isRegenerating = false;

  // Sistema de tracking de WPM por segundo
  private wpmTrackingData: WPMDataPoint[] = [];
  private totalCharactersTyped = signal<number>(0);
  private correctCharactersTyped = signal<number>(0);
  private trackingInterval: any;

  private readonly testConfigService = inject(TestConfigService);
  private readonly document = inject(DOCUMENT);

  // Computed signals para verificar modo del test
  readonly testType = computed(() => this.testConfigService.testType());
  readonly isWordBasedTest = computed(() => this.testType() === 'words');
  readonly isTimeBasedTest = computed(() => this.testType() === 'time');
  readonly targetWordCount = computed(() => this.testConfigService.wordCount() || 25);
  readonly includeAccents = computed(() => this.testConfigService.includeAccents());
  readonly includeNumbers = computed(() => this.testConfigService.includeNumbers());

  // Computed para verificar si el test de palabras ha terminado
  readonly isWordTestComplete = computed(() => {
    return this.isWordBasedTest() && this.completedWords().length >= this.targetWordCount();
  });

  constructor(
    private wordGenerator: WordGeneratorService, 
    private timerService: TimerService
  ) {
    this.wordGenerator = wordGenerator;
    this.timerService = timerService;
    
    // Effect para manejar finalización del timer (modo tiempo)
    effect(() => {
      if (this.isTimeBasedTest() && this.timerService.isFinished()) {
        this.handleTestFinished();
      }
    });

    // Effect para manejar finalización por palabras (modo palabras)
    effect(() => {
      if (this.isWordTestComplete()) {
        this.handleTestFinished();
      }
    });

    // Effect unificado para manejar cambios en configuración (evita bucles infinitos)
    effect(() => {
      const testType = this.testType();
      const wordCount = this.targetWordCount();
      const includeAccents = this.includeAccents();
      const includeNumbers = this.includeNumbers();
      const testStarted = this.testStarted();
      
      // Solo actuar si el test NO ha comenzado y no estamos ya regenerando
      if (!testStarted && !this.isRegenerating && wordCount > 0) {
        this.handleConfigurationChange(testType, wordCount, includeAccents, includeNumbers);
      }
    }, { allowSignalWrites: true }); // Permitir escrituras de signals en este effect
  }

  // Computed signals para estado derivado
  currentWord = computed(() => {
    const allWords = this.allWords();
    const currentIndex = this.currentAbsoluteIndex();
    return allWords[currentIndex] || '';
  });

  // Sistema de filas con scroll fluido
  visibleRows = computed(() => {
    const rows = this.wordRows();
    const currentIndex = this.currentAbsoluteIndex();
    const currentRowIndex = Math.floor(currentIndex / this.WORDS_PER_ROW);
    
    // Determinar qué filas mostrar (máximo 3)
    let startRowIndex = Math.max(0, currentRowIndex - 1); // Mostrar fila anterior si existe
    if (currentRowIndex === 0) {
      startRowIndex = 0; // En la primera fila, empezar desde 0
    }
    
    const endRowIndex = Math.min(rows.length, startRowIndex + this.VISIBLE_ROWS);
    return rows.slice(startRowIndex, endRowIndex);
  });

  // Estado de la palabra actual con caracteres
  currentCharIndex = computed(() => this.currentInput().length);
  
  currentWordWithChars = computed(() => {
    const word = this.currentWord();
    const input = this.currentInput();
    
    if (!word) return [];
    
    return word.split('').map((char, index) => ({
      char,
      isTyped: index < input.length,
      isCorrect: index < input.length ? input[index] === char : undefined,
      isActive: index === input.length
    }));
  });

  // Computed signals para estado derivado - Timer y Test
  testState = computed(() => {
    if (!this.testStarted()) return 'waiting';
    
    // Verificar finalización por cualquier modo
    const isTimeFinished = this.isTimeBasedTest() && this.timerService.isFinished();
    const isWordFinished = this.isWordTestComplete();
    
    if (isTimeFinished || isWordFinished) return 'finished';
    if (this.timerService.isRunning()) return 'running';
    return 'paused';
  });

  // Acceso directo a propiedades del timer service
  timeRemaining = computed(() => this.timerService.timeRemaining());
  formattedTime = computed(() => this.timerService.formattedTime());
  timerProgress = computed(() => this.timerService.progress());
  showTimeWarning = computed(() => 
    this.timerService.isWarning() && this.timerSettings().showWarnings
  );

  // Estado combinado para UI
  canStartTest = computed(() => 
    !this.testStarted() && !this.timerService.isRunning()
  );
  
  canPauseTest = computed(() => 
    this.testStarted() && this.timerService.isRunning()
  );

  canResumeTest = computed(() => 
    this.testStarted() && !this.timerService.isRunning() && !this.timerService.isFinished()
  );

  // Debug getters
  currentWordIndex = computed(() => this.currentAbsoluteIndex());
  words = computed(() => this.allWords());

  // Computed para obtener la duración configurada
  configuredDuration = computed(() => this.testConfigService.effectiveTestDuration());

  // Configuración del gráfico de ApexCharts
  chartOptions = computed(() => {
    const stats = this.finalStatistics();
    if (!stats) return null;

    return {
      series: [{
        name: 'WPM',
        data: stats.wpmOverTime.map(point => ({
          x: point.time,
          y: point.wpm
        }))
      }],
      chart: {
        type: 'line' as any,
        height: 300,
        background: 'transparent',
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      colors: ['#00D9FF'],
      stroke: {
        curve: 'smooth' as any,
        width: 3
      },
      grid: {
        borderColor: '#334155',
        strokeDashArray: 5
      },
      xaxis: {
        title: {
          text: 'Tiempo (segundos)',
          style: {
            color: '#94A3B8'
          }
        },
        labels: {
          style: {
            colors: '#94A3B8'
          }
        }
      },
      yaxis: {
        title: {
          text: 'WPM',
          style: {
            color: '#94A3B8'
          }
        },
        labels: {
          style: {
            colors: '#94A3B8'
          }
        }
      },
      tooltip: {
        theme: 'dark'
      }
    };
  });

  ngOnInit(): void {
    this.initializeWords();
  }

  ngOnDestroy(): void {
    this.stopWPMTracking();
    // Limpiar clase CSS del body al destruir el componente
    this.document.body.classList.remove('statistics-visible');
  }

  private initializeWords(): void {
    // Determinar cuántas palabras generar según el modo del test
    let wordsToGenerate: number;
    
    if (this.isWordBasedTest()) {
      // En modo palabras, generar EXACTAMENTE las necesarias
      const targetWords = this.targetWordCount();
      wordsToGenerate = targetWords; // Sin buffer extra
    } else {
      // En modo tiempo, generar palabras por adelantado como antes
      wordsToGenerate = this.WORDS_AHEAD;
    }
    
    const includeAccents = this.includeAccents();
    const includeNumbers = this.includeNumbers();
    const initialWords = this.wordGenerator.generateMixedWords(wordsToGenerate, 'spanish', includeAccents, includeNumbers);
    this.allWords.set(initialWords);
    
    // Crear filas inmutables iniciales
    this.createInitialRows();
  }

  private handleConfigurationChange(testType: string, wordCount: number, includeAccents: boolean, includeNumbers: boolean): void {
    // Evitar bucles infinitos
    if (this.isRegenerating) {
      return;
    }
    
    this.isRegenerating = true;
    
    // Regenerar palabras basadas en la nueva configuración
    let wordsToGenerate: number;
    
    if (this.isWordBasedTest()) {
      // En modo palabras, generar EXACTAMENTE las palabras seleccionadas
      wordsToGenerate = wordCount; // Sin buffer extra
    } else {
      // En modo tiempo u otros, generar cantidad estándar
      wordsToGenerate = this.WORDS_AHEAD;
    }
    
    // Generar nuevas palabras con configuración de tildes y números
    const newWords = this.wordGenerator.generateMixedWords(wordsToGenerate, 'spanish', includeAccents, includeNumbers);
    this.allWords.set(newWords);
    
    // Log temporal para debug
    console.log(`Modo: ${testType}, Palabras objetivo: ${wordCount}, Tildes: ${includeAccents}, Números: ${includeNumbers}, Palabras generadas: ${newWords.length}`);
    
    // Recrear las filas con las nuevas palabras
    this.createInitialRows();
    
    // Resetear el estado
    this.currentAbsoluteIndex.set(0);
    this.currentInput.set('');
    this.completedWords.set([]);
    
    // Liberar la flag
    this.isRegenerating = false;
  }

  private createInitialRows(): void {
    const words = this.allWords();
    const rows: WordRow[] = [];
    
    // Crear TODAS las filas necesarias para todas las palabras
    const totalRowsNeeded = Math.ceil(words.length / this.WORDS_PER_ROW);
    
    for (let rowIndex = 0; rowIndex < totalRowsNeeded; rowIndex++) {
      const rowId = rowIndex;
      const startWordIndex = rowIndex * this.WORDS_PER_ROW;
      const endWordIndex = Math.min(startWordIndex + this.WORDS_PER_ROW, words.length);
      
      const rowWords: WordState[] = [];
      for (let wordIndex = startWordIndex; wordIndex < endWordIndex; wordIndex++) {
        rowWords.push({
          text: words[wordIndex],
          isCompleted: false,
          isActive: wordIndex === 0, // Solo la primera palabra está activa inicialmente
          absoluteIndex: wordIndex
        });
      }
      
      rows.push({
        id: rowId,
        words: rowWords,
        isVisible: rowIndex < this.VISIBLE_ROWS // Solo las primeras 3 filas visibles inicialmente
      });
    }
    
    this.wordRows.set(rows);
  }

  private ensureWordsAhead(): void {
    // En modo palabras, NO generar más palabras - debe terminar exactamente con el número configurado
    if (this.isWordBasedTest()) {
      // No hacer nada en modo palabras - las palabras están limitadas intencionalmente
      return;
    }
    
    // En modo tiempo, generar palabras como antes
    const currentIndex = this.currentAbsoluteIndex();
    const totalWords = this.allWords().length;
    
    // Si estamos cerca del final, generar más palabras
    if (totalWords - currentIndex < 30) {
      const includeAccents = this.includeAccents();
      const includeNumbers = this.includeNumbers();
      const newWords = this.wordGenerator.generateAdditionalWords(this.WORDS_AHEAD, 'spanish', includeAccents, includeNumbers);
      const updatedWords = [...this.allWords(), ...newWords];
      this.allWords.set(updatedWords);
      
      // Crear nuevas filas para las palabras adicionales
      this.createAdditionalRows();
    }
  }

  private createAdditionalRows(): void {
    const words = this.allWords();
    const currentRows = this.wordRows();
    const lastRowId = currentRows[currentRows.length - 1]?.id || -1;
    const wordsAlreadyInRows = (lastRowId + 1) * this.WORDS_PER_ROW;
    
    // Crear filas para las nuevas palabras
    const newRows: WordRow[] = [];
    for (let wordIndex = wordsAlreadyInRows; wordIndex < words.length; wordIndex += this.WORDS_PER_ROW) {
      const rowId = Math.floor(wordIndex / this.WORDS_PER_ROW);
      const endWordIndex = Math.min(wordIndex + this.WORDS_PER_ROW, words.length);
      
      const rowWords: WordState[] = [];
      for (let i = wordIndex; i < endWordIndex; i++) {
        rowWords.push({
          text: words[i],
          isCompleted: false,
          isActive: false,
          absoluteIndex: i
        });
      }
      
      newRows.push({
        id: rowId,
        words: rowWords,
        isVisible: false
      });
    }
    
    if (newRows.length > 0) {
      this.wordRows.set([...currentRows, ...newRows]);
    }
  }

  private updateWordsState(): void {
    const currentIndex = this.currentAbsoluteIndex();
    const completed = this.completedWords();
    
    // Actualizar estado de todas las palabras en todas las filas
    const updatedRows = this.wordRows().map(row => ({
      ...row,
      words: row.words.map(word => ({
        ...word,
        isCompleted: word.absoluteIndex < currentIndex,
        isActive: word.absoluteIndex === currentIndex,
        isCorrect: word.absoluteIndex < currentIndex && word.absoluteIndex < completed.length ? 
          completed[word.absoluteIndex] === word.text : undefined
      }))
    }));
    
    this.wordRows.set(updatedRows);
  }

  private updateCharacterStats(typedChar: string, expectedChar: string): void {
    this.totalCharactersTyped.update(count => count + 1);
    
    if (typedChar === expectedChar) {
      this.correctCharactersTyped.update(count => count + 1);
    }
  }

  private startWPMTracking(): void {
    this.wpmTrackingData = [];
    this.totalCharactersTyped.set(0);
    this.correctCharactersTyped.set(0);
    
    // Tracker cada segundo
    this.trackingInterval = setInterval(() => {
      const elapsedTime = this.timerService.getElapsedTime();
      const totalChars = this.totalCharactersTyped();
      const correctChars = this.correctCharactersTyped();
      
      // Calcular WPM: (caracteres correctos / 5) / (tiempo en minutos)
      const timeInMinutes = elapsedTime / 60;
      const wpm = timeInMinutes > 0 ? Math.round((correctChars / 5) / timeInMinutes) : 0;
      
      this.wpmTrackingData.push({
        time: elapsedTime,
        wpm: wpm,
        charactersTyped: totalChars
      });
    }, 1000);
  }

  private stopWPMTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  private calculateDetailedStatistics(): TestStatistics {
    const totalWords = this.completedWords().length;
    const correctWords = this.completedWords().filter((word, index) => 
      word === this.allWords()[index]
    ).length;
    
    const totalChars = this.totalCharactersTyped();
    const correctChars = this.correctCharactersTyped();
    const incorrectChars = totalChars - correctChars;
    
    const timeElapsed = this.timerService.getElapsedTime();
    const timeInMinutes = timeElapsed / 60;
    
    // WPM basado en caracteres (más preciso): caracteres correctos / 5 / minutos
    const wpm = timeInMinutes > 0 ? Math.round((correctChars / 5) / timeInMinutes) : 0;
    
    // Accuracy basada en caracteres (más precisa)
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
    
    return {
      wpm,
      accuracy,
      totalCharacters: totalChars,
      correctCharacters: correctChars,
      incorrectCharacters: incorrectChars,
      totalWords,
      correctWords,
      timeElapsed,
      testType: this.testType(),
      testConfig: {
        includeAccents: this.includeAccents(),
        includeNumbers: this.includeNumbers(),
        wordCount: this.isWordBasedTest() ? this.targetWordCount() : undefined,
        duration: this.isTimeBasedTest() ? this.configuredDuration() : undefined
      },
      wpmOverTime: this.wpmTrackingData.map(point => ({
        time: point.time,
        wpm: point.wpm
      }))
    };
  }

  private handleTestFinished(): void {
    this.stopWPMTracking();
    
    const statistics = this.calculateDetailedStatistics();
    this.finalStatistics.set(statistics);
    this.testFinished.set(true);
    
    // Agregar clase CSS al body para ocultar el menú
    this.document.body.classList.add('statistics-visible');
    
    console.log('Test finalizado - Estadísticas completas:', statistics);
    
    // En modo palabras, detener el timer ya que el test terminó por palabras
    if (this.isWordBasedTest()) {
      this.timerService.pauseTimer();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Prevenir comportamiento por defecto en teclas especiales
    if (event.key === ' ' || event.key === 'Backspace') {
      event.preventDefault();
    }

    const isLetterOrNumber = /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ]$/.test(event.key);
    const isSpace = event.key === ' ';
    const isBackspace = event.key === 'Backspace';
    const isEscape = event.key === 'Escape';

    // Auto-inicio del test en la primera tecla válida
    let shouldProcessKey = false;
    
    if ((isLetterOrNumber || isSpace) && !this.testStarted() && this.timerSettings().autoStart) {
      this.startTest(); // Usará duración configurada automáticamente
      shouldProcessKey = true; // Procesar la tecla que inició el test
    } else if (this.testState() === 'running') {
      shouldProcessKey = true; // Procesar teclas normalmente durante el test
    }

    // Procesar entrada si el test está activo
    if (shouldProcessKey) {
      if (isLetterOrNumber) {
        this.handleCharacterInput(event.key);
      } else if (isSpace) {
        this.handleSpaceInput();
      } else if (isBackspace) {
        this.handleBackspace();
      }
    }

    // Manejar controles especiales independientemente del estado
    if (isEscape) {
      // Siempre reiniciar el test al pulsar Esc
      this.handleEscape();
    }
  }

  private handleCharacterInput(char: string): void {
    const currentWord = this.currentWord();
    const currentInput = this.currentInput();
    
    // Solo permitir entrada si no hemos excedido la longitud de la palabra actual
    if (currentWord && currentInput.length < currentWord.length) {
      this.currentInput.set(currentInput + char);
      
      // Actualizar estadísticas de caracteres
      this.updateCharacterStats(char, currentWord[currentInput.length]);
    }
  }

  private handleSpaceInput(): void {
    const currentInput = this.currentInput();
    
    // Solo avanzar si hay algo escrito
    if (currentInput.length > 0) {
      // Agregar la palabra completada al historial
      const completed = this.completedWords();
      this.completedWords.set([...completed, currentInput]);
      
      // Avanzar a la siguiente palabra
      const nextIndex = this.currentAbsoluteIndex() + 1;
      this.currentAbsoluteIndex.set(nextIndex);
      this.currentInput.set('');
      
      // Actualizar estado de todas las palabras
      this.updateWordsState();
      
      // Asegurar que tenemos palabras suficientes por delante
      this.ensureWordsAhead();
    }
  }

  private handleBackspace(): void {
    const currentInput = this.currentInput();
    
    if (currentInput.length > 0) {
      // Eliminar el último caracter
      this.currentInput.set(currentInput.slice(0, -1));
    } else if (this.currentAbsoluteIndex() > 0) {
      // Si no hay texto en la palabra actual, volver a la anterior
      const prevIndex = this.currentAbsoluteIndex() - 1;
      this.currentAbsoluteIndex.set(prevIndex);
      
      // Restaurar el texto de la palabra anterior
      const completed = this.completedWords();
      const prevWordInput = completed[prevIndex] || '';
      this.currentInput.set(prevWordInput);
      
      // Remover la palabra del historial de completadas
      this.completedWords.set(completed.slice(0, -1));
      
      // Actualizar estado de todas las palabras
      this.updateWordsState();
    }
  }

  handleEscape(): void {
    // Reiniciar completamente el test (igual que resetTest pero manteniendo configuración)
    this.stopWPMTracking();
    this.timerService.resetTimer();
    this.testStarted.set(false);
    this.testFinished.set(false);
    this.finalStatistics.set(null);
    this.currentAbsoluteIndex.set(0);
    this.currentInput.set('');
    this.completedWords.set([]);
    this.totalCharactersTyped.set(0);
    this.correctCharactersTyped.set(0);
    
    // Quitar clase CSS del body para mostrar el menú
    this.document.body.classList.remove('statistics-visible');
    
    this.initializeWords();
  }

  // Métodos auxiliares para el template
  getWordClasses(wordState: WordState): string {
    const classes = ['minimal-word'];
    
    if (wordState.isActive) {
      classes.push('highlighted');
    }
    
    if (wordState.isCompleted) {
      classes.push(wordState.isCorrect ? 'correct' : 'incorrect');
    }
    
    return classes.join(' ');
  }

  getCharClasses(charState: { char: string; isTyped: boolean; isCorrect?: boolean; isActive: boolean }): string {
    const classes = ['minimal-char'];
    
    if (charState.isActive) {
      classes.push('active');
    }
    
    if (charState.isTyped) {
      classes.push(charState.isCorrect ? 'correct' : 'incorrect');
    }
    
    return classes.join(' ');
  }

  updateTimerSettings(newSettings: Partial<{ autoStart: boolean; showWarnings: boolean; pauseOnEscape: boolean }>): void {
    this.testConfigService.updateTimerSettings(newSettings);
  }

  startTest(duration?: number): void {
    if (!this.canStartTest()) {
      return;
    }

    this.testStarted.set(true);
    this.testFinished.set(false);
    this.finalStatistics.set(null);
    
    // Iniciar tracking de WPM
    this.startWPMTracking();
    
    if (this.isTimeBasedTest()) {
      // Modo tiempo: usar timer tradicional
      const testDuration = duration || this.configuredDuration();
      this.timerService.startTimer(testDuration);
    } else if (this.isWordBasedTest()) {
      // Modo palabras: iniciar timer sin límite (solo para tracking)
      // o un timer muy largo para permitir medición de tiempo
      this.timerService.startTimer(3600); // 1 hora como máximo teórico
    }
  }

  pauseTest(): void {
    if (this.canPauseTest()) {
      this.timerService.pauseTimer();
    }
  }

  resumeTest(): void {
    if (this.canResumeTest()) {
      this.timerService.resumeTimer();
    }
  }

  resetTest(): void {
    this.stopWPMTracking();
    this.timerService.resetTimer();
    this.testStarted.set(false);
    this.testFinished.set(false);
    this.finalStatistics.set(null);
    this.currentAbsoluteIndex.set(0);
    this.currentInput.set('');
    this.completedWords.set([]);
    this.totalCharactersTyped.set(0);
    this.correctCharactersTyped.set(0);
    
    // Quitar clase CSS del body para mostrar el menú
    this.document.body.classList.remove('statistics-visible');
    
    this.initializeWords();
  }

  // Getters para información de debug
  get dictionaryStats() {
    return this.wordGenerator.getDictionaryStats();
  }

  // Getters para información del timer
  get timerStats() {
    return {
      timeRemaining: this.timeRemaining(),
      progress: this.timerProgress(),
      state: this.testState(),
      isWarning: this.showTimeWarning()
    };
  }

  // Getter para row index (debug)
  currentRowIndex = computed(() => Math.floor(this.currentAbsoluteIndex() / this.WORDS_PER_ROW));
}
