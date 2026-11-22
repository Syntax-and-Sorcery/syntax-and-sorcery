### The problem
You need a function that doubles gold, one that triples it, and one that multiplies it by ten. They're identical except for one number.

### The idea
A function can build another function and return it. The returned function remembers the variables from where you created it, even after the outer function finishes. That memory is a closure.

### Like in real life
You tell a stamp maker a word once, and it hands you a stamp that prints that word every time you use it.

### In code
```js
function makeMultiplier(times) {
  return (gold) => gold * times;
}

const double = makeMultiplier(2);
const triple = makeMultiplier(3);

console.log(double(10));
console.log(triple(10));
console.log(double(7));
```

### Step by step
| Call | `times` it remembers | `gold` | Returns |
|---|---|---|---|
| `double(10)` | 2 | 10 | 20 |
| `triple(10)` | 3 | 10 | 30 |
| `double(7)` | 2 | 7 | 14 |

### Watch out
`makeMultiplier(2)` gives you a function, not a number. `console.log(double)` prints the function itself; call it, as in `double(10)`, to get a result.

### Not just multipliers
Programs often build greeting makers like `makeGreeter("Hail")`, discount helpers, and click handlers this way.
