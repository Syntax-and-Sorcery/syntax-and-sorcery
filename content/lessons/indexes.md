### The problem
Your bag holds a sword, a shield, and a potion. Three separate variables get clumsy, and there's no easy way to ask for "the second item."

### The idea
An array is a list of values inside square brackets. Each item has a position number called an index, starting at 0, so `bag[0]` is the first item. `bag.length` counts the items, and `bag[1] = "bow"` replaces the second one.

### Like in real life
A row of numbered lockers, except the first locker is number 0.

### In code
```js
const bag = ["sword", "shield", "potion"];

console.log(bag[0]);
console.log(bag.length);

bag[1] = "bow"; // const stops you replacing the whole array, not changing its items
console.log(bag[1]);
console.log(bag[bag.length - 1]);
```

### Step by step
| Expression | Value |
|---|---|
| `bag[0]` | sword |
| `bag.length` | 3 |
| `bag[1]` after `bag[1] = "bow"` | bow |
| `bag[bag.length - 1]`, which is `bag[2]` | potion |

### Watch out
The last item is at `bag.length - 1`, not `bag.length`. Here `bag[3]` gives `undefined` because the indexes are 0, 1, and 2.

### Not just bags
Strings use indexes too: `"Ana"[0]` is `"A"`. High-score tables, playlists, and game boards are arrays.
