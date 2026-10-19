/**
 * Offline, rule-based English -> Marathi (Devanagari) phonetic engine.
 *
 * This is the *fallback* used when the online provider (Google Input Tools) is
 * unreachable. It is a real algorithm (longest-match grapheme -> phoneme rules
 * with conjunct, matra and word-final handling), not a lookup of names, but a
 * rules-only engine cannot know word-specific vowel lengths or retroflex
 * consonants, so its output is an approximation. Typing a doubled vowel gives
 * the long form ("aa" -> आ, "ee" -> ई, "oo" -> ऊ).
 */

const VIRAMA = '\u094D';

// Consonant graphemes, tried longest first.
const CONSONANTS = [
  ['chh', 'छ'], ['ksh', 'क्ष'], ['dny', 'ज्ञ'],
  ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['jh', 'झ'], ['th', 'थ'], ['dh', 'ध'],
  ['ph', 'फ'], ['bh', 'भ'], ['sh', 'श'], ['jn', 'ज्ञ'], ['ck', 'क'], ['ng', 'ंग'],
  ['b', 'ब'], ['c', 'क'], ['d', 'द'], ['f', 'फ'], ['g', 'ग'], ['h', 'ह'], ['j', 'ज'],
  ['k', 'क'], ['l', 'ल'], ['m', 'म'], ['n', 'न'], ['p', 'प'], ['q', 'क'], ['r', 'र'],
  ['s', 'स'], ['t', 'त'], ['v', 'व'], ['w', 'व'], ['x', 'क्स'], ['y', 'य'], ['z', 'ज'],
];

// Vowel graphemes, tried longest first: [grapheme, independent form, matra].
const VOWELS = [
  ['aa', 'आ', 'ा'], ['ai', 'ऐ', 'ै'], ['au', 'औ', 'ौ'], ['ee', 'ई', 'ी'], ['ii', 'ई', 'ी'],
  ['oo', 'ऊ', 'ू'], ['uu', 'ऊ', 'ू'], ['ou', 'औ', 'ौ'],
  ['a', 'अ', ''], ['e', 'ए', 'े'], ['i', 'इ', 'ि'], ['o', 'ओ', 'ो'], ['u', 'उ', 'ु'],
];

// Word-final vowel letters after a consonant take their long forms (Sneha -> स्नेहा).
const FINAL_MATRA = { a: 'ा', i: 'ी', u: 'ू' };

function matchAt(word, index, table) {
  for (const entry of table) {
    if (word.startsWith(entry[0], index)) return entry;
  }
  return null;
}

/** Transliterates one run of Latin letters. */
function transliterateWord(input) {
  const word = input.toLowerCase();
  let out = '';
  let afterConsonant = false; // previous output is a consonant still awaiting a vowel
  let i = 0;

  while (i < word.length) {
    const rest = word.length - i;

    // A trailing 'y' after a consonant is the vowel sound ee (Factory -> फॅक्टरी style).
    if (word[i] === 'y' && rest === 1 && afterConsonant) {
      out += 'ी';
      afterConsonant = false;
      i += 1;
      continue;
    }

    const consonant = matchAt(word, i, CONSONANTS);
    // A consonant letter that is really soft 'c' (ce/ci/cy) is an 's' sound.
    if (consonant && consonant[0] === 'c' && 'eiy'.includes(word[i + 1] || '')) {
      out += (afterConsonant ? VIRAMA : '') + 'स';
      afterConsonant = true;
      i += 1;
      continue;
    }
    if (consonant) {
      let glyph = consonant[1];
      // 'sh' before t/th/n is the retroflex ष (Rashtra, Krishna).
      if (consonant[0] === 'sh' && /^(t|n)/.test(word.slice(i + 2))) glyph = 'ष';
      if (consonant[0] === 'ng') {
        out += glyph;
        afterConsonant = true;
        i += consonant[0].length;
        continue;
      }
      out += (afterConsonant ? VIRAMA : '') + glyph;
      afterConsonant = true;
      i += consonant[0].length;
      continue;
    }

    const vowel = matchAt(word, i, VOWELS);
    if (vowel) {
      const [grapheme, independent, matra] = vowel;
      const isFinal = i + grapheme.length === word.length;
      if (afterConsonant) {
        out += isFinal && FINAL_MATRA[grapheme] ? FINAL_MATRA[grapheme] : matra;
      } else {
        out += independent;
      }
      afterConsonant = false;
      i += grapheme.length;
      continue;
    }

    out += word[i];
    afterConsonant = false;
    i += 1;
  }

  return out;
}

export { transliterateWord };
