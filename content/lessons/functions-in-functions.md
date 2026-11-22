### The problem
Your `castSpell` function needs a small helper that only it uses. The helper also needs the spell's power, which lives inside `castSpell`.

### The idea
You can define a function inside another function. The inner function can use the outer function's variables, and code outside can't call the inner one.

### Like in real life
A helper in your kitchen can use anything on your counter, and nobody outside the kitchen can give them jobs.

### In code
```js
function castSpell(power) {
  function hit(target) {
    console.log(target + " takes " + power + " damage");
  }

  hit("Goblin");
  hit("Troll");
}

castSpell(12);
```

### Step by step
| Call | `power` | `target` | Printed |
|---|---|---|---|
| `castSpell(12)` | 12 | | |
| `hit("Goblin")` | 12, from `castSpell` | "Goblin" | Goblin takes 12 damage |
| `hit("Troll")` | 12, from `castSpell` | "Troll" | Troll takes 12 damage |

### Watch out
The inner function exists only inside the outer one. Calling `hit("Bat")` outside `castSpell` stops with "hit is not defined".

### Not just spells
This is the first step toward closures. In the next lessons, you'll return the inner function, and it keeps using the outer variables even after the outer function finishes.
