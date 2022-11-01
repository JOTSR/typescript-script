# typescript-script
Script tag support for TypeScript
Inspired by https://github.com/basarat/typescript-script

## Usage
Add the following line in your page: 
```html
<script src="https://raw.githubusercontent.com/JOTSR/typescript-script/1.0.1/transpiler.js" type="module"></script>
```
Or import it in a js file:
```js
import 'https://raw.githubusercontent.com/JOTSR/typescript-script/1.0.1/transpiler.js'
```

Set data-type to "module" to set transpiled script type to module.
And then you can use script tags that load `.ts` files or even have `typescript` inline: 
```html
<script type="text/typescript" src="script.ts" data-type="module"></script>
<script type="text/typescript">
    const message: string = 'hello'
    setTimeout(()=>console.log(message));
</script>
```
