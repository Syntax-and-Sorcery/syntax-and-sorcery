### The problem
The castle guard has to light the torches along the wall, one by one. Writing one line per torch works for 3 torches, not for 300.

### The idea
A `for` loop repeats a block of code. Its first line has three parts: where to start, when to keep going, and how to step to the next round. Here `torch++` adds 1 each time.

### Like in real life
It's like climbing stairs. You start on step 1, keep going while steps remain, and move up one step each time.

### In code
```js
for (let torch = 1; torch <= 3; torch++) {
  console.log("Torch " + torch + " is lit");
}

console.log("Done");
```

### Step by step
| Round | `torch` | `torch <= 3`? | Printed |
|---|---|---|---|
| 1 | 1 | true | Torch 1 is lit |
| 2 | 2 | true | Torch 2 is lit |
| 3 | 3 | true | Torch 3 is lit |
| End | 4 | false | Done |

### Watch out
Watch for off-by-one mistakes. With `torch < 3`, the loop stops after torch 2 and leaves the last torch dark. Check the first and last rounds by hand.

### Not just torches
The same loop counts down a timer, draws a row of tiles, or retries an action three times.
