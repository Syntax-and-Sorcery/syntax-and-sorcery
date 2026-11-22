### The problem
You want to count how many potions the shop has sold. Other code shouldn't be able to change that count by accident.

### The idea
Keep the count in a variable inside an outer function, and return an inner function that changes it. The inner function keeps that variable between calls, and nothing else can reach it.

### Like in real life
With a tally clicker in your pocket, each click adds one, and only you can click it.

### In code
```js
function makeCounter() {
  let count = 0;
  return () => {
    count = count + 1;
    return count;
  };
}

const sellPotion = makeCounter();
console.log(sellPotion());
console.log(sellPotion());

const sellSword = makeCounter();
console.log(sellSword());
console.log(sellPotion());
```

### Step by step
| Call | Which `count` | `count` after | Printed |
|---|---|---|---|
| `sellPotion()` | the potion counter's | 1 | 1 |
| `sellPotion()` | the potion counter's | 2 | 2 |
| `sellSword()` | the sword counter's, a new one | 1 | 1 |
| `sellPotion()` | the potion counter's | 3 | 3 |

### Watch out
Each call to `makeCounter()` makes a new, separate `count`. Writing `makeCounter()()` every time gives 1 every time, because you start a fresh counter each call.

### Not just counters
Game scores, ID makers like `nextId()`, and "only do this once" guards keep private memory the same way.
