import { loadCanonicalItem, loadDashboardData, loadPracticeItems } from "../data-loader/repository.js";
import { buildMistakeQueue, buildMistakeSession, buildReviewQueue, buildReviewSession, buildSession, checkAnswer, describeGrammar, loadProgress, saveSessionProgress } from "./quiz.js?v=20260615-4";

const TYPE_LABELS = {
  word: "Word",
  expression: "Expression",
  particle: "Particle",
  grammar_pattern: "Grammar",
  verb_construction: "Verb construction",
  dialogue: "Dialogue",
  mistake: "Mistake",
};

const TYPE_PLURALS = {
  word: "Words",
  expression: "Expressions",
  particle: "Particles",
  grammar_pattern: "Grammar",
  verb_construction: "Verb constructions",
  dialogue: "Dialogues",
  mistake: "Mistakes",
};

const TYPE_ICONS = {
  word: "Aa",
  expression: "“ ”",
  particle: "·",
  grammar_pattern: "S",
  verb_construction: "V",
  dialogue: "↔",
  mistake: "!",
};

const PROFILES = {
  catalin: { name: "Catalin", avatar: "./assets/profiles/catalin.jpg" },
  dana: { name: "Dana", avatar: "./assets/profiles/dana.jpg" },
};

function loadActiveProfile() {
  const profile = localStorage.getItem("dutch-os-active-profile");
  return PROFILES[profile] ? profile : "catalin";
}

const state = {
  data: null,
  query: "",
  type: "all",
  week: "all",
  visible: 24,
  practiceItems: null,
  lesson: null,
  academyScope: "week",
  leaderboardScope: "week",
  simulator: null,
  mobileView: "home",
  previousMobileView: "home",
  profile: loadActiveProfile(),
};

const elements = {
  statsGrid: document.querySelector("#stats-grid"),
  latestWeek: document.querySelector("#latest-week"),
  latestWeekCount: document.querySelector("#latest-week-count"),
  heroSummary: document.querySelector("#hero-summary"),
  updatedLabel: document.querySelector("#updated-label"),
  leaderboardScopes: document.querySelectorAll("[data-leaderboard-scope]"),
  leaderboardList: document.querySelector("#leaderboard-list"),
  searchForm: document.querySelector("#search-form"),
  searchInput: document.querySelector("#search-input"),
  typeFilter: document.querySelector("#type-filter"),
  weekFilter: document.querySelector("#week-filter"),
  itemGrid: document.querySelector("#item-grid"),
  resultCount: document.querySelector("#result-count"),
  loadMore: document.querySelector("#load-more"),
  activeFilter: document.querySelector("#active-filter"),
  activeFilterLabel: document.querySelector("#active-filter-label"),
  clearFilters: document.querySelector("#clear-filters"),
  dialog: document.querySelector("#item-dialog"),
  dialogType: document.querySelector("#dialog-type"),
  dialogTitle: document.querySelector("#dialog-title"),
  dialogContent: document.querySelector("#dialog-content"),
  dialogClose: document.querySelector("#dialog-close"),
  themeToggle: document.querySelector("#theme-toggle"),
  profileControl: document.querySelector(".profile-control"),
  profileTrigger: document.querySelector("#profile-trigger"),
  profileMenu: document.querySelector("#profile-menu"),
  profileName: document.querySelector("#profile-name"),
  profileOptions: document.querySelectorAll("[data-profile]"),
  profileAvatar: document.querySelector("#profile-avatar"),
  fatalError: document.querySelector("#fatal-error"),
  academyStarts: document.querySelectorAll(".academy-start"),
  academyScopes: document.querySelectorAll("[data-scope]"),
  openDictionary: document.querySelector("#open-dictionary"),
  dictionaryStageCopy: document.querySelector("#dictionary-stage-copy"),
  practiceXp: document.querySelector("#practice-xp"),
  practiceStreak: document.querySelector("#practice-streak"),
  practiceAccuracy: document.querySelector("#practice-accuracy"),
  coverageRing: document.querySelector("#coverage-ring"),
  coverageTitle: document.querySelector("#coverage-title"),
  coveragePercent: document.querySelector("#coverage-percent"),
  coverageDetail: document.querySelector("#coverage-detail"),
  coverageBar: document.querySelector("#coverage-bar"),
  reviewQueueDetail: document.querySelector("#review-queue-detail"),
  startReviewQueue: document.querySelector("#start-review-queue"),
  mistakeQueueDetail: document.querySelector("#mistake-queue-detail"),
  startMistakeReview: document.querySelector("#start-mistake-review"),
  lessonDialog: document.querySelector("#lesson-dialog"),
  lessonClose: document.querySelector("#lesson-close"),
  lessonProgressBar: document.querySelector("#lesson-progress-bar"),
  lessonCounter: document.querySelector("#lesson-counter"),
  questionLabel: document.querySelector("#question-label"),
  lessonTitle: document.querySelector("#lesson-title"),
  questionHint: document.querySelector("#question-hint"),
  answerArea: document.querySelector("#answer-area"),
  lessonFooter: document.querySelector("#lesson-footer"),
  lessonFeedback: document.querySelector("#lesson-feedback"),
  feedbackTitle: document.querySelector("#feedback-title"),
  feedbackCopy: document.querySelector("#feedback-copy"),
  lessonRetry: document.querySelector("#lesson-retry"),
  lessonCheck: document.querySelector("#lesson-check"),
  dictionaryDialog: document.querySelector("#dictionary-dialog"),
  dictionaryClose: document.querySelector("#dictionary-close"),
  dictionaryScopeLabel: document.querySelector("#dictionary-scope-label"),
  dictionaryWeekControl: document.querySelector("#dictionary-week-control"),
  simulatorStarts: document.querySelectorAll(".simulator-start"),
  simulatorDialog: document.querySelector("#simulator-dialog"),
  simulatorClose: document.querySelector("#simulator-close"),
  simulatorProgress: document.querySelector("#simulator-progress"),
  simulatorCounter: document.querySelector("#simulator-counter"),
  simulatorLabel: document.querySelector("#simulator-label"),
  simulatorQuestion: document.querySelector("#simulator-question"),
  simulatorVisual: document.querySelector("#simulator-visual"),
  simulatorAnswers: document.querySelector("#simulator-answers"),
  simulatorFeedback: document.querySelector("#simulator-feedback"),
  simulatorNext: document.querySelector("#simulator-next"),
  simulatorRulesButton: document.querySelector("#simulator-rules-button"),
  simulatorRules: document.querySelector("#simulator-rules"),
  rulesTitle: document.querySelector("#rules-title"),
  rulesContent: document.querySelector("#rules-content"),
  rulesClose: document.querySelector("#rules-close"),
  mobileTabs: document.querySelectorAll("[data-mobile-view]"),
};

function isMobileLayout() {
  return window.matchMedia("(max-width: 620px)").matches;
}

function showMobileView(view, options = {}) {
  if (view === "dictionary") {
    state.previousMobileView = state.mobileView === "dictionary" ? state.previousMobileView : state.mobileView;
  } else {
    state.mobileView = view;
  }
  document.body.dataset.mobileView = view;
  elements.mobileTabs.forEach((button) => {
    const active = button.dataset.mobileView === view;
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (options.scroll !== false) window.scrollTo({ top: 0, behavior: options.smooth ? "smooth" : "auto" });
}

function closeDictionary() {
  elements.dictionaryDialog.close();
  if (isMobileLayout()) showMobileView(state.previousMobileView, { scroll: false });
}

function mondayOf(date) {
  const value = new Date(date);
  const day = value.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + offset);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const calendarDay = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${calendarDay}`;
}

function formatWeek(isoDate, options = {}) {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: options.year ? "numeric" : undefined,
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderStats() {
  const { statistics } = state.data;
  const cards = [
    ["knowledge_items", "Total items"],
    ["words", "Words"],
    ["expressions", "Expressions"],
    ["grammar-patterns", "Grammar"],
  ];
  elements.statsGrid.innerHTML = cards.map(([key, label]) => `
    <article class="stat-card">
      <strong>${statistics.totals[key].toLocaleString()}</strong>
      <span>${label}</span>
    </article>
  `).join("");
}

function leaderboardStats(profile) {
  const progress = loadProgress(profile);
  if (state.leaderboardScope === "all") return progress;
  return progress.byWeek?.[mondayOf(new Date())] ?? { sessions: 0, answered: 0, correct: 0, xp: 0 };
}

function renderLeaderboard() {
  const ranking = Object.entries(PROFILES)
    .map(([id, profile]) => ({ id, ...profile, stats: leaderboardStats(id) }))
    .sort((left, right) => right.stats.xp - left.stats.xp || right.stats.correct - left.stats.correct || left.name.localeCompare(right.name));
  elements.leaderboardList.innerHTML = ranking.map((profile, index) => {
    const accuracy = profile.stats.answered ? Math.round((profile.stats.correct / profile.stats.answered) * 100) : 0;
    return `
      <article class="leaderboard-row${profile.id === state.profile ? " is-active" : ""}">
        <span class="leaderboard-rank">${index + 1}</span>
        <img src="${profile.avatar}" alt="${profile.name}">
        <div class="leaderboard-person">
          <strong>${profile.name}${profile.id === state.profile ? " <small>You</small>" : ""}</strong>
          <span>${profile.stats.sessions ?? 0} lessons · ${accuracy}% accuracy</span>
        </div>
        <div class="leaderboard-xp"><strong>${profile.stats.xp ?? 0}</strong><span>XP</span></div>
      </article>`;
  }).join("");
}

function setLeaderboardScope(scope) {
  state.leaderboardScope = scope;
  elements.leaderboardScopes.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.leaderboardScope === scope));
  });
  renderLeaderboard();
}

function renderHero() {
  const { statistics, catalog } = state.data;
  const today = new Date();
  const currentWeek = mondayOf(new Date());
  const currentCount = statistics.by_week_start[currentWeek] ?? 0;
  const currentItems = catalog.items.filter((item) => item.week_start === currentWeek);
  const expressions = currentItems.filter((item) => item.type === "expression").length;
  const particles = currentItems.filter((item) => item.type === "particle").length;

  elements.latestWeek.textContent = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(today);
  elements.latestWeekCount.textContent = `${currentCount} ${currentCount === 1 ? "item" : "items"} learned this week`;
  elements.heroSummary.textContent = currentCount
    ? `This week you added ${currentCount} items, including ${expressions} expressions and ${particles} particles.`
    : "Nothing has been added this week yet. Your full academy and earlier lessons are ready whenever you are.";
  elements.updatedLabel.textContent = `Updated ${formatWeek(state.data.catalog.generated_at, { year: true })}`;
}

function populateFilters() {
  const types = [...new Set(state.data.catalog.items.map((item) => item.type))];
  elements.typeFilter.insertAdjacentHTML("beforeend", types.map((type) => `
    <option value="${type}">${TYPE_PLURALS[type] ?? type}</option>
  `).join(""));

  const weeks = [...new Set([
    mondayOf(new Date()),
    ...state.data.catalog.items.map((item) => item.week_start),
  ])].sort().reverse();
  elements.weekFilter.insertAdjacentHTML("beforeend", weeks.map((week) => `
    <option value="${week}">Week of ${formatWeek(week, { year: true })}</option>
  `).join(""));
}

function renderPracticeProgress(progress = loadProgress(state.profile)) {
  if (!state.data) return;
  const currentWeek = mondayOf(new Date());
  const scopedProgress = state.academyScope === "week"
    ? progress.byWeek?.[currentWeek] ?? { sessions: 0, answered: 0, correct: 0, xp: 0, items: {} }
    : progress;
  const name = PROFILES[state.profile].name;
  elements.coverageTitle.textContent = state.academyScope === "week"
    ? `${name}'s coverage this week`
    : `${name}'s full-content coverage`;
  elements.practiceXp.textContent = scopedProgress.xp ?? 0;
  elements.practiceStreak.textContent = progress.streak;
  elements.practiceAccuracy.textContent = scopedProgress.answered
    ? `${Math.round((scopedProgress.correct / scopedProgress.answered) * 100)}%`
    : "—";
  renderCoverage(progress, scopedProgress);
  renderReviewQueue(progress);
  renderMistakeQueue(progress);
}

function renderReviewQueue(progress = loadProgress(state.profile)) {
  if (!state.data) return;
  const week = state.academyScope === "week" ? mondayOf(new Date()) : "all";
  const queue = buildReviewQueue(state.data.catalog.items, progress, { week, size: 20 });
  const scope = state.academyScope === "week" ? "from this week" : "from your full library";
  elements.reviewQueueDetail.textContent = queue.dueCount
    ? `${queue.dueCount} item${queue.dueCount === 1 ? " is" : "s are"} due ${scope}. Mistakes and overdue material come first.`
    : `Nothing is due ${scope}. Your next review will appear as intervals mature.`;
  elements.startReviewQueue.disabled = queue.dueCount === 0;
  const sessionSize = Math.min(20, queue.dueCount);
  elements.startReviewQueue.textContent = queue.dueCount
    ? `Review ${sessionSize} due item${sessionSize === 1 ? "" : "s"}`
    : "Nothing due";
}

function renderMistakeQueue(progress = loadProgress(state.profile)) {
  if (!state.data) return;
  const week = state.academyScope === "week" ? mondayOf(new Date()) : "all";
  const queue = buildMistakeQueue(state.data.catalog.items, progress, { week, size: 20 });
  const scope = state.academyScope === "week" ? "in this week's material" : "across your full library";
  elements.mistakeQueueDetail.textContent = queue.itemCount
    ? `${queue.mistakeCount} unresolved mistake${queue.mistakeCount === 1 ? "" : "s"} across ${queue.itemCount} item${queue.itemCount === 1 ? "" : "s"} ${scope}. Correct answers reduce the queue.`
    : `No unresolved mistakes ${scope}.`;
  elements.startMistakeReview.disabled = queue.itemCount === 0;
  const sessionSize = Math.min(20, queue.itemCount);
  elements.startMistakeReview.textContent = queue.itemCount
    ? `Repair ${sessionSize} item${sessionSize === 1 ? "" : "s"}`
    : "No mistakes";
}

function renderCoverage(progress = loadProgress(state.profile), scopedProgress = progress) {
  const currentWeek = mondayOf(new Date());
  const practiceTypes = new Set(["word", "expression", "particle"]);
  const ids = state.data.catalog.items
    .filter((item) => practiceTypes.has(item.type)
      && (state.academyScope === "all" || item.week_start === currentWeek))
    .map((item) => item.id);
  const itemProgress = state.academyScope === "week" ? scopedProgress.items ?? {} : progress.items;
  const practiced = ids.filter((id) => itemProgress[id]?.correct || itemProgress[id]?.wrong);
  const mastered = ids.filter((id) => {
    const item = itemProgress[id];
    return item && item.correct >= 2 && item.correct > item.wrong;
  });
  const percent = ids.length ? Math.round((practiced.length / ids.length) * 100) : 0;
  elements.coverageRing.style.setProperty("--coverage", percent);
  elements.coveragePercent.textContent = `${percent}%`;
  elements.coverageBar.style.width = `${percent}%`;
  elements.coverageDetail.textContent = ids.length
    ? `${practiced.length} of ${ids.length} practice-ready items retrieved · ${mastered.length} showing stable recall.`
    : "No practice-ready items have been added for this week yet.";
}

function weakItemIds(progress = loadProgress(state.profile)) {
  return Object.entries(progress.items)
    .filter(([, item]) => item.wrong > item.correct)
    .sort((left, right) => right[1].wrong - left[1].wrong)
    .map(([id]) => id);
}

function currentQuestion() {
  return state.lesson.questions[state.lesson.index];
}

function renderQuestion() {
  const lesson = state.lesson;
  const question = currentQuestion();
  const progress = (lesson.index / lesson.questions.length) * 100;
  elements.lessonProgressBar.style.width = `${progress}%`;
  elements.lessonCounter.textContent = `${lesson.index + 1} / ${lesson.questions.length}`;
  elements.questionLabel.textContent = question.label;
  elements.lessonTitle.textContent = question.prompt;
  const expected = question.expected
    ? (question.expected.includes(" — ") ? question.expected : describeGrammar(question.expected))
    : null;
  const cue = expected ? `Expected: ${expected}` : question.hint;
  elements.questionHint.hidden = !cue && !question.meaningHint;
  elements.questionHint.innerHTML = cue ? `<span>${escapeHtml(cue)}</span>` : "";
  if (question.meaningHint) {
    elements.questionHint.insertAdjacentHTML("beforeend", `
      <button class="hint-button" type="button" aria-expanded="false">Hint</button>
      <span class="meaning-hint" hidden>Meaning: “${escapeHtml(question.meaningHint)}”</span>
    `);
    elements.questionHint.querySelector(".hint-button").addEventListener("click", (event) => {
      const hint = elements.questionHint.querySelector(".meaning-hint");
      const revealed = !hint.hidden;
      hint.hidden = revealed;
      event.currentTarget.setAttribute("aria-expanded", String(!revealed));
      event.currentTarget.textContent = revealed ? "Hint" : "Hide hint";
    });
  }
  elements.lessonFeedback.hidden = true;
  elements.lessonRetry.hidden = true;
  elements.lessonFooter.dataset.state = "idle";
  elements.lessonCheck.textContent = "Check";
  elements.lessonCheck.disabled = true;
  lesson.checked = false;
  lesson.response = "";

  if (question.kind === "choice") {
    elements.answerArea.innerHTML = `<div class="choice-grid">${question.options.map((option, index) => `
      <button class="answer-choice" type="button" data-answer="${escapeHtml(option)}">
        <span>${index + 1}</span>${escapeHtml(option)}
      </button>
    `).join("")}</div>`;
    elements.answerArea.querySelectorAll("[data-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        elements.answerArea.querySelectorAll("[data-answer]").forEach((choice) => choice.classList.remove("selected"));
        button.classList.add("selected");
        lesson.response = button.dataset.answer;
        elements.lessonCheck.disabled = false;
      });
    });
  } else {
    elements.answerArea.innerHTML = `
      <label class="typed-answer">
        <span>Your answer</span>
        <input id="typed-response" type="text" autocomplete="off" autocapitalize="none" placeholder="Type in Dutch…">
      </label>
    `;
    const input = document.querySelector("#typed-response");
    input.addEventListener("input", () => {
      lesson.response = input.value;
      elements.lessonCheck.disabled = !input.value.trim();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && input.value.trim()) checkLessonAnswer();
    });
    input.focus();
  }
}

function finishLesson() {
  const progress = saveSessionProgress(state.lesson.results, state.lesson.profile);
  const scopedXp = state.lesson.scope === "week"
    ? progress.byWeek?.[mondayOf(new Date())]?.xp ?? 0
    : progress.xp;
  renderPracticeProgress(progress);
  renderLeaderboard();
  const correct = state.lesson.results.filter((result) => result.correct).length;
  const total = state.lesson.results.length;
  elements.lessonProgressBar.style.width = "100%";
  elements.questionLabel.textContent = "Lesson complete";
  elements.lessonTitle.textContent = correct === total ? "Perfect lesson!" : "Goed gedaan!";
  elements.questionHint.hidden = false;
  elements.questionHint.textContent = `You answered ${correct} of ${total} correctly and earned ${state.lesson.results.reduce((sum, result) => sum + (result.correct ? 10 : 2), 0)} XP.`;
  elements.answerArea.innerHTML = `
    <div class="lesson-result">
      <div><strong>${correct}/${total}</strong><span>correct</span></div>
      <div><strong>${progress.streak}</strong><span>day streak</span></div>
      <div><strong>${scopedXp}</strong><span>${state.lesson.scope === "week" ? "this week XP" : "total XP"}</span></div>
    </div>
  `;
  elements.lessonFeedback.hidden = true;
  elements.lessonFooter.dataset.state = "complete";
  elements.lessonRetry.hidden = false;
  elements.lessonCheck.disabled = false;
  elements.lessonCheck.textContent = "Close";
  state.lesson.complete = true;
}

function checkLessonAnswer() {
  const lesson = state.lesson;
  if (!lesson || !lesson.response) return;
  if (lesson.complete) {
    elements.lessonDialog.close();
    return;
  }
  if (lesson.checked) {
    lesson.index += 1;
    if (lesson.index >= lesson.questions.length) finishLesson();
    else renderQuestion();
    return;
  }
  const question = currentQuestion();
  const correct = checkAnswer(question, lesson.response);
  lesson.checked = true;
  lesson.results.push({ itemId: question.itemId, correct });
  elements.lessonFeedback.hidden = false;
  elements.feedbackTitle.textContent = correct ? "Correct!" : "Not quite";
  const translatedAnswer = question.answerTranslation
    ? `${question.answer} · ${question.answerTranslation}`
    : question.answer;
  elements.feedbackCopy.textContent = correct
    ? `${translatedAnswer} · +10 XP`
    : `Correct answer: ${translatedAnswer}`;
  elements.lessonFooter.dataset.state = correct ? "correct" : "wrong";
  elements.lessonCheck.textContent = lesson.index === lesson.questions.length - 1 ? "See results" : "Continue";
  elements.lessonCheck.disabled = false;
  elements.answerArea.querySelectorAll("button, input").forEach((control) => { control.disabled = true; });
}

async function startLesson(mode = "recall", trigger = null) {
  const sizes = { recognition: 20, recall: 20, sentences: 20, review: 20, mistakes: 20 };
  const originalLabel = trigger?.textContent;
  if (trigger) {
    trigger.disabled = true;
    trigger.textContent = "Building lesson…";
  }
  try {
    state.practiceItems ??= await loadPracticeItems(state.data.catalog);
    const week = state.academyScope === "week" ? mondayOf(new Date()) : "all";
    const previousIds = state.lesson?.mode === mode && state.lesson?.scope === state.academyScope
      ? state.lesson.sourceIds
      : [];
    const progress = loadProgress(state.profile);
    const session = mode === "review"
      ? buildReviewSession(state.practiceItems, progress, { week, size: sizes.review })
      : mode === "mistakes"
        ? buildMistakeSession(state.practiceItems, progress, { week, size: sizes.mistakes })
        : buildSession(state.practiceItems, {
        week,
        size: sizes[mode] ?? 20,
        weakIds: weakItemIds(),
        excludeIds: mode === "sentences" ? [] : previousIds,
        mode,
      });
    if (!session.questions.length) throw new Error("No practice items available");
    state.lesson = {
      ...session,
      mode,
      scope: state.academyScope,
      sourceIds: session.questions.map((question) => question.itemId),
      profile: state.profile,
      index: 0,
      results: [],
      response: "",
      checked: false,
      complete: false,
    };
    renderQuestion();
    if (!elements.lessonDialog.open) elements.lessonDialog.showModal();
  } catch (error) {
    console.error(error);
    elements.fatalError.hidden = false;
    elements.fatalError.querySelector("strong").textContent = "A practice lesson could not be created.";
  } finally {
    if (trigger) {
      trigger.disabled = false;
      trigger.textContent = originalLabel;
    }
  }
}

function normalizedSearchText(item) {
  return [item.dutch, item.english, item.category, item.type, ...item.tags]
    .join(" ")
    .toLocaleLowerCase("nl-NL");
}

function filteredItems() {
  const query = state.query.trim().toLocaleLowerCase("nl-NL");
  return state.data.catalog.items
    .filter((item) => state.type === "all" || item.type === state.type)
    .filter((item) => state.week === "all" || item.week_start === state.week)
    .filter((item) => !query || normalizedSearchText(item).includes(query))
    .sort((left, right) => right.week_start.localeCompare(left.week_start));
}

function renderLibrary() {
  const matches = filteredItems();
  const visibleItems = matches.slice(0, state.visible);
  elements.resultCount.textContent = `${matches.length} ${matches.length === 1 ? "item" : "items"}`;
  elements.itemGrid.innerHTML = visibleItems.length ? visibleItems.map((item) => `
    <button class="item-card" type="button" data-item-id="${item.id}">
      <span class="item-card-icon item-card-icon--${item.type}" aria-hidden="true">${TYPE_ICONS[item.type] ?? "·"}</span>
      <span class="item-card-copy">
        <span class="item-meta">${TYPE_LABELS[item.type] ?? item.type} · ${formatWeek(item.week_start)}</span>
        <strong lang="nl">${escapeHtml(item.dutch)}</strong>
        <span>${escapeHtml(item.english)}</span>
      </span>
      <span class="item-arrow" aria-hidden="true">→</span>
    </button>
  `).join("") : `
    <div class="empty-state">
      <strong>No learned items match.</strong>
      <span>Try another word or clear the filters.</span>
    </div>
  `;

  elements.loadMore.hidden = visibleItems.length >= matches.length;
  const filters = [];
  if (state.query) filters.push(`“${state.query}”`);
  if (state.type !== "all") filters.push(TYPE_PLURALS[state.type] ?? state.type);
  if (state.week !== "all") filters.push(`week of ${formatWeek(state.week)}`);
  elements.activeFilter.hidden = filters.length === 0;
  elements.activeFilterLabel.textContent = filters.join(" · ");

  elements.itemGrid.querySelectorAll("[data-item-id]").forEach((button) => {
    button.addEventListener("click", () => showItemDialog(button.dataset.itemId));
  });
}

function detailRows(item) {
  const rows = [];
  const push = (label, value) => {
    if (value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length)) {
      rows.push(`<div class="detail-row"><dt>${label}</dt><dd>${escapeHtml(Array.isArray(value) ? value.join("; ") : value)}</dd></div>`);
    }
  };
  push("Category", item.category);
  push("Part of speech", item.part_of_speech);
  push("Article", item.article);
  push("Plural", item.plural);
  push("Register", item.register);
  push("Pattern", item.pattern);
  push("Explanation", item.explanation);
  push("Constraints", item.constraints);
  push("Functions", item.functions);
  push("Tone effect", item.tone_effect);
  push("Construction", item.construction);
  push("Word order", item.word_order_notes);
  push("Fixed preposition", item.fixed_preposition);
  if (typeof item.separable === "boolean") push("Separable", item.separable ? "Yes" : "No");
  push("Status", item.status);
  return rows.join("");
}

function examplesHtml(examples = []) {
  if (!examples.length) return "";
  return `
    <section class="detail-section">
      <h3>Examples</h3>
      ${examples.map((example) => `
        <blockquote>
          <strong lang="nl">${escapeHtml(example.dutch)}</strong>
          <span>${escapeHtml(example.english)}</span>
          <small>${example.source_type === "class_note" ? "From class notes" : "Practice example"}</small>
        </blockquote>
      `).join("")}
    </section>
  `;
}

async function showItemDialog(itemId) {
  const catalogItem = state.data.catalog.items.find((item) => item.id === itemId);
  if (!catalogItem) return;
  elements.dialogType.textContent = `${TYPE_LABELS[catalogItem.type]} · Week of ${formatWeek(catalogItem.week_start, { year: true })}`;
  elements.dialogTitle.textContent = catalogItem.dutch;
  elements.dialogContent.innerHTML = "<p>Loading details…</p>";
  elements.dialog.showModal();

  try {
    const item = await loadCanonicalItem(catalogItem);
    if (!item) throw new Error("Canonical record not found");
    if (item.type === "dialogue") {
      elements.dialogTitle.textContent = item.title;
      elements.dialogContent.innerHTML = `
        <p class="dialog-lead">${escapeHtml(item.setting)}</p>
        <div class="dialogue-turns">
          ${item.turns.map((turn) => `<div><strong>${escapeHtml(turn.speaker)}</strong><p lang="nl">${escapeHtml(turn.dutch)}</p><span>${escapeHtml(turn.english)}</span></div>`).join("")}
        </div>
      `;
      return;
    }
    if (item.type === "mistake") {
      elements.dialogTitle.textContent = item.correct;
      elements.dialogContent.innerHTML = `
        <div class="correction"><span>${escapeHtml(item.incorrect)}</span><strong>${escapeHtml(item.correct)}</strong></div>
        <p class="dialog-lead">${escapeHtml(item.english)}</p>
        <dl class="detail-list">${detailRows(item)}</dl>
        ${item.notes ? `<p class="note-box">${escapeHtml(item.notes)}</p>` : ""}
      `;
      return;
    }
    elements.dialogContent.innerHTML = `
      <p class="dialog-translation">${escapeHtml(item.english)}</p>
      <dl class="detail-list">${detailRows(item)}</dl>
      ${examplesHtml(item.examples)}
      ${item.notes ? `<p class="note-box">${escapeHtml(item.notes)}</p>` : ""}
      <div class="tag-list">${item.tags.filter((tag) => tag !== item.week_start).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
    `;
  } catch (error) {
    console.error(error);
    elements.dialogContent.innerHTML = "<p>These details could not be loaded.</p>";
  }
}

function updateFilters() {
  state.query = elements.searchInput.value;
  state.type = elements.typeFilter.value;
  state.week = elements.weekFilter.value;
  state.visible = 24;
  renderLibrary();
}

function setAcademyScope(scope) {
  state.academyScope = scope;
  elements.academyScopes.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.scope === scope));
  });
  elements.dictionaryStageCopy.textContent = scope === "week"
    ? "Search and explore everything first learned this week."
    : "Search and filter your complete Dutch learning history.";
  const currentWeek = mondayOf(new Date());
  const hasWeeklyItems = state.data.catalog.items.some((item) =>
    item.week_start === currentWeek && ["word", "expression", "particle"].includes(item.type));
  elements.academyStarts.forEach((button) => {
    button.dataset.defaultLabel ??= button.textContent;
    const unavailable = scope === "week" && !hasWeeklyItems;
    button.disabled = unavailable;
    button.textContent = unavailable ? "No items this week" : button.dataset.defaultLabel;
  });
  renderPracticeProgress();
}

function openDictionary() {
  const weekly = state.academyScope === "week";
  state.query = "";
  state.type = "all";
  state.week = weekly ? mondayOf(new Date()) : "all";
  state.visible = 24;
  elements.searchInput.value = "";
  elements.typeFilter.value = "all";
  elements.weekFilter.value = state.week;
  elements.dictionaryWeekControl.hidden = weekly;
  elements.dictionaryScopeLabel.textContent = weekly
    ? `Week of ${formatWeek(state.week, { year: true })}`
    : "Full content";
  renderLibrary();
  elements.dictionaryDialog.showModal();
}

const HOUR_WORDS = ["twaalf", "een", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien", "elf"];
const ENGLISH_HOURS = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];

function dutchTime(hour, minute) {
  const current = HOUR_WORDS[hour % 12];
  const next = HOUR_WORDS[(hour + 1) % 12];
  const forms = {
    0: `${current} uur`,
    5: `vijf over ${current}`,
    10: `tien over ${current}`,
    15: `kwart over ${current}`,
    20: `tien voor half ${next}`,
    25: `vijf voor half ${next}`,
    30: `half ${next}`,
    35: `vijf over half ${next}`,
    40: `tien over half ${next}`,
    45: `kwart voor ${next}`,
    50: `tien voor ${next}`,
    55: `vijf voor ${next}`,
  };
  return forms[minute];
}

function englishTime(hour, minute) {
  const current = ENGLISH_HOURS[hour % 12];
  const next = ENGLISH_HOURS[(hour + 1) % 12];
  const forms = {
    0: `${current} o'clock`,
    5: `five past ${current}`,
    10: `ten past ${current}`,
    15: `quarter past ${current}`,
    20: `twenty past ${current}`,
    25: `twenty-five past ${current}`,
    30: `half past ${current}`,
    35: `twenty-five to ${next}`,
    40: `twenty to ${next}`,
    45: `quarter to ${next}`,
    50: `ten to ${next}`,
    55: `five to ${next}`,
  };
  return forms[minute];
}

function shuffled(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function timeSimulatorQuestions() {
  const candidates = [];
  for (let hour = 1; hour <= 12; hour += 1) {
    for (let minute = 0; minute < 60; minute += 5) candidates.push({ hour, minute });
  }
  return shuffled(candidates).slice(0, 10).map(({ hour, minute }) => {
    const answer = dutchTime(hour, minute);
    const nearbyMinutes = [
      (minute + 5) % 60,
      (minute + 55) % 60,
      (minute + 10) % 60,
      (minute + 50) % 60,
      (minute + 15) % 60,
      (minute + 45) % 60,
      (minute + 30) % 60,
    ];
    const distractors = [...new Set(nearbyMinutes.map((otherMinute) => dutchTime(hour, otherMinute)))]
      .filter((value) => value !== answer)
      .slice(0, 3);
    return {
      question: "Hoe laat is het?",
      answer,
      translation: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} · ${englishTime(hour, minute)}`,
      options: shuffled([answer, ...distractors]),
      visual: `<div class="digital-clock" role="img" aria-label="Digital clock showing ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}">
        <span>${String(hour).padStart(2, "0")}</span><i>:</i><span>${String(minute).padStart(2, "0")}</span>
      </div>`,
    };
  });
}

const LOCATION_SCENES = [
  ["in", "in", "inside / in", "The ball is inside the box"],
  ["op", "on", "on top of", "The ball is on the box"],
  ["onder", "under", "under", "The ball is under the box"],
  ["naast", "next", "next to", "The ball is next to the box"],
  ["voor", "front", "in front of", "The ball is in front of the box"],
  ["achter", "behind", "behind", "The ball is behind the box"],
  ["tussen", "between", "between", "The ball is between the boxes"],
  ["tegen", "against", "against", "The ball is against the wall"],
  ["aan", "attached", "on / attached to", "The picture is on the wall"],
  ["links van", "left", "to the left of", "The ball is left of the box"],
  ["rechts van", "right", "to the right of", "The ball is right of the box"],
  ["boven", "above", "above", "The ball is above the box"],
];

function locationSimulatorQuestions() {
  return shuffled(LOCATION_SCENES).slice(0, 10).map(([answer, scene, translation, description]) => ({
    question: "Welk plaatswoord past?",
    answer,
    translation,
    options: shuffled([answer, ...shuffled(LOCATION_SCENES.map(([word]) => word).filter((word) => word !== answer)).slice(0, 3)]),
    visual: `<div class="place-scene place-scene--${scene}" aria-label="${description}"><span class="scene-ball"></span><span class="scene-box"></span>${scene === "between" ? '<span class="scene-box scene-box--second"></span>' : ""}${["against", "attached"].includes(scene) ? '<span class="scene-wall"></span>' : ""}</div>`,
  }));
}

function startSimulator(mode) {
  const questions = mode === "time" ? timeSimulatorQuestions() : locationSimulatorQuestions();
  state.simulator = { mode, questions, index: 0, correct: 0, locked: false };
  elements.simulatorRules.hidden = true;
  renderSimulatorQuestion();
  if (!elements.simulatorDialog.open) elements.simulatorDialog.showModal();
}

function simulatorRulesHtml(mode) {
  if (mode === "time") {
    return `
      <div class="rule-intro">
        <strong>The central idea</strong>
        <p>Dutch speakers organize the hour around two anchors: the current full hour and the next half hour. From :20 until :40, the phrase is built around <em>half + the next hour</em>.</p>
      </div>
      <ol class="rule-steps">
        <li><strong>Minutes 00–15: count after the current hour.</strong><span>Use <em>over</em>: 08:10 is <em>tien over acht</em>. At :15 use <em>kwart over</em>.</span></li>
        <li><strong>Minutes 20–25: count down to the half hour.</strong><span>08:20 is ten minutes before 08:30, so say <em>tien voor half negen</em>. The hour after <em>half</em> is always the upcoming hour.</span></li>
        <li><strong>Minute 30: say half + the upcoming hour.</strong><span>08:30 is <em>half negen</em>. This literally means halfway toward nine.</span></li>
        <li><strong>Minutes 35–40: count after the half hour.</strong><span>08:35 is <em>vijf over half negen</em>; 08:40 is <em>tien over half negen</em>.</span></li>
        <li><strong>Minutes 45–55: count down to the next full hour.</strong><span>Use <em>voor</em>: 08:45 is <em>kwart voor negen</em>; 08:55 is <em>vijf voor negen</em>.</span></li>
        <li><strong>Exact hours use uur.</strong><span>08:00 is <em>acht uur</em>. In everyday speech, <em>uur</em> is normally omitted in the other patterns.</span></li>
      </ol>
      <div class="rule-warning"><strong>Common English-speaker mistake</strong><p><em>Half negen</em> means 08:30, never 09:30. Always look forward to the next hour after <em>half</em>.</p></div>`;
  }
  return `
    <p>Use a location word before the noun phrase: <strong>De bal ligt onder de tafel.</strong></p>
    <dl class="rules-list rules-list--words">
      ${LOCATION_SCENES.map(([word, , translation]) => `<div><dt>${escapeHtml(word)}</dt><dd>${escapeHtml(translation)}</dd></div>`).join("")}
    </dl>
    <p class="rule-note"><strong>Useful pattern:</strong> subject + <em>staat/ligt/zit</em> + location word + noun.</p>`;
}

function showSimulatorRules() {
  const mode = state.simulator?.mode ?? "time";
  elements.rulesTitle.textContent = mode === "time" ? "How to tell time in Dutch" : "Dutch location words";
  elements.rulesContent.innerHTML = simulatorRulesHtml(mode);
  elements.simulatorRules.hidden = false;
}

function renderSimulatorQuestion() {
  const simulator = state.simulator;
  const question = simulator.questions[simulator.index];
  elements.simulatorLabel.textContent = simulator.mode === "time" ? "Time simulator" : "Location simulator";
  elements.simulatorQuestion.textContent = question.question;
  elements.simulatorCounter.textContent = `${simulator.index + 1} / ${simulator.questions.length}`;
  elements.simulatorProgress.style.width = `${(simulator.index / simulator.questions.length) * 100}%`;
  elements.simulatorVisual.innerHTML = question.visual;
  elements.simulatorFeedback.hidden = true;
  elements.simulatorNext.hidden = true;
  elements.simulatorAnswers.innerHTML = question.options.map((option, index) => `
    <button class="answer-choice" type="button" data-simulator-answer="${escapeHtml(option)}"><span>${index + 1}</span>${escapeHtml(option)}</button>
  `).join("");
  elements.simulatorAnswers.querySelectorAll("[data-simulator-answer]").forEach((button) => {
    button.addEventListener("click", () => answerSimulator(button.dataset.simulatorAnswer));
  });
}

function answerSimulator(response) {
  const simulator = state.simulator;
  if (simulator.locked) return;
  simulator.locked = true;
  const question = simulator.questions[simulator.index];
  const correct = response === question.answer;
  if (correct) simulator.correct += 1;
  elements.simulatorFeedback.hidden = false;
  elements.simulatorFeedback.className = `simulator-feedback ${correct ? "correct" : "wrong"}`;
  elements.simulatorFeedback.innerHTML = correct
    ? `<strong>Correct!</strong><span>${escapeHtml(question.answer)} · ${escapeHtml(question.translation)}</span>`
    : `<strong>Correct answer: ${escapeHtml(question.answer)}</strong><span>${escapeHtml(question.translation)}</span>`;
  elements.simulatorAnswers.querySelectorAll("button").forEach((button) => { button.disabled = true; });
  elements.simulatorNext.hidden = false;
  elements.simulatorNext.textContent = simulator.index === simulator.questions.length - 1 ? "See results" : "Next question";
}

function nextSimulatorQuestion() {
  const simulator = state.simulator;
  simulator.index += 1;
  simulator.locked = false;
  if (simulator.index < simulator.questions.length) {
    renderSimulatorQuestion();
    return;
  }
  elements.simulatorProgress.style.width = "100%";
  elements.simulatorQuestion.textContent = "Simulator complete";
  elements.simulatorVisual.innerHTML = `<div class="simulator-score"><strong>${simulator.correct}/10</strong><span>correct</span></div>`;
  elements.simulatorAnswers.innerHTML = `<button class="primary-button" id="simulator-again" type="button">Try another round</button>`;
  elements.simulatorFeedback.hidden = true;
  elements.simulatorNext.hidden = true;
  document.querySelector("#simulator-again").addEventListener("click", () => startSimulator(simulator.mode));
}

function bindEvents() {
  elements.searchForm.addEventListener("submit", (event) => event.preventDefault());
  elements.searchInput.addEventListener("input", updateFilters);
  elements.typeFilter.addEventListener("change", updateFilters);
  elements.weekFilter.addEventListener("change", updateFilters);
  elements.clearFilters.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.typeFilter.value = "all";
    elements.weekFilter.value = state.academyScope === "week" ? mondayOf(new Date()) : "all";
    updateFilters();
    elements.searchInput.focus();
  });
  elements.loadMore.addEventListener("click", () => {
    state.visible += 24;
    renderLibrary();
  });
  elements.dialogClose.addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) elements.dialog.close();
  });
  elements.themeToggle.addEventListener("change", () => {
    const dark = elements.themeToggle.checked;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("dutch-os-theme", dark ? "dark" : "light");
  });
  elements.profileTrigger.addEventListener("click", () => {
    const open = elements.profileTrigger.getAttribute("aria-expanded") === "true";
    setProfileMenuOpen(!open);
  });
  elements.profileOptions.forEach((option) => {
    option.addEventListener("click", () => {
      state.profile = option.dataset.profile;
      localStorage.setItem("dutch-os-active-profile", state.profile);
      renderProfile();
      renderPracticeProgress();
      renderLeaderboard();
      setProfileMenuOpen(false);
      elements.profileTrigger.focus();
    });
  });
  document.addEventListener("click", (event) => {
    if (!elements.profileControl.contains(event.target)) setProfileMenuOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setProfileMenuOpen(false);
      elements.profileTrigger.focus();
    }
  });
  elements.academyStarts.forEach((button) => button.addEventListener("click", () => startLesson(button.dataset.mode, button)));
  elements.startReviewQueue.addEventListener("click", () => startLesson("review", elements.startReviewQueue));
  elements.startMistakeReview.addEventListener("click", () => startLesson("mistakes", elements.startMistakeReview));
  elements.academyScopes.forEach((button) => button.addEventListener("click", () => setAcademyScope(button.dataset.scope)));
  elements.leaderboardScopes.forEach((button) => button.addEventListener("click", () => setLeaderboardScope(button.dataset.leaderboardScope)));
  elements.openDictionary.addEventListener("click", () => {
    if (isMobileLayout()) showMobileView("dictionary", { scroll: false });
    openDictionary();
  });
  elements.dictionaryClose.addEventListener("click", closeDictionary);
  elements.dictionaryDialog.addEventListener("close", () => {
    if (isMobileLayout() && document.body.dataset.mobileView === "dictionary") {
      showMobileView(state.previousMobileView, { scroll: false });
    }
  });
  elements.mobileTabs.forEach((button) => button.addEventListener("click", () => {
    const view = button.dataset.mobileView;
    if (view === "dictionary") {
      setAcademyScope("all");
      showMobileView("dictionary", { scroll: false });
      openDictionary();
      return;
    }
    showMobileView(view);
  }));
  elements.simulatorStarts.forEach((button) => button.addEventListener("click", () => startSimulator(button.dataset.simulator)));
  elements.simulatorClose.addEventListener("click", () => elements.simulatorDialog.close());
  elements.simulatorNext.addEventListener("click", nextSimulatorQuestion);
  elements.simulatorRulesButton.addEventListener("click", showSimulatorRules);
  elements.rulesClose.addEventListener("click", () => { elements.simulatorRules.hidden = true; });
  elements.lessonCheck.addEventListener("click", checkLessonAnswer);
  elements.lessonRetry.addEventListener("click", () => startLesson(state.lesson.mode));
  elements.lessonClose.addEventListener("click", () => elements.lessonDialog.close());
}

async function init() {
  const savedTheme = localStorage.getItem("dutch-os-theme");
  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
  }
  elements.themeToggle.checked = savedTheme === "dark";
  showMobileView("home", { scroll: false });
  bindEvents();
  try {
    state.data = await loadDashboardData();
    renderHero();
    renderStats();
    setLeaderboardScope("week");
    populateFilters();
    setAcademyScope("week");
    renderProfile();
    renderPracticeProgress();
  } catch (error) {
    console.error(error);
    elements.fatalError.hidden = false;
    elements.heroSummary.textContent = "Repository data could not be loaded.";
  }
}

function renderProfile() {
  const { name, avatar } = PROFILES[state.profile];
  elements.profileAvatar.src = avatar;
  elements.profileAvatar.alt = `${name} profile photo`;
  elements.profileName.textContent = name;
  elements.profileOptions.forEach((option) => {
    const selected = option.dataset.profile === state.profile;
    option.setAttribute("aria-checked", String(selected));
    option.classList.toggle("selected", selected);
  });
  elements.practiceXp.closest(".practice-stats").setAttribute("aria-label", `${name}'s local practice progress`);
}

function setProfileMenuOpen(open) {
  elements.profileTrigger.setAttribute("aria-expanded", String(open));
  elements.profileMenu.hidden = !open;
  if (open) {
    const selected = elements.profileMenu.querySelector(`[data-profile="${state.profile}"]`);
    selected?.focus();
  }
}

init();
