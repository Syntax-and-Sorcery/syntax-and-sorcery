### The problem
A dragon has 10 health, and each arrow deals 4 damage. You want to keep shooting until it drops, without figuring out the number of arrows yourself.

### The idea
A `while` loop repeats as long as its condition is true. Use it when you don't know in advance how many rounds it takes.

### Like in real life
When you stir soup until it boils, you don't count the stirs. You check the pot each time.

### In code
```js
let health = 10;
let arrows = 0;

while (health > 0) {
  health = health - 4;
  arrows++;
  console.log("Arrow " + arrows + ": health " + health);
}
```

### Step by step
| Round | `health` before | `health > 0`? | `health` after | Printed |
|---|---|---|---|---|
| 1 | 10 | true | 6 | Arrow 1: health 6 |
| 2 | 6 | true | 2 | Arrow 2: health 2 |
| 3 | 2 | true | -2 | Arrow 3: health -2 |
| End | -2 | false | | |

### Watch out
If nothing inside the loop changes the condition, it never stops. Forget `health = health - 4` and the loop runs forever.

### Not just dragons
Games keep running until the player quits, and a form keeps asking until the answer is valid.
