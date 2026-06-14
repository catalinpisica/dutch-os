const PRACTICE_TYPES = new Set(["word", "expression", "particle"]);

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

function makeCloze(item) {
  const example = item.examples?.find((candidate) => {
    const itemText = item.dutch.replace(/[.!?]$/, "");
    return itemText.split(/\s+/).length === 1 && candidate.dutch.toLocaleLowerCase("nl-NL").includes(itemText.toLocaleLowerCase("nl-NL"));
  });
  if (!example) return null;
  const word = item.dutch.replace(/[.!?]$/, "");
  const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return {
    kind: "cloze",
    itemId: item.id,
    label: "Complete the sentence",
    prompt: example.dutch.replace(pattern, "____"),
    hint: example.english,
    answer: word,
    direction: "cloze",
  };
}

export function buildSession(allItems, options = {}) {
  const size = options.size ?? 10;
  const eligible = allItems.filter((item) =>
    PRACTICE_TYPES.has(item.type)
    && item.dutch
    && item.english
    && (options.week === "all" || item.week_start === options.week)
  );
  const weakIds = new Set(options.weakIds ?? []);
  const weak = shuffle(eligible.filter((item) => weakIds.has(item.id)));
  const remaining = shuffle(eligible.filter((item) => !weakIds.has(item.id)));
  const selected = [...weak, ...remaining].slice(0, Math.min(size, eligible.length));
  const questions = selected.map((item, index) => {
    const cloze = makeCloze(item);
    if (options.mode === "recognition") return makeChoice(eligible, item, index % 2 === 0 ? "nl-en" : "en-nl");
    if (options.mode === "recall") {
      if (index % 3 === 2 && cloze) return cloze;
      return makeTyped(item);
    }
    if (index % 4 === 3 && cloze) return cloze;
    if (index % 3 === 2) return makeTyped(item);
    return makeChoice(eligible, item, index % 2 === 0 ? "nl-en" : "en-nl");
  });
  return { questions, sourceCount: eligible.length };
}

export function checkAnswer(question, response) {
  return normalize(response) === normalize(question.answer);
}

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem("dutch-os-progress")) ?? defaultProgress();
  } catch {
    return defaultProgress();
  }
}

function defaultProgress() {
  return {
    sessions: 0,
    answered: 0,
    correct: 0,
    xp: 0,
    streak: 0,
    lastPracticeDate: null,
    items: {},
  };
}

export function saveSessionProgress(results) {
  const progress = loadProgress();
  const today = new Date().toLocaleDateString("en-CA");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
  if (progress.lastPracticeDate !== today) {
    progress.streak = progress.lastPracticeDate === yesterday ? progress.streak + 1 : 1;
  }
  progress.lastPracticeDate = today;
  progress.sessions += 1;
  progress.answered += results.length;
  progress.correct += results.filter((result) => result.correct).length;
  progress.xp += results.reduce((total, result) => total + (result.correct ? 10 : 2), 0);
  results.forEach((result) => {
    const item = progress.items[result.itemId] ?? { correct: 0, wrong: 0, lastPracticed: null };
    item[result.correct ? "correct" : "wrong"] += 1;
    item.lastPracticed = today;
    progress.items[result.itemId] = item;
  });
  localStorage.setItem("dutch-os-progress", JSON.stringify(progress));
  return progress;
}
