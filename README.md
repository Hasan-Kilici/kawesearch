# KaweSearch

This repository contains a fuzzy search library that provides a flexible way to search and match strings using various fuzzy matching algorithms. It supports multiple languages and allows for customization of search options such as algorithms, thresholds, and synonym handling.

## Features

- Multiple Matching Algorithms: Supports various algorithms for fuzzy matching, including:
    - Levenshtein
    - Damerau-Levenshtein
    - Jaro-Winkler
    - Soundex
    - Metaphone (beta)

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

const search = new Search(data, synonyms, {
  language: "en", 
  algorithm: "levenshtein",
  threshold: 0.7
});

async function performSearch() {
  const query = "Cappadocia"; // This can be input from a user
  const results = await search.search(query);
  console.log(results);
}

performSearch();
```
### Explanation:

- Data: The data is a list of objects where each object contains a searchable field (name, tags, etc.).
- **Synonyms**: Synonyms are provided for words that should be considered equivalent during the search. This helps in handling variations of terms like "Kapadokya" and "Cappadocia".
- **Search Options**: Customize the search options, such as the algorithm to use and the threshold for matching.

### Customizing Search Options

You can customize the search behavior by adjusting the following options:

- `algorithm`: Choose the matching algorithm (`levenshtein`, `damerau-levenshtein`, `jaro-winkler`, `soundex`, or `metaphone`) or custom search.
- `threshold`: Set a minimum similarity threshold (between 0 and 1) to determine if a match is valid.
- `language`: Specify the language for search messages (e.g., `en`, `tr`, `de`, etc.).
- `debounceDelay`: Set a delay for debouncing search input to optimize performance.

### Methods
- search(query): Initiates the search and returns the matching results.
- _performSearch(query): Executes the actual search after debounce.
- _suggest(query): Suggests alternative results if no direct match is found.
- _match(query, word): Matches the query against a word using the selected algorithm.
- _calculateDistance(query, word): Calculates the distance between the query and word using the chosen algorithm.

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
const search = new Search(data, synonyms, {
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
## Contributing 
We welcome contributions to this project! If you'd like to contribute, please fork the repository, create a branch for your changes, and submit a pull request.
License

This project is licensed under the MIT License.
