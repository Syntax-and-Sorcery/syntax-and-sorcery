### The problem
A merchant's prices are `[10, 25, 40]`. You want a new list with every price doubled, and another with only the prices under 30.

### The idea
`map` makes a new array by running a function on every item and keeping what it returns. `filter` makes a new array with only the items for which the function returns `true`. Neither one changes the original array.

### Like in real life
Picture two helpers sorting apples at a market stall. One polishes every apple for map, and the other keeps only the red ones for filter.

### In code
```js
const prices = [10, 25, 40];

const doubled = prices.map((price) => price * 2);
const cheap = prices.filter((price) => price < 30);

console.log(doubled);
console.log(cheap);
console.log(prices);
```

### Step by step
| `price` | `map` gives | `price < 30`? | `filter` keeps it? |
|---|---|---|---|
| 10 | 20 | true | yes |
| 25 | 50 | true | yes |
| 40 | 80 | false | no |

So `doubled` is `[20, 50, 80]`, `cheap` is `[10, 25]`, and `prices` is still `[10, 25, 40]`.

### Watch out
Because `map` and `filter` don't change `prices`, a line like `prices.map((price) => price * 2);` on its own does nothing you can see. Keep the result in a variable.

### Not just prices
Turning a list of players into a list of their names is a `map`. Showing only unread messages is a `filter`.
