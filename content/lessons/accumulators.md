### The problem
A dungeon has 4 rooms, and each room holds 10 more gold than the one before: 10, 20, 30, 40. A loop visits the rooms one at a time, but it doesn't remember the rooms it already saw. Where does the running total live?

### The idea
Make a variable before the loop to hold the result so far, and add to it each round. When the loop ends, it holds the answer. That kind of variable is an accumulator.

### Like in real life
You drop coins into an empty jar one handful at a time, and at the end the jar holds them all. `total` is the jar.

### In code
```js
let total = 0; // the empty jar

for (let room = 1; room <= 4; room++) {
  const gold = room * 10;
  total = total + gold;
}

console.log("Total gold: " + total);
```

### Step by step
| Round | `room` | `gold` | `total` after |
|---|---|---|---|
| 1 | 1 | 10 | 10 |
| 2 | 2 | 20 | 30 |
| 3 | 3 | 30 | 60 |
| 4 | 4 | 40 | 100 |
| After the loop | | | Prints "Total gold: 100" |

### Watch out
If `let total = 0` is inside the loop, it starts again at 0 every round and doesn't exist after the loop. Declare it once, before the loop.

### Not just sums
The same pattern counts things with `count++`, tracks the biggest value with `if (gold > best) best = gold`, or builds a string.
