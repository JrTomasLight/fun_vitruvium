// Импорт классов
import { VitruviumActor } from './documents/actor.mjs';
import { VitruviumItem } from './documents/item.mjs';
import { VitruviumActorSheet } from './sheets/actor-sheet.mjs';
import { VitruviumItemSheet } from './sheets/item-sheet.mjs';

// Остальной код, который ты уже вставил...

// Хук инициализации
Hooks.once('init', async function() {
  console.log('Vitruvium System | Initializing');

  // Регистрируем классы документов
  CONFIG.Actor.documentClass = VitruviumActor;
  CONFIG.Item.documentClass = VitruviumItem;

  // Регистрируем листы (отключаем стандартные и включаем наши)
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('vitruvium', VitruviumActorSheet, { 
    makeDefault: true,
    label: 'Витрувий (Персонаж)'
  });
  
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('vitruvium', VitruviumItemSheet, { 
    makeDefault: true,
    label: 'Витрувий (Предмет)'
  });

  // Определяем класс для специальных кубиков
  CONFIG.Dice.rolls.push(VitruviumDice);
});

// Класс для кубиков Витрувия
class VitruviumDice extends DiceTerm {
  constructor(termData) {
    super(termData);
    this.faces = 6;
  }

  roll({minimize=false, maximize=false}={}) {
    const roll = super.roll({minimize, maximize});
    
    // На гранях: 1-3 = 0 успехов, 4-5 = 1 успех, 6 = 2 успеха
    if (roll.result <= 3) {
      roll.success = 0;
    } else if (roll.result <= 5) {
      roll.success = 1;
    } else {
      roll.success = 2;
    }
    
    roll.count = roll.success;
    return roll;
  }

  getTooltipData() {
    const data = super.getTooltipData();
    for ( let [i, term] of data.terms.entries() ) {
      const roll = this.results[i];
      if ( !roll ) continue;
      
      if ( roll.success === 1 ) term.classes.push("success");
      else if ( roll.success === 2 ) term.classes.push("critical-success");
    }
    return data;
  }
}

// Делаем класс доступным глобально
globalThis.VitruviumDice = VitruviumDice;
