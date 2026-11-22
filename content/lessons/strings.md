### The problem
You want to greet each player by name: "Welcome, Ana!" The name is different for every player, so you can't write the whole sentence in advance.

### The idea
A string is text inside quotes. Join strings with `+`, or drop values into a template string written with backticks and `${}`. `.length` counts the characters, and `.slice(start, end)` cuts out a piece.

### Like in real life
Think of beads on a thread. Each character is one bead in a row, so you can count them or cut out a section.

### In code
```js
const name = "Ana";
const greeting = "Welcome, " + name + "!";

console.log(greeting);
console.log(`${name} has ${name.length} letters`);
console.log(greeting.slice(0, 7));
```

### Step by step
| Expression | Value |
|---|---|
| `"Welcome, " + name + "!"` | Welcome, Ana! |
| `name.length` | 3 |
| `` `${name} has ${name.length} letters` `` | Ana has 3 letters |
| `greeting.slice(0, 7)` | Welcome |

### Watch out
`"5" + 3` is `"53"`, not 8. When either side of `+` is a string, JavaScript joins instead of adding, so turn text into a number first with `Number("5")`.

### Not just names
Messages, item names, and anything a player types arrive as strings.
