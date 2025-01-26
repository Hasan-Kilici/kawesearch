
<input type="text" id="search" bind:this={input} on:input={searchPlace} placeholder="Search for a place">
{#if result}
    <ul>
        {#each result as place}
            <li>{place.name}</li>
        {/each}
    </ul>
{/if}
<script>
    import PlaceData from '$lib/data/places.json';
    import Search from 'kawesearch';

    let input;

    const synonyms = {
        otel: ['otel', 'konaklama', 'tatil', 'lüks'],
        restoran: ['restoran', 'yemek', 'cafe', 'kahvaltı'],
        gezilecek: ['gezilecek', 'mekan', 'doğa', 'tarih'],
    };

    let search = new Search(PlaceData, synonyms,{
        language: "tr", 
        algorithm: ["jaro-winkler"],
        threshold: 0.4,
        debounceDelay: 300,
        customMessages: {
            tr:{
                noMatch: "Sonuc bulunamadı my mannn",
                suggestion: "Bunu mu diyon brother?",
            }
        }
    })

    let result = [];

    async function searchPlace() {
        result = await search.search(input.value);
    }

</script>
