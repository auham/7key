/**
 * Demen Card Game Calculator
 * Core game logic, state management, and UI interactions
 */

// App State
let gameState = {
  targetScore: 300,
  players: [],       // Array of player names e.g. ['لاعب 1', 'لاعب 2', 'لاعب 3', 'لاعب 4']
  rounds: [],        // Array of arrays representing scores per round e.g. [[10, 20, 0, 5]]
  scores: [],        // Array of accumulated scores e.g. [10, 20, 0, 5]
  isGameOver: false,
  sortByRank: true   // Display horizontal cards sorted by standing
};

// DOM Elements
const bodyEl = document.body;
const themeToggleBtn = document.getElementById('theme-toggle');
const sunIcon = themeToggleBtn.querySelector('.sun-icon');
const moonIcon = themeToggleBtn.querySelector('.moon-icon');

// Screens
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');

// Setup Inputs
const addPlayerBtn = document.getElementById('add-player-btn');
const removePlayerBtn = document.getElementById('remove-player-btn');
const playerCountDisplay = document.getElementById('player-count-display');
const playersListInputs = document.getElementById('players-list-inputs');
const targetBtns = document.querySelectorAll('.target-btn');
const customTargetWrapper = document.getElementById('custom-target-wrapper');
const customTargetInput = document.getElementById('custom-target-input');
const startGameBtn = document.getElementById('start-game-btn');

// Game Board Elements
const displayTargetScore = document.getElementById('display-target-score');
const scoresContainer = document.getElementById('scores-container');
const lastRoundBanner = document.getElementById('last-round-banner');
const lastRoundDetails = document.getElementById('last-round-details');
const showAddRoundBtn = document.getElementById('show-add-round-btn');
const undoLastRoundBtn = document.getElementById('undo-last-round-btn');
const showHistoryBtn = document.getElementById('show-history-btn');
const backToSetupBtn = document.getElementById('back-to-setup-btn');
const resetGameBtn = document.getElementById('reset-game-btn');

// Modals
const addRoundModal = document.getElementById('add-round-modal');
const addRoundForm = document.getElementById('add-round-form');
const roundInputsList = document.getElementById('round-inputs-list');
const historyModal = document.getElementById('history-modal');
const historyTableHeaders = document.getElementById('history-table-headers');
const historyTableBody = document.getElementById('history-table-body');
const noHistoryMsg = document.getElementById('no-history-msg');
const gameOverModal = document.getElementById('game-over-modal');
const winnerNameDisplay = document.getElementById('winner-name-display');
const winnerStatsDisplay = document.getElementById('winner-stats-display');
const btnNewGame = document.getElementById('btn-new-game');
const btnReviewBoard = document.getElementById('btn-review-board');

// Confirm Dialog
const confirmDialog = document.getElementById('confirm-dialog');
const confirmTitle = document.getElementById('confirm-title');
const confirmDesc = document.getElementById('confirm-desc');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const confirmActionBtn = document.getElementById('confirm-action-btn');

// Toast Notification
const toastEl = document.getElementById('toast');

// Settings & Constants
let soloPlayerCount = 4;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
let pendingConfirmAction = null;

/* ==========================================================================
   PREVENT MOBILE DOUBLE-TAP ZOOM & GESTURE ZOOM
   ========================================================================== */
document.addEventListener('dblclick', (e) => {
  e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

/* ==========================================================================
   THEME MANAGEMENT (DARK / LIGHT MODE)
   ========================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('demen-theme') || 'dark';
  if (savedTheme === 'light') {
    bodyEl.classList.remove('dark-theme');
    bodyEl.classList.add('light-theme');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    bodyEl.classList.add('dark-theme');
    bodyEl.classList.remove('light-theme');
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  }
}

themeToggleBtn.addEventListener('click', () => {
  if (bodyEl.classList.contains('dark-theme')) {
    bodyEl.classList.remove('dark-theme');
    bodyEl.classList.add('light-theme');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
    localStorage.setItem('demen-theme', 'light');
  } else {
    bodyEl.classList.add('dark-theme');
    bodyEl.classList.remove('light-theme');
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
    localStorage.setItem('demen-theme', 'dark');
  }
});

/* ==========================================================================
   TOAST NOTIFICATION
   ========================================================================== */
function showToast(message, duration = 2500) {
  toastEl.textContent = message;
  toastEl.classList.add('active');
  setTimeout(() => {
    toastEl.classList.remove('active');
  }, duration);
}

/* ==========================================================================
   CONFIRMATION DIALOG
   ========================================================================== */
function showConfirm(title, description, onConfirm) {
  confirmTitle.textContent = title;
  confirmDesc.textContent = description;
  confirmDialog.classList.add('active');
  pendingConfirmAction = onConfirm;
}

function hideConfirm() {
  confirmDialog.classList.remove('active');
  pendingConfirmAction = null;
}

confirmCancelBtn.addEventListener('click', hideConfirm);
confirmActionBtn.addEventListener('click', () => {
  if (pendingConfirmAction) {
    pendingConfirmAction();
  }
  hideConfirm();
});

/* ==========================================================================
   LOCAL STORAGE PERSISTENCE
   ========================================================================== */
function saveStateToLocalStorage() {
  localStorage.setItem('demen-game-state', JSON.stringify(gameState));
}

function loadStateFromLocalStorage() {
  const savedState = localStorage.getItem('demen-game-state');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      // Migration from old team mode if needed
      if (parsed.gameMode === 'team' || !Array.isArray(parsed.players) || parsed.players.length < 2) {
        parsed.players = (parsed.players && parsed.players.length >= 2) 
          ? parsed.players 
          : ['لاعب رقم 1', 'لاعب رقم 2', 'لاعب رقم 3', 'لاعب رقم 4'];
      }
      if (typeof parsed.sortByRank === 'undefined') {
        parsed.sortByRank = true;
      }
      gameState = parsed;
      return true;
    } catch (e) {
      console.error('Failed to parse local storage game state', e);
    }
  }
  return false;
}

function clearSavedState() {
  localStorage.removeItem('demen-game-state');
}

/* ==========================================================================
   SETUP SCREEN INTERACTIONS
   ========================================================================== */
function renderSoloPlayersInputs() {
  playersListInputs.innerHTML = '';
  for (let i = 1; i <= soloPlayerCount; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';
    
    let savedName = (gameState.players && gameState.players[i - 1]) || '';
    if (savedName.startsWith('لاعب رقم ') || savedName.startsWith('اللاعب ')) {
      savedName = '';
    }
    
    wrapper.innerHTML = `
      <span class="input-prefix">لاعب ${i}</span>
      <input type="text" id="player-${i}-name" value="${savedName}" placeholder="لاعب رقم ${i}" maxlength="15" autocomplete="off">
    `;
    playersListInputs.appendChild(wrapper);
  }
  playerCountDisplay.textContent = `${soloPlayerCount} لاعبين`;
}

addPlayerBtn.addEventListener('click', () => {
  if (soloPlayerCount < MAX_PLAYERS) {
    saveCurrentSoloNamesInput();
    soloPlayerCount++;
    renderSoloPlayersInputs();
  } else {
    showToast(`الحد الأقصى للاعبين هو ${MAX_PLAYERS}`);
  }
});

removePlayerBtn.addEventListener('click', () => {
  if (soloPlayerCount > MIN_PLAYERS) {
    saveCurrentSoloNamesInput();
    soloPlayerCount--;
    if (gameState.players.length > soloPlayerCount) {
      gameState.players = gameState.players.slice(0, soloPlayerCount);
    }
    renderSoloPlayersInputs();
  } else {
    showToast(`الحد الأدنى للاعبين هو ${MIN_PLAYERS}`);
  }
});

function saveCurrentSoloNamesInput() {
  const currentNames = [];
  for (let i = 1; i <= soloPlayerCount; i++) {
    const input = document.getElementById(`player-${i}-name`);
    if (input) {
      currentNames.push(input.value.trim() || `لاعب رقم ${i}`);
    }
  }
  gameState.players = currentNames;
}

// Target score selector buttons
targetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    targetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const targetVal = btn.getAttribute('data-target');
    if (targetVal === 'custom') {
      customTargetWrapper.style.display = 'flex';
      customTargetInput.focus();
    } else {
      customTargetWrapper.style.display = 'none';
      gameState.targetScore = parseInt(targetVal, 10);
    }
  });
});

customTargetInput.addEventListener('input', () => {
  let val = parseInt(customTargetInput.value, 10);
  if (isNaN(val) || val <= 0) {
    gameState.targetScore = 300;
  } else {
    gameState.targetScore = val;
  }
});

/* ==========================================================================
   START GAME LOGIC
   ========================================================================== */
startGameBtn.addEventListener('click', () => {
  saveCurrentSoloNamesInput();
  
  // Validate duplicate player names
  const uniqueNames = new Set(gameState.players);
  if (uniqueNames.size !== gameState.players.length) {
    showToast('الرجاء التأكد من عدم تكرار أسماء اللاعبين!');
    return;
  }

  // Determine Target Score
  const activeTargetBtn = document.querySelector('.target-btn.active');
  if (activeTargetBtn && activeTargetBtn.getAttribute('data-target') === 'custom') {
    const customVal = parseInt(customTargetInput.value, 10);
    if (isNaN(customVal) || customVal < 50) {
      showToast('الرجاء إدخال نتيجة نهائية صالحة (50 نقطة كحد أدنى)');
      return;
    }
    gameState.targetScore = customVal;
  }

  // Initialize scores
  gameState.scores = new Array(gameState.players.length).fill(0);
  gameState.rounds = [];
  gameState.isGameOver = false;

  saveStateToLocalStorage();
  goToGameScreen();
  showToast('بدأت المباراة! بالتوفيق للجميع 🃏');
});

function goToGameScreen() {
  setupScreen.classList.remove('active');
  gameScreen.classList.add('active');
  
  displayTargetScore.textContent = gameState.targetScore;
  renderGameBoard();
}

/* ==========================================================================
   GAME BOARD RENDERING (SQUARE CARDS GRID & PREVIOUS SCORES)
   ========================================================================== */
function renderGameBoard() {
  scoresContainer.innerHTML = '';
  scoresContainer.className = 'scores-grid';

  const totalRounds = gameState.rounds.length;

  // Rank calculation (lowest score is best)
  const rankedIndices = [...Array(gameState.players.length).keys()].sort(
    (a, b) => gameState.scores[a] - gameState.scores[b]
  );
  const leaderIndex = rankedIndices[0];
  const isDraw = gameState.scores[leaderIndex] === gameState.scores[rankedIndices[1]];

  gameState.players.forEach((playerName, index) => {
    const currentScore = gameState.scores[index];
    const progressPercent = Math.min((currentScore / gameState.targetScore) * 100, 100);

    // Calculate previous score before last round & points added in last round
    let prevScore = 0;
    let lastRoundPoints = 0;

    if (totalRounds > 0) {
      for (let r = 0; r < totalRounds - 1; r++) {
        prevScore += gameState.rounds[r][index];
      }
      lastRoundPoints = gameState.rounds[totalRounds - 1][index];
    }

    const card = document.createElement('div');
    const cardClasses = ['score-card'];

    const isCurrentLeader = index === leaderIndex && !isDraw;
    if (isCurrentLeader) {
      cardClasses.push('winner-leading');
    }
    if (currentScore >= gameState.targetScore) {
      cardClasses.push('danger-losing');
    } else if (progressPercent >= 80) {
      cardClasses.push('warning-near');
    }
    card.className = cardClasses.join(' ');

    // Rank text and badge styling
    const rank = rankedIndices.indexOf(index) + 1;
    let rankText = `#${rank}`;
    let rankBadgeClass = 'rank-other';

    if (rank === 1 && !isDraw) {
      rankText = '👑 الأول';
      rankBadgeClass = 'rank-1';
    } else if (isDraw && (index === rankedIndices[0] || index === rankedIndices[1])) {
      rankText = '🤝 متصدر';
      rankBadgeClass = 'rank-1';
    } else if (rank === 2) {
      rankText = '🥈 الثاني';
      rankBadgeClass = 'rank-2';
    } else if (rank === 3) {
      rankText = '🥉 الثالث';
      rankBadgeClass = 'rank-3';
    }

    // Previous score badge HTML
    card.innerHTML = `
      <div class="card-header-score">
        <div class="name-rank-container">
          <span class="score-card-name" title="${playerName}">${playerName}</span>
          <span class="rank-badge ${rankBadgeClass}">${rankText}</span>
        </div>
        <span class="score-card-val">${currentScore}</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="progress-text">
          <span>0</span>
          <span>الهدف: ${gameState.targetScore}</span>
        </div>
      </div>
    `;

    scoresContainer.appendChild(card);
  });

  // Enable/Disable undo button
  undoLastRoundBtn.disabled = totalRounds === 0;

  // Render last round status banner
  if (totalRounds > 0) {
    lastRoundBanner.style.display = 'block';
    const lastRound = gameState.rounds[totalRounds - 1];

    const details = gameState.players.map((name, idx) => {
      const pts = lastRound[idx];
      return `${name} (${pts >= 0 ? '+' : ''}${pts})`;
    }).join(' • ');

    lastRoundDetails.textContent = `جولة #${totalRounds}: ${details}`;
  } else {
    lastRoundBanner.style.display = 'none';
  }
}

/* ==========================================================================
   ADD ROUND MODAL (EXPANDED QUICK ADDS & CLEAR BUTTON)
   ========================================================================== */
showAddRoundBtn.addEventListener('click', () => {
  if (gameState.isGameOver) {
    showToast('المباراة انتهت بالفعل! ابدأ مباراة جديدة.');
    return;
  }

  roundInputsList.innerHTML = '';
  gameState.players.forEach((playerName, index) => {
    const row = document.createElement('div');
    row.className = 'round-input-card';

    const currentScore = gameState.scores[index] || 0;

    row.innerHTML = `
      <div class="round-input-top">
        <div class="round-player-meta">
          <span class="round-player-name">${playerName}</span>
          <span class="round-player-current">النقاط الحالية: <strong>${currentScore}</strong></span>
        </div>
        <div class="round-input-controls">
          <button type="button" class="btn-clear-score" data-player="${index}" title="مسح">✕</button>
          <input type="number" id="round-score-${index}" class="score-entry-input" placeholder="0" min="0" max="1000" inputmode="numeric" value="">
        </div>
      </div>
      <div class="quick-chips-wrapper">
        <button type="button" class="quick-add-btn sub-btn" data-player="${index}" data-val="-10" title="إنقاص 10">-10</button>
        <button type="button" class="quick-add-btn" data-player="${index}" data-val="10">+10</button>
        <button type="button" class="quick-add-btn" data-player="${index}" data-val="20">+20</button>
        <button type="button" class="quick-add-btn" data-player="${index}" data-val="30">+30</button>
        <button type="button" class="quick-add-btn" data-player="${index}" data-val="40">+40</button>
        <button type="button" class="quick-add-btn" data-player="${index}" data-val="50">+50</button>
      </div>
    `;

    roundInputsList.appendChild(row);
  });

  // Attach quick add listeners with rapid-tap feedback and double-tap zoom protection
  const quickBtns = roundInputsList.querySelectorAll('.quick-add-btn');
  quickBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const playerIdx = btn.getAttribute('data-player');
      const addVal = parseInt(btn.getAttribute('data-val'), 10);
      const inputEl = document.getElementById(`round-score-${playerIdx}`);
      if (inputEl) {
        const currentVal = parseInt(inputEl.value, 10) || 0;
        const newVal = Math.max(0, currentVal + addVal);
        inputEl.value = newVal > 0 ? newVal : '';
        btn.classList.add('btn-tapped');
        setTimeout(() => btn.classList.remove('btn-tapped'), 150);
      }
    });
  });

  // Attach clear buttons listeners
  const clearBtns = roundInputsList.querySelectorAll('.btn-clear-score');
  clearBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const playerIdx = btn.getAttribute('data-player');
      const inputEl = document.getElementById(`round-score-${playerIdx}`);
      if (inputEl) {
        inputEl.value = '';
        inputEl.focus();
      }
    });
  });

  openModal(addRoundModal);
});

// Save round scores
addRoundForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const roundScores = [];
  let allZero = true;

  for (let i = 0; i < gameState.players.length; i++) {
    const inputEl = document.getElementById(`round-score-${i}`);
    const scoreVal = parseInt(inputEl.value, 10) || 0;

    if (scoreVal < 0) {
      showToast('الرجاء إدخال نقاط موجبة فقط!');
      return;
    }

    if (scoreVal > 0) allZero = false;
    roundScores.push(scoreVal);
  }

  if (allZero) {
    showToast('الرجاء إدخال نقاط لأحد اللاعبين على الأقل!');
    return;
  }

  gameState.rounds.push(roundScores);
  recalculateScores();
  saveStateToLocalStorage();

  renderGameBoard();
  closeModal(addRoundModal);
  showToast('تم تسجيل نقاط الجولة بنجاح ✔️');

  checkGameCompletion();
});

function recalculateScores() {
  gameState.scores = new Array(gameState.players.length).fill(0);
  gameState.rounds.forEach(round => {
    for (let i = 0; i < gameState.players.length; i++) {
      gameState.scores[i] += round[i];
    }
  });
}

function checkGameCompletion() {
  const crossedTarget = gameState.scores.some(score => score >= gameState.targetScore);

  if (crossedTarget) {
    gameState.isGameOver = true;

    // Lowest score wins in Demen!
    const minScore = Math.min(...gameState.scores);
    const winners = [];
    gameState.scores.forEach((score, index) => {
      if (score === minScore) {
        winners.push({ index, name: gameState.players[index], score });
      }
    });

    if (winners.length > 1) {
      winnerNameDisplay.textContent = 'تعادل بالصدارة! 🤝';
      winnerStatsDisplay.textContent = `الفائزون بأقل نقاط: ${minScore} نقطة (${winners.map(w => w.name).join(' و ')})`;
    } else {
      const finalWinner = winners[0];
      winnerNameDisplay.textContent = finalWinner.name;
      winnerStatsDisplay.textContent = `الفائز بأقل نقاط: ${finalWinner.score} نقطة`;
    }

    setTimeout(() => {
      openModal(gameOverModal);
    }, 600);
  }
}

/* ==========================================================================
   UNDO ROUND LOGIC
   ========================================================================= */
undoLastRoundBtn.addEventListener('click', () => {
  if (gameState.rounds.length === 0) return;

  showConfirm(
    'هل أنت متأكد؟',
    'سيتم التراجع عن الجولة الأخيرة وحذف نقاطها.',
    () => {
      gameState.rounds.pop();
      gameState.isGameOver = false;
      recalculateScores();
      saveStateToLocalStorage();
      renderGameBoard();
      showToast('تم التراجع عن الجولة الأخيرة ↩️');
    }
  );
});

/* ==========================================================================
   HISTORY MODAL LOGIC (ROUNDS TABLE WITH PREVIOUS SCORES)
   ========================================================================== */
showHistoryBtn.addEventListener('click', () => {
  historyTableHeaders.innerHTML = '<th>الجولة</th>';
  gameState.players.forEach(name => {
    historyTableHeaders.innerHTML += `<th>${name}</th>`;
  });

  historyTableBody.innerHTML = '';

  if (gameState.rounds.length === 0) {
    noHistoryMsg.style.display = 'block';
  } else {
    noHistoryMsg.style.display = 'none';

    // Track running totals before each round
    const runningTotals = new Array(gameState.players.length).fill(0);

    gameState.rounds.forEach((round, roundIdx) => {
      const row = document.createElement('tr');
      const maxInRound = Math.max(...round);

      let cellsHTML = `<td class="history-round-num">${roundIdx + 1}</td>`;

      round.forEach((score, playerIdx) => {
        const prevScore = runningTotals[playerIdx];
        runningTotals[playerIdx] += score;
        const currentTotal = runningTotals[playerIdx];

        let cellClass = '';
        if (score === maxInRound && score > 0) {
          cellClass = 'highlight-danger';
        }

        cellsHTML += `
          <td class="${cellClass}">
            <div class="history-cell-box">
              <span class="history-pts">${score > 0 ? '+' + score : '0'}</span>
              <span class="history-prev-tag">السابق: ${prevScore}</span>
              <span class="history-total-tag">المجموع: ${currentTotal}</span>
            </div>
          </td>
        `;
      });

      row.innerHTML = cellsHTML;
      historyTableBody.appendChild(row);
    });

    // Summary row at the bottom showing current final score
    const totalRow = document.createElement('tr');
    totalRow.className = 'history-total-row';
    let totalCellsHTML = `<td><strong>الإجمالي</strong></td>`;
    gameState.scores.forEach(score => {
      totalCellsHTML += `<td><strong>${score}</strong></td>`;
    });
    totalRow.innerHTML = totalCellsHTML;
    historyTableBody.appendChild(totalRow);
  }

  openModal(historyModal);
});

/* ==========================================================================
   RESET & RESTART LOGIC
   ========================================================================== */
resetGameBtn.addEventListener('click', () => {
  showConfirm(
    'إعادة تعيين المباراة؟',
    'سيتم تصفير جميع النقاط والبدء من الجولة الأولى بنفس اللاعبين.',
    () => {
      gameState.scores = new Array(gameState.players.length).fill(0);
      gameState.rounds = [];
      gameState.isGameOver = false;
      saveStateToLocalStorage();
      renderGameBoard();
      showToast('تمت إعادة تعيين المباراة 🔄');
    }
  );
});

backToSetupBtn.addEventListener('click', () => {
  showConfirm(
    'الخروج من المباراة؟',
    'سيتم مسح الجولة الحالية والعودة لشاشة إعداد اللاعبين.',
    () => {
      clearSavedState();
      gameScreen.classList.remove('active');
      setupScreen.classList.add('active');
      showToast('تم إنهاء المباراة.');
    }
  );
});

btnNewGame.addEventListener('click', () => {
  closeModal(gameOverModal);
  clearSavedState();
  gameScreen.classList.remove('active');
  setupScreen.classList.add('active');
});

btnReviewBoard.addEventListener('click', () => {
  closeModal(gameOverModal);
  showToast('يمكنك مراجعة لوحة النتائج الآن.');
});

/* ==========================================================================
   MODAL UTILITIES
   ========================================================================== */
function openModal(modalEl) {
  modalEl.classList.add('active');
}

function closeModal(modalEl) {
  modalEl.classList.remove('active');
}

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-close');
    const modalEl = document.getElementById(modalId);
    if (modalEl) closeModal(modalEl);
  });
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && overlay.id !== 'game-over-modal') {
      closeModal(overlay);
    }
  });
});

/* ==========================================================================
   APP INITIALIZATION
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const loaded = loadStateFromLocalStorage();

  if (loaded && gameState.players.length >= MIN_PLAYERS) {
    soloPlayerCount = gameState.players.length;
    renderSoloPlayersInputs();

    // Select target score button
    targetBtns.forEach(btn => {
      const targetVal = btn.getAttribute('data-target');
      if (parseInt(targetVal, 10) === gameState.targetScore) {
        targetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        customTargetWrapper.style.display = 'none';
      }
    });

    const presets = [300, 500, 1000];
    if (!presets.includes(gameState.targetScore)) {
      targetBtns.forEach(b => b.classList.remove('active'));
      const customTrigger = document.getElementById('custom-target-trigger');
      if (customTrigger) customTrigger.classList.add('active');
      customTargetWrapper.style.display = 'flex';
      customTargetInput.value = gameState.targetScore;
    }

    goToGameScreen();

    if (gameState.isGameOver) {
      checkGameCompletion();
    }
  } else {
    soloPlayerCount = 4;
    renderSoloPlayersInputs();
  }
});
