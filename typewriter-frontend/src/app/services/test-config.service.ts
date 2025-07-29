import { Injectable, signal, computed } from '@angular/core';
import { TestConfiguration, DEFAULT_TEST_CONFIG } from '../interfaces/timer-settings';

@Injectable({
  providedIn: 'root'
})
export class TestConfigService {
  
  // Signal principal de configuración
  private readonly config = signal<TestConfiguration>({ ...DEFAULT_TEST_CONFIG });
  
  // Computed signals para acceso específico
  readonly testType = computed(() => this.config().testType);
  readonly duration = computed(() => this.config().duration);
  readonly wordCount = computed(() => this.config().wordCount);
  readonly quoteLength = computed(() => this.config().quoteLength);
  readonly includePunctuation = computed(() => this.config().includePunctuation);
  readonly includeNumbers = computed(() => this.config().includeNumbers);
  readonly includeAccents = computed(() => this.config().includeAccents);
  readonly timerSettings = computed(() => this.config().timerSettings);
  
  // Computed para obtener la duración efectiva del test
  readonly effectiveTestDuration = computed(() => {
    const config = this.config();
    switch (config.testType) {
      case 'time':
        return config.duration || 30;
      case 'words':
        // Para test de palabras, usamos una duración estimada
        return (config.wordCount || 25) * 2; // ~2 segundos por palabra estimado
      case 'quote':
        // Para quotes, duración basada en longitud
        switch (config.quoteLength) {
          case 'short': return 30;
          case 'medium': return 60;
          case 'long': return 120;
          case 'thicc': return 300;
          default: return 60;
        }
      default:
        return 30;
    }
  });
  
  // Computed para verificar si es test de tiempo limitado
  readonly isTimedTest = computed(() => this.config().testType === 'time');
  
  // Métodos para actualizar configuración
  setTestType(testType: 'time' | 'words' | 'quote' | 'zen'): void {
    this.config.update(current => ({ ...current, testType }));
  }
  
  setDuration(duration: number): void {
    this.config.update(current => ({ ...current, duration }));
  }
  
  setWordCount(wordCount: number): void {
    this.config.update(current => ({ ...current, wordCount }));
  }
  
  setQuoteLength(quoteLength: 'all' | 'short' | 'medium' | 'long' | 'thicc'): void {
    this.config.update(current => ({ ...current, quoteLength }));
  }
  
  setPunctuation(includePunctuation: boolean): void {
    this.config.update(current => ({ ...current, includePunctuation }));
  }
  
  setNumbers(includeNumbers: boolean): void {
    this.config.update(current => ({ ...current, includeNumbers }));
  }
  
  setAccents(includeAccents: boolean): void {
    this.config.update(current => ({ ...current, includeAccents }));
  }
  
  updateTimerSettings(timerSettings: Partial<typeof DEFAULT_TEST_CONFIG.timerSettings>): void {
    this.config.update(current => ({
      ...current,
      timerSettings: { ...current.timerSettings, ...timerSettings }
    }));
  }
  
  // Método para actualizar configuración basada en selección del menú
  updateFromMenuSelection(primaryType: string, categoryValue: any, secondaryItems: string[]): void {
    // Actualizar tipo principal
    if (['time', 'words', 'quote', 'zen'].includes(primaryType)) {
      this.setTestType(primaryType as any);
    }
    
    // Actualizar valor específico según el tipo
    switch (primaryType) {
      case 'time':
        if (typeof categoryValue === 'number') {
          this.setDuration(categoryValue);
        }
        break;
      case 'words':
        if (typeof categoryValue === 'number') {
          this.setWordCount(categoryValue);
        }
        break;
      case 'quote':
        if (typeof categoryValue === 'string') {
          this.setQuoteLength(categoryValue as any);
        }
        break;
    }
    
    // Actualizar opciones secundarias
    this.setPunctuation(secondaryItems.includes('punctuation'));
    this.setNumbers(secondaryItems.includes('numbers'));
    
    // Configurar tildes: se habilitan automáticamente cuando se selecciona punctuation
    this.setAccents(secondaryItems.includes('punctuation'));
  }
  
  // Método para obtener configuración completa
  getConfiguration(): TestConfiguration {
    return { ...this.config() };
  }
  
  // Método para resetear a configuración por defecto
  resetToDefault(): void {
    this.config.set({ ...DEFAULT_TEST_CONFIG });
  }
} 