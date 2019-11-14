<script>
    const defaultImage = "./assets/cat.jpg";
    export let imgUrl = defaultImage;
</script>

<style>
    .cage{
        margin-bottom: 1.0em;
    }
</style>


<div class="cage">
    <span class="caption">
       <a href="{imgUrl}">{imgUrl}</a>
    </span>
    <br>
    <img src="{imgUrl}" alt="{imgUrl}">

</div>
