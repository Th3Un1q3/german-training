export interface GrammarExercise {
  id: string;
  label: string;
}

export interface GrammarLevel {
  level: string;
  name: string;
  exercises: GrammarExercise[];
}

export const GRAMMAR_LEVELS: GrammarLevel[] = [
  {
    level: 'A1',
    name: 'Beginner',
    exercises: [
      { id: 'a1-present-tense', label: 'Present Tense (Präsens)' },
      { id: 'a1-haben-sein', label: 'haben & sein' },
      { id: 'a1-articles', label: 'Articles (der, die, das)' },
      { id: 'a1-noun-gender', label: 'Noun Gender (Genus)' },
      { id: 'a1-noun-plurals', label: 'Noun Plurals' },
      { id: 'a1-personal-pronouns', label: 'Personal Pronouns' },
      { id: 'a1-possessive-pronouns', label: 'Possessive Pronouns' },
      { id: 'a1-nominative-case', label: 'Nominative Case' },
      { id: 'a1-accusative-case', label: 'Accusative Case' },
      { id: 'a1-negation', label: 'Negation (nicht / kein)' },
      { id: 'a1-questions', label: 'Questions (Fragen)' },
      { id: 'a1-main-clauses', label: 'Main Clause Word Order' },
      { id: 'a1-modal-verbs', label: 'Modal Verbs (Präsens)' },
      { id: 'a1-imperative', label: 'Imperative' },
      { id: 'a1-prepositions-time', label: 'Prepositions of Time' },
      { id: 'a1-prepositions-place', label: 'Prepositions of Place' },
    ],
  },
  {
    level: 'A2',
    name: 'Elementary',
    exercises: [
      { id: 'a2-perfect-tense', label: 'Perfect Tense (Perfekt)' },
      { id: 'a2-dative-case', label: 'Dative Case' },
      { id: 'a2-reflexive-verbs', label: 'Reflexive Verbs' },
      { id: 'a2-separable-verbs', label: 'Separable Verbs' },
      { id: 'a2-conjunctions', label: 'Conjunctions (und, aber, weil, dass)' },
      { id: 'a2-adjective-declension', label: 'Adjective Declension' },
      { id: 'a2-comparative-superlative', label: 'Comparative & Superlative' },
      { id: 'a2-preterite', label: 'Simple Past (Präteritum)' },
      { id: 'a2-prepositions-manner', label: 'Prepositions of Manner' },
      { id: 'a2-causal-prepositions', label: 'Causal Prepositions' },
      { id: 'a2-infinitive-with-zu', label: 'Infinitive with/without zu' },
      { id: 'a2-wann-wenn-als', label: 'wann / wenn / als' },
      { id: 'a2-das-dass', label: 'das vs. dass' },
      { id: 'a2-relative-clauses', label: 'Relative Clauses (Nom/Akk)' },
      { id: 'a2-indirect-questions', label: 'Indirect Questions' },
    ],
  },
  {
    level: 'B1',
    name: 'Intermediate',
    exercises: [
      { id: 'b1-past-perfect', label: 'Past Perfect (Plusquamperfekt)' },
      { id: 'b1-future-tense', label: 'Future Tense (Futur I)' },
      { id: 'b1-passive-voice', label: 'Passive Voice (Vorgangspassiv)' },
      { id: 'b1-konjunktiv-ii', label: 'Subjunctive II (Konjunktiv II)' },
      { id: 'b1-relative-clauses-all', label: 'Relative Clauses (all cases)' },
      { id: 'b1-relative-pronouns', label: 'Relative Pronouns' },
      { id: 'b1-conditional-clauses', label: 'Conditional Clauses (wenn/falls)' },
      { id: 'b1-infinitive-clauses', label: 'Infinitive Clauses (um … zu)' },
      { id: 'b1-n-declension', label: 'N-Declension' },
      { id: 'b1-genitiv', label: 'Genitive Case' },
      { id: 'b1-adverbs', label: 'Adverbs (types & position)' },
      { id: 'b1-stehen-liegen-sitzen', label: 'stehen/stellen, liegen/legen, sitzen/setzen' },
      { id: 'b1-modal-verbs-past', label: 'Modal Verbs (Perfekt & Präteritum)' },
      { id: 'b1-tense-overview', label: 'Tense Overview (all tenses)' },
      { id: 'b1-indirect-speech', label: 'Indirect Speech' },
    ],
  },
  {
    level: 'B2',
    name: 'Upper Intermediate',
    exercises: [
      { id: 'b2-future-perfect', label: 'Future Perfect (Futur II)' },
      { id: 'b2-passive-alternatives', label: 'Passive Alternatives (man, sich lassen, -bar)' },
      { id: 'b2-passive-with-modals', label: 'Passive with Modal Verbs' },
      { id: 'b2-konjunktiv-i', label: 'Subjunctive I (Konjunktiv I)' },
      { id: 'b2-conditional-irrealis', label: 'Conditional Irrealis (Gegenwart & Vergangenheit)' },
      { id: 'b2-participles', label: 'Participles (Partizip I & II)' },
      { id: 'b2-participial-attributes', label: 'Participial Attributes (Partizipialattribute)' },
      { id: 'b2-nominalised-adjectives', label: 'Nominalised Adjectives' },
      { id: 'b2-advanced-conjunctions', label: 'Advanced Conjunctions (obschon, sofern, indem)' },
      { id: 'b2-advanced-prepositions', label: 'Prepositions with Cases (mixed)' },
      { id: 'b2-demonstrative-pronouns', label: 'Demonstrative Pronouns' },
      { id: 'b2-indefinite-pronouns', label: 'Indefinite Pronouns' },
      { id: 'b2-transitive-intransitive', label: 'Transitive / Intransitive Verbs' },
      { id: 'b2-zustandspassiv', label: 'Statal Passive (Zustandspassiv)' },
      { id: 'b2-commas', label: 'Comma Rules (Kommaregeln)' },
    ],
  },
  {
    level: 'C1',
    name: 'Advanced',
    exercises: [
      { id: 'c1-participle-clauses', label: 'Participle Clauses (Partizipialsätze)' },
      { id: 'c1-gerundiv', label: 'Gerundive (zu + Partizip I)' },
      { id: 'c1-passive-all-tenses', label: 'Passive (all tenses)' },
      { id: 'c1-konjunktiv-advanced', label: 'Subjunctive I & II (advanced)' },
      { id: 'c1-indirect-speech-all', label: 'Indirect Speech (all forms)' },
      { id: 'c1-conditional-without-wenn', label: 'Conditional Clauses without wenn' },
      { id: 'c1-adjective-formation', label: 'Adjective Formation (from nouns/verbs)' },
      { id: 'c1-advanced-declension', label: 'Advanced Declension (all cases mixed)' },
      { id: 'c1-separable-dual-prefix', label: 'Separable Verbs (dual prefix / both forms)' },
      { id: 'c1-passive-modals-konjunktiv', label: 'Passive with Modals + Konjunktiv' },
      { id: 'c1-genitiv-prepositions', label: 'Genitive Prepositions with other Cases' },
      { id: 'c1-capital-letters', label: 'Capitalisation Rules (Groß-/Kleinschreibung)' },
      { id: 'c1-advanced-adverbs', label: 'Advanced Adverbs (Relativ/Kausal/Steigerung)' },
      { id: 'c1-complex-sentence-structure', label: 'Complex Sentence Structure' },
      { id: 'c1-irregular-verbs', label: 'Irregular Verbs (all tenses)' },
    ],
  },
];
