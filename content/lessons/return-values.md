### The problem
You want a function that calculates a potion's price with 10% tax, so you can use that price elsewhere: add it up, compare it, or show it.

### The idea
`return` sends a value back to the caller, replacing the function call with that value. The function stops as soon as it returns.

### Like in real life
Think of a vending machine. Coins go in as the arguments, and a drink comes out as the return value.

### In code
```js
function priceWithTax(price) {
  return price + price / 10;
}

const cost = priceWithTax(20);
console.log(cost);
console.log(priceWithTax(50) + 1);
```

### Step by step
| Call | `price` | Returns | Printed |
|---|---|---|---|
| `priceWithTax(20)` | 20 | 22 | 22 (through `cost`) |
| `priceWithTax(50) + 1` | 50 | 55 | 56 |

### Watch out
`console.log` shows a value but doesn't hand it back. A function that prints its result instead of returning it gives back `undefined`, and that's what a puzzle's tests will see.

### Not just prices
The code puzzles here test what your function returns. Built-in functions like `Math.floor` return values the same way.
