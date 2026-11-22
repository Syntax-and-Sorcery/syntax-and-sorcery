### The problem
You want to print every item in the bag, whether it holds 3 items or 30.

### The idea
`for (const item of bag)` runs its block once per item and puts each value into `item` in turn. `item` can be a `const` because each round makes a new `item`. When you also need the position, use a counting loop that runs while `i < bag.length` and read `bag[i]`.

### Like in real life
Emptying a bag onto the table and looking at each thing as it comes out.

### In code
```js
const bag = ["sword", "shield", "potion"];

for (const item of bag) {
  console.log("You have a " + item);
}

for (let i = 0; i < bag.length; i++) {
  console.log(i + ": " + bag[i]);
}
```

### Step by step
| Round | `item` | `i` | First loop prints | Second loop prints |
|---|---|---|---|---|
| 1 | "sword" | 0 | You have a sword | 0: sword |
| 2 | "shield" | 1 | You have a shield | 1: shield |
| 3 | "potion" | 2 | You have a potion | 2: potion |

### Watch out
`for (const item in bag)` looks almost the same, but it gives the indexes "0", "1", and "2" instead of the items. Use `of` for arrays.

### Not just bags
Any list uses the same loop: players in a match, lines in a file, or enemies on the screen.
