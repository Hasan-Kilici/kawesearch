export function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
    );
  
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
  
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
  
    return dp[a.length][b.length];
}

function cosineSimilarity(str1, str2) {
  const vectorize = (str) => {
    const freq = {};
    for (let char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
  };

  const dotProduct = (vec1, vec2) => {
    return Object.keys(vec1).reduce((sum, key) => {
      return sum + (vec1[key] * (vec2[key] || 0));
    }, 0);
  };

  const magnitude = (vec) => {
    return Math.sqrt(Object.values(vec).reduce((sum, val) => sum + val * val, 0));
  };

  const vec1 = vectorize(str1);
  const vec2 = vectorize(str2);

  const dot = dotProduct(vec1, vec2);
  const mag1 = magnitude(vec1);
  const mag2 = magnitude(vec2);

  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (mag1 * mag2);
}

function tfIdfSimilarity(str1, str2) {
  const termFrequency = (str) => {
    const tf = {};
    const words = str.split(/\s+/);
    const totalWords = words.length;
    for (let word of words) {
      tf[word] = (tf[word] || 0) + 1;
    }
    for (let word in tf) {
      tf[word] /= totalWords;
    }
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
    if (idf[word]) {
      score += tf1[word] * idf[word] * tf2[word] * idf[word];
    }
  }
  return score;
}

function smithWaterman(str1, str2) {
  const scoreMatrix = Array.from({ length: str1.length + 1 }, () =>
    Array(str2.length + 1).fill(0)
  );

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
  if (memo[key] !== undefined) {
    return memo[key];
  }
  const result = func(...args);
  memo[key] = result;
  return result;
}

export function damerauLevenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
    );
  
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
  
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
  
        if (
          i > 1 &&
          j > 1 &&
          a[i - 1] === b[j - 2] &&
          a[i - 2] === b[j - 1]
        ) {
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
        let max_dist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
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
            if (a[i] !== b[i]) {
                k++;
            }
        }

        t = k / 2;

        return (matches / a.length + matches / b.length + (matches - t) / matches) / 3;
    }

    const jaroDistance = jaro(a, b);
    const prefix = 0.1;
    const max_prefix_length = 4;
    const commonPrefix = Math.min(a.length, b.length, max_prefix_length);
    const jaroWinklerSimilarity = jaroDistance + commonPrefix * prefix * (1 - jaroDistance);

    return jaroWinklerSimilarity;
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
    
    let firstLetter = wordStr[0];
    wordStr = wordStr.replace(/[aeiouy]/g, '').replace(/([bfpv])/g, '1').replace(/([cgjkqsxz])/g, '2').replace(/([dt])/g, '3').replace(/([lm])/g, '4').replace(/([mn])/g, '5').replace(/([r])/g, '6');
    wordStr = firstLetter + wordStr.slice(1);
    return wordStr.substring(0, 4).padEnd(4, '0').toUpperCase();
}

export function metaphone(word) {
    const metaphoneRules = [
        [/[aeiou]/g, ''],
        [/[bcdghjklmnpqrstwxyz]/g, ''],
        [/[b]/g, 'b'],
        [/[c]/g, 'k'],
        [/[d]/g, 't'],
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
  function getNGrams(str, n) {
      let grams = new Set();
      for (let i = 0; i <= str.length - n; i++) {
          grams.add(str.substring(i, i + n));
      }
      return grams;
  }
  
  const ngrams1 = getNGrams(str1, n);
  const ngrams2 = getNGrams(str2, n);
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x))).size;
  const union = new Set([...ngrams1, ...ngrams2]).size;
  return intersection / union;
}


export function fuzzyMatch(query, word, threshold = 0.8, algorithm = "damerau-levenshtein", customParams = {}) {
  let similarity = 0;

  switch(algorithm) {
    case 'levenshtein':
      similarity = 1 - memoizedSimilarity(levenshtein, query, word) / Math.max(query.length, word.length);
      break;
    case 'damerau-levenshtein':
      similarity = 1 - memoizedSimilarity(damerauLevenshtein, query, word) / Math.max(query.length, word.length);
      break;
    case 'jaro-winkler':
      similarity = jaroWinkler(query, word);
      break;
    case 'soundex':
      similarity = query === soundex(word) ? 1 : 0;
      break;
    case 'metaphone':
      similarity = query === metaphone(word) ? 1 : 0;
      break;
    case 'jaccard':
      similarity = jaccardSimilarity(query, word);
      break;
    case 'ngram':
      similarity = ngramSimilarity(query, word, 2);
      break;
    case 'cosine':
      similarity = cosineSimilarity(query, word);
      break;
    case 'tf-idf':
      similarity = tfIdfSimilarity(query, word);
      break;
    case 'smith-waterman':
      similarity = smithWaterman(query, word);
      break;
  }

  if (customParams?.prefix) {
    const prefix = customParams.prefix;
    const commonPrefix = Math.min(query.length, word.length, prefix);
    similarity += commonPrefix * (1 - similarity);
  }

  return similarity >= threshold;
}
