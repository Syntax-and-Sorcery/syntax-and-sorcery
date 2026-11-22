### The problem
You need to know if the hero's level is high enough to enter the tower, or if the player typed the right password.

### The idea
A comparison asks a yes-or-no question and answers `true` or `false`. `===` means "is equal to", and `!==` means "is not equal to". `<`, `>`, `<=`, and `>=` compare sizes.

### Like in real life
A balance scale shows which side is heavier, or whether both sides weigh the same.

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
One `=` stores a value, and `===` compares. `level = 10` tries to put 10 into `level`, while `level === 10` asks whether it is 10. Avoid `==` because it treats `"5"` and `5` as equal.

### Not just numbers
Comparisons check passwords, test high scores, and sort lists.
