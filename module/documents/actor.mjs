export class VitruviumActor extends Actor {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    
    const actorData = this;
    const systemData = actorData.system;
    
    // Если это не персонаж и не NPC — выходим
    if ( !['character', 'npc'].includes(actorData.type) ) return;
    
    // Получаем значения характеристик
    const body = Number(systemData.attributes?.body?.value) || 1;
    const movement = Number(systemData.attributes?.movement?.value) || 1;
    
    // Вычисляем производные атрибуты
    // Здоровье = Телосложение × 6
    if ( systemData.health ) {
      systemData.health.max = body * 6;
      if ( systemData.health.value > systemData.health.max ) {
        systemData.health.value = systemData.health.max;
      }
    }
    
    // Скорость = Движение × 2
    if ( systemData.speed ) {
      systemData.speed.value = movement * 2;
    }
    
    // Грузоподъёмность = Телосложение × 20
    if ( systemData.carryCapacity ) {
      systemData.carryCapacity.value = body * 20;
    }
    
    // Максимум вдохновения = 6 минус стресс
    if ( systemData.inspiration && systemData.stress ) {
      const stress = Number(systemData.stress.value) || 0;
      systemData.inspiration.max = Math.max(0, 6 - stress);
      if ( systemData.inspiration.value > systemData.inspiration.max ) {
        systemData.inspiration.value = systemData.inspiration.max;
      }
    }
    
    // Проверка перегруза
    if ( systemData.encumbrance ) {
      const carry = Number(systemData.encumbrance.value) || 0;
      const capacity = systemData.carryCapacity?.value || body * 20;
      
      // За каждые 10 кг сверх нормы скорость -1 и помеха на движение
      const excess = Math.max(0, carry - capacity);
      const penaltySteps = Math.floor(excess / 10);
      
      systemData.encumbrance.steps = penaltySteps;
      
      // Применяем штраф к скорости
      if ( penaltySteps > 0 && systemData.speed ) {
        systemData.speed.value = Math.max(0, (movement * 2) - penaltySteps);
      }
    }
  }
  
  /** 
   * Совершить проверку характеристики
   * @param {string} attribute - название характеристики (body, perception, etc.)
   * @param {object} options - опции (сложность, преимущество, помеха)
   */
  async rollAttribute(attribute, options = {}) {
    const attr = this.system.attributes?.[attribute];
    if ( !attr ) {
      ui.notifications.warn(`Характеристика ${attribute} не найдена`);
      return;
    }
    
    const diceCount = attr.value || 1;
    const difficulty = options.difficulty || 1;
    const advantage = options.advantage || 0;
    const disadvantage = options.disadvantage || 0;
    
    // Определяем количество дополнительных бросков (преимущество/помеха)
    let extraRolls = 0;
    let takeBest = true;
    
    if ( advantage > disadvantage ) {
      extraRolls = advantage - disadvantage;
      takeBest = true;
    } else if ( disadvantage > advantage ) {
      extraRolls = disadvantage - advantage;
      takeBest = false;
    }
    
    // Формируем формулу броска
    let formula = `${diceCount}d6x`;
    if ( extraRolls > 0 ) {
      formula = `${extraRolls + 1}#${formula}`;
    }
    
    // Совершаем бросок
    const roll = await new Roll(formula).evaluate({ async: true });
    
    // Считаем успехи
    let successes = 0;
    let bestRoll = null;
    let worstRoll = null;
    
    if ( extraRolls > 0 ) {
      const rolls = roll.terms[0].rolls;
      for ( const r of rolls ) {
        const total = r.results.reduce((sum, res) => sum + (res.success || 0), 0);
        if ( !bestRoll || total > bestRoll.total ) bestRoll = { roll: r, total };
        if ( !worstRoll || total < worstRoll.total ) worstRoll = { roll: r, total };
      }
      
      const selected = takeBest ? bestRoll : worstRoll;
      successes = selected.total;
    } else {
      successes = roll.dice[0].results.reduce((sum, res) => sum + (res.success || 0), 0);
    }
    
    // Определяем результат
    const success = successes >= difficulty;
    const partial = !success && successes === difficulty - 1;
    
    // Создаём сообщение в чат
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: options.flavor || `Проверка ${attr.label || attribute}`,
      content: await renderTemplate('systems/vitruvium/templates/chat/roll.hbs', {
        successes,
        difficulty,
        success,
        partial,
        advantage: extraRolls > 0 && takeBest,
        disadvantage: extraRolls > 0 && !takeBest,
        diceCount,
        attribute: attr.label || attribute,
        roll
      })
    };
    
    await ChatMessage.create(messageData);
    
    return { successes, difficulty, success, partial, roll };
  }
}
