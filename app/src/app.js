import { loadCanonicalItem, loadDashboardData, loadPracticeItems } from "../data-loader/repository.js";
import { buildSession, checkAnswer, loadProgress, saveSessionProgress } from "./quiz.js";

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

const state = {
  data: null,
  query: "",
  type: "all",
  week: "all",
  visible: 24,
  practiceItems: null,
  lesson: null,
};

const elements = {
  statsGrid: document.querySelector("#stats-grid"),
  latestWeek: document.querySelector("#latest-week"),
  latestWeekCount: document.querySelector("#latest-week-count"),
  heroSummary: document.querySelector("#hero-summary"),
  todayLabel: document.querySelector("#today-label"),
  updatedLabel: document.querySelector("#updated-label"),
  reviewButton: document.querySelector("#review-button"),
  reviewCount: document.querySelector("#review-count"),
  reviewContent: document.querySelector("#review-content"),
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
  fatalError: document.querySelector("#fatal-error"),
  academyStarts: document.querySelectorAll(".academy-start"),
  academyReview: document.querySelector("#academy-review"),
  practiceWeekFilter: document.querySelector("#practice-week-filter"),
  practiceXp: document.querySelector("#practice-xp"),
  practiceStreak: document.querySelector("#practice-streak"),
  practiceAccuracy: document.querySelector("#practice-accuracy"),
  coverageRing: document.querySelector("#coverage-ring"),
  coveragePercent: document.querySelector("#coverage-percent"),
  coverageDetail: document.querySelector("#coverage-detail"),
  coverageBar: document.querySelector("#coverage-bar"),
  lessonDialog: document.querySelector("#lesson-dialog"),
  lessonClose: document.querySelector("#lesson-close"),
  lessonProgressBar: document.querySelector("#lesson-progress-bar"),
  lessonHearts: document.querySelector("#lesson-hearts"),
  lessonCounter: document.querySelector("#lesson-counter"),
  questionLabel: document.querySelector("#question-label"),
  lessonTitle: document.querySelector("#lesson-title"),
  questionHint: document.querySelector("#question-hint"),
  answerArea: document.querySelector("#answer-area"),
  lessonFooter: document.querySelector("#lesson-footer"),
  lessonFeedback: document.querySelector("#lesson-feedback"),
  feedbackTitle: document.querySelector("#feedback-title"),
  feedbackCopy: document.querySelector("#feedback-copy"),
  lessonCheck: document.querySelector("#lesson-check"),
};

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
    ["knowledge_items", "Learned items", "∑"],
    ["words", "Words", "Aa"],
    ["expressions", "Expressions", "“ ”"],
    ["grammar-patterns", "Grammar patterns", "S"],
  ];
  elements.statsGrid.innerHTML = cards.map(([key, label, icon]) => `
    <article class="stat-card">
      <span class="stat-icon" aria-hidden="true">${icon}</span>
      <strong>${statistics.totals[key].toLocaleString()}</strong>
      <span>${label}</span>
    </article>
  `).join("");
}

function renderHero() {
  const { entrypoint, statistics, catalog } = state.data;
  const latestWeek = entrypoint.latest_week_start;
  const latestCount = statistics.by_week_start[latestWeek] ?? 0;
  const latestItems = catalog.items.filter((item) => item.week_start === latestWeek);
  const expressions = latestItems.filter((item) => item.type === "expression").length;
  const particles = latestItems.filter((item) => item.type === "particle").length;
  const currentWeek = mondayOf(new Date());

  elements.todayLabel.textContent = `Today · ${new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}`;
  elements.latestWeek.textContent = formatWeek(latestWeek, { year: true });
  elements.latestWeekCount.textContent = `${latestCount} items first learned`;
  elements.heroSummary.textContent = latestWeek === currentWeek
    ? `This week you added ${latestCount} items, including ${expressions} expressions and ${particles} particles.`
    : `Your latest recorded week added ${latestCount} items. Pick up where you left off with a focused review.`;
  elements.updatedLabel.textContent = `Updated ${formatWeek(state.data.catalog.generated_at, { year: true })}`;
}

function reviewExercises(review) {
  return ["recall", "translation", "cloze", "grammar", "roleplay"]
    .flatMap((section) => review[section].map((exercise) => ({ ...exercise, section })));
}

function renderReview() {
  const latestWeek = state.data.entrypoint.latest_week_start;
  const review = state.data.reviews.find((item) => item.week_start === latestWeek);
  if (!review) {
    elements.reviewContent.innerHTML = "<p>No prepared review is available for the latest week yet.</p>";
    elements.reviewCount.textContent = "0 prompts";
    return;
  }

  const exercises = reviewExercises(review);
  const weekItems = state.data.catalog.items.filter((item) => item.week_start === latestWeek);
  const curriculum = Object.entries(TYPE_PLURALS)
    .map(([type, label]) => [label, weekItems.filter((item) => item.type === type).length])
    .filter(([, count]) => count > 0);
  const activityCounts = ["recall", "translation", "cloze", "grammar", "roleplay"]
    .map((section) => [section, review[section].length])
    .filter(([, count]) => count > 0);
  elements.reviewCount.textContent = `${exercises.length} prompts`;
  elements.reviewContent.innerHTML = `
    <div class="review-summary">
      <span class="review-number">${exercises.length}</span>
      <div>
        <strong>Prepared exercises</strong>
        <span>Teacher-prepared application prompts</span>
      </div>
    </div>
    <div class="workshop-breakdown">
      <div>
        <strong>This week’s curriculum</strong>
        <span>${curriculum.map(([label, count]) => `${count} ${label.toLocaleLowerCase()}`).join(" · ")}</span>
      </div>
      <div>
        <strong>Workshop activities</strong>
        <span>${activityCounts.map(([label, count]) => `${count} ${label}`).join(" · ")}</span>
      </div>
    </div>
    <div class="review-topics">
      ${review.focus_ids.slice(0, 5).map((id) => `<span>${escapeHtml(id.split("-").slice(1).join(" ").replaceAll("_", " "))}</span>`).join("")}
    </div>
    <button class="primary-button" id="open-review" type="button">Open full workshop</button>
  `;
  document.querySelector("#open-review").addEventListener("click", () => showReviewDialog(review));
}

function populateFilters() {
  const types = [...new Set(state.data.catalog.items.map((item) => item.type))];
  elements.typeFilter.insertAdjacentHTML("beforeend", types.map((type) => `
    <option value="${type}">${TYPE_PLURALS[type] ?? type}</option>
  `).join(""));

  const weeks = [...new Set(state.data.catalog.items.map((item) => item.week_start))].sort().reverse();
  elements.weekFilter.insertAdjacentHTML("beforeend", weeks.map((week) => `
    <option value="${week}">Week of ${formatWeek(week, { year: true })}</option>
  `).join(""));
  elements.practiceWeekFilter.innerHTML = weeks.map((week) => `
    <option value="${week}">Week of ${formatWeek(week, { year: true })}</option>
  `).join("");
}

function renderPracticeProgress(progress = loadProgress()) {
  elements.practiceXp.textContent = progress.xp;
  elements.practiceStreak.textContent = progress.streak;
  elements.practiceAccuracy.textContent = progress.answered
    ? `${Math.round((progress.correct / progress.answered) * 100)}%`
    : "—";
  renderCoverage(progress);
}

function renderCoverage(progress = loadProgress()) {
  if (!state.data) return;
  const week = elements.practiceWeekFilter.value || state.data.entrypoint.latest_week_start;
  const practiceTypes = new Set(["word", "expression", "particle"]);
  const ids = state.data.catalog.items
    .filter((item) => item.week_start === week && practiceTypes.has(item.type))
    .map((item) => item.id);
  const practiced = ids.filter((id) => progress.items[id]?.correct || progress.items[id]?.wrong);
  const mastered = ids.filter((id) => {
    const item = progress.items[id];
    return item && item.correct >= 2 && item.correct > item.wrong;
  });
  const percent = ids.length ? Math.round((practiced.length / ids.length) * 100) : 0;
  elements.coverageRing.style.setProperty("--coverage", percent);
  elements.coveragePercent.textContent = `${percent}%`;
  elements.coverageBar.style.width = `${percent}%`;
  elements.coverageDetail.textContent = `${practiced.length} of ${ids.length} practice-ready items retrieved · ${mastered.length} showing stable recall.`;
}

function weakItemIds(progress = loadProgress()) {
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
  elements.lessonHearts.textContent = Array.from({ length: 3 }, (_, index) => index < lesson.hearts ? "♥" : "♡").join(" ");
  elements.lessonHearts.setAttribute("aria-label", `${lesson.hearts} hearts remaining`);
  elements.questionLabel.textContent = question.label;
  elements.lessonTitle.textContent = question.prompt;
  elements.questionHint.hidden = !question.hint;
  elements.questionHint.textContent = question.hint ?? "";
  elements.lessonFeedback.hidden = true;
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
  const progress = saveSessionProgress(state.lesson.results);
  renderPracticeProgress(progress);
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
      <div><strong>${progress.xp}</strong><span>total XP</span></div>
    </div>
  `;
  elements.lessonFeedback.hidden = true;
  elements.lessonFooter.dataset.state = "complete";
  elements.lessonCheck.disabled = false;
  elements.lessonCheck.textContent = "Finish";
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
    if (lesson.index >= lesson.questions.length || lesson.hearts === 0) finishLesson();
    else renderQuestion();
    return;
  }
  const question = currentQuestion();
  const correct = checkAnswer(question, lesson.response);
  lesson.checked = true;
  lesson.results.push({ itemId: question.itemId, correct });
  if (!correct) {
    lesson.hearts -= 1;
    if (!question.retry) {
      lesson.questions.push({ ...question, retry: true, label: "Try this one again" });
    }
  }
  elements.lessonFeedback.hidden = false;
  elements.feedbackTitle.textContent = correct ? "Correct!" : "Not quite";
  elements.feedbackCopy.textContent = correct ? "+10 XP" : `Correct answer: ${question.answer}`;
  elements.lessonFooter.dataset.state = correct ? "correct" : "wrong";
  elements.lessonCheck.textContent = lesson.index === lesson.questions.length - 1 || lesson.hearts === 0 ? "See results" : "Continue";
  elements.lessonCheck.disabled = false;
  elements.answerArea.querySelectorAll("button, input").forEach((control) => { control.disabled = true; });
}

async function startLesson(mode = "recall", trigger = null) {
  const sizes = { recognition: 20, recall: 25, mastery: 30 };
  const originalLabel = trigger?.textContent;
  if (trigger) {
    trigger.disabled = true;
    trigger.textContent = "Building lesson…";
  }
  try {
    state.practiceItems ??= await loadPracticeItems(state.data.entrypoint);
    const session = buildSession(state.practiceItems, {
      week: mode === "mastery" ? "all" : elements.practiceWeekFilter.value,
      size: sizes[mode] ?? 25,
      weakIds: weakItemIds(),
      mode,
    });
    if (!session.questions.length) throw new Error("No practice items available");
    state.lesson = { ...session, index: 0, hearts: 3, results: [], response: "", checked: false, complete: false };
    renderQuestion();
    elements.lessonDialog.showModal();
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

function showReviewDialog(review) {
  const exercises = reviewExercises(review);
  elements.dialogType.textContent = `Prepared review · Week of ${formatWeek(review.week_start, { year: true })}`;
  elements.dialogTitle.textContent = "Weekly practice";
  elements.dialogContent.innerHTML = `
    <div class="exercise-list">
      ${exercises.map((exercise, index) => `
        <details ${index === 0 ? "open" : ""}>
          <summary><span>${TYPE_LABELS[exercise.section] ?? exercise.section}</span>${escapeHtml(exercise.prompt)}</summary>
          <div><strong>Answer</strong><p>${escapeHtml(exercise.answer)}</p></div>
        </details>
      `).join("")}
    </div>
  `;
  elements.dialog.showModal();
}

function updateFilters() {
  state.query = elements.searchInput.value;
  state.type = elements.typeFilter.value;
  state.week = elements.weekFilter.value;
  state.visible = 24;
  renderLibrary();
}

function bindEvents() {
  elements.searchForm.addEventListener("submit", (event) => event.preventDefault());
  elements.searchInput.addEventListener("input", updateFilters);
  elements.typeFilter.addEventListener("change", updateFilters);
  elements.weekFilter.addEventListener("change", updateFilters);
  elements.clearFilters.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.typeFilter.value = "all";
    elements.weekFilter.value = "all";
    updateFilters();
    elements.searchInput.focus();
  });
  elements.loadMore.addEventListener("click", () => {
    state.visible += 24;
    renderLibrary();
  });
  elements.reviewButton.addEventListener("click", () => document.querySelector("#review").scrollIntoView({ behavior: "smooth" }));
  elements.dialogClose.addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) elements.dialog.close();
  });
  elements.themeToggle.addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("dutch-os-theme", dark ? "dark" : "light");
    elements.themeToggle.setAttribute("aria-label", dark ? "Use light theme" : "Use dark theme");
  });
  elements.academyStarts.forEach((button) => button.addEventListener("click", () => startLesson(button.dataset.mode, button)));
  elements.academyReview.addEventListener("click", () => {
    const review = state.data.reviews.find((item) => item.week_start === elements.practiceWeekFilter.value);
    if (review) showReviewDialog(review);
  });
  elements.practiceWeekFilter.addEventListener("change", () => renderPracticeProgress());
  elements.lessonCheck.addEventListener("click", checkLessonAnswer);
  elements.lessonClose.addEventListener("click", () => elements.lessonDialog.close());
}

async function init() {
  const savedTheme = localStorage.getItem("dutch-os-theme");
  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
    elements.themeToggle.setAttribute("aria-label", savedTheme === "dark" ? "Use light theme" : "Use dark theme");
  }
  bindEvents();
  try {
    state.data = await loadDashboardData();
    renderHero();
    renderStats();
    renderReview();
    populateFilters();
    renderPracticeProgress();
    renderLibrary();
  } catch (error) {
    console.error(error);
    elements.fatalError.hidden = false;
    elements.heroSummary.textContent = "Repository data could not be loaded.";
  }
}

init();
