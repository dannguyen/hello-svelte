<script>
	let name = "Just Appy";
    let catSrc = "./assets/cat.jpg";

    import Button from './Button.svelte';
</script>

<style>
	h1 {
		color: purple;
	}

    img{
        border: 3px solid pink;
        margin: auto auto;
        display: block;
    }

</style>

<h1>Hello {name}!</h1>


<Button />

<img src="{catSrc}" alt="cat image">
