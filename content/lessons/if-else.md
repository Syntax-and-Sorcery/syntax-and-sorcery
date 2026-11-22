### The problem
A troll guards the bridge. With more than 10 gold, you cross for free. With more than 5, you pay a toll. Otherwise, you're stuck. Your code needs to do something different in each case.

### The idea
`if` runs a block of code only when its condition is true. The condition is usually a comparison, like `gold > 10`. `else if` checks another condition when the first one is false. `else` runs when none of the conditions are true.

### Like in real life
Picture a guard at a door. Show your pass and you go in. Otherwise, the guard turns you away.

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
