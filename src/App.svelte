<script>
	let name = "World";

    import Loader from './Loader.svelte';
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

<header>
    <h1>Hello {name}, welcome to CageLoader!</h1>
</header>

<Loader />


