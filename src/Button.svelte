<script>
    export let btnLabel = 'Load!';

    function handleClick(){
        console.log("Button clicked!");
    }
</script>

<style>
    button.mybutton{
            align-items:flex-start;
            background-color:rgb(0, 123, 255);
            border-bottom-color:rgb(0, 123, 255);
            border-bottom-left-radius:4.8px;
            border-bottom-right-radius:4.8px;
            border-bottom-style:solid;
            cursor: pointer;

    }
</style>

<section class="cage-panel">

    <label for="cageWidth">Width:</label>
    <input name="cageWidth" type="text" value=600>

    <label for="cageHeight">Height</label>
    <input name="cageHeight" type="text" value=400>


    <button class="mybutton" type="button" on:click={handleClick}>
        {btnLabel}
    </button>

</section>

