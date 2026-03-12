export class VitruviumActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['vitruvium', 'sheet', 'actor'],
      width: 720,
      height: 680,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'abilities' }]
    });
  }

  /** @override */
  get template() {
    return `systems/vitruvium/templates/actor-${this.actor.type}.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    const actorData = context.actor;
    
    // Добавляем удобные ссылки
    context.system = actorData.system;
    context.config = CONFIG.vitruvium;
    
    // Фильтруем предметы по типам
    context.abilities = actorData.items.filter(item => item.type === 'ability');
    context.weapons = actorData.items.filter(item => item.type === 'weapon');
    context.armors = actorData.items.filter(item => item.type === 'armor');
    context.inventory = actorData.items.filter(item => ['weapon', 'armor', 'feature'].includes(item.type));
    
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Кнопки броска характеристик
    html.find('.roll-attribute').click(this._onRollAttribute.bind(this));
    
    // Управление предметами
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
    html.find('.item-use').click(this._onItemUse.bind(this));
    
    // Drag & drop для предметов
    if ( this.isEditable ) {
      new DragDrop({
        dragSelector: '.item',
        dropSelector: null,
        permissions: { dragstart: () => true },
        callbacks: { dragstart: this._onDragStart.bind(this) }
      }).bind(html[0]);
    }
  }

  /** Бросок характеристики */
  _onRollAttribute(event) {
    event.preventDefault();
    const attribute = event.currentTarget.dataset.attr;
    
    // Здесь можно добавить диалог с выбором сложности
    const difficulty = 1; // По умолчанию
    
    this.actor.rollAttribute(attribute, { difficulty });
  }

  /** Редактирование предмета */
  _onItemEdit(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.item').dataset.itemId;
    const item = this.actor.items.get(itemId);
    item.sheet.render(true);
  }

  /** Удаление предмета */
  _onItemDelete(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.item').dataset.itemId;
    this.actor.items.get(itemId).delete();
  }

  /** Использование предмета/способности */
  _onItemUse(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.item').dataset.itemId;
    const item = this.actor.items.get(itemId);
    
    if ( item.type === 'ability' ) {
      item.use();
    }
  }
}
