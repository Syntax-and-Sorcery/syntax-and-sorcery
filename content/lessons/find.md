### The problem
Your potions heal different amounts, and you want the first one that heals at least 30.

### The idea
`find` checks the items in order and returns the first one for which your function returns `true`. It stops there, and if nothing matches it returns `undefined`.

### Like in real life
When you try pens from a drawer, you stop at the first one that writes.

### In code
```js
const potions = [10, 20, 35, 50];

const strong = potions.find((heal) => heal >= 30);
console.log(strong);

const huge = potions.find((heal) => heal > 100);
console.log(huge);
```

### Step by step
| `heal` | `heal >= 30`? | What happens |
|---|---|---|
| 10 | false | Keep looking |
| 20 | false | Keep looking |
| 35 | true | Stop: `strong` is 35 |
| 50 | | Never checked |

The second search finds nothing above 100, so `huge` is `undefined`.

### Watch out
Check for `undefined` before using the result. Here `huge + 5` gives `NaN`, short for "not a number", instead of an error, so the bug shows up much later.

### Not just potions
Finding a player by name or the first free seat is a `find`. `findIndex` works the same way but gives the position instead.
