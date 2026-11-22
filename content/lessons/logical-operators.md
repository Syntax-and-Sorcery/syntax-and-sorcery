### The problem
The vault opens only if you have the key and it's night. You need to check two things at once.

### The idea
`&&` means and, so it's true only when both sides are true. `||` means or, so it's true when at least one side is true. `!` means not, flipping true to false and false to true.

### Like in real life
To board a fair ride, you need a ticket and you must be tall enough. If you miss either one, you don't get on.

### In code
```js
const hasKey = true;
const isNight = false;

console.log(hasKey && isNight);
console.log(hasKey || isNight);
console.log(!isNight);

if (hasKey && isNight) {
  console.log("The vault opens.");
} else {
  console.log("The vault stays shut.");
}
```

### Step by step
| Expression | Read it as | Value |
|---|---|---|
| `hasKey && isNight` | key and night | false |
| `hasKey \|\| isNight` | key or night | true |
| `!isNight` | not night | true |
| `if (hasKey && isNight)` | key and night | false, so it prints "The vault stays shut." |

### Watch out
Write out both sides in full. `door === "red" || "blue"` doesn't check two colors. JavaScript reads it as `(door === "red") || "blue"`. Because `"blue"` counts as true on its own, the check always passes. Write `door === "red" || door === "blue"`.

### Not just vaults
A login checks the name and the password. A game ends when health runs out or time is up.
