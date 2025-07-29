export interface TimerSettings {
  autoStart: boolean;
  showWarnings: boolean;
  pauseOnEscape: boolean;
}

export interface TestConfiguration {
  // Configuración principal del test
  testType: 'time' | 'words' | 'quote' | 'zen';
  
  // Configuraciones específicas por tipo
  duration?: number; // Para test de tiempo (en segundos)
  wordCount?: number; // Para test de palabras
  quoteLength?: 'all' | 'short' | 'medium' | 'long' | 'thicc';
  
  // Configuraciones adicionales
  includePunctuation: boolean;
  includeNumbers: boolean;
  includeAccents: boolean; // Para habilitar/deshabilitar tildes y acentos
  
  // Configuraciones del timer
  timerSettings: TimerSettings;
}

export const DEFAULT_TEST_CONFIG: TestConfiguration = {
  testType: 'time',
  duration: 30,
  wordCount: 25,
  quoteLength: 'all',
  includePunctuation: false,
  includeNumbers: false,
  includeAccents: false, // Por defecto las tildes están deshabilitadas
  timerSettings: {
    autoStart: true,
    showWarnings: true,
    pauseOnEscape: true
  }
};