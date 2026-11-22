### The problem
You pick up loot as you walk, and later you use the last thing you picked up. The bag keeps growing and shrinking.

### The idea
`push` adds an item to the end of an array. `pop` removes the last item and gives it back to you. Both change the array itself.

### Like in real life
Picture a stack of plates. You put new plates on top and take plates off the top.

### In code
```js
const bag = ["sword"];

bag.push("potion");
bag.push("map");
console.log(bag.length);

const used = bag.pop();
console.log(used);
console.log(bag.length);
```

### Step by step
| Step | `bag` after | Printed |
|---|---|---|
| `bag.push("potion")` | sword, potion | |
| `bag.push("map")` | sword, potion, map | |
| `console.log(bag.length)` | sword, potion, map | 3 |
| `const used = bag.pop()` | sword, potion | |
| `console.log(used)` | sword, potion | map |
| `console.log(bag.length)` | sword, potion | 2 |

### Watch out
`push` returns the new length, not the array. `const newBag = bag.push("gem")` gives you a number.

### Not just bags
An Undo button works the same way. The app pushes each action onto a list, and Undo pops the last one off.
