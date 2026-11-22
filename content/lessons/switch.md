### The problem
The player picks a door by its color, and each color leads somewhere else. A long chain of `else if` checks the same variable again and again.

### The idea
`switch` compares one value against each `case` and runs the code under the match. `break` ends that case, and `default` runs when no case matches.

### Like in real life
Think of a vending machine. Press B2, and you get whatever is in slot B2.

### In code
```js
const door = "blue";

switch (door) {
  case "red":
    console.log("A dragon's lair.");
    break;
  case "blue":
    console.log("A quiet library.");
    break;
  default:
    console.log("A blank wall.");
}
```

### Step by step
| Case | Matches `"blue"`? | What happens |
|---|---|---|
| `"red"` | no | Skip |
| `"blue"` | yes | Print "A quiet library.", then `break` leaves the switch |
| `default` | | Never reached |

### Watch out
Forget a `break`, and JavaScript keeps running into the next case. Without the second `break`, the blue door would print "A blank wall." too.

### Not just doors
Menus, keyboard keys, and game states like playing, paused, and game over often pick their action with a switch.
