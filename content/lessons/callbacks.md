### The problem
You want to show a message after a short wait, or build one "repeat this 2 times" function that runs a different action each time.

### The idea
A callback is a function you pass to another function, which calls it for you, now or later. You've used them already: the function you give `map` is a callback.

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

setTimeout(() => console.log("The potion is ready"), 100);
console.log("Brewing...");
```

### Step by step
| Step | What runs | Printed |
|---|---|---|
| 1 | `repeat` calls `action(1)` | Swing 1 |
| 2 | `repeat` calls `action(2)` | Swing 2 |
| 3 | `setTimeout` stores its callback for later and moves on | |
| 4 | `console.log("Brewing...")` | Brewing... |
| 5 | 100 ms later, the stored callback runs | The potion is ready |

### Watch out
Pass the function, don't call it. `setTimeout(brew(), 100)` runs `brew` right away and hands `setTimeout` its result; write `setTimeout(brew, 100)`.

### Not just timers
Button clicks, server requests, and `map`, `filter`, and `find` all take callbacks.
