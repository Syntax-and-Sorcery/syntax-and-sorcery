### The problem
A merchant's prices are in an object: `{ sword: 30, shield: 20, potion: 5 }`. You want to print every item and its price without naming each one.

### The idea
`for (const item in prices)` runs once per property, with `item` set to each property's name. Read the value with square brackets, `prices[item]`. `Object.keys(prices)` gives you all the names as an array.

### Like in real life
You read a menu line by line, where each line lists a dish and its price.

### In code
```js
const prices = { sword: 30, shield: 20, potion: 5 };

for (const item in prices) {
  console.log(item + " costs " + prices[item]);
}

console.log(Object.keys(prices).length + " items for sale");
```

### Step by step
| Round | `item` | `prices[item]` | Printed |
|---|---|---|---|
| 1 | "sword" | 30 | sword costs 30 |
| 2 | "shield" | 20 | shield costs 20 |
| 3 | "potion" | 5 | potion costs 5 |
| After the loop | | | 3 items for sale |

### Watch out
`prices.item` looks for a property literally named "item" and gives `undefined`. When a variable holds the name, use square brackets: `prices[item]`.

### Not just prices
The same loop works on any object: vote counts, word counts, or player settings. Use `in` for objects and `of` for arrays.
