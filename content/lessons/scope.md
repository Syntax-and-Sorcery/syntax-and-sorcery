### The problem
You make a variable inside a function, then try to use it after the function has run, and JavaScript says it is not defined.

### The idea
A variable you create with `let` or `const` exists only inside its curly braces `{ }`. That area is its scope. Code inside the braces can use outer variables, but not the other way around.

### Like in real life
From inside your tent at camp, you can see the campfire, but people at the campfire can't see into your tent.

### In code
```js
const hero = "Ana";
let gold = 10;

function openChest() {
  const found = 25;
  gold = gold + found;
  console.log(hero + " found " + found + " gold");
}

openChest();
console.log("Gold: " + gold);
// console.log(found); here would stop with "found is not defined"
```

### Step by step
| When | `gold` | `found` | Printed |
|---|---|---|---|
| Before the call | 10 | Doesn't exist | |
| Inside `openChest` | 35 | 25 | Ana found 25 gold |
| After the call | 35 | Doesn't exist | Gold: 35 |

### Watch out
Writing `let gold = 0;` inside the function makes a second, separate `gold`. Changes to it don't touch the outer one, which stays 10.

### Not just functions
Loops and `if` blocks have their own scope too: a `let` inside a loop's braces is gone after the loop.
