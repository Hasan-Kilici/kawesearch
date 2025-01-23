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

export function fuzzyMatch(query, word, threshold = 0.8, algorithm = "damerau-levenshtein") {
    let similarity = 0;
    
    switch(algorithm) {
        case 'levenshtein':
            similarity = 1 - levenshtein(query, word) / Math.max(query.length, word.length);
            break;
        case 'damerau-levenshtein':
            similarity = 1 - damerauLevenshtein(query, word) / Math.max(query.length, word.length);
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
    }
    
    return similarity >= threshold;
}
