### The problem
Your hero starts with 50 gold, and you need that number in several places. If you type 50 everywhere, you have to change every copy when the gold changes.

### The idea
A variable is a name that holds a value. Make one with `let`, give it a value with `=`, and use the name wherever you need the value. Use `const` instead of `let` for a value that will never change. `console.log` prints a value so you can see it.

### Like in real life
A jar with a label on it. The label stays the same, and you can swap what's inside.

### In code
```js
let gold = 50;
console.log(gold);

gold = gold + 20;
console.log(gold);

const heroName = "Ana";
console.log(heroName);
```

### Step by step
| Line | `gold` | `heroName` | Printed |
|---|---|---|---|
| `let gold = 50;` | 50 | | |
| `console.log(gold);` | 50 | | 50 |
| `gold = gold + 20;` | 70 | | |
| `console.log(gold);` | 70 | | 70 |
| `const heroName = "Ana";` | 70 | "Ana" | |
| `console.log(heroName);` | 70 | "Ana" | Ana |

### Watch out
`const` makes a variable that can never get a new value. Writing `const gold = 50;` and then `gold = 70;` stops with an error. Use `let` for anything that changes.

### Not just gold
Every program keeps its data in variables: a score, a player's name, or the seconds left on a timer.
