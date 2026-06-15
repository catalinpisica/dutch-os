const PRACTICE_TYPES = new Set(["word", "expression", "particle"]);

const AUTHORED_SENTENCES = [
  ["word-duur", "Deze jas kost honderd euro. Hij is erg ____.", "duur", "adjective"],
  ["word-goedkoop", "Deze koffie kost maar één euro. Dat is ____.", "goedkoop", "adjective"],
  ["word-hier", "Kom maar ____. Je kunt naast mij zitten.", "hier", "adverb"],
  ["word-daar", "Zie je die winkel? Ik werk ____.", "daar", "adverb"],
  ["word-meestal", "Ik drink ____ koffie in de ochtend, maar soms thee.", "meestal", "adverb"],
  ["word-soms", "Ik fiets vaak, maar ____ neem ik de bus.", "soms", "adverb"],
  ["word-vaak", "Zij sport vier keer per week. Ze sport dus ____.", "vaak", "adverb"],
  ["word-nooit", "Hij drinkt geen koffie. Hij drinkt ____ koffie.", "nooit", "adverb"],
  ["word-natuurlijk", "Kun je me helpen? Ja, ____!", "natuurlijk", "adverb"],
  ["word-open", "Je kunt naar binnen; de winkel is ____.", "open", "adjective"],
  ["word-leeg", "Er zit niets meer in de zak. De zak is ____.", "leeg", "adjective"],
  ["word-laat", "Het is al middernacht. Het is erg ____.", "laat", "adjective"],
  ["word-moe", "Ik heb slecht geslapen, dus ik ben ____.", "moe", "adjective"],
  ["word-druk", "Ik heb vandaag veel werk. Ik ben erg ____.", "druk", "adjective"],
  ["word-warm", "De zon schijnt en het is 28 graden. Het is ____.", "warm", "adjective"],
  ["word-ziek", "Hij heeft koorts en blijft in bed. Hij is ____.", "ziek", "adjective"],
  ["word-prima", "Hoe gaat het? Het gaat ____.", "prima", "adjective"],
  ["word-vervelend", "Je trein is weer te laat. Wat ____!", "vervelend", "adjective"],
  ["word-binnenkomen", "De deur is open. Je mag ____.", "binnenkomen", "verb"],
  ["word-drinken", "Wil je koffie of thee ____?", "drinken", "verb"],
  ["word-slapen", "Ik ben moe. Ik wil vroeg gaan ____.", "slapen", "verb"],
  ["word-vragen", "Ik weet het niet. Ik ga het aan de leraar ____.", "vragen", "verb"],
  ["word-zonder", "Ik drink koffie ____ suiker.", "zonder", "preposition"],
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

function normalize(value) {
  return value
    .toLocaleLowerCase("nl-NL")
    .normalize("NFKD")
    .replace(/[.,!?;:'"()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function distractors(items, target, field, count = 3) {
  return [...new Set(
    shuffle(items.filter((item) => item.id !== target.id && item[field]))
      .map((item) => item[field])
      .filter((value) => normalize(value) !== normalize(target[field]))
  )].slice(0, count);
}

function makeChoice(items, item, direction) {
  const from = direction === "nl-en" ? "dutch" : "english";
  const to = direction === "nl-en" ? "english" : "dutch";
  return {
    kind: "choice",
    itemId: item.id,
    label: direction === "nl-en" ? "Choose the English meaning" : "Choose the Dutch translation",
    prompt: item[from],
    answer: item[to],
    options: shuffle([item[to], ...distractors(items, item, to)]),
    direction,
  };
}

function makeTyped(item) {
  return {
    kind: "typed",
    itemId: item.id,
    label: "Write this in Dutch",
    prompt: item.english,
    answer: item.dutch,
    direction: "en-nl",
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
  return {
    kind: "cloze",
    itemId: item.id,
    label: "Complete the sentence",
    prompt: example.dutch.replace(pattern, (match, prefix) => `${prefix}____`),
    hint: example.english,
    expected: item.type === "expression"
      ? "expression"
      : item.part_of_speech ?? (item.type === "particle" ? "particle" : "word"),
    answer: word,
    direction: "cloze",
  };
}

export function buildSession(allItems, options = {}) {
  const size = options.size ?? 10;
  const excludedIds = new Set(options.excludeIds ?? []);
  let eligible = allItems.filter((item) =>
    PRACTICE_TYPES.has(item.type)
    && item.dutch
    && item.english
    && (options.week === "all" || item.week_start === options.week)
    && !excludedIds.has(item.id)
  );
  if (options.mode === "sentences") {
    const eligibleIds = new Set(eligible.map((item) => item.id));
    const sourceQuestions = eligible.flatMap((item) =>
      (item.examples ?? []).map((example) => makeCloze(item, example)).filter(Boolean)
    );
    const authoredQuestions = AUTHORED_SENTENCES
      .filter(([itemId]) => eligibleIds.has(itemId))
      .map(([itemId, prompt, answer, expected]) => ({
        kind: "cloze",
        itemId,
        label: "Complete the sentence",
        prompt,
        hint: null,
        expected,
        answer,
        direction: "cloze",
      }));
    const questions = shuffle([...authoredQuestions, ...sourceQuestions])
      .filter((question, index, values) => values.findIndex((candidate) => candidate.prompt === question.prompt) === index)
      .slice(0, size)
      .map((question) => ({ ...question, hint: null }));
    return { questions, sourceCount: questions.length };
  }
  const weakIds = new Set(options.weakIds ?? []);
  const weak = shuffle(eligible.filter((item) => weakIds.has(item.id)));
  const remaining = shuffle(eligible.filter((item) => !weakIds.has(item.id)));
  const selected = [...weak, ...remaining].slice(0, Math.min(size, eligible.length));
  const questions = selected.map((item, index) => {
    const cloze = makeCloze(item);
    if (options.mode === "recognition") return makeChoice(eligible, item, index % 2 === 0 ? "nl-en" : "en-nl");
    if (options.mode === "recall") return makeTyped(item);
    if (index % 4 === 3 && cloze) return cloze;
    if (index % 3 === 2) return makeTyped(item);
    return makeChoice(eligible, item, index % 2 === 0 ? "nl-en" : "en-nl");
  });
  return { questions, sourceCount: eligible.length };
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
  progress.byWeek ??= {};
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

export function saveSessionProgress(results, profile = "catalin") {
  const progress = loadProgress(profile);
  const today = new Date().toLocaleDateString("en-CA");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
  if (progress.lastPracticeDate !== today) {
    progress.streak = progress.lastPracticeDate === yesterday ? progress.streak + 1 : 1;
  }
  progress.lastPracticeDate = today;
  progress.sessions += 1;
  progress.answered += results.length;
  progress.correct += results.filter((result) => result.correct).length;
  const earnedXp = results.reduce((total, result) => total + (result.correct ? 10 : 2), 0);
  const correctAnswers = results.filter((result) => result.correct).length;
  progress.xp += earnedXp;
  const week = mondayOf(today);
  const weekly = progress.byWeek[week] ?? { sessions: 0, answered: 0, correct: 0, xp: 0, items: {} };
  weekly.sessions += 1;
  weekly.answered += results.length;
  weekly.correct += correctAnswers;
  weekly.xp += earnedXp;
  progress.byWeek[week] = weekly;
  results.forEach((result) => {
    const item = progress.items[result.itemId] ?? { correct: 0, wrong: 0, lastPracticed: null };
    item[result.correct ? "correct" : "wrong"] += 1;
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
