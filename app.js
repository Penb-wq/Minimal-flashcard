const CONFIG_URL = "config.json";
const THEME_KEY = "mechanical-flashcards-theme";
const CHECKIN_KEY = "mechanical-flashcards:daily-checkin-v1";
const UPDATE_LOG_KEY = "hasSeenUpdate_v1.1";
const PROGRESS_PREFIX = "progress_";
const LEGACY_CHAPTER_PREFIX = "mechanical-flashcards:chapter:";
const LEGACY_GLOBAL_KEY = "mechanical-flashcards-progress-v1";

const THEME_COLORS = {
  light: "#f4f5f1",
  dark: "#111713"
};

const LEGACY_GLOBAL_RANGES = {
  md_ch1: [1, 1],
  md_ch2: [2, 20],
  md_ch3: [21, 26],
  md_ch4: [27, 49],
  md_ch5: [50, 85],
  md_ch6: [86, 104],
  md_ch8: [105, 132],
  md_ch9: [133, 160],
  md_ch10: [161, 191],
  md_ch11: [192, 222],
  md_ch12: [223, 246],
  md_ch13: [247, 273],
  md_ch14: [274, 277],
  md_ch15: [278, 288]
};

const elements = {
  themeToggles: document.querySelectorAll("[data-theme-toggle]"),
  themeColorMeta: document.querySelector('meta[name="theme-color"]'),
  brandBlock: document.querySelector("#brand-block"),
  backButton: document.querySelector("#back-button"),
  backLabel: document.querySelector("#back-label"),
  updateLogButton: document.querySelector("#update-log-button"),
  updateLogModal: document.querySelector("#update-log-modal"),
  updateLogClose: document.querySelector("#update-log-close"),
  subjectMeta: document.querySelector("#subject-meta"),
  subjectMetaIcon: document.querySelector("#subject-meta-icon"),
  subjectMetaTitle: document.querySelector("#subject-meta-title"),
  subjectProgressText: document.querySelector("#subject-progress-text"),
  subjectProgressTrack: document.querySelector("#subject-progress-track"),
  subjectProgressFill: document.querySelector("#subject-progress-fill"),
  studyMeta: document.querySelector("#study-meta"),
  studySubjectName: document.querySelector("#study-subject-name"),
  studyChapterTitle: document.querySelector("#study-chapter-title"),
  studyProgressText: document.querySelector("#study-progress-text"),
  studyProgressTrack: document.querySelector("#study-progress-track"),
  studyProgressFill: document.querySelector("#study-progress-fill"),
  hallView: document.querySelector("#hall-view"),
  chapterView: document.querySelector("#chapter-view"),
  studyView: document.querySelector("#study-view"),
  subjectList: document.querySelector("#subject-list"),
  chapterList: document.querySelector("#chapter-list"),
  hallOverallProgress: document.querySelector("#hall-overall-progress"),
  streakButton: document.querySelector("#streak-button"),
  chapterDirectoryMeta: document.querySelector("#chapter-directory-meta"),
  loadingState: document.querySelector("#loading-state"),
  errorState: document.querySelector("#error-state"),
  errorMessage: document.querySelector("#error-message"),
  retryButton: document.querySelector("#retry-button"),
  comingSoonTemplate: document.querySelector("#coming-soon-template"),
  submissionTrigger: document.querySelector("#submission-trigger"),
  submissionModal: document.querySelector("#submission-modal"),
  submissionClose: document.querySelector("#submission-close"),
  checkinModal: document.querySelector("#checkin-modal"),
  checkinSummary: document.querySelector("#checkin-summary"),
  checkinClose: document.querySelector("#checkin-close"),
  flashcard: document.querySelector("#flashcard"),
  cardBack: document.querySelector("#card-back"),
  questionText: document.querySelector("#question-text"),
  answerText: document.querySelector("#answer-text"),
  keywordValue: document.querySelector("#keyword-value"),
  cardIndex: document.querySelector("#card-index"),
  completionPanel: document.querySelector("#completion-panel"),
  completionCopy: document.querySelector("#completion-copy"),
  completionActions: document.querySelector("#completion-actions"),
  nextChapterButton: document.querySelector("#next-chapter-button"),
  returnDirectoryButton: document.querySelector("#return-directory-button"),
  actionButtons: document.querySelector("#action-buttons"),
  rememberButton: document.querySelector("#remember-button"),
  forgotButton: document.querySelector("#forgot-button"),
  queueStatus: document.querySelector("#queue-status")
};

let subjects = [];
let activeSubject = null;
let activeChapter = null;
let currentView = "hall";
let isFlipped = false;
let loadRequestId = 0;
let updateAutoOpenAttempted = false;
let checkInState = {
  lastStudyDate: null,
  streak: 0,
  totalDays: 0
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getProgressKey(subjectId, chapterId) {
  return `${PROGRESS_PREFIX}${subjectId}_${chapterId}`;
}

function normalizeChapterState(cards, savedState) {
  const validIds = new Set(cards.map((card) => card.id));
  const mastered = Array.isArray(savedState?.mastered)
    ? [...new Set(savedState.mastered)].filter((id) => validIds.has(id))
    : [];
  const masteredSet = new Set(mastered);
  const queue = Array.isArray(savedState?.queue)
    ? [...new Set(savedState.queue)].filter(
        (id) => validIds.has(id) && !masteredSet.has(id)
      )
    : [];
  const queuedSet = new Set(queue);

  cards.forEach((card) => {
    if (!masteredSet.has(card.id) && !queuedSet.has(card.id)) {
      queue.push(card.id);
      queuedSet.add(card.id);
    }
  });

  return { mastered, queue };
}

function readChapterState(subjectId, chapter) {
  try {
    const savedState = JSON.parse(
      localStorage.getItem(getProgressKey(subjectId, chapter.id))
    );
    return normalizeChapterState(chapter.cards, savedState);
  } catch {
    return normalizeChapterState(chapter.cards, null);
  }
}

function saveChapterState(subjectId, chapter) {
  try {
    localStorage.setItem(
      getProgressKey(subjectId, chapter.id),
      JSON.stringify(chapter.state)
    );
  } catch {
    // The current session continues even if storage is unavailable.
  }
}

function saveChapterStateDirectly(subjectId, chapterId, state) {
  try {
    localStorage.setItem(
      getProgressKey(subjectId, chapterId),
      JSON.stringify(state)
    );
  } catch {
    // Migration is best-effort.
  }
}

function getLegacyChapterId(chapterId) {
  const chapterMatch = /^md_ch(\d+)$/.exec(chapterId);
  if (chapterMatch) {
    return chapterMatch[1];
  }
  const appendixMatch = /^md_a(\d+)$/.exec(chapterId);
  if (appendixMatch) {
    return `A${appendixMatch[1]}`;
  }
  return null;
}

function getLegacyGlobalState(subjectId, chapter) {
  if (subjectId !== "mech_design") {
    return null;
  }

  const range = LEGACY_GLOBAL_RANGES[chapter.id];
  if (!range) {
    return null;
  }

  try {
    const savedGlobal = JSON.parse(localStorage.getItem(LEGACY_GLOBAL_KEY));
    if (!savedGlobal) {
      return null;
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
    const mastered = Array.isArray(savedGlobal.mastered)
      ? [...new Set(savedGlobal.mastered.map(toLocalId).filter(Boolean))]
      : [];
    const masteredSet = new Set(mastered);
    const queue = Array.isArray(savedGlobal.queue)
      ? [...new Set(savedGlobal.queue.map(toLocalId).filter(Boolean))].filter(
          (id) => !masteredSet.has(id)
        )
      : [];

    return { mastered, queue };
  } catch {
    return null;
  }
}

function migrateLegacyProgress(loadedSubjects) {
  try {
    loadedSubjects.forEach((subject) => {
      subject.chapters.forEach((chapter) => {
        const progressKey = getProgressKey(subject.subjectId, chapter.id);
        if (localStorage.getItem(progressKey)) {
          return;
        }

        let legacyState = null;
        if (subject.subjectId === "mech_design") {
          const legacyChapterId = getLegacyChapterId(chapter.id);
          if (legacyChapterId) {
            try {
              legacyState = JSON.parse(
                localStorage.getItem(
                  `${LEGACY_CHAPTER_PREFIX}${legacyChapterId}`
                )
              );
            } catch {
              legacyState = null;
            }
          }
          if (!legacyState) {
            legacyState = getLegacyGlobalState(subject.subjectId, chapter);
          }
        }

        if (legacyState) {
          saveChapterStateDirectly(
            subject.subjectId,
            chapter.id,
            normalizeChapterState(chapter.cards, legacyState)
          );
        }
      });
    });
  } catch {
    // Invalid or unavailable legacy storage should not block the platform.
  }
}

function getSubjectStats(subject) {
  return subject.chapters.reduce(
    (stats, chapter) => {
      stats.total += chapter.cards.length;
      stats.mastered += chapter.state.mastered.length;
      return stats;
    },
    { mastered: 0, total: 0 }
  );
}

function getChapterStats(chapter) {
  return {
    mastered: chapter.state.mastered.length,
    total: chapter.cards.length
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`请求 ${url} 失败：${response.status}`);
  }
  return response.json();
}

function normalizeCards(chapterName, cards) {
  assert(Array.isArray(cards), `${chapterName} 的数据不是数组`);
  assert(cards.length > 0, `${chapterName} 暂无题目`);

  return cards.map((card, index) => {
    assert(
      card &&
        typeof card.question === "string" &&
        typeof card.answer === "string",
      `${chapterName} 第 ${index + 1} 题格式不正确`
    );
    return {
      id: `card-${index + 1}`,
      question: card.question,
      answer: card.answer,
      keyword: typeof card.keyword === "string" ? card.keyword : ""
    };
  });
}

function normalizeConfig(rawConfig) {
  assert(Array.isArray(rawConfig), "config.json 必须是数组");

  const subjectIds = new Set();
  const chapterIds = new Set();
  return rawConfig.map((subject, subjectIndex) => {
    assert(
      subject &&
        typeof subject.subjectId === "string" &&
        subject.subjectId.trim(),
      `第 ${subjectIndex + 1} 个科目缺少 subjectId`
    );
    assert(
      typeof subject.subjectName === "string" && subject.subjectName.trim(),
      `${subject.subjectId} 缺少 subjectName`
    );
    assert(!subjectIds.has(subject.subjectId), "subjectId 不得重复");
    subjectIds.add(subject.subjectId);
    assert(
      Array.isArray(subject.chapters) && subject.chapters.length > 0,
      `${subject.subjectName} 暂无章节`
    );
    assert(
      subject.comingSoon === undefined ||
        typeof subject.comingSoon === "boolean",
      `${subject.subjectName} 的 comingSoon 必须是布尔值`
    );

    const groups = Array.isArray(subject.groups)
      ? subject.groups.map((group, groupIndex) => {
          assert(
            group &&
              typeof group.id === "string" &&
              group.id.trim() &&
              typeof group.name === "string" &&
              group.name.trim(),
            `${subject.subjectName} 第 ${groupIndex + 1} 个小科目配置不正确`
          );
          return {
            id: group.id,
            name: group.name
          };
        })
      : [];
    const groupIds = new Set();
    groups.forEach((group) => {
      assert(!groupIds.has(group.id), "小科目 ID 不得重复");
      groupIds.add(group.id);
    });

    const chapters = subject.chapters.map((chapter, chapterIndex) => {
      assert(
        chapter &&
          typeof chapter.id === "string" &&
          chapter.id.trim() &&
          typeof chapter.name === "string" &&
          chapter.name.trim(),
        `${subject.subjectName} 第 ${chapterIndex + 1} 个章节配置不正确`
      );
      assert(!chapterIds.has(chapter.id), "章节 ID 必须在全站唯一");
      chapterIds.add(chapter.id);
      const groupId =
        typeof chapter.group === "string" && chapter.group
          ? chapter.group
          : null;
      assert(
        groupId === null || groupIds.has(groupId),
        `${chapter.name} 指定的小科目不存在`
      );
      return {
        id: chapter.id,
        name: chapter.name,
        groupId,
        cards: null,
        state: null
      };
    });

    return {
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      icon:
        typeof subject.icon === "string" && subject.icon.trim()
          ? subject.icon
          : "📚",
      comingSoon: subject.comingSoon === true,
      groups,
      chapters
    };
  });
}

async function loadPlatform() {
  const requestId = ++loadRequestId;
  setLoadingState(true);

  try {
    const rawConfig = await fetchJson(CONFIG_URL);
    const normalizedSubjects = normalizeConfig(rawConfig);
    const chapterJobs = [];

    normalizedSubjects.forEach((subject) => {
      subject.chapters.forEach((chapter) => {
        chapterJobs.push(
          fetchJson(`${chapter.id}.json`)
            .then((cards) => {
              chapter.cards = normalizeCards(chapter.name, cards);
            })
            .catch((error) => {
              throw new Error(`${chapter.name} 加载失败：${error.message}`);
            })
        );
      });
    });

    await Promise.all(chapterJobs);
    if (requestId !== loadRequestId) {
      return;
    }

    migrateLegacyProgress(normalizedSubjects);
    normalizedSubjects.forEach((subject) => {
      subject.chapters.forEach((chapter) => {
        chapter.state = readChapterState(subject.subjectId, chapter);
      });
    });

    subjects = normalizedSubjects;
    setLoadingState(false);
    setView("hall");
    renderHall();
    maybeShowUpdateLog();
  } catch (error) {
    if (requestId === loadRequestId) {
      showLoadError(error);
    }
  }
}

function setLoadingState(isLoading) {
  elements.subjectList.hidden = isLoading;
  elements.loadingState.hidden = !isLoading;
  elements.errorState.hidden = true;
  elements.chapterView.hidden = true;
  elements.studyView.hidden = true;
  elements.hallView.hidden = false;
  elements.brandBlock.hidden = false;
  elements.backButton.hidden = true;
  elements.subjectMeta.hidden = true;
  elements.studyMeta.hidden = true;
  elements.hallOverallProgress.textContent = isLoading ? "读取中" : "";
}

function showLoadError(error) {
  elements.subjectList.hidden = true;
  elements.loadingState.hidden = true;
  elements.errorState.hidden = false;
  elements.hallOverallProgress.textContent = "加载失败";
  elements.errorMessage.textContent =
    location.protocol === "file:"
      ? "请通过本地 HTTP 服务器打开页面，浏览器不允许 file:// 页面读取 JSON。"
      : error.message || "学习数据加载失败。";
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

function createSubjectCard(subject) {
  const { mastered, total } = getSubjectStats(subject);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "subject-card";
  if (subject.comingSoon) {
    button.classList.add("subject-card--coming-soon");
  }
  button.dataset.subjectId = subject.subjectId;
  button.setAttribute(
    "aria-label",
    `${subject.subjectName}，已掌握 ${mastered} / 总题数 ${total}`
  );

  const header = document.createElement("span");
  header.className = "subject-card-header";

  const icon = document.createElement("span");
  icon.className = "subject-icon";
  icon.textContent = subject.icon;
  icon.setAttribute("aria-hidden", "true");

  const arrow = document.createElement("span");
  arrow.className = "subject-arrow";
  arrow.append(createChevronIcon());
  header.append(icon, arrow);

  const name = document.createElement("span");
  name.className = "subject-name";
  name.textContent = subject.subjectName;

  const meta = document.createElement("span");
  meta.className = "subject-meta-line";
  const scopeText = subject.groups.length
    ? `${subject.groups.length} 个小科目`
    : `${subject.chapters.length} 个章节`;
  meta.textContent =
    `${scopeText} · 已掌握 ${mastered} / 总题数 ${total}`;

  const progress = document.createElement("span");
  progress.className = "subject-progress";
  progress.append(createProgressTrack(mastered, total, "subject-progress-track"));

  button.append(header, name, meta, progress);
  if (subject.comingSoon) {
    button.append(
      elements.comingSoonTemplate.content.cloneNode(true)
    );
  }
  return button;
}

function renderHall() {
  const fragment = document.createDocumentFragment();
  subjects.forEach((subject) => {
    fragment.append(createSubjectCard(subject));
  });
  elements.subjectList.replaceChildren(fragment);
  elements.subjectList.hidden = false;

  const totals = subjects.reduce(
    (result, subject) => {
      const stats = getSubjectStats(subject);
      result.mastered += stats.mastered;
      result.total += stats.total;
      return result;
    },
    { mastered: 0, total: 0 }
  );
  elements.hallOverallProgress.textContent =
    `总进度 ${totals.mastered} / ${totals.total}`;
}

function formatChapterCode(chapterId) {
  const chapterMatch = /_ch(\d+)$/i.exec(chapterId);
  if (chapterMatch) {
    return chapterMatch[1].padStart(2, "0");
  }
  const appendixMatch = /_a(\d+)$/i.exec(chapterId);
  if (appendixMatch) {
    return `A${appendixMatch[1]}`;
  }
  return chapterId;
}

function createChapterRow(chapter) {
  const { mastered, total } = getChapterStats(chapter);
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
  code.textContent = formatChapterCode(chapter.id);

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

function createChapterGroup(group, chapters) {
  const section = document.createElement("section");
  section.className = "chapter-group";

  const header = document.createElement("div");
  header.className = "chapter-group-heading";

  const name = document.createElement("span");
  name.textContent = group.name;

  const meta = document.createElement("span");
  meta.textContent = chapters.length
    ? `${chapters.length} 个章节`
    : "内容整理中";
  header.append(name, meta);
  section.append(header);

  if (chapters.length) {
    chapters.forEach((chapter) => {
      section.append(createChapterRow(chapter));
    });
  } else {
    const empty = document.createElement("div");
    empty.className = "chapter-group-empty";
    empty.textContent = "章节内容待更新";
    section.append(empty);
  }

  return section;
}

function renderSubjectMeta() {
  const stats = getSubjectStats(activeSubject);
  elements.subjectMetaIcon.textContent = activeSubject.icon;
  elements.subjectMetaTitle.textContent = activeSubject.subjectName;
  elements.subjectProgressText.textContent =
    `已掌握 ${stats.mastered} / 总题数 ${stats.total}`;
  elements.subjectProgressFill.style.width =
    stats.total > 0 ? `${(stats.mastered / stats.total) * 100}%` : "0%";
  elements.subjectProgressTrack.setAttribute(
    "aria-valuemax",
    String(stats.total)
  );
  elements.subjectProgressTrack.setAttribute(
    "aria-valuenow",
    String(stats.mastered)
  );
}

function renderChapterDirectory() {
  if (!activeSubject) {
    return;
  }
  renderSubjectMeta();
  const fragment = document.createDocumentFragment();
  if (activeSubject.groups.length) {
    elements.chapterDirectoryMeta.textContent =
      `${activeSubject.groups.length} 个小科目 · ${activeSubject.chapters.length} 个章节`;
    activeSubject.groups.forEach((group) => {
      const groupChapters = activeSubject.chapters.filter(
        (chapter) => chapter.groupId === group.id
      );
      fragment.append(createChapterGroup(group, groupChapters));
    });
  } else {
    elements.chapterDirectoryMeta.textContent =
      `${activeSubject.chapters.length} 个章节`;
    activeSubject.chapters.forEach((chapter) => {
      fragment.append(createChapterRow(chapter));
    });
  }
  elements.chapterList.replaceChildren(fragment);
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

function getNextChapter() {
  if (!activeSubject || !activeChapter) {
    return null;
  }
  const currentIndex = activeSubject.chapters.findIndex(
    (chapter) => chapter.id === activeChapter.id
  );
  return currentIndex >= 0
    ? activeSubject.chapters[currentIndex + 1] || null
    : null;
}

function showCompletion() {
  setFlipped(false);
  elements.flashcard.hidden = true;
  elements.completionPanel.hidden = false;
  elements.actionButtons.hidden = true;
  elements.completionActions.hidden = false;
  const nextChapter = getNextChapter();
  elements.nextChapterButton.hidden = !nextChapter;
  elements.completionActions.classList.toggle("is-single", !nextChapter);
  elements.flashcard.setAttribute("tabindex", "-1");
  elements.completionCopy.textContent =
    `本章 ${activeChapter.cards.length} 个考点已全部掌握。`;
  elements.queueStatus.textContent = "本章已通关";
}

function renderCard({ animate = false } = {}) {
  if (!activeChapter || !activeSubject) {
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
  elements.completionActions.hidden = true;
  elements.completionActions.classList.remove("is-single");
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

function setView(view) {
  currentView = view;
  elements.hallView.hidden = view !== "hall";
  elements.chapterView.hidden = view !== "chapters";
  elements.studyView.hidden = view !== "study";
  elements.brandBlock.hidden = view !== "hall";
  elements.backButton.hidden = view === "hall";
  elements.updateLogButton.hidden = view !== "hall";
  elements.subjectMeta.hidden = view !== "chapters";
  elements.studyMeta.hidden = view !== "study";
  elements.backLabel.textContent =
    view === "study" ? "返回章节目录" : "返回科目大厅";
  window.scrollTo(0, 0);
}

function openSubject(subjectId) {
  const subject = subjects.find((item) => item.subjectId === subjectId);
  if (!subject) {
    return;
  }
  activeSubject = subject;
  activeChapter = null;
  setView("chapters");
  renderChapterDirectory();
  document.title = `${subject.subjectName} · 章节目录`;
}

function openChapter(chapterId) {
  if (!activeSubject) {
    return;
  }
  const chapter = activeSubject.chapters.find(
    (item) => item.id === chapterId
  );
  if (!chapter) {
    return;
  }
  activeChapter = chapter;
  setView("study");
  const group = activeSubject.groups.find(
    (item) => item.id === chapter.groupId
  );
  elements.studySubjectName.textContent = group
    ? `${activeSubject.subjectName} · ${group.name}`
    : activeSubject.subjectName;
  elements.studyChapterTitle.textContent = chapter.name;
  document.title = `${chapter.name} · ${activeSubject.subjectName}`;
  renderCard();
}

function openNextChapter() {
  const nextChapter = getNextChapter();
  if (nextChapter) {
    openChapter(nextChapter.id);
  }
}

function returnToChapters() {
  activeChapter = null;
  setView("chapters");
  renderChapterDirectory();
  document.title = `${activeSubject.subjectName} · 章节目录`;
}

function returnToHall() {
  activeSubject = null;
  activeChapter = null;
  setView("hall");
  renderHall();
  document.title = "多科目闪卡";
}

function handleBack() {
  if (currentView === "study") {
    returnToChapters();
  } else if (currentView === "chapters") {
    returnToHall();
  }
}

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readDailyCheckIn() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKIN_KEY));
    return {
      lastStudyDate:
        typeof saved?.lastStudyDate === "string"
          ? saved.lastStudyDate
          : null,
      streak:
        Number.isInteger(saved?.streak) && saved.streak >= 0
          ? saved.streak
          : 0,
      totalDays:
        Number.isInteger(saved?.totalDays) && saved.totalDays >= 0
          ? saved.totalDays
          : 0
    };
  } catch {
    return {
      lastStudyDate: null,
      streak: 0,
      totalDays: 0
    };
  }
}

function saveDailyCheckIn() {
  try {
    localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkInState));
  } catch {
    // Daily check-in remains available for the current session.
  }
}

function updateStreakButton() {
  const label = checkInState.totalDays
    ? `每日打卡，已连续打卡 ${checkInState.streak} 天，累计学习 ${checkInState.totalDays} 天`
    : "每日打卡";
  elements.streakButton.setAttribute("aria-label", label);
  elements.streakButton.setAttribute("title", label);
}

function markDailyStudy() {
  const now = new Date();
  const today = formatLocalDate(now);
  if (checkInState.lastStudyDate === today) {
    return false;
  }

  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  );
  checkInState.streak =
    checkInState.lastStudyDate === formatLocalDate(yesterday)
      ? checkInState.streak + 1
      : 1;
  checkInState.totalDays += 1;
  checkInState.lastStudyDate = today;
  saveDailyCheckIn();
  updateStreakButton();
  return true;
}

function rememberCurrentCard() {
  const currentCard = getCurrentCard();
  if (!currentCard || !isFlipped) {
    return;
  }

  activeChapter.state.mastered.push(currentCard.id);
  activeChapter.state.queue.shift();
  saveChapterState(activeSubject.subjectId, activeChapter);
  markDailyStudy();
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
  saveChapterState(activeSubject.subjectId, activeChapter);
  markDailyStudy();
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

function openSubmissionModal() {
  if (!elements.submissionModal.open) {
    elements.submissionModal.showModal();
  }
}

function closeSubmissionModal() {
  if (elements.submissionModal.open) {
    elements.submissionModal.close();
  }
}

function openCheckinModal() {
  elements.checkinSummary.textContent =
    `🔥 已连续打卡 ${checkInState.streak} 天 | 累计学习 ${checkInState.totalDays} 天`;
  if (!elements.checkinModal.open) {
    elements.checkinModal.showModal();
  }
}

function closeCheckinModal() {
  if (elements.checkinModal.open) {
    elements.checkinModal.close();
  }
}

function hasSeenUpdateLog() {
  try {
    return localStorage.getItem(UPDATE_LOG_KEY) === "true";
  } catch {
    return false;
  }
}

function markUpdateLogSeen() {
  try {
    localStorage.setItem(UPDATE_LOG_KEY, "true");
  } catch {
    // The modal still closes if storage is unavailable.
  }
}

function openUpdateLog() {
  if (!elements.updateLogModal.open) {
    elements.updateLogModal.showModal();
  }
}

function closeUpdateLog() {
  if (elements.updateLogModal.open) {
    elements.updateLogModal.close();
  }
}

function acknowledgeUpdateLog() {
  markUpdateLogSeen();
  closeUpdateLog();
}

function maybeShowUpdateLog() {
  if (updateAutoOpenAttempted || hasSeenUpdateLog()) {
    return;
  }
  updateAutoOpenAttempted = true;
  requestAnimationFrame(() => {
    openUpdateLog();
  });
}

function bindEvents() {
  elements.subjectList.addEventListener("click", (event) => {
    const subjectButton = event.target.closest("[data-subject-id]");
    if (subjectButton) {
      openSubject(subjectButton.dataset.subjectId);
    }
  });

  elements.chapterList.addEventListener("click", (event) => {
    const chapterButton = event.target.closest("[data-chapter-id]");
    if (chapterButton) {
      openChapter(chapterButton.dataset.chapterId);
    }
  });

  elements.backButton.addEventListener("click", handleBack);
  elements.flashcard.addEventListener("click", toggleCard);
  elements.flashcard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCard();
    }
  });
  elements.rememberButton.addEventListener("click", rememberCurrentCard);
  elements.forgotButton.addEventListener("click", forgetCurrentCard);
  elements.nextChapterButton.addEventListener("click", openNextChapter);
  elements.returnDirectoryButton.addEventListener("click", returnToChapters);
  elements.retryButton.addEventListener("click", loadPlatform);
  elements.submissionTrigger.addEventListener("click", openSubmissionModal);
  elements.submissionClose.addEventListener("click", closeSubmissionModal);
  elements.submissionModal.addEventListener("click", (event) => {
    if (event.target === elements.submissionModal) {
      closeSubmissionModal();
    }
  });
  elements.streakButton.addEventListener("click", openCheckinModal);
  elements.checkinClose.addEventListener("click", closeCheckinModal);
  elements.checkinModal.addEventListener("click", (event) => {
    if (event.target === elements.checkinModal) {
      closeCheckinModal();
    }
  });
  elements.updateLogButton.addEventListener("click", openUpdateLog);
  elements.updateLogClose.addEventListener("click", acknowledgeUpdateLog);
  elements.updateLogModal.addEventListener("click", (event) => {
    if (event.target === elements.updateLogModal) {
      closeUpdateLog();
    }
  });
  elements.themeToggles.forEach((button) => {
    button.addEventListener("click", toggleTheme);
  });
}

function initialize() {
  checkInState = readDailyCheckIn();
  updateStreakButton();
  const initialTheme =
    document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  setTheme(initialTheme);
  bindEvents();
  loadPlatform();
}

initialize();
