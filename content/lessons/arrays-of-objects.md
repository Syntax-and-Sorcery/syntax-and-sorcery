### The problem
Your party has three heroes, each with a name and some health. You want to know who needs healing and how much health the party has in total.

### The idea
Put the objects in an array, one object per hero. Loop over the array, and use a dot on each item to read its properties.

### Like in real life
Picture a deck of character cards. The deck is the array, and each card is an object.

### In code
```js
const party = [
  { name: "Ana", health: 40 },
  { name: "Bo", health: 15 },
  { name: "Cy", health: 30 },
];

let total = 0;
for (const hero of party) {
  total = total + hero.health;
  if (hero.health < 20) {
    console.log(hero.name + " needs healing");
  }
}

console.log("Party health: " + total);
console.log(party[1].name);
```

### Step by step
| Round | `hero.name` | `hero.health` | `total` after | Printed |
|---|---|---|---|---|
| 1 | Ana | 40 | 40 | |
| 2 | Bo | 15 | 55 | Bo needs healing |
| 3 | Cy | 30 | 85 | |
| After the loop | | | 85 | Party health: 85, then Bo |

### Watch out
`party.name` is `undefined` because the array itself has no name. Only its items do, so pick an item first, like `party[0].name`, or loop over them.

### Not just parties
Most web data arrives as an array of objects: users, products, or messages. `party.map((hero) => hero.name)` gives you only the names.
