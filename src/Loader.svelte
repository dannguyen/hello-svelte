<script>
    import Cage from './Cage.svelte';

    const defaultSrcUrl = 'https://www.placecage.com'
    const CAGETYPES = ['g', 'c', 'gif']

    export let cageWidth = 600;
    export let cageHeight = 400;
    export let cageType = '';

    $: btnLabel = `Load: ${cageWidth}x${cageHeight} cage!`;

    function handleClick(){
        loadCage(cageWidth, cageHeight)
    }

    function loadCage(width=cageWidth, height=cageHeight, imgtype=cageType){
        let url = defaultSrcUrl;

        if (CAGETYPES.includes(imgtype)){

            url = `${url}/${imgtype}`
        }

        url = `${url}/${width}/${height}`

        if(true){
            // todo: should be able to trigger event on cageUrl update, right?
            console.log("Loader doing it! " + url);

            // todo: figure out slots:
            // https://svelte.dev/docs
            let cage = new Cage({
                target: document.getElementById('cageCage'),
                props: {
                    imgUrl: url
                }
            });

        }else{
            console.log("Already loaded: " + cageUrl);
        }

    }

    function randoCage(){
        let w = Math.round(200 + (Math.random() * 800));
        let h = Math.round(0.25 * w + (Math.random() * 600));
        let t = 'normal'
        if(Math.random() > 0.4){
            t = CAGETYPES[Math.floor(Math.random() * CAGETYPES.length)]
        }
        loadCage(w, h, t)
    }

</script>

<style>
    button.mybutton{
            align-items:flex-start;
            border-bottom-color:rgb(0, 123, 255);
            border-bottom-left-radius:4.8px;
            border-bottom-right-radius:4.8px;
            border-bottom-style:solid;
            cursor: pointer;
    }

    input{ margin-right: 5px; }

    label{
        display: inline-block;
    }

    .buttons{
        max-width: 450px;
        text-align: left;
        margin: auto;
    }

    #cageCage{
        width: 100%;
        text-align: center;
        margin-left: auto;
        margin-right: auto;
    }
</style>

<section class="cage-panel">

        <div class="buttons">
                <button class="mybutton" type="button" on:click={randoCage}>
                    Random!
                </button>
        <br>

            <button class="mybutton" type="button" on:click={handleClick}>
                {btnLabel}
            </button>
            <label for="cageWidth">Width:</label>
            <input size=4 name="cageWidth" type="text" bind:value={cageWidth}>

            <label for="cageHeight">Height</label>
            <input size=4 name="cageHeight" type="text" bind:value={cageHeight}>
        </div>

    <section id="cageCage">
    </section>

</section>

