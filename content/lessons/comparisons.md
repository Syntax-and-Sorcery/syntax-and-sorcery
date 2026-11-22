### The problem
You need to know if the hero's level is high enough to enter the tower, or if the password the player typed is the right one.

### The idea
A comparison asks a yes-or-no question and answers `true` or `false`. `===` means "is equal to" and `!==` means "is not equal to". `<`, `>`, `<=` and `>=` compare sizes.

### Like in real life
A balance scale tells you which side is heavier, or shows that both weigh the same.

### In code
```js
const level = 5;

console.log(level >= 5);
console.log(level > 5);
console.log(level === 5);
console.log("dragon" !== "Dragon");
```

### Step by step
| Comparison | Answer | Why |
|---|---|---|
| `level >= 5` | true | 5 is at least 5 |
| `level > 5` | false | 5 is not more than 5 |
| `level === 5` | true | Same number |
| `"dragon" !== "Dragon"` | true | Capital letters count, so they differ |

### Watch out
One `=` stores a value and `===` compares. With a `let` variable, `if (level = 10)` sets `level` to 10 instead of checking it. Also avoid `==`, which treats `"5"` and `5` as equal.

### Not just numbers
Comparisons check passwords, test high scores, and sort lists.
