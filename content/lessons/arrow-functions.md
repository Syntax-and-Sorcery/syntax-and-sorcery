### The problem
A small job like "double this number" takes three lines with the `function` keyword. You'll write lots of these small functions once you work with lists.

### The idea
An arrow function is a shorter way to write a function: `(gold) => gold * 2`. With a single expression after the arrow, the function returns its value without `return`. Store it in a `const` to give it a name.

### Like in real life
Think of a nickname. "Alexander" and "Alex" name the same person, and one is quicker to say.

### In code
```js
function doubleLong(gold) {
  return gold * 2;
}

const double = (gold) => gold * 2;
const hail = (name) => "Hail, " + name + "!";

console.log(doubleLong(4));
console.log(double(4));
console.log(hail("Bo"));
```

### Step by step
| Call | Works out | Printed |
|---|---|---|
| `doubleLong(4)` | `return 4 * 2` | 8 |
| `double(4)` | `4 * 2`, returned without `return` | 8 |
| `hail("Bo")` | `"Hail, " + "Bo" + "!"` | Hail, Bo! |

### Watch out
Curly braces change the rule. `(gold) => { gold * 2 }` returns `undefined`; with braces you have to write `return gold * 2`.

### Not just shortcuts
Arrow functions are everywhere in modern JavaScript, especially as the small functions you pass to list tools like `map` and `filter` in later lessons.
