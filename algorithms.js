export function levenshtein(a, b) {
  const alen = a.length;
  const blen = b.length;
  const n = Math.max(alen, blen);
  
  let curr = 0;
  let prev = 0;

  for (let i = 0; i <= alen; i++) {
      curr = 0;
      for (let j = 0; j <= blen; j++) {
          curr |= (prev & (curr ^ prev)) >> 1;
          prev = curr;
      }
  }

  return curr & n;
}

function cosineSimilarity(str1, str2) {
  const vectorize = (str) => {
    const freq = {};
    for (let char of str) freq[char] = (freq[char] || 0) + 1;
    return freq;
  };

  const dotProduct = (vec1, vec2) => Object.keys(vec1).reduce((sum, key) => sum + (vec1[key] * (vec2[key] || 0)), 0);
  const magnitude = (vec) => Math.sqrt(Object.values(vec).reduce((sum, val) => sum + val * val, 0));

  const vec1 = vectorize(str1);
  const vec2 = vectorize(str2);

  const dot = dotProduct(vec1, vec2);
  const mag1 = magnitude(vec1);
  const mag2 = magnitude(vec2);

  return mag1 === 0 || mag2 === 0 ? 0 : dot / (mag1 * mag2);
}

function tfIdfSimilarity(str1, str2) {
  const termFrequency = (str) => {
    const tf = {};
    const words = str.split(/\s+/);
    const totalWords = words.length;
    for (let word of words) tf[word] = (tf[word] || 0) + 1;
    for (let word in tf) tf[word] /= totalWords;
    return tf;
  };

  const inverseDocumentFrequency = (str1, str2) => {
    const allWords = [...new Set(str1.split(/\s+/).concat(str2.split(/\s+/)))];
    const idf = {};
    for (let word of allWords) {
      const containsInStr1 = str1.includes(word) ? 1 : 0;
      const containsInStr2 = str2.includes(word) ? 1 : 0;
      idf[word] = Math.log(2 / (containsInStr1 + containsInStr2));
    }
    return idf;
  };

  const tf1 = termFrequency(str1);
  const tf2 = termFrequency(str2);
  const idf = inverseDocumentFrequency(str1, str2);

  let score = 0;
  for (let word in tf1) {
    if (idf[word]) score += tf1[word] * idf[word] * tf2[word] * idf[word];
  }
  return score;
}

function smithWaterman(str1, str2) {
  const scoreMatrix = Array.from({ length: str1.length + 1 }, () => Array(str2.length + 1).fill(0));
  const match = 2;
  const mismatch = -1;
  const gap = -1;

  let maxScore = 0;

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const matchScore = str1[i - 1] === str2[j - 1] ? match : mismatch;
      const diagonal = scoreMatrix[i - 1][j - 1] + matchScore;
      const left = scoreMatrix[i - 1][j] + gap;
      const up = scoreMatrix[i][j - 1] + gap;

      scoreMatrix[i][j] = Math.max(0, diagonal, left, up);
      maxScore = Math.max(maxScore, scoreMatrix[i][j]);
    }
  }

  return maxScore / Math.max(str1.length, str2.length);
}

const memo = {};

function memoizedSimilarity(func, ...args) {
  const key = `${func.name}:${args.join(',')}`;
  if (memo[key] !== undefined) return memo[key];
  const result = func(...args);
  memo[key] = result;
  return result;
}

export function damerauLevenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = (a.charCodeAt(i - 1) ^ b.charCodeAt(j - 1)) === 0 ? 0 : 1;

      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);

      if (i > 1 && j > 1 &&
          (a.charCodeAt(i - 1) ^ b.charCodeAt(j - 2)) === 0 &&
          (a.charCodeAt(i - 2) ^ b.charCodeAt(j - 1)) === 0) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }

  return dp[a.length][b.length];
}

export function jaroWinkler(a, b) {
  const jaro = (a, b) => {
    const m = [];
    let t = 0;
    const max_dist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
    let matches = 0;

    for (let i = 0; i < a.length; i++) {
      for (let j = Math.max(0, i - max_dist); j < Math.min(b.length, i + max_dist + 1); j++) {
        if (b[j] === a[i] && !m[j]) {
          m[j] = true;
          matches++;
          break;
        }
      }
    }

    if (matches === 0) return 0;

    let k = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) k++;
    }

    t = k / 2;

    return (matches / a.length + matches / b.length + (matches - t) / matches) / 3;
  };

  const jaroDistance = jaro(a, b);
  const prefix = 0.1;
  const max_prefix_length = 4;
  const commonPrefix = Math.min(a.length, b.length, max_prefix_length);
  return jaroDistance + commonPrefix * prefix * (1 - jaroDistance);
}

export function soundex(word) {
  const soundexMapping = {
    a: '0', e: '0', i: '0', o: '0', u: '0', y: '0',
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6'
  };

  let wordStr = word.toLowerCase().replace(/[^a-z]/g, '');
  if (wordStr === '') return '';

  let result = wordStr[0];
  let prevCode = soundexMapping[result];

  for (let i = 1; i < wordStr.length; i++) {
    let char = wordStr[i];
    let code = soundexMapping[char] || '';

    if (code !== prevCode) {
      result += code;
      prevCode = code;
    }
  }

  return (result + '000').substring(0, 4).toUpperCase();
}

export function metaphone(word) {
  const metaphoneRules = [
    [/[aeiou]/g, ''],
    [/[bcdghjklmnpqrstwxyz]/g, ''],
    [/b/g, 'b'],
    [/c/g, 'k'],
    [/d/g, 't'],
  ];

  let result = word.toLowerCase();
  metaphoneRules.forEach(([regex, replacement]) => {
    result = result.replace(regex, replacement);
  });

  return result;
}

function jaccardSimilarity(str1, str2) {
  const set1 = new Set(str1.split(""));
  const set2 = new Set(str2.split(""));
  const intersection = new Set([...set1].filter(x => set2.has(x))).size;
  const union = set1.size + set2.size - intersection;
  return intersection / union;
}

function ngramSimilarity(str1, str2, n = 2) {
  const getNGrams = (str, n) => {
    let grams = new Set();
    for (let i = 0; i <= str.length - n; i++) grams.add(str.substring(i, i + n));
    return grams;
  };

  const ngrams1 = getNGrams(str1, n);
  const ngrams2 = getNGrams(str2, n);
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x))).size;
  const union = new Set([...ngrams1, ...ngrams2]).size;
  return intersection / union;
}

const algorithmsMap = {
  'levenshtein': (query, word) => 1 - memoizedSimilarity(levenshtein, query, word) / Math.max(query.length, word.length),
  'damerau-levenshtein': (query, word) => 1 - memoizedSimilarity(damerauLevenshtein, query, word) / Math.max(query.length, word.length),
  'jaro-winkler': (query, word) => jaroWinkler(query, word),
  'soundex': (query, word) => query === soundex(word) ? 1 : 0,
  'metaphone': (query, word) => query === metaphone(word) ? 1 : 0,
  'jaccard': (query, word) => jaccardSimilarity(query, word),
  'ngram': (query, word) => ngramSimilarity(query, word, 2),
  'cosine': (query, word) => cosineSimilarity(query, word),
  'tf-idf': (query, word) => tfIdfSimilarity(query, word),
  'smith-waterman': (query, word) => smithWaterman(query, word),
};

export function fuzzyMatch(query, word, threshold = 0.8, algorithms = ["damerau-levenshtein"], customParams = {}) {
  let totalSimilarity = 0;
  let validCount = 0;

  algorithms.forEach(algorithm => {
    const algorithmFunc = algorithmsMap[algorithm];
    if (algorithmFunc) {
      const similarity = algorithmFunc(query, word);
      if (similarity >= threshold) {
        totalSimilarity += similarity;
        validCount++;
      }
    }
  });

  const averageSimilarity = validCount > 0 ? totalSimilarity / validCount : 0;
  return averageSimilarity >= threshold;
}
