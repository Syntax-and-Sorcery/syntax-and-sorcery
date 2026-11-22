### The problem
You want one "repeat this 2 times" function that runs a different action each time. Or you want a brewing function that lets you decide what happens when the potion is done.

### The idea
A callback is a function you pass to another function, which calls it for you. The function that receives it decides when to call it and what to pass in.

### Like in real life
When you leave your number at a busy restaurant, you don't wait at the door. The host calls you when your table is ready.

### In code
```js
function repeat(times, action) {
  for (let i = 1; i <= times; i++) {
    action(i);
  }
}

repeat(2, (n) => console.log("Swing " + n));

function brew(potion, whenDone) {
  console.log("Brewing " + potion + "...");
  whenDone(potion);
}

brew("healing", (name) => console.log("The " + name + " potion is ready"));
```

### Step by step
| Step | What runs | Printed |
|---|---|---|
| 1 | `repeat` calls `action(1)` | Swing 1 |
| 2 | `repeat` calls `action(2)` | Swing 2 |
| 3 | `brew` prints its first line | Brewing healing... |
| 4 | `brew` calls `whenDone("healing")` | The healing potion is ready |

### Watch out
Pass the function without calling it. If `swing` is a function, `repeat(2, swing())` runs `swing` once right away and passes its result to `repeat`. That result is usually `undefined`, so `action(i)` stops with an error. Write `repeat(2, swing)`.

### Not just potions
Timers and button clicks use callbacks. So do the list tools `map`, `filter`, and `find` in the next adventure.
