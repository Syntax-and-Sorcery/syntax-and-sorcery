### The problem
A troll guards the bridge. With more than 10 gold you cross for free, with more than 5 you pay a toll, and otherwise you're stuck. Your code has to do something different in each case.

### The idea
`if` runs a block of code only when its condition is true. `else if` checks another condition when the first one was false, and `else` runs when none of them were true.

### Like in real life
Picture a guard at a door. Show your pass and you go in; otherwise the guard turns you away.

### In code
```js
const gold = 7;

if (gold > 10) {
  console.log("The troll lets you cross.");
} else if (gold > 5) {
  console.log("The troll takes 5 gold and lets you cross.");
} else {
  console.log("The troll blocks the bridge.");
}
```

### Step by step
| Check | Result | What happens |
|---|---|---|
| `gold > 10` | false | Skip this block |
| `gold > 5` | true | Print "The troll takes 5 gold and lets you cross." |
| `else` | | Skipped, because a block already ran |

### Watch out
Only the first true block runs. Put the strictest check first. If `gold > 5` came before `gold > 10`, a hero with 20 gold would pay the toll too.

### Not just trolls
Games check if the player has won, forms check if a field is empty, and shops check if you can afford something.
