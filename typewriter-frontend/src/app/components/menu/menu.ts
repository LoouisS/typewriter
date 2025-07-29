import { Component, signal, computed, effect, inject } from '@angular/core';
import { MenuItem, CategoryOption } from '../../interfaces/menu-item';
import { TestConfigService } from '../../services/test-config.service';

@Component({
  selector: 'app-menu',
  imports: [],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class Menu {
  private readonly testConfigService = inject(TestConfigService);
  private readonly availableDurations = [15, 30, 60, 120];
  
  // Signal para el item principal seleccionado (obligatorio)
  private readonly selectedPrimaryItemId = signal<string>('time');
  
  // Signal para los items secundarios seleccionados (opcionales)
  private readonly selectedSecondaryItemIds = signal<string[]>([]);
  
  // Signal para la opción específica seleccionada
  private readonly selectedCategoryOptionId = signal<string>('time-30');
  
  // Signal para controlar las animaciones
  private readonly isAnimating = signal<boolean>(false);
  
  // Items del menú organizados por categoría
  readonly secondaryMenuItems = signal<MenuItem[]>([
    { id: 'punctuation', name: 'punctuation', icon: '@', type: 'punctuation', category: 'secondary' },
    { id: 'numbers', name: 'numbers', icon: '#', type: 'numbers', category: 'secondary' }
  ]);
  
  readonly primaryMenuItems = signal<MenuItem[]>([
    { id: 'time', name: 'time', icon: '⏲', type: 'time', category: 'primary' },
    { id: 'words', name: 'words', icon: 'T', type: 'words', category: 'primary' }
    // { id: 'quote', name: 'quote', icon: '🐒', type: 'quote', category: 'primary' },
    // { id: 'zen', name: 'zen', icon: '⚙', type: 'custom', category: 'primary' }
  ]);
  
  // Opciones específicas para cada categoría
  readonly timeOptions = signal<CategoryOption[]>([
    { id: 'time-15', value: 15, label: '15', category: 'time' },
    { id: 'time-30', value: 30, label: '30', category: 'time' },
    { id: 'time-60', value: 60, label: '60', category: 'time' },
    { id: 'time-120', value: 120, label: '120', category: 'time' }
  ]);
  
  readonly wordsOptions = signal<CategoryOption[]>([
    { id: 'words-10', value: 10, label: '10', category: 'words' },
    { id: 'words-25', value: 25, label: '25', category: 'words' },
    { id: 'words-50', value: 50, label: '50', category: 'words' },
    { id: 'words-100', value: 100, label: '100', category: 'words' }
  ]);
  
  readonly quoteOptions = signal<CategoryOption[]>([
    { id: 'quote-all', value: 'all', label: 'all', category: 'quote' },
    { id: 'quote-short', value: 'short', label: 'short', category: 'quote' },
    { id: 'quote-medium', value: 'medium', label: 'medium', category: 'quote' },
    { id: 'quote-long', value: 'long', label: 'long', category: 'quote' },
    { id: 'quote-thicc', value: 'thicc', label: 'thicc', category: 'quote' }
  ]);
  
  // Computed para obtener las opciones actuales según la categoría seleccionada
  readonly currentCategoryOptions = computed(() => {
    const selectedPrimary = this.selectedPrimaryItemId();
    switch (selectedPrimary) {
      case 'time':
        return this.timeOptions();
      case 'words':
        return this.wordsOptions();
      case 'quote':
        return this.quoteOptions();
      default:
        return [];
    }
  });
  
  // Computed para verificar si debe mostrar opciones específicas
  readonly shouldShowCategoryOptions = computed(() => {
    const selectedPrimary = this.selectedPrimaryItemId();
    return ['time', 'words', 'quote'].includes(selectedPrimary);
  });
  
  // Computed para obtener el item principal seleccionado
  readonly selectedPrimaryMenuItem = computed(() => {
    const selectedId = this.selectedPrimaryItemId();
    return this.primaryMenuItems().find(item => item.id === selectedId);
  });
  
  // Computed para obtener los items secundarios seleccionados
  readonly selectedSecondaryMenuItems = computed(() => {
    const selectedIds = this.selectedSecondaryItemIds();
    return this.secondaryMenuItems().filter(item => selectedIds.includes(item.id));
  });
  
  // Computed para obtener la opción de categoría seleccionada
  readonly selectedCategoryOption = computed(() => {
    const selectedId = this.selectedCategoryOptionId();
    return this.currentCategoryOptions().find(option => option.id === selectedId);
  });
  
  constructor() {
    // Effect para manejar las animaciones al cambiar de categoría
    effect(() => {
      const shouldShow = this.shouldShowCategoryOptions();
      if (shouldShow) {
        this.isAnimating.set(true);
        setTimeout(() => this.isAnimating.set(false), 500);
      }
    });
    
    // Effect para sincronizar cambios con TestConfigService
    effect(() => {
      this.updateTestConfiguration();
    });
  }
  
  // Método privado para actualizar la configuración del test
  private updateTestConfiguration(): void {
    const primaryType = this.selectedPrimaryItemId();
    const selectedOption = this.selectedCategoryOption();
    const secondaryItems = this.selectedSecondaryItemIds();
    
    this.testConfigService.updateFromMenuSelection(
      primaryType,
      selectedOption?.value,
      secondaryItems
    );
  }
  
  // Método para seleccionar un item principal (solo uno a la vez)
  selectPrimaryMenuItem(itemId: string): void {
    // Activar animación de salida si cambia la categoría
    if (this.selectedPrimaryItemId() !== itemId) {
      this.isAnimating.set(true);
    }
    
    this.selectedPrimaryItemId.set(itemId);
    // Resetear la opción específica al cambiar de categoría
    this.resetCategoryOption(itemId);
  }
  
  // Método para resetear la opción específica según la nueva categoría
  private resetCategoryOption(categoryId: string): void {
    switch (categoryId) {
      case 'time':
        this.selectedCategoryOptionId.set('time-30');
        break;
      case 'words':
        this.selectedCategoryOptionId.set('words-25');
        break;
      case 'quote':
        this.selectedCategoryOptionId.set('quote-all');
        break;
      default:
        this.selectedCategoryOptionId.set('');
    }
  }
  
  // Método para seleccionar una opción específica de categoría
  selectCategoryOption(optionId: string): void {
    this.selectedCategoryOptionId.set(optionId);
  }
  
  // Método para toggle de items secundarios (múltiple selección)
  toggleSecondaryMenuItem(itemId: string): void {
    const currentSelected = this.selectedSecondaryItemIds();
    if (currentSelected.includes(itemId)) {
      // Remover si ya está seleccionado
      this.selectedSecondaryItemIds.set(currentSelected.filter(id => id !== itemId));
    } else {
      // Agregar si no está seleccionado
      this.selectedSecondaryItemIds.set([...currentSelected, itemId]);
    }
  }
  
  // Método para verificar si un item principal está activo
  isPrimaryActive(itemId: string): boolean {
    return this.selectedPrimaryItemId() === itemId;
  }
  
  // Método para verificar si un item secundario está activo
  isSecondaryActive(itemId: string): boolean {
    return this.selectedSecondaryItemIds().includes(itemId);
  }
  
  // Método para verificar si una opción de categoría está activa
  isCategoryOptionActive(optionId: string): boolean {
    return this.selectedCategoryOptionId() === optionId;
  }
}
