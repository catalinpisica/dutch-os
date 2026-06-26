const PRACTICE_TYPES = new Set(["word", "expression", "particle", "verb_construction"]);
const GUIDED_TYPE_ORDER = ["word", "expression", "particle", "verb_construction"];

const AUTHORED_SENTENCES = [
  ["word-duur", "Deze jas kost honderd euro. Hij is erg ____.", "duur", "adjective", "This jacket costs one hundred euros. It is very expensive."],
  ["word-goedkoop", "Deze koffie kost maar één euro. Dat is ____.", "goedkoop", "adjective", "This coffee costs only one euro. That is cheap."],
  ["word-hier", "Kom maar ____. Je kunt naast mij zitten.", "hier", "adverb", "Come here. You can sit next to me."],
  ["word-daar", "Zie je die winkel? Ik werk ____.", "daar", "adverb", "Do you see that shop? I work there."],
  ["word-meestal", "Ik drink ____ koffie in de ochtend, maar soms thee.", "meestal", "adverb", "I usually drink coffee in the morning, but sometimes tea."],
  ["word-soms", "Ik fiets vaak, maar ____ neem ik de bus.", "soms", "adverb", "I often cycle, but sometimes I take the bus."],
  ["word-vaak", "Zij sport vier keer per week. Ze sport dus ____.", "vaak", "adverb", "She exercises four times a week. So she exercises often."],
  ["word-nooit", "Hij drinkt geen koffie. Hij drinkt ____ koffie.", "nooit", "adverb", "He does not drink coffee. He never drinks coffee."],
  ["word-natuurlijk", "Kun je me helpen? Ja, ____!", "natuurlijk", "adverb", "Can you help me? Yes, of course!"],
  ["word-open", "Je kunt naar binnen; de winkel is ____.", "open", "adjective", "You can go inside; the shop is open."],
  ["word-leeg", "Er zit niets meer in de zak. De zak is ____.", "leeg", "adjective", "There is nothing left in the bag. The bag is empty."],
  ["word-laat", "Het is al middernacht. Het is erg ____.", "laat", "adjective", "It is already midnight. It is very late."],
  ["word-moe", "Ik heb slecht geslapen, dus ik ben ____.", "moe", "adjective", "I slept badly, so I am tired."],
  ["word-druk", "Ik heb vandaag veel werk. Ik ben erg ____.", "druk", "adjective", "I have a lot of work today. I am very busy."],
  ["word-warm", "De zon schijnt en het is 28 graden. Het is ____.", "warm", "adjective", "The sun is shining and it is 28 degrees. It is warm."],
  ["word-ziek", "Hij heeft koorts en blijft in bed. Hij is ____.", "ziek", "adjective", "He has a fever and stays in bed. He is ill."],
  ["word-prima", "Hoe gaat het? Het gaat ____.", "prima", "adjective", "How are you? I am fine."],
  ["word-vervelend", "Je trein is weer te laat. Wat ____!", "vervelend", "adjective", "Your train is late again. How annoying!"],
  ["word-binnenkomen", "De deur is open. Je mag ____.", "binnenkomen", "verb", "The door is open. You may come in."],
  ["word-drinken", "Wil je koffie of thee ____?", "drinken", "verb", "Would you like to drink coffee or tea?"],
  ["word-slapen", "Ik ben moe. Ik wil vroeg gaan ____.", "slapen", "verb", "I am tired. I want to go to sleep early."],
  ["word-vragen", "Ik weet het niet. Ik ga het aan de leraar ____.", "vragen", "verb", "I do not know. I am going to ask the teacher."],
  ["word-zonder", "Ik drink koffie ____ suiker.", "zonder", "preposition", "I drink coffee without sugar."],
  ["particle-even", "Wacht ____; ik pak mijn jas.", "even", "particle"],
  ["particle-hoor", "Dat is helemaal prima, ____.", "hoor", "particle"],
  ["particle-toch", "Je komt morgen ook, ____?", "toch", "particle"],
  ["particle-nog-steeds", "De bus is twintig minuten te laat en ik wacht ____.", "nog steeds", "particle phrase"],
  ["particle-alweer", "Ben je nu ____ thuis? Dat ging snel!", "alweer", "particle"],
  ["expression-kom-binnen", "De deur is open. ____!", "Kom binnen", "expression"],
  ["expression-het-maakt-me-niet-uit", "Koffie of thee? ____. Kies jij maar.", "Het maakt me niet uit", "expression"],
  ["expression-doe-maar-niet", "Wil je nog koffie? Nee, ____. Ik heb genoeg.", "doe maar niet", "expression"],
  ["expression-zal-ik-doen", "Kun je morgen bellen? Ja, ____. ", "zal ik doen", "expression"],
];

function shuffle(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function uniqueItemsById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function uniqueQuestionsByItemId(questions) {
  const seen = new Set();
  return questions.filter((question) => {
    if (!question?.itemId || seen.has(question.itemId)) return false;
    seen.add(question.itemId);
    return true;
  });
}

function normalize(value) {
  return value
    .toLocaleLowerCase("nl-NL")
    .normalize("NFKD")
    .replace(/[.,!?;:'"()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function distractors(items, target, field, count = 3) {
  const sameType = items.filter((item) => item.id !== target.id && item.type === target.type && item[field]);
  const sameGrammar = target.part_of_speech
    ? sameType.filter((item) => item.part_of_speech === target.part_of_speech)
    : sameType;
  const candidates = [...shuffle(sameGrammar), ...shuffle(sameType)];
  return [...new Set(
    candidates
      .map((item) => practiceValue(item, field))
      .filter((value) => normalize(value) !== normalize(practiceValue(target, field)))
  )].slice(0, count);
}

function practiceDutch(item) {
  if (item.type === "verb_construction" && /\+\s*infinitief/i.test(item.dutch)) {
    return item.infinitive ?? item.dutch.replace(/\s*\+\s*infinitief/i, "").trim();
  }
  return item.dutch;
}

function practiceValue(item, field) {
  return field === "dutch" ? practiceDutch(item) : item[field];
}

function answerNote(item) {
  if (item.type !== "verb_construction") return null;
  const practiceAnswer = practiceDutch(item);
  if (normalize(practiceAnswer) === normalize(item.dutch)) return null;
  return `Pattern: ${item.dutch}. In a sentence, use a conjugated form plus another verb.`;
}

const GRAMMAR_EXPLANATIONS = {
  adjective: "a describing word",
  adverb: "a word that describes how, when, where, or how often",
  expression: "a fixed multi-word phrase",
  noun: "a person, place, thing, or idea",
  particle: "a small context word that changes tone or emphasis",
  "particle phrase": "a short phrase that changes tone, emphasis, or timing",
  preposition: "a word showing place, direction, or relationship",
  pronoun: "a word used instead of a noun",
  "proper noun": "the name of a specific person, place, or thing",
  verb: "an action or state word",
  word: "one vocabulary item",
};

function readableGrammar(value) {
  return String(value ?? "word").replaceAll("_", " ");
}

export function describeGrammar(value) {
  const grammar = readableGrammar(value);
  return `${grammar} — ${GRAMMAR_EXPLANATIONS[grammar] ?? "the kind of Dutch item needed here"}`;
}

function clozeCue(item, grammar = null) {
  const expected = grammar ?? (item.type === "expression"
    ? "expression"
    : item.part_of_speech ?? (item.type === "particle" ? "particle" : "word"));
  return {
    expected: describeGrammar(expected),
    meaning: item.english,
  };
}

function makeChoice(items, item, direction) {
  const from = direction === "nl-en" ? "dutch" : "english";
  const to = direction === "nl-en" ? "english" : "dutch";
  return {
    kind: "choice",
    itemId: item.id,
    label: direction === "nl-en" ? "Choose the English meaning" : "Choose the Dutch translation",
    prompt: practiceValue(item, from),
    answer: practiceValue(item, to),
    answerTranslation: practiceValue(item, from),
    answerNote: answerNote(item),
    options: shuffle([practiceValue(item, to), ...distractors(items, item, to)]),
    direction,
  };
}

function makeTyped(item) {
  return {
    kind: "typed",
    itemId: item.id,
    label: "Write this in Dutch",
    prompt: item.english,
    answer: practiceDutch(item),
    answerTranslation: item.english,
    answerNote: answerNote(item),
    direction: "en-nl",
  };
}

export function buildRetryQuestion(item) {
  return makeTyped(item);
}

function makeContextChoice(items, item, sentence, target, translation) {
  return {
    kind: "choice",
    itemId: item.id,
    label: "What does the highlighted Dutch mean?",
    prompt: sentence,
    contextTarget: target,
    contextTranslation: translation,
    answer: item.english,
    answerTranslation: practiceDutch(item),
    answerNote: answerNote(item),
    options: shuffle([item.english, ...distractors(items, item, "english")]),
    direction: "context-nl-en",
  };
}

function sentenceTokens(sentence) {
  return sentence.trim().split(/\s+/).map((text, index) => ({ id: `${index}-${text}`, text }));
}

function shuffledDifferently(tokens) {
  let shuffled = shuffle(tokens);
  if (shuffled.every((token, index) => token.id === tokens[index].id) && shuffled.length > 1) {
    shuffled = [...shuffled.slice(1), shuffled[0]];
  }
  return shuffled;
}

function makeSentenceBuild(item, example) {
  const tokens = sentenceTokens(example.dutch);
  return {
    kind: "sentence-build",
    itemId: item.id,
    label: "Build this sentence in Dutch",
    prompt: example.english,
    hint: "Tap a chosen word to move it back.",
    answer: example.dutch,
    contextTranslation: example.english,
    tokens: shuffledDifferently(tokens),
    direction: "sentence-build",
  };
}

function wholeTargetInSentence(sentence, target) {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = sentence.match(new RegExp(`(^|\\s)(${escaped})(?=\\s|[.,!?;:]|$)`, "i"));
  return match?.[2] ?? null;
}

function contextSources(allItems) {
  const practicePool = uniqueItemsById(allItems)
    .filter((item) => PRACTICE_TYPES.has(item.type) && item.dutch && item.english);
  const itemsById = new Map(practicePool.map((item) => [item.id, item]));
  const authored = AUTHORED_SENTENCES
    .filter(([itemId, , , , translation]) => itemsById.has(itemId) && translation)
    .map(([itemId, prompt, answer, , translation]) => ({
      item: itemsById.get(itemId),
      sentence: prompt.replace("____", answer),
      target: answer,
      translation,
    }));
  const authoredIds = new Set(authored.map(({ item }) => item.id));
  const sourced = practicePool.flatMap((item) => (item.examples ?? [])
    .map((example) => ({ example, target: example.dutch && wholeTargetInSentence(example.dutch, item.dutch) }))
    .filter(({ example, target }) => example.english && target)
    .slice(0, 1)
    .map(({ example, target }) => ({ item, sentence: example.dutch, target, translation: example.english })))
    .filter(({ item }) => !authoredIds.has(item.id));
  return [...authored, ...sourced];
}

export function buildContextSession(allItems, progress, options = {}) {
  const size = options.size ?? 20;
  const excludedIds = new Set(options.excludeIds ?? []);
  const practicePool = uniqueItemsById(allItems)
    .filter((item) => PRACTICE_TYPES.has(item.type) && item.dutch && item.english);
  let candidates = contextSources(allItems).filter(({ item }) =>
    (options.week === "all" || item.week_start === options.week) && !excludedIds.has(item.id));
  if (!candidates.length && excludedIds.size) {
    candidates = contextSources(allItems).filter(({ item }) =>
      options.week === "all" || item.week_start === options.week);
  }
  candidates.sort((left, right) => {
    const leftProgress = progress.items?.[left.item.id];
    const rightProgress = progress.items?.[right.item.id];
    const leftAttempts = (leftProgress?.correct ?? 0) + (leftProgress?.wrong ?? 0);
    const rightAttempts = (rightProgress?.correct ?? 0) + (rightProgress?.wrong ?? 0);
    return leftAttempts - rightAttempts
      || (leftProgress?.lastPracticed ?? "").localeCompare(rightProgress?.lastPracticed ?? "")
      || left.item.dutch.localeCompare(right.item.dutch, "nl");
  });
  const selected = candidates.slice(0, Math.min(size, candidates.length));
  return {
    questions: selected.map(({ item, sentence, target, translation }) =>
      makeContextChoice(practicePool, item, sentence, target, translation)),
    sourceCount: candidates.length,
  };
}

function makeCloze(item, suppliedExample = null) {
  const example = suppliedExample ?? item.examples?.find((candidate) => {
    const itemText = item.dutch.replace(/[.!?]$/, "");
    return candidate.dutch.toLocaleLowerCase("nl-NL").includes(itemText.toLocaleLowerCase("nl-NL"));
  });
  if (!example) return null;
  const word = item.dutch.replace(/[.!?]$/, "");
  if (!example.dutch.toLocaleLowerCase("nl-NL").includes(word.toLocaleLowerCase("nl-NL"))) return null;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|\\s)${escaped}(?=\\s|[.,!?;:]|$)`, "i");
  const cue = clozeCue(item);
  return {
    kind: "cloze",
    itemId: item.id,
    label: "Complete the sentence",
    prompt: example.dutch.replace(pattern, (match, prefix) => `${prefix}____`),
    hint: example.english,
    expected: cue.expected,
    meaningHint: cue.meaning,
    answer: word,
    answerTranslation: item.english,
    direction: "cloze",
  };
}

export function buildSession(allItems, options = {}) {
  const size = options.size ?? 10;
  const excludedIds = new Set(options.excludeIds ?? []);
  const uniqueItems = uniqueItemsById(allItems);
  const recognitionPool = uniqueItems.filter((item) =>
    PRACTICE_TYPES.has(item.type)
    && item.dutch
    && item.english
  );
  let eligible = uniqueItems.filter((item) =>
    PRACTICE_TYPES.has(item.type)
    && item.dutch
    && item.english
    && (options.week === "all" || item.week_start === options.week)
    && !excludedIds.has(item.id)
  );
  if (options.mode === "building") {
    const candidates = shuffle(eligible.flatMap((item) => (item.examples ?? [])
      .filter((example) => {
        const wordCount = example.dutch?.trim().split(/\s+/).length ?? 0;
        return example.dutch && example.english && wordCount >= 3 && wordCount <= 9;
      })
      .map((example) => makeSentenceBuild(item, example))))
      .filter((question, index, values) =>
        values.findIndex((candidate) => normalize(candidate.answer) === normalize(question.answer)) === index);
    const uniqueCandidates = uniqueQuestionsByItemId(candidates);
    const questions = uniqueCandidates.slice(0, size);
    return { questions, sourceCount: uniqueCandidates.length };
  }
  if (options.mode === "sentences") {
    const eligibleIds = new Set(eligible.map((item) => item.id));
    const eligibleById = new Map(eligible.map((item) => [item.id, item]));
    const sourceQuestions = eligible.flatMap((item) =>
      (item.examples ?? []).map((example) => makeCloze(item, example)).filter(Boolean)
    );
    const authoredQuestions = AUTHORED_SENTENCES
      .filter(([itemId]) => eligibleIds.has(itemId))
      .map(([itemId, prompt, answer, expected]) => {
        const item = eligibleById.get(itemId);
        const cue = clozeCue(item, expected);
        return {
          kind: "cloze",
          itemId,
          label: "Complete the sentence",
          prompt,
          hint: null,
          expected: cue.expected,
          meaningHint: cue.meaning,
          answer,
          answerTranslation: item.english,
          direction: "cloze",
        };
      });
    const candidates = shuffle([...authoredQuestions, ...sourceQuestions])
      .filter((question, index, values) => values.findIndex((candidate) => candidate.prompt === question.prompt) === index)
      .map((question) => ({ ...question, hint: null }));
    const questions = uniqueQuestionsByItemId(candidates).slice(0, size);
    return { questions, sourceCount: questions.length };
  }
  const weakIds = new Set(options.weakIds ?? []);
  const weak = shuffle(eligible.filter((item) => weakIds.has(item.id)));
  const remaining = shuffle(eligible.filter((item) => !weakIds.has(item.id)));
  const selected = [...weak, ...remaining].slice(0, Math.min(size, eligible.length));
  const questions = selected.map((item, index) => {
    const cloze = makeCloze(item);
    if (options.mode === "recognition") return makeChoice(recognitionPool, item, index % 2 === 0 ? "nl-en" : "en-nl");
    if (options.mode === "recall") return makeTyped(item);
    if (index % 4 === 3 && cloze) return cloze;
    if (index % 3 === 2) return makeTyped(item);
    return makeChoice(eligible, item, index % 2 === 0 ? "nl-en" : "en-nl");
  });
  return { questions, sourceCount: eligible.length };
}

function firstBuildableExample(item) {
  return (item.examples ?? []).find((example) => {
    const wordCount = example.dutch?.trim().split(/\s+/).length ?? 0;
    return example.dutch && example.english && wordCount >= 3 && wordCount <= 9;
  });
}

function guidedQuestionForTarget(item, index, practicePool, context) {
  const cloze = makeCloze(item);
  const buildable = firstBuildableExample(item);
  const variants = [
    context ? makeContextChoice(practicePool, item, context.sentence, context.target, context.translation) : null,
    makeChoice(practicePool, item, "nl-en"),
    makeChoice(practicePool, item, "en-nl"),
    makeTyped(item),
    cloze ? { ...cloze, hint: null } : null,
    buildable ? makeSentenceBuild(item, buildable) : null,
  ].filter(Boolean);
  return variants[index % variants.length];
}

function practicePriority(item, progress) {
  const itemProgress = progress.items?.[item.id];
  const correct = itemProgress?.correct ?? 0;
  const wrong = itemProgress?.wrong ?? 0;
  const attempts = correct + wrong;
  const mistakeDebt = itemProgress?.mistakeDebt ?? Math.max(0, wrong - correct);
  return {
    item,
    attempts,
    weakness: mistakeDebt + Math.max(0, wrong - correct),
    lastPracticed: itemProgress?.lastPracticed ?? "",
    seed: Math.random(),
  };
}

function selectGuidedTargets(eligible, targetCount) {
  const selected = [];
  const selectedIds = new Set();
  GUIDED_TYPE_ORDER.forEach((type) => {
    if (selected.length >= targetCount) return;
    const item = eligible.find((candidate) => candidate.type === type && !selectedIds.has(candidate.id));
    if (!item) return;
    selected.push(item);
    selectedIds.add(item.id);
  });
  eligible.forEach((item) => {
    if (selected.length >= targetCount || selectedIds.has(item.id)) return;
    selected.push(item);
    selectedIds.add(item.id);
  });
  return selected;
}

export function buildGuidedSession(allItems, progress, options = {}) {
  const size = options.size ?? 36;
  const week = options.week ?? "all";
  const practicePool = uniqueItemsById(allItems)
    .filter((item) => PRACTICE_TYPES.has(item.type) && item.dutch && item.english);
  const eligible = practicePool
    .filter((item) => week === "all" || item.week_start === week)
    .map((item) => practicePriority(item, progress))
    .sort((left, right) =>
      right.weakness - left.weakness
      || left.attempts - right.attempts
      || left.lastPracticed.localeCompare(right.lastPracticed)
      || left.seed - right.seed
      || left.item.dutch.localeCompare(right.item.dutch, "nl"))
    .map((entry) => entry.item);
  const targetCount = Math.min(options.targetCount ?? size, eligible.length);
  const targets = selectGuidedTargets(eligible, targetCount);
  const targetIds = new Set(targets.map((item) => item.id));
  const contextsById = new Map(contextSources(allItems)
    .filter(({ item }) => targetIds.has(item.id))
    .map((source) => [source.item.id, source]));
  const questions = targets
    .map((item, index) => guidedQuestionForTarget(item, index, practicePool, contextsById.get(item.id)))
    .slice(0, size);
  return {
    questions,
    sourceCount: eligible.length,
    targetCount: targets.length,
  };
}

function reviewIntervalDays(itemProgress) {
  if (!itemProgress || itemProgress.wrong > itemProgress.correct) return 0;
  const strength = Math.max(0, itemProgress.correct - itemProgress.wrong);
  return [0, 1, 3, 7, 14, 30][Math.min(strength, 5)];
}

function daysSince(dateValue, now) {
  if (!dateValue) return Number.POSITIVE_INFINITY;
  const date = new Date(`${dateValue}T12:00:00`);
  return Math.floor((now.getTime() - date.getTime()) / 86400000);
}

export function buildReviewQueue(allItems, progress, options = {}) {
  const now = options.now ?? new Date();
  const week = options.week ?? "all";
  const size = options.size ?? 20;
  const ranked = uniqueItemsById(allItems)
    .filter((item) => PRACTICE_TYPES.has(item.type)
      && item.dutch
      && item.english
      && (week === "all" || item.week_start === week))
    .map((item) => {
      const itemProgress = progress.items?.[item.id];
      const interval = reviewIntervalDays(itemProgress);
      const elapsed = daysSince(itemProgress?.lastPracticed, now);
      const unseen = !itemProgress;
      return {
        item,
        due: unseen || elapsed >= interval,
        priority: itemProgress?.wrong > itemProgress?.correct ? 0 : unseen ? 2 : 1,
        weakness: itemProgress ? itemProgress.wrong - itemProgress.correct : 0,
        overdue: elapsed - interval,
      };
    })
    .filter((entry) => entry.due)
    .sort((left, right) => left.priority - right.priority
      || right.weakness - left.weakness
      || right.overdue - left.overdue
      || left.item.dutch.localeCompare(right.item.dutch, "nl"));
  return {
    items: ranked.slice(0, size).map((entry) => entry.item),
    dueCount: ranked.length,
  };
}

export function buildReviewSession(allItems, progress, options = {}) {
  const queue = buildReviewQueue(allItems, progress, options);
  const recognitionPool = uniqueItemsById(allItems)
    .filter((item) => PRACTICE_TYPES.has(item.type) && item.dutch && item.english);
  const questions = queue.items.map((item, index) => {
    const cloze = makeCloze(item);
    if (index % 3 === 0) return makeChoice(recognitionPool, item, index % 2 === 0 ? "nl-en" : "en-nl");
    if (index % 3 === 1) return makeTyped(item);
    return cloze ?? makeTyped(item);
  });
  return { questions, sourceCount: queue.dueCount };
}

function unresolvedMistakes(itemProgress) {
  if (!itemProgress) return 0;
  return itemProgress.mistakeDebt ?? Math.max(0, (itemProgress.wrong ?? 0) - (itemProgress.correct ?? 0));
}

export function buildMistakeQueue(allItems, progress, options = {}) {
  const week = options.week ?? "all";
  const size = options.size ?? 20;
  const ranked = uniqueItemsById(allItems)
    .filter((item) => PRACTICE_TYPES.has(item.type)
      && item.dutch
      && item.english
      && (week === "all" || item.week_start === week))
    .map((item) => ({
      item,
      debt: unresolvedMistakes(progress.items?.[item.id]),
      lastPracticed: progress.items?.[item.id]?.lastPracticed ?? "",
    }))
    .filter((entry) => entry.debt > 0)
    .sort((left, right) => right.debt - left.debt
      || left.lastPracticed.localeCompare(right.lastPracticed)
      || left.item.dutch.localeCompare(right.item.dutch, "nl"));
  return {
    items: ranked.slice(0, size).map((entry) => entry.item),
    itemCount: ranked.length,
    mistakeCount: ranked.reduce((total, entry) => total + entry.debt, 0),
  };
}

export function buildMistakeSession(allItems, progress, options = {}) {
  const queue = buildMistakeQueue(allItems, progress, options);
  const questions = uniqueItemsById(queue.items).map((item, index) => {
    const cloze = makeCloze(item);
    return index % 2 === 1 && cloze ? cloze : makeTyped(item);
  });
  return { questions, sourceCount: queue.itemCount };
}

export function checkAnswer(question, response) {
  return normalize(response) === normalize(question.answer);
}

function progressKey(profile) {
  return `dutch-os-progress:${profile}`;
}

export function loadProgress(profile = "catalin") {
  try {
    const key = progressKey(profile);
    const stored = localStorage.getItem(key);
    if (stored) return normalizeProgress(JSON.parse(stored), key);

    // Preserve progress created before profiles existed as Catalin's history.
    if (profile === "catalin") {
      const legacy = localStorage.getItem("dutch-os-progress");
      if (legacy) {
        localStorage.setItem(key, legacy);
        localStorage.removeItem("dutch-os-progress");
        return normalizeProgress(JSON.parse(legacy), key);
      }
    }
    return defaultProgress();
  } catch {
    return defaultProgress();
  }
}

function mondayOf(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return date.toLocaleDateString("en-CA");
}

function normalizeProgress(progress, key) {
  let changed = false;
  progress.byWeek ??= {};
  progress.items ??= {};
  if (!Object.keys(progress.byWeek).length && progress.lastPracticeDate) {
    const week = mondayOf(progress.lastPracticeDate);
    progress.byWeek[week] = {
      sessions: progress.sessions ?? 0,
      answered: progress.answered ?? 0,
      correct: progress.correct ?? 0,
      xp: progress.xp ?? 0,
      items: {},
    };
    localStorage.setItem(key, JSON.stringify(progress));
  }
  Object.values(progress.byWeek).forEach((week) => { week.items ??= {}; });
  Object.values(progress.items ?? {}).forEach((item) => {
    if (item.mistakeDebt === undefined) {
      item.mistakeDebt = Math.max(0, (item.wrong ?? 0) - (item.correct ?? 0));
      changed = true;
    }
  });
  if (changed) localStorage.setItem(key, JSON.stringify(progress));
  return progress;
}

function defaultProgress() {
  return {
    sessions: 0,
    answered: 0,
    correct: 0,
    xp: 0,
    streak: 0,
    lastPracticeDate: null,
    byWeek: {},
    items: {},
  };
}

export function saveSessionProgress(results, profile = "catalin", options = {}) {
  const progress = loadProgress(profile);
  const today = new Date().toLocaleDateString("en-CA");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
  const countSession = options.countSession !== false;
  if (progress.lastPracticeDate !== today) {
    progress.streak = progress.lastPracticeDate === yesterday ? progress.streak + 1 : 1;
  }
  progress.lastPracticeDate = today;
  if (countSession) progress.sessions += 1;
  progress.answered += results.length;
  progress.correct += results.filter((result) => result.correct).length;
  const earnedXp = results.reduce((total, result) => total + (result.correct ? 10 : 2), 0);
  const correctAnswers = results.filter((result) => result.correct).length;
  progress.xp += earnedXp;
  const week = mondayOf(today);
  const weekly = progress.byWeek[week] ?? { sessions: 0, answered: 0, correct: 0, xp: 0, items: {} };
  if (countSession) weekly.sessions += 1;
  weekly.answered += results.length;
  weekly.correct += correctAnswers;
  weekly.xp += earnedXp;
  progress.byWeek[week] = weekly;
  results.forEach((result) => {
    const item = progress.items[result.itemId] ?? { correct: 0, wrong: 0, lastPracticed: null };
    item.mistakeDebt ??= Math.max(0, item.wrong - item.correct);
    item[result.correct ? "correct" : "wrong"] += 1;
    item.mistakeDebt = result.correct ? Math.max(0, item.mistakeDebt - 1) : item.mistakeDebt + 1;
    item.lastPracticed = today;
    progress.items[result.itemId] = item;
    const weeklyItem = weekly.items[result.itemId] ?? { correct: 0, wrong: 0, lastPracticed: null };
    weeklyItem[result.correct ? "correct" : "wrong"] += 1;
    weeklyItem.lastPracticed = today;
    weekly.items[result.itemId] = weeklyItem;
  });
  localStorage.setItem(progressKey(profile), JSON.stringify(progress));
  return progress;
}
