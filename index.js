import { damerauLevenshtein, levenshtein, fuzzyMatch } from "./algorithms.js";
import { messages } from "./lang.js";

export default class Search {
    constructor(data, synonyms, synonymUsageFrequency = {}, options = {}) {
        this.data = data;
        this.synonyms = synonyms;
        this.synonymUsageFrequency = synonymUsageFrequency || {};
        this.language = options.language || "en";
        this.options = {
            algorithm: options.algorithm || ["levenshtein"],
            threshold: options.threshold || 0.8,
            suggestOnNoMatch: options.suggestOnNoMatch ?? true,
            suggestionThreshold: options.suggestionThreshold || 0.5,
            customSearch: options.customSearch || null,
            customMessages: options.customMessages || {},
            debounceDelay: options.debounceDelay || 300,
            cacheSize: options.cacheSize || 100,
            timeout: options.timeout || 5000,
            cacheTTL: options.cacheTTL || 60000,
        };
        this._initializeMessages();

        this.index = this.createIndex(data);
        this.lruCache = new Map();
        this.cacheExpiry = new Map();
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

    generateTrigrams(text) {
        const trigrams = [];
        const sanitizedText = text.toLowerCase().replace(/\s+/g, '');
        for (let i = 0; i < sanitizedText.length - 2; i++) {
            trigrams.push(sanitizedText.substring(i, i + 3));
        }
        return trigrams;
    }

    createIndex(data) {
        const invertedIndex = {};

        data.forEach((item) => {
            const searchableFields = [item.name, ...(item.tags || [])];
            searchableFields.forEach((field) => {
                const words = field.toLowerCase().split(/\s+/);
                words.forEach((word) => {
                    const normalizedWord = word.trim();
                    if (!invertedIndex[normalizedWord]) {
                        invertedIndex[normalizedWord] = new Set();
                    }
                    invertedIndex[normalizedWord].add(item.id);
                });
            });
        });

        return invertedIndex;
    }

    async search(query) {
        if (this.abortController) {
            this.abortController.abort();
        }

        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("Zaman aşımına uğradı"));
            }, this.options.timeout);
        });

        const searchPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
                if (signal.aborted) return reject(new Error("İşlem iptal edildi"));
                this._performSearch(query)
                    .then(resolve)
                    .catch(reject);
            }, this.options.debounceDelay);
        });

        try {
            return await Promise.race([searchPromise, timeoutPromise]);
        } catch (error) {
            console.error("An error occurred during the search:", error);
            throw error;
        }
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
                const resolvedField = field.toLowerCase();
                return resolvedField.includes(resolvedQuery);
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
            this.cacheExpiry.delete(oldestKey);
        }
        this.lruCache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + this.options.cacheTTL);
    }

    _getFromCache(key) {
        const value = this.lruCache.get(key);
        const expiry = this.cacheExpiry.get(key);
        if (value && Date.now() < expiry) {
            this.lruCache.delete(key);
            this.lruCache.set(key, value);
            return value;
        } else {
            this.lruCache.delete(key);
            this.cacheExpiry.delete(key);
            return null;
        }
    }
}
