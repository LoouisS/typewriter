import { Injectable, signal } from '@angular/core';

export interface WordGeneratorOptions {
  count: number;
  language: 'spanish' | 'english';
  difficulty: 'easy' | 'medium' | 'hard';
  includeNumbers?: boolean;
  includePunctuation?: boolean;
  includeAccents?: boolean;
}

export interface WordDictionary {
  [key: string]: {
    easy: string[];
    medium: string[];
    hard: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class WordGeneratorService {
  // Diccionario principal (siempre incluye acentos originales)
  private readonly dictionaries: WordDictionary = {
    spanish: {
      easy: [
        'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para',
        'al', 'una', 'su', 'del', 'las', 'un', 'por', 'con', 'no', 'una', 'su', 'para', 'es', 'al', 'lo', 'como', 'más', 'o', 'pero', 'sus',
        'casa', 'día', 'agua', 'sol', 'luz', 'mar', 'año', 'mes', 'vez', 'vida', 'mano', 'pie', 'ojo', 'cara', 'pelo', 'boca', 'nariz',
        'amor', 'paz', 'bien', 'mal', 'alto', 'bajo', 'gran', 'poco', 'todo', 'nada', 'aquí', 'allí', 'hoy', 'ayer', 'mañana', 'ahora',
        'sí', 'no', 'muy', 'más', 'menos', 'tanto', 'como', 'donde', 'cuando', 'porque', 'pero', 'aunque', 'hasta', 'desde', 'entre',
        'ir', 'ver', 'dar', 'ser', 'estar', 'tener', 'hacer', 'decir', 'poder', 'deber', 'querer', 'saber', 'venir', 'llegar', 'pasar',
        // Palabras adicionales con tildes
        'está', 'será', 'están', 'después', 'así', 'también', 'además', 'mamá', 'papá', 'café', 'música', 'médico', 'rápido', 'fácil'
      ],
      medium: [
        'tiempo', 'persona', 'momento', 'lugar', 'trabajo', 'problema', 'sistema', 'programa', 'pregunta', 'gobierno', 'número', 'país', 'caso', 'grupo', 'parte',
        'manera', 'forma', 'medio', 'camino', 'razón', 'derecho', 'punto', 'ejemplo', 'servicio', 'historia', 'desarrollo', 'proceso', 'estado', 'nivel', 'orden',
        'empresa', 'política', 'control', 'proyecto', 'resultado', 'mercado', 'precio', 'producto', 'modelo', 'centro', 'curso', 'clase', 'relación', 'función',
        'situación', 'condición', 'posición', 'dirección', 'información', 'comunicación', 'educación', 'investigación', 'construcción', 'producción', 'administración',
        'conocimiento', 'experiencia', 'diferencia', 'importancia', 'necesidad', 'posibilidad', 'oportunidad', 'responsabilidad', 'actividad', 'realidad', 'capacidad',
        'conseguir', 'mantener', 'realizar', 'presentar', 'considerar', 'desarrollar', 'establecer', 'determinar', 'reconocer', 'recordar', 'decidir', 'cambiar',
        'estudiar', 'aprender', 'enseñar', 'explicar', 'entender', 'comprender', 'utilizar', 'aplicar', 'crear', 'producir', 'construir', 'formar', 'organizar',
        // Palabras adicionales con tildes
        'tecnología', 'descripción', 'organización', 'participación', 'comunicación', 'administración', 'transformación', 'operación', 'educación', 'información'
      ],
      hard: [
        'extraordinario', 'responsabilidad', 'características', 'representación', 'especialización', 'internacionalización', 'profesionalización', 'institucionalización',
        'desafortunadamente', 'independientemente', 'consecuentemente', 'simultáneamente', 'aproximadamente', 'específicamente', 'particularmente', 'generalmente',
        'tradicionalmente', 'excepcionalmente', 'proporcionalmente', 'fundamentalmente', 'principalmente', 'especialmente', 'personalmente', 'prácticamente',
        'transformación', 'implementación', 'democratización', 'modernización', 'globalización', 'privatización', 'nacionalización', 'descentralización',
        'constitucionalidad', 'inconstitucionalidad', 'incomprensibilidad', 'irresponsabilidad', 'desproporcionalmente', 'anticonstitucional', 'multidisciplinario',
        'interdisciplinario', 'psicológicamente', 'sociológicamente', 'tecnológicamente', 'metodológicamente', 'epistemológicamente', 'fenomenológicamente',
        'caracterización', 'sistematización', 'conceptualización', 'contextualización', 'problematización', 'instrumentalización', 'operacionalización',
        // Palabras adicionales con tildes y caracteres especiales
        'investigación', 'publicación', 'clasificación', 'verificación', 'identificación', 'modificación', 'planificación', 'organización', 'configuración'
      ]
    },
    english: {
      easy: [
        'the', 'of', 'and', 'a', 'to', 'in', 'is', 'you', 'that', 'it', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'I',
        'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said',
        'cat', 'dog', 'sun', 'run', 'big', 'red', 'car', 'day', 'man', 'way', 'may', 'say', 'she', 'use', 'her', 'now', 'oil', 'sit', 'set', 'hot',
        'get', 'has', 'him', 'old', 'see', 'two', 'how', 'its', 'who', 'did', 'yes', 'his', 'her', 'she', 'him', 'his', 'how', 'man', 'new', 'now',
        'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
      ],
      medium: [
        'people', 'time', 'work', 'life', 'world', 'school', 'house', 'right', 'great', 'small', 'different', 'following', 'large', 'public', 'important',
        'system', 'program', 'question', 'government', 'number', 'country', 'problem', 'group', 'place', 'hand', 'part', 'week', 'case', 'point', 'company',
        'right', 'water', 'room', 'mother', 'area', 'money', 'story', 'fact', 'month', 'different', 'lot', 'study', 'book', 'eye', 'job', 'word', 'business',
        'issue', 'side', 'kind', 'head', 'house', 'service', 'friend', 'father', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car', 'city',
        'community', 'name', 'president', 'university', 'policy', 'available', 'student', 'activity', 'economic', 'society', 'election', 'similar', 'various'
      ],
      hard: [
        'extraordinary', 'responsibility', 'characteristics', 'representation', 'specialization', 'internationalization', 'professionalization', 'institutionalization',
        'unfortunately', 'independently', 'consequently', 'simultaneously', 'approximately', 'specifically', 'particularly', 'generally', 'traditionally',
        'exceptionally', 'proportionally', 'fundamentally', 'primarily', 'especially', 'personally', 'practically', 'transformation', 'implementation',
        'democratization', 'modernization', 'globalization', 'privatization', 'nationalization', 'decentralization', 'constitutionality', 'unconstitutionality',
        'incomprehensibility', 'irresponsibility', 'disproportionately', 'unconstitutional', 'multidisciplinary', 'interdisciplinary', 'psychologically',
        'sociologically', 'technologically', 'methodologically', 'epistemologically', 'phenomenologically', 'characterization', 'systematization'
      ]
    }
  };



  // Estado del servicio
  private currentLanguage = signal<'spanish' | 'english'>('spanish');
  private currentDifficulty = signal<'easy' | 'medium' | 'hard'>('easy');

  constructor() {}

  /**
   * Elimina acentos y tildes de una palabra
   */
  private removeAccents(word: string): string {
    const accentMap: { [key: string]: string } = {
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u',
      'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ü': 'U',
      'ñ': 'n', 'Ñ': 'N'
    };
    
    return word.replace(/[áéíóúüÁÉÍÓÚÜñÑ]/g, (match) => accentMap[match] || match);
  }

  /**
   * Procesa una palabra según la configuración de acentos
   */
  private processWordForAccents(word: string, includeAccents: boolean): string {
    return includeAccents ? word : this.removeAccents(word);
  }

  /**
   * Genera un número aleatorio del 1 al 100
   */
  private generateRandomNumber(): string {
    return (Math.floor(Math.random() * 100) + 1).toString();
  }

  /**
   * Lista de combinaciones de palabras con números para usar cuando includeNumbers está habilitado
   */
  private readonly numberedWordVariants: string[] = [
    // Números standalone
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '25', '30', '50', '100', '123', '456', '789',
    // Combinaciones comunes
    'web2', 'html5', 'css3', 'js2024', 'año2024', 'día1', 'paso2',
    'nivel1', 'nivel2', 'nivel3', 'fase1', 'fase2', 'etapa3',
    'punto1', 'punto2', 'item1', 'item2', 'test1', 'demo2',
    '1vez', '2veces', '3veces', '1día', '2días', '3años',
    'user1', 'user2', 'file1', 'file2', 'doc1', 'page1'
  ];

  /**
   * Procesa palabras para incluir números cuando esté habilitado
   */
  private processWordForNumbers(words: string[], includeNumbers: boolean, percentage: number = 0.15): string[] {
    if (!includeNumbers) {
      return words;
    }

    const result: string[] = [];
    const targetNumberedWords = Math.floor(words.length * percentage);
    const numberedIndices = new Set<number>();

    // Seleccionar índices aleatorios para reemplazar con números
    while (numberedIndices.size < targetNumberedWords && numberedIndices.size < words.length) {
      const randomIndex = Math.floor(Math.random() * words.length);
      numberedIndices.add(randomIndex);
    }

    for (let i = 0; i < words.length; i++) {
      if (numberedIndices.has(i)) {
        // Reemplazar con un número aleatorio del 1 al 100
        result.push(this.generateRandomNumber());
      } else {
        result.push(words[i]);
      }
    }

    return result;
  }

  /**
   * Genera un array de palabras aleatorias según las opciones especificadas
   */
  generateWords(options: Partial<WordGeneratorOptions> = {}): string[] {
    const config: WordGeneratorOptions = {
      count: 25,
      language: 'spanish',
      difficulty: 'easy',
      includeNumbers: false,
      includePunctuation: false,
      includeAccents: false,
      ...options
    };

    const dictionary = this.dictionaries[config.language][config.difficulty];
    const words: string[] = [];

    for (let i = 0; i < config.count; i++) {
      let word = this.getRandomWord(dictionary);
      
      // Procesar acentos según configuración
      word = this.processWordForAccents(word, config.includeAccents || false);
      
      // Agregar puntuación ocasionalmente si está habilitado
      if (config.includePunctuation && Math.random() < 0.15) {
        word = this.addPunctuation(word);
      }
      
      words.push(word);
    }

    // Procesar números de manera controlada al final
    const finalWords = this.processWordForNumbers(words, config.includeNumbers || false);

    return finalWords;
  }

  /**
   * Genera palabras mezclando diferentes niveles de dificultad
   */
  generateMixedWords(count: number = 25, language: 'spanish' | 'english' = 'spanish', includeAccents: boolean = false, includeNumbers: boolean = false): string[] {
    const words: string[] = [];
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const weights = [0.6, 0.3, 0.1]; // 60% fácil, 30% medio, 10% difícil
    
    for (let i = 0; i < count; i++) {
      const difficulty = this.getWeightedRandomDifficulty(difficulties, weights);
      const dictionary = this.dictionaries[language][difficulty];
      let word = this.getRandomWord(dictionary);
      
      // Procesar acentos según configuración
      word = this.processWordForAccents(word, includeAccents);
      words.push(word);
    }
    
    // Procesar números de manera controlada al final
    const finalWords = this.processWordForNumbers(words, includeNumbers);
    
    return finalWords;
  }

  /**
   * Genera palabras comunes más frecuentes (para principiantes)
   */
  generateCommonWords(count: number = 25, includeAccents: boolean = false, includeNumbers: boolean = false): string[] {
    const commonSpanish = [
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para',
      'casa', 'día', 'agua', 'sol', 'luz', 'mar', 'año', 'mes', 'vez', 'vida', 'mano', 'pie', 'ojo', 'cara', 'amor', 'paz',
      'ir', 'ver', 'dar', 'ser', 'estar', 'tener', 'hacer', 'decir', 'poder', 'deber', 'querer', 'saber', 'venir', 'llegar'
    ];
    
    const words: string[] = [];
    for (let i = 0; i < count; i++) {
      let word = this.getRandomWord(commonSpanish);
      // Procesar acentos según configuración
      word = this.processWordForAccents(word, includeAccents);
      words.push(word);
    }
    
    // Procesar números de manera controlada al final
    const finalWords = this.processWordForNumbers(words, includeNumbers);
    
    return finalWords;
  }

  /**
   * Genera palabras adicionales para el sistema de scroll infinito
   * Utilizado cuando se necesitan más palabras durante el test
   */
  generateAdditionalWords(count: number = 60, language: 'spanish' | 'english' = 'spanish', includeAccents: boolean = false, includeNumbers: boolean = false): string[] {
    return this.generateMixedWords(count, language, includeAccents, includeNumbers);
  }

  /**
   * Obtiene estadísticas del diccionario
   */
  getDictionaryStats(language: 'spanish' | 'english' = 'spanish', includeAccents: boolean = false): {
    easy: number;
    medium: number;
    hard: number;
    total: number;
  } {
    const dict = this.dictionaries[language];
    return {
      easy: dict.easy.length,
      medium: dict.medium.length,
      hard: dict.hard.length,
      total: dict.easy.length + dict.medium.length + dict.hard.length
    };
  }

  /**
   * Configura el idioma por defecto
   */
  setLanguage(language: 'spanish' | 'english'): void {
    this.currentLanguage.set(language);
  }

  /**
   * Configura la dificultad por defecto
   */
  setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.currentDifficulty.set(difficulty);
  }

  /**
   * Obtiene el idioma actual
   */
  getCurrentLanguage(): 'spanish' | 'english' {
    return this.currentLanguage();
  }

  /**
   * Obtiene la dificultad actual
   */
  getCurrentDifficulty(): 'easy' | 'medium' | 'hard' {
    return this.currentDifficulty();
  }

  // Métodos privados auxiliares
  private getRandomWord(dictionary: string[]): string {
    const randomIndex = Math.floor(Math.random() * dictionary.length);
    return dictionary[randomIndex];
  }

  private getWeightedRandomDifficulty(
    difficulties: ('easy' | 'medium' | 'hard')[],
    weights: number[]
  ): 'easy' | 'medium' | 'hard' {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (random < cumulativeWeight) {
        return difficulties[i];
      }
    }
    
    return difficulties[0]; // fallback
  }



  private addPunctuation(word: string): string {
    const punctuation = ['.', ',', '!', '?', ';', ':'];
    const randomPunct = punctuation[Math.floor(Math.random() * punctuation.length)];
    return word + randomPunct;
  }
} 