export class VitruviumItem extends Item {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    
    const itemData = this;
    const systemData = itemData.system;
    
    // Валидация в зависимости от типа
    switch ( itemData.type ) {
      case 'ability':
        this._prepareAbilityData(systemData);
        break;
      case 'weapon':
        this._prepareWeaponData(systemData);
        break;
      case 'armor':
        this._prepareArmorData(systemData);
        break;
    }
  }
  
  /** Подготовка данных способности */
  _prepareAbilityData(data) {
    // Убеждаемся что уровень в пределах 1-6
    if ( data.level ) {
      data.level.value = Math.clamped(data.level.value || 1, 1, 6);
    }
  }
  
  /** Подготовка данных оружия */
  _prepareWeaponData(data) {
    // Урон не может быть отрицательным
    if ( data.damage ) {
      data.damage.value = Math.max(0, data.damage.value || 0);
    }
  }
  
  /** Подготовка данных брони */
  _prepareArmorData(data) {
    // Прочность не может быть больше максимальной
    if ( data.durability && data.durabilityMax ) {
      data.durability.value = Math.min(
        data.durability.value || 0,
        data.durabilityMax.value || 0
      );
    }
  }
  
  /** 
   * Использовать способность (для активных способностей)
   */
  async use() {
    if ( this.type !== 'ability' ) return;
    
    const systemData = this.system;
    
    // Проверяем, активная ли способность
    if ( systemData.activation?.value !== 'активная' ) {
      ui.notifications.warn('Эта способность пассивная');
      return;
    }
    
    // Проверяем стоимость
    const cost = systemData.cost?.value || 0;
    if ( cost > 0 ) {
      const actor = this.parent;
      if ( !actor ) {
        ui.notifications.warn('Способность не принадлежит персонажу');
        return;
      }
      
      const inspiration = actor.system.inspiration?.value || 0;
      if ( inspiration < cost ) {
        ui.notifications.warn(`Недостаточно вдохновения. Нужно: ${cost}`);
        return;
      }
      
      // Списываем вдохновение
      await actor.update({ 'system.inspiration.value': inspiration - cost });
    }
    
    // Создаём сообщение в чат
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.parent }),
      content: await renderTemplate('systems/vitruvium/templates/chat/ability.hbs', {
        name: this.name,
        level: systemData.level?.value,
        type: systemData.abilityType?.value,
        effect: systemData.effect?.value
      })
    });
  }
}
