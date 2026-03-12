export class VitruviumItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['vitruvium', 'sheet', 'item'],
      width: 520,
      height: 480,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description' }]
    });
  }

  /** @override */
  get template() {
    return `systems/vitruvium/templates/item-${this.item.type}.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    const itemData = context.item;
    
    context.system = itemData.system;
    context.config = CONFIG.vitruvium;
    
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Здесь можно добавить обработчики для специфичных элементов
    if ( this.isEditable ) {
      // Например, кнопки для типов способностей
    }
  }
}
