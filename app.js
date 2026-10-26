const CONFIG_URL = "config.json";
const THEME_KEY = "mechanical-flashcards-theme";
const LEGACY_STORAGE_KEY = "mechanical-flashcards-progress-v1";
const LEGACY_MIGRATION_KEY = "mechanical-flashcards:legacy-migrated-v2";
const CHAPTER_STORAGE_PREFIX = "mechanical-flashcards:chapter:";

const THEME_COLORS = {
  light: "#f4f5f1",
  dark: "#111713"
};

const LEGACY_CHAPTER_RANGES = {
  "1": [1, 1],
  "2": [2, 20],
  "3": [21, 26],
  "4": [27, 49],
  "5": [50, 85],
  "6": [86, 104],
  "8": [105, 132],
  "9": [133, 160],
  "10": [161, 191]
};

const elements = {
  themeToggles: document.querySelectorAll("[data-theme-toggle]"),
  themeColorMeta: document.querySelector('meta[name="theme-color"]'),
  brandBlock: document.querySelector("#brand-block"),
  backButton: document.querySelector("#back-button"),
  studyMeta: document.querySelector("#study-meta"),
  studyChapterTitle: document.querySelector("#study-chapter-title"),
  directoryView: document.querySelector("#directory-view"),
  studyView: document.querySelector("#study-view"),
  chapterList: document.querySelector("#chapter-list"),
  loadingState: document.querySelector("#loading-state"),
  errorState: document.querySelector("#error-state"),
  errorMessage: document.querySelector("#error-message"),
  retryButton: document.querySelector("#retry-button"),
  overallProgress: document.querySelector("#overall-progress"),
  studyProgressText: document.querySelector("#study-progress-text"),
  studyProgressTrack: document.querySelector("#study-progress-track"),
  studyProgressFill: document.querySelector("#study-progress-fill"),
  cardStage: document.querySelector("#card-stage"),
  flashcard: document.querySelector("#flashcard"),
  cardBack: document.querySelector("#card-back"),
  questionText: document.querySelector("#question-text"),
  answerText: document.querySelector("#answer-text"),
  keywordValue: document.querySelector("#keyword-value"),
  cardIndex: document.querySelector("#card-index"),
  completionPanel: document.querySelector("#completion-panel"),
  completionCopy: document.querySelector("#completion-copy"),
  actionButtons: document.querySelector("#action-buttons"),
  rememberButton: document.querySelector("#remember-button"),
  forgotButton: document.querySelector("#forgot-button"),
  restartButton: document.querySelector("#restart-button"),
  queueStatus: document.querySelector("#queue-status")
};

let chapters = [];
let activeChapter = null;
let isFlipped = false;
let loadRequestId = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getChapterStorageKey(chapterId) {
  return `${CHAPTER_STORAGE_PREFIX}${chapterId}`;
}

function normalizeChapterState(cards, savedState) {
  const validIds = new Set(cards.map((card) => card.id));
  const mastered = Array.isArray(savedState?.mastered)
    ? [...new Set(savedState.mastered)].filter((id) => validIds.has(id))
    : [];
  const masteredSet = new Set(mastered);
  const savedQueue = Array.isArray(savedState?.queue)
    ? [...new Set(savedState.queue)].filter(
        (id) => validIds.has(id) && !masteredSet.has(id)
      )
    : [];
  const queuedSet = new Set(savedQueue);

  cards.forEach((card) => {
    if (!masteredSet.has(card.id) && !queuedSet.has(card.id)) {
      savedQueue.push(card.id);
      queuedSet.add(card.id);
    }
  });

  return {
    mastered,
    queue: savedQueue
  };
}

function readChapterState(chapter) {
  try {
    const savedState = JSON.parse(
      localStorage.getItem(getChapterStorageKey(chapter.id))
    );
    return normalizeChapterState(chapter.cards, savedState);
  } catch {
    return normalizeChapterState(chapter.cards, null);
  }
}

function saveChapterState(chapter) {
  try {
    localStorage.setItem(
      getChapterStorageKey(chapter.id),
      JSON.stringify(chapter.state)
    );
  } catch {
    // The current session can continue even if storage is unavailable.
  }
}

function saveChapterStateDirectly(chapterId, state) {
  try {
    localStorage.setItem(
      getChapterStorageKey(chapterId),
      JSON.stringify(state)
    );
  } catch {
    // Migration is best-effort.
  }
}

function migrateLegacyProgress(loadedChapters) {
  try {
    if (localStorage.getItem(LEGACY_MIGRATION_KEY) === "1") {
      return;
    }

    const rawLegacyState = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!rawLegacyState) {
      localStorage.setItem(LEGACY_MIGRATION_KEY, "1");
      return;
    }

    const legacyState = JSON.parse(rawLegacyState);
    const legacyMastered = new Set(
      Array.isArray(legacyState?.mastered) ? legacyState.mastered : []
    );
    const legacyQueue = Array.isArray(legacyState?.queue)
      ? legacyState.queue
      : [];

    loadedChapters.forEach((chapter) => {
      const storageKey = getChapterStorageKey(chapter.id);
      if (localStorage.getItem(storageKey)) {
        return;
      }

      const range = LEGACY_CHAPTER_RANGES[chapter.id];
      if (!range) {
        return;
      }

      const [rangeStart, rangeEnd] = range;
      const toLocalId = (legacyId) => {
        const match = /^card-(\d+)$/.exec(String(legacyId));
        if (!match) {
          return null;
        }
        const legacyIndex = Number(match[1]);
        if (legacyIndex < rangeStart || legacyIndex > rangeEnd) {
          return null;
        }
        return `card-${legacyIndex - rangeStart + 1}`;
      };

      const mastered = [
        ...new Set([...legacyMastered].map(toLocalId).filter(Boolean))
      ];
      const masteredSet = new Set(mastered);
      const queue = [
        ...new Set(legacyQueue.map(toLocalId).filter(Boolean))
      ].filter((id) => !masteredSet.has(id));

      saveChapterStateDirectly(
        chapter.id,
        normalizeChapterState(chapter.cards, { mastered, queue })
      );
    });

    localStorage.setItem(LEGACY_MIGRATION_KEY, "1");
  } catch {
    // Invalid legacy data should not prevent the catalog from loading.
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`请求 ${url} 失败：${response.status}`);
  }
  return response.json();
}

function normalizeChapter(meta, cards) {
  assert(Array.isArray(cards), `章节 ${meta.name} 的数据不是数组`);
  assert(cards.length > 0, `章节 ${meta.name} 暂无题目`);

  const normalizedCards = cards.map((card, index) => {
    assert(
      card &&
        typeof card.question === "string" &&
        typeof card.answer === "string",
      `章节 ${meta.name} 第 ${index + 1} 题格式不正确`
    );
    return {
      id: `card-${index + 1}`,
      question: card.question,
      answer: card.answer,
      keyword: typeof card.keyword === "string" ? card.keyword : ""
    };
  });

  return {
    id: String(meta.id),
    name: String(meta.name),
    file: String(meta.file),
    cards: normalizedCards,
    state: null
  };
}

async function loadCatalog() {
  const requestId = ++loadRequestId;
  setLoadingState(true);

  try {
    const chapterConfig = await fetchJson(CONFIG_URL);
    assert(Array.isArray(chapterConfig), "config.json 必须是数组");

    const loadedChapters = await Promise.all(
      chapterConfig.map(async (meta) => {
        assert(
          meta &&
            meta.id !== undefined &&
            typeof meta.name === "string" &&
            typeof meta.file === "string",
          "config.json 中存在无效章节配置"
        );
        const cards = await fetchJson(meta.file);
        return normalizeChapter(meta, cards);
      })
    );

    if (requestId !== loadRequestId) {
      return;
    }

    migrateLegacyProgress(loadedChapters);
    loadedChapters.forEach((chapter) => {
      chapter.state = readChapterState(chapter);
    });

    chapters = loadedChapters;
    renderDirectory();
    setLoadingState(false);
  } catch (error) {
    if (requestId !== loadRequestId) {
      return;
    }
    showLoadError(error);
  }
}

function setLoadingState(isLoading) {
  elements.chapterList.hidden = isLoading;
  elements.loadingState.hidden = !isLoading;
  elements.errorState.hidden = true;
  elements.chapterList.setAttribute("aria-busy", String(isLoading));

  if (isLoading) {
    elements.chapterList.replaceChildren();
    elements.overallProgress.textContent = "读取中";
  }
}

function showLoadError(error) {
  elements.chapterList.hidden = true;
  elements.loadingState.hidden = true;
  elements.errorState.hidden = false;
  elements.overallProgress.textContent = "加载失败";
  elements.errorMessage.textContent =
    location.protocol === "file:"
      ? "请通过本地 HTTP 服务器打开页面，浏览器不允许 file:// 页面读取 JSON。"
      : error.message || "章节数据加载失败。";
}

function createProgressTrack(mastered, total, className) {
  const track = document.createElement("span");
  track.className = className;
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", String(total));
  track.setAttribute("aria-valuenow", String(mastered));

  const fill = document.createElement("span");
  fill.className = `${className}-fill`;
  fill.style.width = total > 0 ? `${(mastered / total) * 100}%` : "0%";
  track.append(fill);
  return track;
}

function createChevronIcon() {
  const namespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(namespace, "svg");
  icon.setAttribute("width", "18");
  icon.setAttribute("height", "18");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.8");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");

  const path = document.createElementNS(namespace, "path");
  path.setAttribute("d", "m9 18 6-6-6-6");
  icon.append(path);
  return icon;
}

function createChapterRow(chapter) {
  const total = chapter.cards.length;
  const mastered = chapter.state.mastered.length;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chapter-item";
  button.dataset.chapterId = chapter.id;
  button.setAttribute(
    "aria-label",
    `${chapter.name}，已掌握 ${mastered} / 总题数 ${total}`
  );

  const code = document.createElement("span");
  code.className = "chapter-code";
  code.textContent = String(chapter.id).padStart(2, "0");

  const content = document.createElement("span");
  content.className = "chapter-content";

  const name = document.createElement("span");
  name.className = "chapter-name";
  name.textContent = chapter.name;

  const progress = document.createElement("span");
  progress.className = "chapter-progress";

  const progressText = document.createElement("span");
  progressText.className = "chapter-progress-text";
  progressText.textContent = `已掌握 ${mastered} / 总题数 ${total}`;

  progress.append(
    createProgressTrack(mastered, total, "chapter-progress-track"),
    progressText
  );
  content.append(name, progress);

  const arrow = document.createElement("span");
  arrow.className = "chapter-arrow";
  arrow.append(createChevronIcon());

  button.append(code, content, arrow);
  return button;
}

function renderDirectory() {
  const fragment = document.createDocumentFragment();
  chapters.forEach((chapter) => {
    fragment.append(createChapterRow(chapter));
  });
  elements.chapterList.replaceChildren(fragment);
  elements.chapterList.hidden = false;
  elements.errorState.hidden = true;

  const totalCards = chapters.reduce(
    (sum, chapter) => sum + chapter.cards.length,
    0
  );
  const totalMastered = chapters.reduce(
    (sum, chapter) => sum + chapter.state.mastered.length,
    0
  );
  elements.overallProgress.textContent = `总进度 ${totalMastered} / ${totalCards}`;
}

function getCurrentCard() {
  if (!activeChapter) {
    return null;
  }
  const currentId = activeChapter.state.queue[0];
  return activeChapter.cards.find((card) => card.id === currentId) || null;
}

function setFlipped(nextValue) {
  isFlipped = nextValue;
  elements.flashcard.classList.toggle("is-flipped", isFlipped);
  elements.flashcard.setAttribute("aria-pressed", String(isFlipped));
  elements.flashcard.setAttribute(
    "aria-label",
    isFlipped ? "收起答案" : "翻转卡片"
  );
  elements.cardBack.setAttribute("aria-hidden", String(!isFlipped));
  elements.rememberButton.disabled = !isFlipped;
  elements.forgotButton.disabled = !isFlipped;
}

function toggleCard() {
  if (!getCurrentCard()) {
    return;
  }
  setFlipped(!isFlipped);
}

function updateStudyProgress() {
  const total = activeChapter.cards.length;
  const mastered = activeChapter.state.mastered.length;
  elements.studyProgressText.textContent = `已掌握 ${mastered} / 总题数 ${total}`;
  elements.studyProgressFill.style.width = `${(mastered / total) * 100}%`;
  elements.studyProgressTrack.setAttribute("aria-valuemax", String(total));
  elements.studyProgressTrack.setAttribute("aria-valuenow", String(mastered));
}

function playCardEnter() {
  elements.flashcard.classList.remove("card-enter");
  void elements.flashcard.offsetWidth;
  elements.flashcard.classList.add("card-enter");
}

function showCompletion() {
  setFlipped(false);
  elements.flashcard.hidden = true;
  elements.completionPanel.hidden = false;
  elements.actionButtons.hidden = true;
  elements.restartButton.hidden = false;
  elements.flashcard.setAttribute("tabindex", "-1");
  elements.completionCopy.textContent =
    `本章 ${activeChapter.cards.length} 个考点已全部掌握。`;
  elements.queueStatus.textContent = "本章完成";
}

function renderCard({ animate = false } = {}) {
  if (!activeChapter) {
    return;
  }

  const currentCard = getCurrentCard();
  elements.flashcard.classList.remove("is-flipped", "card-enter");
  isFlipped = false;
  elements.rememberButton.disabled = true;
  elements.forgotButton.disabled = true;

  if (!currentCard) {
    showCompletion();
    updateStudyProgress();
    return;
  }

  elements.flashcard.hidden = false;
  elements.completionPanel.hidden = true;
  elements.actionButtons.hidden = false;
  elements.restartButton.hidden = true;
  elements.flashcard.setAttribute("tabindex", "0");
  elements.flashcard.setAttribute("aria-pressed", "false");
  elements.flashcard.setAttribute("aria-label", "翻转卡片");
  elements.cardBack.setAttribute("aria-hidden", "true");

  elements.questionText.textContent = currentCard.question;
  elements.answerText.textContent = currentCard.answer;
  elements.keywordValue.textContent = currentCard.keyword;
  const originalIndex =
    activeChapter.cards.findIndex((card) => card.id === currentCard.id) + 1;
  elements.cardIndex.textContent =
    `${originalIndex} / ${activeChapter.cards.length}`;

  const remainingCount = activeChapter.state.queue.length;
  elements.queueStatus.textContent =
    remainingCount > 1 ? `本章剩余 ${remainingCount} 张` : "本章最后一张";

  updateStudyProgress();

  if (animate) {
    playCardEnter();
  }
}

function openChapter(chapterId) {
  const chapter = chapters.find((item) => item.id === String(chapterId));
  if (!chapter) {
    return;
  }

  activeChapter = chapter;
  elements.directoryView.hidden = true;
  elements.studyView.hidden = false;
  elements.brandBlock.hidden = true;
  elements.backButton.hidden = false;
  elements.studyMeta.hidden = false;
  elements.studyChapterTitle.textContent = chapter.name;
  document.title = `${chapter.name} · 机械设计闪卡`;
  window.scrollTo(0, 0);
  renderCard();
}

function returnToDirectory() {
  activeChapter = null;
  isFlipped = false;
  elements.studyView.hidden = true;
  elements.directoryView.hidden = false;
  elements.brandBlock.hidden = false;
  elements.backButton.hidden = true;
  elements.studyMeta.hidden = true;
  elements.flashcard.classList.remove("is-flipped", "card-enter");
  document.title = "机械设计闪卡";
  renderDirectory();
  window.scrollTo(0, 0);
}

function rememberCurrentCard() {
  const currentCard = getCurrentCard();
  if (!currentCard || !isFlipped) {
    return;
  }

  activeChapter.state.mastered.push(currentCard.id);
  activeChapter.state.queue.shift();
  saveChapterState(activeChapter);
  renderCard({ animate: true });
}

function forgetCurrentCard() {
  const currentCard = getCurrentCard();
  if (!currentCard || !isFlipped) {
    return;
  }

  activeChapter.state.queue = [
    ...activeChapter.state.queue.slice(1),
    activeChapter.state.queue[0]
  ];
  saveChapterState(activeChapter);
  renderCard({ animate: true });
}

function restartChapter() {
  if (!activeChapter) {
    return;
  }

  activeChapter.state = normalizeChapterState(activeChapter.cards, null);
  saveChapterState(activeChapter);
  renderCard({ animate: true });
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Theme persistence is optional.
  }
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  elements.themeColorMeta.setAttribute("content", THEME_COLORS[theme]);
  elements.themeToggles.forEach((button) => {
    const label = theme === "dark" ? "切换浅色模式" : "切换深色模式";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  });
  saveTheme(theme);
}

function toggleTheme() {
  const nextTheme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
}

function bindEvents() {
  elements.chapterList.addEventListener("click", (event) => {
    const chapterButton = event.target.closest("[data-chapter-id]");
    if (chapterButton) {
      openChapter(chapterButton.dataset.chapterId);
    }
  });

  elements.backButton.addEventListener("click", returnToDirectory);
  elements.flashcard.addEventListener("click", toggleCard);
  elements.flashcard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCard();
    }
  });
  elements.rememberButton.addEventListener("click", rememberCurrentCard);
  elements.forgotButton.addEventListener("click", forgetCurrentCard);
  elements.restartButton.addEventListener("click", restartChapter);
  elements.retryButton.addEventListener("click", loadCatalog);
  elements.themeToggles.forEach((button) => {
    button.addEventListener("click", toggleTheme);
  });
}

function initialize() {
  const initialTheme =
    document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  setTheme(initialTheme);
  bindEvents();
  loadCatalog();
}

initialize();
