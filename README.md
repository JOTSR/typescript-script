# typescript-script
Script tag support for TypeScript
Inspired by https://github.com/basarat/typescript-script

## Usage
Add the following line in your page: 
```html
<script src="https://rawgit.com/JOTSR/typescript-script/master/transpiler.js" type="module"></script>
```
Or import it in a js file:
```js
import 'https://rawgit.com/JOTSR/typescript-script/master/transpiler.js'
```

And then you can use script tags that load `.ts` files or even have `typescript` inline: 
```html
<script type="text/typescript" src="script.ts"></script>
<script type="text/typescript">
    const message: string = 'hello'
    setTimeout(()=>console.log(message));
</script>
```
