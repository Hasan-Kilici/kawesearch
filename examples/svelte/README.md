![resim](https://github.com/user-attachments/assets/379b62ad-48d8-47bc-896e-783480119d00)
```svelte
<input type="text" id="search" bind:this={input} on:input={searchPlace} placeholder="Search for a place">
{#if result}
    {#if result.suggestions && result.suggestions.length > 0}
        <p>{result.message} {result.suggestions[0].name}</p>
        <ul>
            {#each result.suggestions as place}
                <li>{place.name}</li>
            {/each}
        </ul>
    {:else}
        {#each result as place}
                <li>{place.name}</li>
        {/each}
    {/if}
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
        language: "en", 
        algorithm: "levenshtein",
        threshold: 0.7,
        debounceDelay: 300,
        suggestOnNoMatch: true,
        suggestionThreshold: 0.4,
    })

    let result = [];

    async function searchPlace() {
        result = await search.search(input.value);
        console.log(result);
    }

</script>
```

![resim](https://github.com/user-attachments/assets/5c60eecc-59bf-42b8-9421-bc4497631c00)
```svelte

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
        algorithm: "jaro-winkler",
        threshold: 0.4,
        debounceDelay: 300,
    })

    let result = [];

    async function searchPlace() {
        result = await search.search(input.value);
    }

</script>
```
