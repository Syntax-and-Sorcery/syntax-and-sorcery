### The problem
Your hero has a battle cry that uses her own name, and a way to spend her own gold. You want those actions to live with the hero, not in loose functions somewhere else.

### The idea
A method is a function stored in an object. Call it with a dot and parentheses: `hero.shout()`. Inside a method, `this` means the object you called it on.

### Like in real life
A music box holds its own tune, and you turn the handle to play it.

### In code
```js
const hero = {
  name: "Ana",
  gold: 50,
  shout() {
    console.log("For glory! I am " + this.name);
  },
  spend(amount) {
    this.gold = this.gold - amount;
    return this.gold;
  },
};

hero.shout();
console.log(hero.spend(15));
```

### Step by step
| Call | `this` | What it does | Printed |
|---|---|---|---|
| `hero.shout()` | `hero` | Reads `this.name`, which is "Ana" | For glory! I am Ana |
| `hero.spend(15)` | `hero` | Sets `this.gold` to 50 - 15 and returns it | 35 |

### Watch out
Arrow functions don't get their own `this`. Write `shout: () => console.log(this.name)` and `this` is not the hero, so use the `shout() { }` form for methods.

### Not just heroes
You've used methods already: `bag.push("map")`, `greeting.slice(0, 7)`, and `console.log` are all methods.
