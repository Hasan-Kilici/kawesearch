import { damerauLevenshtein, levenshtein, fuzzyMatch } from "./algorithms.js";
import { messages } from "./lang.js";

export default class Search {
    constructor(data, synonyms, synonymUsageFrequency = {}, options = {}) {
        this.data = data;
        this.synonyms = synonyms;
        this.synonymUsageFrequency = synonymUsageFrequency;
        this.language = options.language || "en";
        this.options = {
          algorithm: options.algorithm || "damerau-levenshtein",
          threshold: options.threshold || 0.8,
          suggestOnNoMatch: options.suggestOnNoMatch || true,
          suggestionThreshold: options.suggestionThreshold || 0.5,
          customSearch: options.customSearch || null,
          customMessages: options.customMessages || {},
          debounceDelay: options.debounceDelay || 300,
        };
        this._initializeMessages();
        
        this.index = this.createIndex(data);
        this.cache = {};
        this.debounceTimer = null;
        this.debouncePromise = null;
    }

    _initializeMessages() {
        if (Object.keys(this.options.customMessages).length > 0) {
            this.messages = {
                ...messages[this.language],
                ...this.options.customMessages[this.language],
            };
        } else {
            this.messages = messages[this.language];
        }
    }

    _resolveSynonyms(word) {
        if (!word) return [word];
        if (this.cache[word]) return this.cache[word];
    
        const synonyms = this.synonyms[word] || [];
    
        const weightedSynonyms = synonyms.map(synonym => ({
            word: synonym,
            weight: this.synonymWeight(synonym)
        }));
    
        weightedSynonyms.sort((a, b) => b.weight - a.weight);
    
        const result = [word, ...weightedSynonyms.map(item => item.word)];
    
        this.cache[word] = result;
    
        return result;
    }
    
    synonymWeight(synonym) {
        const frequency = this.synonymUsageFrequency[synonym] || 1;
        return frequency;
    }

    createIndex(data) {
        const index = {};
        data.forEach((item) => {
            index[item.id] = item;
        });
        return index;
    }

    async search(query) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debouncePromise = new Promise((resolve) => {
            this.debounceTimer = setTimeout(() => {
                resolve(this._performSearch(query));
            }, this.options.debounceDelay);
        });

        return this.debouncePromise;
    }

    async _performSearch(query) {
        if (!query) return [];

        if (this.cache[query]) {
            console.log("Cache hit!");
            return this.cache[query]; 
        }

        const results = this.data.filter((item) => {
            const searchableFields = [item.name, ...(item.tags || [])];
            const resolvedQuery = query.toLowerCase();
        
            const matches = searchableFields.some((field) => {
                if (!field) return false;
                const resolvedField = field.toLowerCase();
                const fieldWords = this._resolveSynonyms(resolvedField);
        
                return fieldWords.some((word) => this._match(resolvedQuery, word));
            });
        
            return matches;
        });
    
        if (results.length === 0 && this.options.suggestOnNoMatch) {
            return this._suggest(query);
        }

        this.cache[query] = results; 

        return results;
    }

    _suggest(query) {
        const suggestions = this.data
          .map((item) => {
            const searchableFields = [item.name, ...(item.tags || [])];
            const resolvedQuery = query.toLowerCase();
    
            const closestMatch = searchableFields.reduce(
              (bestMatch, field) => {
                if (!field) return bestMatch;
                const resolvedField = field.toLowerCase();
                const distance = this._calculateDistance(resolvedQuery, resolvedField);
                const similarity = 1 - distance / Math.max(resolvedQuery.length, resolvedField.length);
    
                if (similarity > bestMatch.similarity) {
                  return { field, similarity, item };
                }
    
                return bestMatch;
              },
              { similarity: 0, item: null }
            );
    
            return closestMatch.similarity >= this.options.suggestionThreshold
              ? closestMatch.item
              : null;
          })
          .filter(Boolean);

        return {
          message: suggestions.length > 0 ? this.messages.suggest : this.messages.noResults,
          suggestions: suggestions,
        };
    }

    _match(query, word) {
        const algorithm = this.options.algorithm;
        const threshold = this.options.threshold;
    
        if (this.options.customSearch) {
          return this.options.customSearch(query, word);
        }
    
        return fuzzyMatch(query, word, threshold, algorithm);
    }

    _calculateDistance(query, word) {
        if (this.options.algorithm === "levenshtein") {
            return levenshtein(query, word);
        }
        return damerauLevenshtein(query, word);
    }
}
