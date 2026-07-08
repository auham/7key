/**
 * Demen Card Game Calculator
 * core game logic and UI interactions
 */

// App State
let gameState = {
  gameMode: 'team', // 'team' or 'solo'
  targetScore: 300,
  players: [],      // Array of names
  rounds: [],       // Array of arrays representing scores per round e.g. [[10, 20], [0, 40]]
  scores: [],       // Array of accumulated scores e.g. [10, 60]
  isGameOver: false
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
const modeTeamBtn = document.getElementById('mode-team-btn');
const modeSoloBtn = document.getElementById('mode-solo-btn');
const teamSetupSection = document.getElementById('team-setup-section');
const soloSetupSection = document.getElementById('solo-setup-section');
const team1Input = document.getElementById('team1-name');
const team2Input = document.getElementById('team2-name');
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

// Toast
const toastEl = document.getElementById('toast');

// Settings & Constants
let soloPlayerCount = 4;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
let pendingConfirmAction = null;

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
   GAME STATE LOCAL STORAGE SYNC
   ========================================================================== */
function saveStateToLocalStorage() {
  localStorage.setItem('demen-game-state', JSON.stringify(gameState));
}

function loadStateFromLocalStorage() {
  const savedState = localStorage.getItem('demen-game-state');
  if (savedState) {
    try {
      gameState = JSON.parse(savedState);
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

// Switch Modes (Team / Solo)
modeTeamBtn.addEventListener('click', () => setMode('team'));
modeSoloBtn.addEventListener('click', () => setMode('solo'));

function setMode(mode) {
  gameState.gameMode = mode;
  if (mode === 'team') {
    modeTeamBtn.classList.add('active');
    modeSoloBtn.classList.remove('active');
    teamSetupSection.style.display = 'block';
    soloSetupSection.style.display = 'none';
  } else {
    modeTeamBtn.classList.remove('active');
    modeSoloBtn.classList.add('active');
    teamSetupSection.style.display = 'none';
    soloSetupSection.style.display = 'block';
    renderSoloPlayersInputs();
  }
}

// Render inputs dynamically for individual players
function renderSoloPlayersInputs() {
  playersListInputs.innerHTML = '';
  for (let i = 1; i <= soloPlayerCount; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';
    
    // Get previous value if exists, otherwise default
    const savedName = gameState.players[i-1] || `اللاعب ${i}`;
    
    wrapper.innerHTML = `
      <span class="input-prefix">لاعب ${i}</span>
      <input type="text" id="player-${i}-name" value="${savedName}" placeholder="اسم اللاعب ${i}" maxlength="12" autocomplete="off">
    `;
    playersListInputs.appendChild(wrapper);
  }
  playerCountDisplay.textContent = `${soloPlayerCount} لاعبين`;
}

// Add/Remove players in Solo mode
addPlayerBtn.addEventListener('click', () => {
  if (soloPlayerCount < MAX_PLAYERS) {
    // Save current names first
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
    // Shrink players list in state
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
      currentNames.push(input.value.trim() || `اللاعب ${i}`);
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
      gameState.targetScore = parseInt(targetVal);
    }
  });
});

// Custom target input change handler
customTargetInput.addEventListener('input', () => {
  let val = parseInt(customTargetInput.value);
  if (isNaN(val) || val <= 0) {
    gameState.targetScore = 300; // default backup
  } else {
    gameState.targetScore = val;
  }
});

/* ==========================================================================
   START GAME LOGIC
   ========================================================================== */
startGameBtn.addEventListener('click', () => {
  // 1. Determine Players / Teams Names
  if (gameState.gameMode === 'team') {
    const team1Name = team1Input.value.trim() || 'لنا';
    const team2Name = team2Input.value.trim() || 'لهم';
    
    if (team1Name === team2Name) {
      showToast('الرجاء اختيار أسماء مختلفة للفريقين!');
      return;
    }
    gameState.players = [team1Name, team2Name];
  } else {
    saveCurrentSoloNamesInput();
    // Validate duplicates
    const uniqueNames = new Set(gameState.players);
    if (uniqueNames.size !== gameState.players.length) {
      showToast('الرجاء التأكد من عدم تكرار أسماء اللاعبين!');
      return;
    }
  }

  // 2. Determine Target Score
  const activeTargetBtn = document.querySelector('.target-btn.active');
  if (activeTargetBtn && activeTargetBtn.getAttribute('data-target') === 'custom') {
    const customVal = parseInt(customTargetInput.value);
    if (isNaN(customVal) || customVal < 50) {
      showToast('الرجاء إدخال نتيجة نهائية صالحة (50 نقطة كحد أدنى)');
      return;
    }
    gameState.targetScore = customVal;
  }

  // 3. Initialize scores
  gameState.scores = new Array(gameState.players.length).fill(0);
  gameState.rounds = [];
  gameState.isGameOver = false;

  // 4. Save state & Transition
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
   GAME BOARD RENDERING & INTERACTION
   ========================================================================== */
function renderGameBoard() {
  scoresContainer.innerHTML = '';
  
  // Apply layout class
  if (gameState.gameMode === 'team') {
    scoresContainer.className = 'scores-grid team-layout';
  } else {
    scoresContainer.className = 'scores-grid solo-layout';
  }

  // Sort indices by score descending to find rankings
  const rankedIndices = [...Array(gameState.players.length).keys()].sort((a, b) => gameState.scores[b] - gameState.scores[a]);
  const leaderIndex = rankedIndices[0];
  const isDraw = gameState.scores[leaderIndex] === gameState.scores[rankedIndices[1]] && gameState.scores[leaderIndex] > 0;

  gameState.players.forEach((playerName, index) => {
    const currentScore = gameState.scores[index];
    const progressPercent = Math.min((currentScore / gameState.targetScore) * 100, 100);
    
    const card = document.createElement('div');
    
    // Classes
    let cardClasses = ['score-card'];
    if (gameState.gameMode === 'team') {
      cardClasses.push(`team-card-${index + 1}`);
    }
    // Highlight current leader (if score > 0 and not a draw)
    if (index === leaderIndex && currentScore > 0 && !isDraw) {
      cardClasses.push('winner-leading');
    }
    card.className = cardClasses.join(' ');

    // Calculate rank for solo mode
    let rankBadgeHTML = '';
    if (gameState.gameMode === 'solo' && currentScore > 0) {
      const rank = rankedIndices.indexOf(index) + 1;
      let rankText = `${rank}#`;
      if (rank === 1 && !isDraw) rankText = '👑 الأول';
      else if (rank === 2) rankText = 'الثاني';
      else if (rank === 3) rankText = 'الثالث';
      
      rankBadgeHTML = `<div class="rank-badge">${rankText}</div>`;
    }

    card.innerHTML = `
      ${rankBadgeHTML}
      <div class="card-header-score">
        <span class="score-card-name">${playerName}</span>
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
  undoLastRoundBtn.disabled = gameState.rounds.length === 0;

  // Render last round status banner
  if (gameState.rounds.length > 0) {
    lastRoundBanner.style.display = 'block';
    const lastRound = gameState.rounds[gameState.rounds.length - 1];
    
    // Build a text details of last round: "لاعب1 (+10)، لاعب2 (+0)..."
    const details = gameState.players.map((name, idx) => {
      const points = lastRound[idx];
      return `${name} (${points >= 0 ? '+' : ''}${points})`;
    }).join(' | ');
    
    lastRoundDetails.textContent = details;
  } else {
    lastRoundBanner.style.display = 'none';
  }
}

/* ==========================================================================
   ADD ROUND MODAL LOGIC
   ========================================================================== */
showAddRoundBtn.addEventListener('click', () => {
  if (gameState.isGameOver) {
    showToast('المباراة انتهت بالفعل! ابدأ مباراة جديدة.');
    return;
  }
  
  // Render Inputs inside modal
  roundInputsList.innerHTML = '';
  gameState.players.forEach((playerName, index) => {
    const row = document.createElement('div');
    row.className = 'round-input-row';
    
    row.innerHTML = `
      <span class="round-player-name">${playerName}</span>
      <div class="score-entry-control">
        <button type="button" class="quick-add-btn" data-player="${index}" data-val="10">+10</button>
        <button type="button" class="quick-add-btn" data-player="${index}" data-val="50">+50</button>
        <input type="number" id="round-score-${index}" class="score-entry-input" placeholder="0" min="0" max="1000" inputmode="numeric" value="">
      </div>
    `;
    
    roundInputsList.appendChild(row);
  });

  // Attach event listeners to the quick add buttons inside modal
  const quickBtns = roundInputsList.querySelectorAll('.quick-add-btn');
  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const playerIdx = btn.getAttribute('data-player');
      const addVal = parseInt(btn.getAttribute('data-val'));
      const inputEl = document.getElementById(`round-score-${playerIdx}`);
      if (inputEl) {
        const currentVal = parseInt(inputEl.value) || 0;
        inputEl.value = currentVal + addVal;
      }
    });
  });

  openModal(addRoundModal);
});

// Save new round score
addRoundForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const roundScores = [];
  let allZero = true;

  for (let i = 0; i < gameState.players.length; i++) {
    const inputEl = document.getElementById(`round-score-${i}`);
    const scoreVal = parseInt(inputEl.value) || 0;
    
    if (scoreVal < 0) {
      showToast('الرجاء إدخال نقاط موجبة فقط!');
      return;
    }
    
    if (scoreVal > 0) allZero = false;
    roundScores.push(scoreVal);
  }

  if (allZero) {
    showToast('الرجاء إدخال نقاط لأحد اللاعبين أو الفرق على الأقل!');
    return;
  }

  // Add round to game state
  gameState.rounds.push(roundScores);
  
  // Recalculate accumulated scores
  recalculateScores();

  // Save State
  saveStateToLocalStorage();

  // Render & Close modal
  renderGameBoard();
  closeModal(addRoundModal);
  showToast('تم تسجيل نقاط الجولة بنجاح ✔️');

  // Check Game Over
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
  // Find if anyone reached or exceeded the target score
  const winners = [];
  gameState.players.forEach((name, index) => {
    if (gameState.scores[index] >= gameState.targetScore) {
      winners.push({ index, name, score: gameState.scores[index] });
    }
  });

  if (winners.length > 0) {
    gameState.isGameOver = true;
    
    // Sort winners in case multiple players crossed the target in the same round
    winners.sort((a, b) => b.score - a.score);
    const finalWinner = winners[0];
    
    // Check for draw (two players crossed target with exact same score)
    const isDraw = winners.length > 1 && winners[0].score === winners[1].score;
    
    if (isDraw) {
      winnerNameDisplay.textContent = 'تعادل! 🤝';
      winnerStatsDisplay.textContent = `الفريقان وصلا إلى ${finalWinner.score} نقطة`;
    } else {
      winnerNameDisplay.textContent = finalWinner.name;
      winnerStatsDisplay.textContent = `النتيجة النهائية: ${finalWinner.score} نقطة`;
    }

    // Open celebration modal
    setTimeout(() => {
      openModal(gameOverModal);
    }, 600);
  }
}

/* ==========================================================================
   UNDO ROUND LOGIC
   ========================================================================== */
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
   HISTORY MODAL LOGIC
   ========================================================================== */
showHistoryBtn.addEventListener('click', () => {
  // Render headers
  historyTableHeaders.innerHTML = '<th>الجولة</th>';
  gameState.players.forEach(name => {
    historyTableHeaders.innerHTML += `<th>${name}</th>`;
  });

  // Render rows
  historyTableBody.innerHTML = '';
  
  if (gameState.rounds.length === 0) {
    noHistoryMsg.style.display = 'block';
  } else {
    noHistoryMsg.style.display = 'none';
    
    gameState.rounds.forEach((round, roundIdx) => {
      const row = document.createElement('tr');
      
      // Calculate which column was the highest scorer in this round
      const maxInRound = Math.max(...round);
      
      let cellsHTML = `<td class="history-round-num">${roundIdx + 1}</td>`;
      
      round.forEach((score, playerIdx) => {
        let cellClass = '';
        if (score === maxInRound && score > 0) {
          cellClass = gameState.gameMode === 'team' && playerIdx === 1 ? 'highlight-danger' : 'highlight-primary';
        }
        cellsHTML += `<td class="${cellClass}">${score}</td>`;
      });
      
      row.innerHTML = cellsHTML;
      historyTableBody.appendChild(row);
    });
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
    'سيتم مسح الجولة الحالية والعودة لشاشة إعداد اللاعبين والفرق.',
    () => {
      clearSavedState();
      // Go back to setup screen
      gameScreen.classList.remove('active');
      setupScreen.classList.add('active');
      showToast('تم إنهاء المباراة بنجاح.');
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

// Close buttons logic
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-close');
    const modalEl = document.getElementById(modalId);
    if (modalEl) closeModal(modalEl);
  });
});

// Close modal when clicking outside content
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      // Don't allow closing game over modal by clicking outside
      if (overlay.id !== 'game-over-modal') {
        closeModal(overlay);
      }
    }
  });
});

/* ==========================================================================
   APP INITIALIZATION
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // Try loading saved game
  const loaded = loadStateFromLocalStorage();
  
  if (loaded && gameState.players.length > 0) {
    // Determine player counts for UI inputs in case they back out
    if (gameState.gameMode === 'solo') {
      soloPlayerCount = gameState.players.length;
      setMode('solo');
    } else {
      setMode('team');
      team1Input.value = gameState.players[0] || 'لنا';
      team2Input.value = gameState.players[1] || 'لهم';
    }
    
    // Select correct target score in buttons
    targetBtns.forEach(btn => {
      const targetVal = btn.getAttribute('data-target');
      if (parseInt(targetVal) === gameState.targetScore) {
        targetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        customTargetWrapper.style.display = 'none';
      }
    });
    
    // If target is not one of presets, show custom target input
    const presets = [300, 500, 1000];
    if (!presets.includes(gameState.targetScore)) {
      targetBtns.forEach(b => b.classList.remove('active'));
      document.getElementById('custom-target-trigger').classList.add('active');
      customTargetWrapper.style.display = 'flex';
      customTargetInput.value = gameState.targetScore;
    }

    goToGameScreen();
    
    // If was already game over, show it again
    if (gameState.isGameOver) {
      checkGameCompletion();
    }
  } else {
    // Default setup
    setMode('team');
  }
});
