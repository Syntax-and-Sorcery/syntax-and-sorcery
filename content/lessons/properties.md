### The problem
A hero has a name, a level, and some gold. Three loose variables per hero get messy once you have five heroes.

### The idea
An object groups related values under names, called properties: `{ name: "Ana", level: 3 }`. Read a property with a dot, `hero.name`, and change or add one the same way.

### Like in real life
A character sheet is one card with labeled boxes for name, level, and gold.

### In code
```js
const hero = { name: "Ana", level: 3, gold: 50 };

console.log(hero.name);

hero.gold = hero.gold + 20;
hero.weapon = "sword";

console.log(hero.gold);
console.log(hero.weapon);
```

### Step by step
| Step | `hero` after | Printed |
|---|---|---|
| Make `hero` | name Ana, level 3, gold 50 | |
| `console.log(hero.name)` | same | Ana |
| `hero.gold = hero.gold + 20` | gold is now 70 | |
| `hero.weapon = "sword"` | new property weapon: sword | |
| `console.log(hero.gold)` | same | 70 |
| `console.log(hero.weapon)` | same | sword |

### Watch out
A missing property isn't an error; it gives `undefined`. A typo like `hero.glod` quietly returns `undefined`, so check your spelling first when a value goes missing.

### Not just heroes
Anything with named parts is usually an object: settings, a player's profile, or one row of a table.
