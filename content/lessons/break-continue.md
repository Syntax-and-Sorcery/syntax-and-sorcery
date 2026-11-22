### The problem
You search a dungeon room by room for the key. One room is flooded, so you want to skip it, and once you find the key there's no point checking the rest.

### The idea
`continue` skips the rest of this round and jumps to the next one. `break` leaves the loop at once.

### Like in real life
When you look for a recipe in a cookbook, you flip past the photo pages and close the book as soon as you find it.

### In code
```js
for (let room = 1; room <= 5; room++) {
  if (room === 2) {
    console.log("Room 2 is flooded, skip it");
    continue;
  }
  if (room === 4) {
    console.log("Found the key in room 4");
    break;
  }
  console.log("Room " + room + ": nothing here");
}
```

### Step by step
| Round | `room` | What happens | Printed |
|---|---|---|---|
| 1 | 1 | Neither `if` matches | Room 1: nothing here |
| 2 | 2 | `continue` skips the last line | Room 2 is flooded, skip it |
| 3 | 3 | Neither `if` matches | Room 3: nothing here |
| 4 | 4 | `break` ends the loop | Found the key in room 4 |
| | 5 | Never visited | |

### Watch out
In a `while` loop, `continue` jumps straight back to the condition. If the counter goes up at the bottom of the loop, `continue` skips that too, and the loop never ends.

### Not just keys
A search stops at the first match with `break`, and `continue` skips bad data, like empty lines in a file.
