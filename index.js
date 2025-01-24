import { damerauLevenshtein, levenshtein, fuzzyMatch } from "./algorithms.js";
import { messages } from "./lang.js";

export default class Search {
    constructor(data, synonyms, synonymUsageFrequency = {}, options = {}) {
        this.data = data;
        this.synonyms = synonyms;
        this.synonymUsageFrequency = synonymUsageFrequency || {};
        this.language = options.language || "en";
        this.options = {
            algorithm: options.algorithm || "damerau-levenshtein",
            threshold: options.threshold || 0.8,
            suggestOnNoMatch: options.suggestOnNoMatch ?? true,
            suggestionThreshold: options.suggestionThreshold || 0.5,
            customSearch: options.customSearch || null,
            customMessages: options.customMessages || {},
            debounceDelay: options.debounceDelay || 300,
            cacheSize: options.cacheSize || 100,
        };
        this._initializeMessages();

        this.index = this.createIndex(data);
        this.lruCache = new Map();
        this.abortController = null;
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
        if (this.lruCache.has(`synonym:${word}`)) {
            return this._getFromCache(`synonym:${word}`);
        }

        const synonyms = this.synonyms[word] || [];
        const weightedSynonyms = synonyms
            .map(synonym => ({
                word: synonym,
                weight: this.synonymUsageFrequency[synonym] ?? 1
            }))
            .sort((a, b) => b.weight - a.weight)
            .map(item => item.word);

        const result = [word, ...weightedSynonyms];
        this._setToCache(`synonym:${word}`, result);
        return result;
    }

    createIndex(data) {
        return data.reduce((index, item) => {
            index[item.id] = item;
            return index;
        }, {});
    }

    async search(query) {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (signal.aborted) return reject(new Error("Request aborted"));

                this._performSearch(query)
                    .then(resolve)
                    .catch(reject);
            }, this.options.debounceDelay);
        });
    }

    async _performSearch(query) {
        if (!query) return [];

        if (this.lruCache.has(query)) {
            console.log("Cache hit!");
            return this._getFromCache(query);
        }

        const results = this.data.filter((item) => {
            const searchableFields = [item.name, ...(item.tags || [])];
            const resolvedQuery = query.toLowerCase();

            return searchableFields.some((field) => {
                if (!field) return false;
                const resolvedField = field.toLowerCase();
                const fieldWords = this._resolveSynonyms(resolvedField);
                return fieldWords.some((word) => this._match(resolvedQuery, word));
            });
        });

        if (results.length === 0 && this.options.suggestOnNoMatch) {
            return this._suggest(query);
        }

        this._setToCache(query, results);
        return results;
    }

    _suggest(query) {
        if (this.lruCache.has(`suggestion:${query}`)) {
            return this._getFromCache(`suggestion:${query}`);
        }

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

        const result = {
            message: suggestions.length > 0 ? this.messages.suggest : this.messages.noResults,
            suggestions: suggestions,
        };

        this._setToCache(`suggestion:${query}`, result);
        return result;
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
        return this.options.algorithm === "levenshtein"
            ? levenshtein(query, word)
            : damerauLevenshtein(query, word);
    }

    _setToCache(key, value) {
        if (this.lruCache.size >= this.options.cacheSize) {
            const oldestKey = this.lruCache.keys().next().value;
            this.lruCache.delete(oldestKey);
        }
        this.lruCache.set(key, value);
    }

    _getFromCache(key) {
        const value = this.lruCache.get(key);
        if (value !== undefined) {
            this.lruCache.delete(key);
            this.lruCache.set(key, value);
        }
        return value;
    }
}
