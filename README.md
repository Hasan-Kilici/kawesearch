# KaweSearch

This repository contains a fuzzy search library that provides a flexible way to search and match strings using various fuzzy matching algorithms. It supports multiple languages and allows for customization of search options such as algorithms, thresholds, and synonym handling.

## Features

- Multiple Matching Algorithms: Supports various algorithms for fuzzy matching, including:
    - Levenshtein
    - Damerau-Levenshtein
    - Jaro-Winkler
    - Soundex
    - Metaphone (beta)
    - jaccard similarity
    - ngram similarity
    - cosine similarity
    - tf-idf similarity
    - smith-waterman

- **Synonym Support**: Handles synonyms with customizable frequency and weightings.
- **Customizable Search Options**: Allows customization of search behavior, including algorithm choice, threshold, and more.
- **Language Support**: Includes multiple languages for search messages, with easy extensions for additional languages.

## Algorithms

The library implements the following algorithms for fuzzy matching:

1. **Levenshtein Distance**: Measures the number of single-character edits (insertions, deletions, or substitutions) required to transform one string into another.
2. **Damerau-Levenshtein Distance**: Similar to Levenshtein, but also considers transpositions of two adjacent characters.
3. **Jaro-Winkler Similarity**: Measures the similarity between two strings, with a preference for strings that match from the beginning.
4. **Soundex**: Converts a string to a phonetic code to find words that sound similar.
5. **Metaphone**: An algorithm that encodes words to their phonetic representation, helping in phonetic matching.

## Installation

To install this package, run the following command:

```sh
npm install kawesearch
```

## Usage Example

Here is an example of how to use the Search class in your application.
Example Setup
```js
import Search from "kawesearch";

const data = [
  {
    id: 1,
    name: "Kapadokya",
    type: "Gezilecek yerler",
    location: "Turkey",
  },
  {
    id: 2,
    name: "Cappadocia",
    type: "Tourist Attractions",
    location: "Turkey",
  },
];

const synonyms = {
  Kapadokya: ["Cappadocia"],
};

const search = new Search(data, synonyms, {}, {
  language: "en", 
  algorithm: ["levenshtein", "soundex"],
  threshold: 0.7
});

async function performSearch() {
  const query = "Cappadocia";
  const results = await search.search(query);
  console.log(results);
}

performSearch();
```
### Explanation:

- ``Data``: The data is a list of objects where each object contains a searchable field (name, tags, etc.).
- **``Synonyms``**: Synonyms are provided for words that should be considered equivalent during the search. This helps in handling variations of terms like "Kapadokya" and "Cappadocia".
- **`Search Options`**: Customize the search options, such as the algorithm to use and the threshold for matching.

### Customizing Search Options

You can customize the search behavior by adjusting the following options:

- ``algorithm``: The algorithm(s) to use for calculating text similarity (default: ["levenshtein"]).
- ``threshold``: The similarity threshold for results (default: 0.8).
- ``suggestOnNoMatch``: Whether to suggest results if no exact match is found (default: true).
- ``suggestionThreshold``: The threshold for suggestion similarity (default: 0.5).
- ``customSearch``: A custom search function (default: null).
- ``customMessages``: Custom messages for results (default: {}).
- ``debounceDelay``: Delay before performing search after the last query (default: 300ms).
- ``cacheSize``: The size of the cache for storing search results (default: 100).
- ``timeout``: The timeout duration for search operations (default: 5000ms).
- ``cacheTTL``: The time-to-live for cache entries (default: 60000ms).

### Methods
- ``search(query)``: Initiates the search and returns the matching results.
- ``_performSearch(query)``: Executes the actual search after debounce.
- ``_suggest(query)``: Suggests alternative results if no direct match is found.
- ``_match``(query, word): Matches the query against a word using the selected algorithm.`
- ``_setToCache``(key, value): Caches a result with a specific key.
- ``_getFromCache``(key): Retrieves a cached result by key.


## Languages Supported

The library currently supports the following languages for search messages:

- English (en)
- Turkish (tr)
- German (de)
- Azerbaijani (az)
- French (fr)
- Spanish (es)
- Italian (it)
- Russian (ru)
- Portuguese (pt)
- Arabic (ar)

You can easily extend the library to support additional languages by modifying the lang.js file or you can use `customMessages`.

### Example
```js
const search = new Search(data, synonyms, {},{
    threshold: 0.8,
    suggestOnNoMatch: true,
    suggestionThreshold: 0.5,
    language: "cat",
    algorithm: "levenshtein",
    debounceDelay: 300,
    customMessages : {
        cat:{
            suggest:"myau?",
            noResults:"Pssst!"
        }
    }
});
```

## Bechmakring
```js
import Search from "kawesearch";

const keywords = Array.from({ length: 1000000 }, (_, i) => ({
    name: `keyword${i + 1}`,
    id: i + 1
}));

const synonyms = keywords.reduce((acc, keyword) => {
    acc[keyword.name] = [`${keyword.name}Synonym1`, `${keyword.name}Synonym2`, `${keyword.name}Synonym3`];
    return acc;
}, {});

const search = new Search(keywords, synonyms, {}, {
    language: "en", 
    algorithm: ["levenshtein"],
    threshold: 0.6,
    timeout: 200,
    debounceDelay: 1,
});

async function benchmarkSearch(query) {
    const start = process.hrtime();
    const results = await search.search(query);
    const end = process.hrtime(start);

    const timeInMs = (end[0] * 1e9 + end[1]) / 1e6;
    console.log(`Search for "${query}" took ${Math.floor(timeInMs.toFixed(3))} ms and take ${results.length} results`);

    return timeInMs;
}

async function performBenchmark() {
    const query = "keyword99";
    
    const time = await benchmarkSearch(query);
    console.log(`Search time for "${query}": ${time.toFixed(3)} ms`); 
}

performBenchmark();
```
Result 
```
Search for "keyword99" took 78 ms and take 11111 results
Search time for "keyword99": 78.690 ms
```

## Contributing 
We welcome contributions to this project! If you'd like to contribute, please fork the repository, create a branch for your changes, and submit a pull request.
License

This project is licensed under the MIT License.
