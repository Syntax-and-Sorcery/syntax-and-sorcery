### The problem
You print the same welcome line at the start of every level. If you copy it everywhere, you have to fix every copy when the wording changes.

### The idea
A function gives a block of code a name. Define it once with `function`, then run it by writing its name with parentheses: `showBanner()`. Running it like this is calling the function.

### Like in real life
You write a recipe card once, then cook from it whenever you want the dish.

### In code
```js
function showBanner() {
  console.log("== Welcome, hero! ==");
}

showBanner();
console.log("Level 1 begins");
showBanner();
```

### Step by step
| Step | What runs | Printed |
|---|---|---|
| 1 | `function showBanner() { ... }` | Nothing yet: it's only defined |
| 2 | `showBanner();` | == Welcome, hero! == |
| 3 | `console.log("Level 1 begins");` | Level 1 begins |
| 4 | `showBanner();` | == Welcome, hero! == |

### Watch out
The name without parentheses doesn't run anything. `showBanner;` only points to the function; you need `showBanner()` to call it.

### Not just banners
Every code puzzle in this game is a function you fill in, and the tests call it to check your answer.
