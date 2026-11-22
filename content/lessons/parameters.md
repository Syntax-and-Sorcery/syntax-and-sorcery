### The problem
Your welcome line should greet each hero by name and title. Writing a separate function for every hero would be silly.

### The idea
A parameter is a name inside a function's parentheses that receives a value when you call the function. The value you pass in is an argument.

### Like in real life
When you order a cake, the baker uses the same recipe every time, and you pick the name to write on top.

### In code
```js
function greet(name, title) {
  console.log("Welcome, " + title + " " + name + "!");
}

greet("Ana", "Knight");
greet("Bo", "Wizard");
```

### Step by step
| Call | `name` | `title` | Printed |
|---|---|---|---|
| `greet("Ana", "Knight")` | "Ana" | "Knight" | Welcome, Knight Ana! |
| `greet("Bo", "Wizard")` | "Bo" | "Wizard" | Welcome, Wizard Bo! |

### Watch out
Arguments match parameters by position, not by name. `greet("Knight", "Ana")` prints "Welcome, Ana Knight!", and a missing argument becomes `undefined`, meaning no value.

### Not just greetings
`console.log("hi")` and `Math.floor(6.25)` are functions too, and the values inside their parentheses are arguments.
