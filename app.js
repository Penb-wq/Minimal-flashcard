const flashcardData = [
  {"question":"机器的基本组成要素是什么？","answer":"机械零件。","keyword":"机器组成"},
  {"question":"机器由哪三部分组成？各部分的作用是什么？","answer":"由原动机部分、传动部分和执行部分组成。原动机部分是驱动整部机器完成预定功能的动力源；传动部分把原动机的运动形式、运动及动力参数转变为执行部分所需的运动形式、运动及动力参数；执行部分用来完成机器的预定功能。","keyword":"机器组成"},
  {"question":"机器设计的一般程序及各阶段的最终目标是什么？","answer":"一般程序为计划阶段、方案设计阶段、技术设计阶段和技术文件编制阶段。计划阶段形成设计任务书；方案设计阶段提出原理性设计方案；技术设计阶段绘制零件图、部件图和总装图；技术文件编制阶段编制说明书、明细表及其他技术文件。","keyword":"设计程序"},
  {"question":"对机器的基本要求有哪些？","answer":"使用功能要求、经济性要求、劳动保护和环境保护要求、寿命与可靠性要求以及其他专用要求。","keyword":"基本要求"},
  {"question":"机械零件的主要失效形式有哪四种？","answer":"整体断裂、过大残余变形、零件表面破坏以及破坏正常工作条件引起的失效。","keyword":"失效形式"},
  {"question":"零件表面破坏有哪三种形式？分别在什么情况下发生？","answer":"表面破坏分为腐蚀、磨损和接触疲劳。腐蚀发生于处于潮湿空气中或与水、汽及其他腐蚀性介质相接触的金属零件；磨损发生于作相对运动的零件接触表面；接触疲劳发生于接触变应力条件下工作的零件表面。","keyword":"表面破坏"},
  {"question":"设计机械零件时应满足哪些基本要求？","answer":"应满足避免在预定寿命期内失效的要求，以及结构工艺性、经济性、质量小和可靠性等要求；避免失效的要求主要包括强度、刚度和寿命。","keyword":"零件要求"},
  {"question":"提高机械零件强度的措施有哪些？","answer":"采用高强度材料；使零件具有足够的截面尺寸；合理设计零件的截面形状；采用热处理和化学热处理；提高运动零件的制造精度；合理配置机器中各零件的相对位置。","keyword":"提高强度"},
  {"question":"零件刚度分为哪两类？提高刚度的措施有哪些？","answer":"刚度分为整体变形刚度和表面接触刚度。提高整体变形刚度可增大零件截面尺寸或截面惯性矩，也可缩短支承跨距或采用多支点结构；提高表面接触刚度可增大贴合面以降低压力，也可采用精加工降低表面不平度。","keyword":"刚度措施"},
  {"question":"影响机械零件寿命的主要因素有哪些？","answer":"疲劳、腐蚀和磨损。","keyword":"寿命因素"},
  {"question":"影响零件材料疲劳强度的主要因素有哪些？","answer":"应力集中、零件尺寸大小、零件表面品质和环境状况。","keyword":"疲劳因素"},
  {"question":"提高零件耐腐蚀性能的途径有哪些？","answer":"选用耐腐蚀材料，采用发蓝、表面镀层、喷涂漆膜和表面阳极化处理等措施。","keyword":"防腐措施"},
  {"question":"机械零件的设计准则有哪些？","answer":"强度准则、刚度准则、寿命准则、振动稳定性准则和可靠性准则。","keyword":"设计准则"},
  {"question":"零件在什么情况下会发生共振？","answer":"当零件本身的固有频率与激振源的频率重合或成倍数关系时，零件会发生共振。","keyword":"共振条件"},
  {"question":"什么是振动稳定性？","answer":"在设计机器时使零件的固有频率与激振源的频率相互错开。","keyword":"振动稳定"},
  {"question":"失效率浴盆曲线分为哪三个阶段？","answer":"早期失效阶段、正常使用阶段和损坏阶段。","keyword":"浴盆曲线"},
  {"question":"机械零件常用的设计方法有哪些？","answer":"理论设计、经验设计和模型实验设计。","keyword":"设计方法"},
  {"question":"机械零件设计的一般步骤是什么？","answer":"选择零件的类型和结构；计算零件上的载荷；分析零件失效形式并确定设计准则；选择材料；确定基本尺寸；对零件进行结构设计；进行校核计算；画工作图并编写说明书。","keyword":"设计步骤"},
  {"question":"机械零件常用材料有哪些？","answer":"金属材料、高分子材料、陶瓷材料和复合材料。","keyword":"常用材料"},
  {"question":"零件标准化和系列化的含义是什么？","answer":"标准化是对零件的尺寸、结构要素、材料性能、检验方法、设计方法等制定各类共同遵守的标准；系列化是对同一产品，在同一结构或基本尺寸条件下规定若干个辅助尺寸不同的产品。","keyword":"标准化"},
  {"question":"疲劳损伤累积假说中，等号右边的值为什么会大于或小于1？","answer":"使初始疲劳裂纹产生和使疲劳裂纹扩展所需的应力水平不同。递升变应力时，前期的较小应力未引起疲劳裂纹，反而对材料有强化作用，故右边的值会大于1；递减变应力时，开始施加的最大应力已引起初始裂纹，以后较小的应力仍能使裂纹扩展，故对材料有削弱作用，右边的值会小于1。","keyword":"累积损伤"},
  {"question":"提高机械零件疲劳强度的措施有哪些？","answer":"降低应力集中的影响；选用疲劳强度高的材料并采用能提高材料疲劳强度的热处理方法；提高零件表面质量；尽可能减小或消除零件表面可能发生的初始裂纹尺寸。","keyword":"疲劳措施"},
  {"question":"什么是低应力脆断？","answer":"工作应力小于许用应力时所发生的突然断裂。","keyword":"低应力脆断"},
  {"question":"什么是可靠性？","answer":"产品在规定工作条件下、规定使用期限内完成规定功能的能力。","keyword":"可靠性"},
  {"question":"可靠性设计与传统设计方法有何区别？","answer":"传统设计方法把设计变量视为确定性变量；可靠性设计通过概率与统计方法分析和处理设计中的随机变量，从而更准确地把握产品可靠性。","keyword":"可靠设计"},
  {"question":"可靠度R的定义是什么？","answer":"产品在规定工作条件下及规定使用期限内完成规定功能的概率。","keyword":"可靠度"},
  {"question":"什么是摩擦？","answer":"正压力作用下相互接触的两个物体受切向外力影响而发生相对滑动，或有相对滑动趋势时，在接触表面上产生抵抗滑动的阻力，这一自然现象称为摩擦。","keyword":"摩擦定义"},
  {"question":"按摩擦面间润滑剂的情况，摩擦分为哪几类？","answer":"干摩擦、边界摩擦、混合摩擦和流体摩擦。边界摩擦的λ≤1，混合摩擦的1≤λ≤3，流体摩擦的λ＞3。","keyword":"摩擦分类"},
  {"question":"四种摩擦的摩擦系数大小关系如何？","answer":"干摩擦＞边界摩擦＞混合摩擦＞流体摩擦。","keyword":"摩擦系数"},
  {"question":"什么是边界膜？","answer":"牢固地吸附在金属表面上的分子膜。","keyword":"边界膜"},
  {"question":"边界膜按形成机理如何分类？温度对吸附膜有何影响？","answer":"边界膜分为吸附膜和反应膜，吸附膜又分为物理吸附膜和化学吸附膜。吸附膜的吸附强度随温度升高而下降，达到一定温度后会发生软化、失向和脱吸。","keyword":"边界膜分类"},
  {"question":"提高边界膜强度的措施有哪些？","answer":"合理选择摩擦副材料和润滑剂；降低表面粗糙度值；在润滑剂中加入适量的油性添加剂和极压添加剂。","keyword":"膜强度"},
  {"question":"什么是磨损？","answer":"运动副之间的摩擦导致零件表面材料逐渐丧失或迁移，即形成磨损。","keyword":"磨损定义"},
  {"question":"磨损分为哪三个阶段？磨合阶段包括哪些过程？设计时应如何控制各阶段？","answer":"磨损分为磨合阶段、稳定磨损阶段和剧烈磨损阶段。磨合阶段包括摩擦表面轮廓峰的形状变化和表面材料被加工硬化两个过程。设计机器时应缩短磨合期、延长稳定磨损期、推迟剧烈磨损期的到来。","keyword":"磨损阶段"},
  {"question":"按磨损机理不同，磨损分为哪几类？","answer":"粘附磨损、磨粒磨损、疲劳磨损、冲蚀磨损、腐蚀磨损和微动磨损。","keyword":"磨损类型"},
  {"question":"润滑剂的作用有哪些？","answer":"降低摩擦、减轻磨损；防锈；散热降温；缓冲吸振；密封。","keyword":"润滑作用"},
  {"question":"润滑剂分为哪四种类型？","answer":"气体、液体、半固体和固体。","keyword":"润滑剂分类"},
  {"question":"评判润滑油优劣的主要指标有哪些？","answer":"粘度、润滑性、极压性、闪点、凝点和氧化稳定性。","keyword":"润滑油指标"},
  {"question":"动力粘度、运动粘度和流体密度之间有何关系？","answer":"动力粘度为η，运动粘度为ν，流体密度为ρ，ν=η/ρ。","keyword":"粘度关系"},
  {"question":"润滑油润滑性的含义是什么？","answer":"润滑性又称油性，指润滑油中极性分子与金属表面吸附形成边界油膜的能力，吸附能力越强，润滑性越好。","keyword":"润滑性"},
  {"question":"润滑油的闪点和凝点分别是什么？","answer":"油加热后所蒸发的油气遇火焰能发出闪光时的最低温度称为闪点；润滑油在规定条件下不能再自由流动时所达到的温度称为凝点。","keyword":"闪点凝点"},
  {"question":"什么是润滑脂的锥入度？其大小说明什么？","answer":"一个重1.5N的标准锥体，在25℃恒温下由油脂表面经5s后刺入的深度称为锥入度。锥入度越小，润滑脂越稠，其标志着润滑脂内阻力的大小和流动性的强弱。","keyword":"锥入度"},
  {"question":"什么是润滑脂的滴点？","answer":"在规定加热条件下，润滑脂从标准测量杯的孔口滴下第一滴液体时的温度。","keyword":"滴点"},
  {"question":"润滑剂添加剂的作用有哪些？","answer":"提高润滑剂的油性和极压性；推迟润滑剂老化变质，延长其使用寿命；改善润滑剂的物理性能。","keyword":"添加剂"},
  {"question":"油润滑的方法有哪些？","answer":"滴油润滑、油环润滑、飞溅润滑和压力循环润滑。","keyword":"油润滑"},
  {"question":"脂润滑的常用装置是什么？","answer":"旋盖式油脂杯。","keyword":"脂润滑"},
  {"question":"什么是流体动力润滑？其优点有哪些？","answer":"利用摩擦面间的相对运动自动形成承载油膜来润滑。其优点是摩擦力小、磨损小，并可缓和振动与冲击。","keyword":"动力润滑"},
  {"question":"什么是楔效应？形成压力油膜必须满足哪些条件？","answer":"具有一定粘性的流体流入楔形收敛间隙而产生压力的效应称为楔效应。形成压力油膜必须满足：两表面间形成收敛的楔形间隙；两表面有足够的相对滑动速度，且运动方向使润滑油从大口流进、小口流出；润滑油具有一定粘度且供油充分。","keyword":"楔效应"},
  {"question":"什么是流体静力润滑？其优点有哪些？","answer":"靠液压泵将加压后的流体送入两摩擦表面间，利用流体静压力平衡外载荷。其承载能力不依赖流体粘度，可用较低粘度的润滑剂，提高摩擦副承载能力，也可减小摩擦力矩。","keyword":"静力润滑"}
];

const STORAGE_KEY = "mechanical-flashcards-progress-v1";
const THEME_KEY = "mechanical-flashcards-theme";
const THEME_COLORS = {
  light: "#f4f5f1",
  dark: "#111713"
};

const cards = flashcardData.map((card, index) => ({
  ...card,
  id: `card-${index + 1}`
}));

const cardById = new Map(cards.map((card) => [card.id, card]));
const allCardIds = cards.map((card) => card.id);

const elements = {
  themeToggle: document.querySelector("#theme-toggle"),
  themeColorMeta: document.querySelector('meta[name="theme-color"]'),
  progressText: document.querySelector("#progress-text"),
  progressTrack: document.querySelector("#progress-track"),
  progressFill: document.querySelector("#progress-fill"),
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

let isFlipped = false;
let state = {
  queue: [...allCardIds],
  mastered: []
};

function readSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const validIds = new Set(allCardIds);
    const mastered = Array.isArray(saved?.mastered)
      ? [...new Set(saved.mastered.filter((id) => validIds.has(id)))]
      : [];
    const masteredSet = new Set(mastered);
    const savedQueue = Array.isArray(saved?.queue) ? saved.queue : [];
    const queue = [...new Set(savedQueue)].filter(
      (id) => validIds.has(id) && !masteredSet.has(id)
    );
    const queuedSet = new Set(queue);

    allCardIds.forEach((id) => {
      if (!masteredSet.has(id) && !queuedSet.has(id)) {
        queue.push(id);
        queuedSet.add(id);
      }
    });

    return { queue, mastered };
  } catch {
    return {
      queue: [...allCardIds],
      mastered: []
    };
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The app remains usable when storage is unavailable.
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Theme persistence is optional.
  }
}

function getCurrentCard() {
  return cardById.get(state.queue[0]) || null;
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

function updateProgress() {
  const masteredCount = state.mastered.length;
  const totalCount = cards.length;
  const percentage = totalCount > 0 ? (masteredCount / totalCount) * 100 : 0;

  elements.progressText.textContent = `已掌握 ${masteredCount} / 总题数 ${totalCount}`;
  elements.progressFill.style.width = `${percentage}%`;
  elements.progressTrack.setAttribute("aria-valuemax", String(totalCount));
  elements.progressTrack.setAttribute("aria-valuenow", String(masteredCount));
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
  elements.completionCopy.textContent = `已掌握全部 ${cards.length} 个考点，记忆队列已清空。`;
  elements.queueStatus.textContent = "全部完成";
}

function renderCard({ animate = false } = {}) {
  const currentCard = getCurrentCard();

  elements.flashcard.classList.remove("is-flipped");
  elements.flashcard.classList.remove("card-enter");
  isFlipped = false;
  elements.rememberButton.disabled = true;
  elements.forgotButton.disabled = true;

  if (!currentCard) {
    showCompletion();
    updateProgress();
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
  elements.cardIndex.textContent = `${state.mastered.length + 1} / ${cards.length}`;

  const remainingCount = state.queue.length;
  elements.queueStatus.textContent =
    remainingCount > 1 ? `本轮剩余 ${remainingCount} 张` : "本轮最后一张";

  updateProgress();

  if (animate) {
    playCardEnter();
  }
}

function rememberCurrentCard() {
  const currentCard = getCurrentCard();
  if (!currentCard || !isFlipped) {
    return;
  }

  state.mastered.push(currentCard.id);
  state.queue.shift();
  saveProgress();
  renderCard({ animate: true });
}

function forgetCurrentCard() {
  const currentCard = getCurrentCard();
  if (!currentCard || !isFlipped) {
    return;
  }

  state.queue = [...state.queue.slice(1), state.queue[0]];
  saveProgress();
  renderCard({ animate: true });
}

function restartStudy() {
  state = {
    queue: [...allCardIds],
    mastered: []
  };
  saveProgress();
  renderCard({ animate: true });
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  elements.themeColorMeta.setAttribute("content", THEME_COLORS[theme]);
  elements.themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "切换浅色模式" : "切换深色模式"
  );
  elements.themeToggle.setAttribute(
    "title",
    theme === "dark" ? "切换浅色模式" : "切换深色模式"
  );
  saveTheme(theme);
}

function toggleTheme() {
  const nextTheme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
}

function initialize() {
  state = readSavedState();

  const initialTheme = document.documentElement.dataset.theme === "dark"
    ? "dark"
    : "light";
  setTheme(initialTheme);
  renderCard();

  elements.flashcard.addEventListener("click", toggleCard);
  elements.flashcard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCard();
    }
  });

  elements.rememberButton.addEventListener("click", rememberCurrentCard);
  elements.forgotButton.addEventListener("click", forgetCurrentCard);
  elements.restartButton.addEventListener("click", restartStudy);
  elements.themeToggle.addEventListener("click", toggleTheme);
}

initialize();
