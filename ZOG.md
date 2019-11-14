# whats I learned



## 2019-11-14

- Change where bundle.css and bundle.js are published to in the rollup-config.js
- Use `{@html "<b>hi</b>"}` to render raw html ([tutorial](https://svelte.dev/tutorial/html-tags)) 
- Reactive declarations use this prompt: `$:`: https://svelte.dev/tutorial/reactive-declarations
- Svelte's reactivity is [triggered by assignments](https://svelte.dev/tutorial/updating-arrays-and-objects). 

    The following *won't* trigger updates to references of `obj.food`

    ```
    let foo = obj.food;
    foo.bar = 'hello'
    ```

    The variable to be updated must be on the left-hand side of assignment:

    ```
    obj = obj
    ```


- Props: the `export` key word is the declaration for properties:

    ```export let foo = 'bar';
