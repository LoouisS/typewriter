import { Component, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface WordState {
  text: string;
  isCompleted: boolean;
  isActive: boolean;
  isCorrect?: boolean;
}

@Component({
  selector: 'app-typewriter-recorder',
  imports: [
    CommonModule
  ],
  templateUrl: './typewriter-recorder.html',
  styleUrl: './typewriter-recorder.css'
})
export class TypewriterRecorder {
  // Estado reactivo con signals
  private words = signal<string[]>([
    'decir', 'camino', 'nombre', 'tiempo', 'preguntar', 'luz', 'con', 'poner',
    'libro', 'medio', 'veces', 'hay', 'lugar', 'luz', 'veces', 'cuando',
    'alto', 'mujer', 'el', 'que', 'lado', 'día', 'conseguir', 'ayudar', 'el'
  ]);

  currentWordIndex = signal<number>(0);
  currentInput = signal<string>('');
  completedWords = signal<string[]>([]);

  // Computed signals para estado derivado
  currentWord = computed(() => this.words()[this.currentWordIndex()]);
  
  wordsState = computed(() => {
    const words = this.words();
    const currentIndex = this.currentWordIndex();
    
    return words.map((word, index) => ({
      text: word,
      isCompleted: index < currentIndex,
      isActive: index === currentIndex,
      isCorrect: index < currentIndex ? this.completedWords()[index] === word : undefined
    }));
  });

  // Estado del caracter actual en la palabra activa
  currentCharIndex = computed(() => this.currentInput().length);
  
  currentWordWithChars = computed(() => {
    const word = this.currentWord();
    const input = this.currentInput();
    
    return word.split('').map((char, index) => ({
      char,
      isTyped: index < input.length,
      isCorrect: index < input.length ? input[index] === char : undefined,
      isActive: index === input.length
    }));
  });

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

    if (isLetterOrNumber) {
      this.handleCharacterInput(event.key);
    } else if (isSpace) {
      this.handleSpaceInput();
    } else if (isBackspace) {
      this.handleBackspace();
    } else if (isEscape) {
      this.handleEscape();
    }
  }

  private handleCharacterInput(char: string): void {
    const currentWord = this.currentWord();
    const currentInput = this.currentInput();
    
    // Solo permitir entrada si no hemos excedido la longitud de la palabra actual
    if (currentInput.length < currentWord.length) {
      this.currentInput.set(currentInput + char);
    }
  }

  private handleSpaceInput(): void {
    const currentInput = this.currentInput();
    const currentWord = this.currentWord();
    
    // Solo avanzar si hay algo escrito
    if (currentInput.length > 0) {
      // Agregar la palabra completada al historial
      const completed = this.completedWords();
      this.completedWords.set([...completed, currentInput]);
      
      // Avanzar a la siguiente palabra si no es la última
      const nextIndex = this.currentWordIndex() + 1;
      if (nextIndex < this.words().length) {
        this.currentWordIndex.set(nextIndex);
        this.currentInput.set('');
      }
    }
  }

  private handleBackspace(): void {
    const currentInput = this.currentInput();
    
    if (currentInput.length > 0) {
      // Eliminar el último caracter
      this.currentInput.set(currentInput.slice(0, -1));
    } else if (this.currentWordIndex() > 0) {
      // Si no hay texto en la palabra actual, volver a la anterior
      const prevIndex = this.currentWordIndex() - 1;
      this.currentWordIndex.set(prevIndex);
      
      // Restaurar el texto de la palabra anterior
      const completed = this.completedWords();
      const prevWordInput = completed[prevIndex] || '';
      this.currentInput.set(prevWordInput);
      
      // Remover la palabra del historial de completadas
      this.completedWords.set(completed.slice(0, -1));
    }
  }

  handleEscape(): void {
    // Reiniciar el test
    this.currentWordIndex.set(0);
    this.currentInput.set('');
    this.completedWords.set([]);
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
}
