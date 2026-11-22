### The problem
A potion costs 7 gold and you want 3 of them. Later you split 25 gold between 4 heroes and need to know what each one gets and what's left over.

### The idea
JavaScript does math with `+`, `-`, `*` for multiply, and `/` for divide. `Math.floor` rounds down to a whole number, and `%` gives the remainder after dividing.

### Like in real life
If you share 25 coins among 4 friends, each gets 6 coins with 1 left over. `Math.floor(25 / 4)` is the 6, and `25 % 4` is the 1.

### In code
```js
const price = 7;
const potions = 3;
console.log(price * potions);

const gold = 25;
const heroes = 4;
console.log(gold / heroes);
console.log(Math.floor(gold / heroes));
console.log(gold % heroes);
```

### Step by step
| Expression | Worked out | Printed |
|---|---|---|
| `price * potions` | 7 × 3 | 21 |
| `gold / heroes` | 25 ÷ 4 | 6.25 |
| `Math.floor(gold / heroes)` | 6.25 rounded down | 6 |
| `gold % heroes` | 25 − 4 × 6 | 1 |

### Watch out
Standard math order applies. `2 + 3 * 4` is 14, not 20, because `*` goes first. Add parentheses, `(2 + 3) * 4`, to add first.

### Not just gold
Scores, health bars, timers, and prices are all numbers. `%` also checks if a number is even: `n % 2` is 0 for every even number.
