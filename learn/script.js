// 注音符號數據
const zhuyinData = {
    consonants: [
        { symbol: 'ㄅ', pinyin: 'b', sound: 'ㄅ' }, { symbol: 'ㄆ', pinyin: 'p', sound: 'ㄆ' },
        { symbol: 'ㄇ', pinyin: 'm', sound: 'ㄇ' }, { symbol: 'ㄈ', pinyin: 'f', sound: 'ㄈ' },
        { symbol: 'ㄉ', pinyin: 'd', sound: 'ㄉ' }, { symbol: 'ㄊ', pinyin: 't', sound: 'ㄊ' },
        { symbol: 'ㄋ', pinyin: 'n', sound: 'ㄋ' }, { symbol: 'ㄌ', pinyin: 'l', sound: 'ㄌ' },
        { symbol: 'ㄍ', pinyin: 'g', sound: 'ㄍ' }, { symbol: 'ㄎ', pinyin: 'k', sound: 'ㄎ' },
        { symbol: 'ㄏ', pinyin: 'h', sound: 'ㄏ' }, { symbol: 'ㄐ', pinyin: 'j', sound: 'ㄐ' },
        { symbol: 'ㄑ', pinyin: 'q', sound: 'ㄑ' }, { symbol: 'ㄒ', pinyin: 'x', sound: 'ㄒ' },
        { symbol: 'ㄓ', pinyin: 'zh', sound: 'ㄓ' }, { symbol: 'ㄔ', pinyin: 'ch', sound: 'ㄔ' },
        { symbol: 'ㄕ', pinyin: 'sh', sound: 'ㄕ' }, { symbol: 'ㄖ', pinyin: 'r', sound: 'ㄖ' },
        { symbol: 'ㄗ', pinyin: 'z', sound: 'ㄗ' }, { symbol: 'ㄘ', pinyin: 'c', sound: 'ㄘ' },
        { symbol: 'ㄙ', pinyin: 's', sound: 'ㄙ' }
    ],
    vowels: [
        { symbol: 'ㄚ', pinyin: 'a', sound: 'ㄚ' }, { symbol: 'ㄛ', pinyin: 'o', sound: 'ㄛ' },
        { symbol: 'ㄜ', pinyin: 'e', sound: 'ㄜ' }, { symbol: 'ㄝ', pinyin: 'ê', sound: 'ㄝ' },
        { symbol: 'ㄞ', pinyin: 'ai', sound: 'ㄞ' }, { symbol: 'ㄟ', pinyin: 'ei', sound: 'ㄟ' },
        { symbol: 'ㄠ', pinyin: 'ao', sound: 'ㄠ' }, { symbol: 'ㄡ', pinyin: 'ou', sound: 'ㄡ' },
        { symbol: 'ㄢ', pinyin: 'an', sound: 'ㄢ' }, { symbol: 'ㄣ', pinyin: 'en', sound: 'ㄣ' },
        { symbol: 'ㄤ', pinyin: 'ang', sound: 'ㄤ' }, { symbol: 'ㄥ', pinyin: 'eng', sound: 'ㄥ' },
        { symbol: 'ㄦ', pinyin: 'er', sound: 'ㄦ' }, { symbol: 'ㄧ', pinyin: 'i', sound: 'ㄧ' },
        { symbol: 'ㄨ', pinyin: 'u', sound: 'ㄨ' }, { symbol: 'ㄩ', pinyin: 'ü', sound: 'ㄩ' }
    ],
    tones: [
        { symbol: 'ˉ', name: '第一聲', example: '媽' },
        { symbol: 'ˊ', name: '第二聲', example: '麻' },
        { symbol: 'ˇ', name: '第三聲', example: '馬' },
        { symbol: 'ˋ', name: '第四聲', example: '罵' }
    ]
};

// 英文字母數據
const alphabetData = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => ({ symbol: c, pinyin: c.toLowerCase(), sound: c })),
    lowercase: 'abcdefghijklmnopqrstuvwxyz'.split('').map(c => ({ symbol: c, pinyin: c.toUpperCase(), sound: c }))
};

// 獎品數據
const rewards = [
    { name: '貼紙 1枚', icon: 'fas fa-star', rarity: 'common' },
    { name: '集點 1枚', icon: 'fas fa-star', rarity: 'common' },
    { name: '貼紙 2枚', icon: 'fas fa-star-of-life', rarity: 'rare' },
    { name: '集點 2枚', icon: 'fas fa-star-of-life', rarity: 'rare' },
    { name: 'TOMICA車子 1台', icon: 'fas fa-car', rarity: 'legendary' }
];

// 頭像數據
const avatars = [
    { id: 'avatar1', icon: 'fas fa-user-circle' },
    { id: 'avatar2', icon: 'fas fa-cat' },
    { id: 'avatar3', icon: 'fas fa-dog' },
    { id: 'avatar4', icon: 'fas fa-dragon' },
    { id: 'avatar5', icon: 'fas fa-robot' },
    { id: 'avatar6', icon: 'fas fa-ghost' }
];

// 全域變數
let currentSection = 'home';
let quizData = { type: '', questions: [], currentQuestion: 0, score: 0 };
let gameRecords = JSON.parse(localStorage.getItem('zhuyinRecords')) || [];
let userRewards = JSON.parse(localStorage.getItem('zhuyinRewards')) || [];
let matchingPairsGame = { pairs: [], matched: [], selected: [], mode: 'zhuyin' };


document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    renderLearnSections();
    updateStatistics();
    displayRecords();
    displayRewards();
    displayRewardCatalog();
    renderAvatars(); // 新增這行
    loadUserProfile();
    setupEventListeners();
    showSection('home');
}

function setupEventListeners() {
    document.body.addEventListener('click', (e) => {
        const navBtn = e.target.closest('.nav-btn');
        if (navBtn) {
            showSection(navBtn.dataset.section);
            return;
        }

        // Handle tab clicks for learning sections
        const learnTabBtn = e.target.closest('.tab-btn');
        if (learnTabBtn && learnTabBtn.closest('#learn-content, #english-content')) { // Ensure it's a learning tab
            const parentContent = learnTabBtn.closest('.tab-bar').nextElementSibling; // Get the tab-contents div
            const tabKey = learnTabBtn.dataset.tab;

            // Deactivate all tabs and content panes in this section
            learnTabBtn.parentNode.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            parentContent.querySelectorAll('.tab-content').forEach(pane => pane.classList.remove('active'));

            // Activate the clicked tab and its content pane
            learnTabBtn.classList.add('active');
            parentContent.querySelector(`#${tabKey}-grid`).classList.add('active');
            return; // Add return to prevent further processing if it's a learning tab
        }

        // Handle tab clicks for rewards section
        const rewardTabBtn = e.target.closest('#rewards .tab-btn');
        if (rewardTabBtn) {
            switchRewardTab(rewardTabBtn.dataset.tab);
            return; // Add return to prevent further processing
        }

        // Handle clear rewards button click
        const clearRewardsBtn = e.target.closest('#clear-rewards-btn');
        if (clearRewardsBtn) {
            clearUserRewards();
            return;
        }

        // Handle free lottery button click
        const freeLotteryBtn = e.target.closest('#free-lottery-btn');
        if (freeLotteryBtn) {
            startFreeLottery();
            return;
        }

        // Handle individual reward delete button click
        const deleteRewardBtn = e.target.closest('.btn-delete-reward');
        if (deleteRewardBtn) {
            const index = parseInt(deleteRewardBtn.dataset.index);
            deleteRewardItem(index);
            return;
        }
    });
}

function showSection(sectionName) {
    document.querySelectorAll('.section.active').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionName)?.classList.add('active');

    document.querySelectorAll('.nav-btn.active').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-section="${sectionName}"]`)?.classList.add('active');

    currentSection = sectionName;

    if (sectionName === 'quiz') resetQuiz();
    if (sectionName === 'records') { updateStatistics(); displayRecords(); }
    if (sectionName === 'rewards') {
        updateLotteryButton();
        displayRewards();
        displayRewardCatalog();
        // 確保在獎勵中心顯示時，正確的分頁被激活
        const activeRewardTab = document.querySelector('#rewards .tab-btn.active');
        if (!activeRewardTab) {
            switchRewardTab('collection'); // 預設激活「我的獎勵」
        } else {
            // 重新激活當前活躍的分頁，以確保正確顯示
            switchRewardTab(activeRewardTab.dataset.tab);
        }
    }
    if (sectionName === 'game') startMatchingPairsGame(matchingPairsGame.mode);
}

// 學習區渲染 (注音和英文都使用Tabs)
function renderLearnSections() {
    // --- 注音學習 ---
    const learnContent = document.getElementById('learn-content');
    learnContent.innerHTML = '';
    createTabbedLearningSection(learnContent, 'zhuyin');

    // --- 英文學習 ---
    const englishContent = document.getElementById('english-content');
    englishContent.innerHTML = '';
    createTabbedLearningSection(englishContent, 'alphabet');
}

function createTabbedLearningSection(containerElement, type) {
    let tabsData, cardCreator;

    if (type === 'zhuyin') {
        tabsData = [
            { key: 'consonants', label: '聲母', data: zhuyinData.consonants, gridClass: 'zhuyin-grid' },
            { key: 'vowels', label: '韻母', data: zhuyinData.vowels, gridClass: 'zhuyin-grid' },
            { key: 'tones', label: '聲調', data: zhuyinData.tones, gridClass: 'tones-grid' }
        ];
        cardCreator = (item) => item.example ? createToneCard(item) : createZhuyinCard(item);
    } else { // alphabet
        tabsData = [
            { key: 'uppercase', label: '大寫', data: alphabetData.uppercase, gridClass: 'alphabet-grid' },
            { key: 'lowercase', label: '小寫', data: alphabetData.lowercase, gridClass: 'alphabet-grid' }
        ];
        cardCreator = createAlphabetCard;
    }

    const tabBar = document.createElement('div');
    tabBar.className = 'tab-bar';
    const tabContentsContainer = document.createElement('div');

    tabsData.forEach((tab, i) => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${i === 0 ? 'active' : ''}`;
        btn.dataset.tab = tab.key;
        btn.textContent = tab.label;
        tabBar.appendChild(btn);

        const contentPane = document.createElement('div');
        contentPane.id = `${tab.key}-grid`;
        contentPane.className = `tab-content ${i === 0 ? 'active' : ''}`;
        
        const cardGrid = document.createElement('div');
        cardGrid.className = tab.gridClass;
        tab.data.forEach(item => cardGrid.appendChild(cardCreator(item)));
        
        contentPane.appendChild(cardGrid);
        tabContentsContainer.appendChild(contentPane);
    });

    containerElement.appendChild(tabBar);
    containerElement.appendChild(tabContentsContainer);
}

function createZhuyinCard(item) {
    const card = document.createElement('div');
    card.className = 'zhuyin-card';
    card.innerHTML = `<span class="zhuyin-symbol">${item.symbol}</span><div class="zhuyin-pinyin">${item.pinyin}</div>`;
    card.onclick = () => { playSound(item.sound, 'zh-TW'); showSoundFeedback(card); };
    return card;
}

function createAlphabetCard(item) {
    const card = document.createElement('div');
    card.className = 'alphabet-card';
    card.innerHTML = `<span class="alphabet-symbol">${item.symbol}</span><div class="alphabet-name">${item.pinyin}</div>`;
    card.onclick = () => { playSound(item.sound, 'en-US'); showSoundFeedback(card); };
    return card;
}

function createToneCard(item) {
    const card = document.createElement('div');
    card.className = 'tone-card';
    card.innerHTML = `<div class="tone-symbol">${item.symbol}</div><div class="tone-name">${item.name}</div><div class="tone-example">${item.example}</div>`;
    card.onclick = () => { playSound(item.example, 'zh-TW'); showSoundFeedback(card); };
    return card;
}

function showSoundFeedback(cardElement) {
    if (cardElement.querySelector('.sound-feedback-animation')) return;
    cardElement.classList.add('playing');
    setTimeout(() => cardElement.classList.remove('playing'), 500);
    const soundIcon = document.createElement('span');
    soundIcon.className = 'sound-feedback-animation';
    soundIcon.innerHTML = '<i class="fas fa-volume-up"></i>';
    cardElement.appendChild(soundIcon);
    setTimeout(() => soundIcon.remove(), 1000);
}

// --- 以下為其他不變的函數 ---

// 測驗邏輯
function startQuiz(type) {
    quizData = { type, questions: [], currentQuestion: 0, score: 0 };
    let sourceData;

    switch (type) {
        case 'consonants': sourceData = zhuyinData.consonants; break;
        case 'vowels': sourceData = zhuyinData.vowels; break;
        case 'mixed': sourceData = [...zhuyinData.consonants, ...zhuyinData.vowels]; break;
        case 'uppercase': sourceData = alphabetData.uppercase; break;
        case 'lowercase': sourceData = alphabetData.lowercase; break;
        case 'alphabet-mixed': sourceData = [...alphabetData.uppercase, ...alphabetData.lowercase]; break;
    }

    const shuffled = [...sourceData].sort(() => 0.5 - Math.random());
    quizData.questions = shuffled.slice(0, 10).map(correctAnswer => {
        const options = [...shuffled.filter(s => s !== correctAnswer).slice(0, 3), correctAnswer].sort(() => 0.5 - Math.random());
        return { question: correctAnswer, options };
    });

    document.getElementById('quiz-start').classList.add('hidden');
    document.getElementById('quiz-game').classList.remove('hidden');
    showQuestion();
}

function showQuestion() {
    if (quizData.currentQuestion >= quizData.questions.length) {
        showQuizResult();
        return;
    }

    const { question, options } = quizData.questions[quizData.currentQuestion];
    document.getElementById('current-question').textContent = quizData.currentQuestion + 1;
    document.getElementById('total-questions').textContent = quizData.questions.length;
    document.getElementById('current-score').textContent = quizData.score;
    document.getElementById('progress-fill').style.width = `${(quizData.currentQuestion / quizData.questions.length) * 100}%`;
    document.getElementById('question-text').textContent = `請選擇「${question.symbol}」的發音`;
    document.getElementById('play-audio').onclick = () => playSound(question.sound, quizData.type.includes('alphabet') ? 'en-US' : 'zh-TW');

    const answersGrid = document.getElementById('answers-grid');
    answersGrid.innerHTML = '';
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = option.pinyin || option.symbol;
        btn.onclick = () => selectAnswer(option);
        answersGrid.appendChild(btn);
    });

    document.getElementById('quiz-feedback').classList.add('hidden');
}

function selectAnswer(selectedOption) {
    const questionData = quizData.questions[quizData.currentQuestion];
    const correct = selectedOption === questionData.question;
    
    if (correct) quizData.score += 10;

    showFeedback(correct, questionData.question);
    playAnswerSound(correct);

    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === (questionData.question.pinyin || questionData.question.symbol)) btn.classList.add('correct');
        else if (btn.textContent === (selectedOption.pinyin || selectedOption.symbol) && !correct) btn.classList.add('wrong');
    });

    setTimeout(() => {
        quizData.currentQuestion++;
        showQuestion();
    }, 2000);
}

function showFeedback(isCorrect, correctOption) {
    const feedback = document.getElementById('quiz-feedback');
    feedback.classList.remove('hidden', 'correct', 'wrong');
    feedback.classList.add(isCorrect ? 'correct' : 'wrong');
    feedback.querySelector('.feedback-icon').innerHTML = `<i class="fas fa-${isCorrect ? 'check-circle' : 'times-circle'}"></i>`;
    feedback.querySelector('.feedback-text').textContent = isCorrect ? '答對了！' : `正確答案是：${correctOption.pinyin || correctOption.symbol}`;
}

function showQuizResult() {
    document.getElementById('quiz-game').classList.add('hidden');
    document.getElementById('quiz-result').classList.remove('hidden');
    document.getElementById('final-score').textContent = quizData.score;

    const messageEl = document.getElementById('result-message');
    const canDraw = quizData.score >= 80;
    if (quizData.score >= 90) messageEl.innerHTML = '太厲害了！您是學習小達人！';
    else if (canDraw) messageEl.innerHTML = '很棒！您已掌握得很好！';
    else if (quizData.score >= 60) messageEl.innerHTML = '不錯！繼續努力！';
    else messageEl.innerHTML = '加油！多練習就會進步！';

    if (canDraw) messageEl.innerHTML += '<br><span style="color: #ffd700; font-weight: bold;">🎉 恭喜！您可以去獎勵中心抽獎了！</span>';
    
    saveGameRecord(canDraw);
}

function resetQuiz() {
    document.getElementById('quiz-start').classList.remove('hidden');
    document.getElementById('quiz-game').classList.add('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
}

function saveGameRecord(canDraw) {
    const record = {
        date: new Date().toLocaleDateString('zh-TW'),
        type: getQuizTypeName(quizData.type),
        score: quizData.score,
        reward: canDraw ? '可抽獎' : '無',
        timestamp: Date.now()
    };
    gameRecords.unshift(record);
    if (gameRecords.length > 20) gameRecords.pop();
    localStorage.setItem('zhuyinRecords', JSON.stringify(gameRecords));
    updateStatistics();
    displayRecords();
}

function updateStatistics() {
    const totalTests = gameRecords.length;
    document.getElementById('total-tests').textContent = totalTests;
    document.getElementById('average-score').textContent = totalTests ? Math.round(gameRecords.reduce((s, r) => s + r.score, 0) / totalTests) : 0;
    document.getElementById('high-score').textContent = totalTests ? Math.max(...gameRecords.map(r => r.score)) : 0;
    document.getElementById('rewards-earned').textContent = userRewards.length;
}

function displayRecords() {
    const tbody = document.querySelector('#records-list tbody');
    tbody.innerHTML = gameRecords.map(r => `
        <tr>
            <td>${r.date}</td>
            <td>${r.type}</td>
            <td>${r.score}</td>
            <td>${r.reward === '可抽獎' ? '<span class="reward-badge">可抽獎</span>' : r.reward}</td>
        </tr>
    `).join('') || '<tr><td colspan="4" style="text-align: center;">還沒有測驗記錄</td></tr>';
}

function switchRewardTab(tab) {
    document.querySelectorAll('#rewards .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`#rewards .tab-btn[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('rewards-collection').style.display = tab === 'collection' ? 'block' : 'none';
    document.getElementById('rewards-catalog').style.display = tab === 'catalog' ? 'block' : 'none';
}

function updateLotteryButton() {
    const lotteryBtn = document.getElementById('lottery-btn');
    const canDraw = gameRecords.some(r => r.reward === '可抽獎');
    lotteryBtn.disabled = !canDraw;
    lotteryBtn.innerHTML = `<i class="fas fa-${canDraw ? 'dice' : 'lock'}"></i> ${canDraw ? '開始抽獎' : '需80分以上'}`;
}

function startLottery() {
    const lotteryBtn = document.getElementById('lottery-btn');
    const eligibleRecordIndex = gameRecords.findIndex(r => r.reward === '可抽獎');
    if (eligibleRecordIndex === -1) return;

    lotteryBtn.disabled = true;
    const lotteryItem = document.getElementById('lottery-item');
    lotteryItem.classList.add('spinning');

    setTimeout(() => {
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        lotteryItem.classList.remove('spinning');
        lotteryItem.innerHTML = `<i class="${randomReward.icon}"></i>`;
        
        userRewards.push({ ...randomReward, date: new Date().toLocaleDateString() });
        localStorage.setItem('zhuyinRewards', JSON.stringify(userRewards));

        gameRecords[eligibleRecordIndex].reward = '已使用';
        localStorage.setItem('zhuyinRecords', JSON.stringify(gameRecords));

        displayRewards();
        updateLotteryButton();
        updateStatistics();
        displayRecords();
        alert(`恭喜獲得：${randomReward.name}！`);
    }, 2000);
}

function displayRewards() {
    const grid = document.getElementById('rewards-grid');
    grid.innerHTML = userRewards.map((r, index) => `
        <div class="reward-slot filled">
            <i class="${r.icon}"></i>
            <span>${r.name}</span>
            <div style="font-size: 0.8rem; color: #eee;">${r.date}</div>
            <button class="btn-delete-reward" data-index="${index}"><i class="fas fa-times-circle"></i></button>
        </div>
    `).join('');
    for (let i = userRewards.length; i < 12; i++) {
        grid.innerHTML += '<div class="reward-slot empty"><i class="fas fa-plus"></i></div>';
    }
}

function displayRewardCatalog() {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = [...rewards].sort((a, b) => {
        const order = { common: 1, rare: 2, legendary: 3 };
        return order[a.rarity] - order[b.rarity];
    }).map(r => `
        <div class="catalog-item ${r.rarity}">
            <div class="rarity-badge ${r.rarity}">${r.rarity.charAt(0).toUpperCase()}</div>
            <i class="${r.icon}"></i>
            <div>${r.name}</div>
        </div>
    `).join('');
}

function startMatchingPairsGame(mode) {
    matchingPairsGame.mode = mode;
    matchingPairsGame.matched = [];
    matchingPairsGame.selected = [];

    document.querySelectorAll('.game-mode-switch .btn-mode').forEach(b => b.classList.remove('active'));
    document.getElementById(`mode-${mode}`).classList.add('active');

    let items;
    if (mode === 'zhuyin') items = [...zhuyinData.consonants, ...zhuyinData.vowels].sort(() => 0.5 - Math.random()).slice(0, 8);
    else items = alphabetData.uppercase.sort(() => 0.5 - Math.random()).slice(0, 8);

    matchingPairsGame.pairs = items.flatMap((item, i) => [
        { id: i * 2, content: item.symbol, pair: i * 2 + 1 },
        { id: i * 2 + 1, content: mode === 'zhuyin' ? item.pinyin : item.symbol.toLowerCase(), pair: i * 2 }
    ]).sort(() => 0.5 - Math.random());

    const grid = document.getElementById('matching-pairs-grid');
    grid.innerHTML = matchingPairsGame.pairs.map(p => `<div class="matching-pair-card-grid" data-id="${p.id}">${p.content}</div>`).join('');
    grid.onclick = (e) => {
        const card = e.target.closest('.matching-pair-card-grid');
        if (card) selectMatchingPairGrid(Number(card.dataset.id));
    };
    document.getElementById('matching-pairs-result').textContent = '';
}

function selectMatchingPairGrid(cardId) {
    const card = document.querySelector(`[data-id="${cardId}"]`);
    if (!card || card.classList.contains('matched') || matchingPairsGame.selected.includes(cardId)) return;

    card.classList.add('selected');
    matchingPairsGame.selected.push(cardId);

    if (matchingPairsGame.selected.length === 2) {
        const [id1, id2] = matchingPairsGame.selected;
        const pair1 = matchingPairsGame.pairs.find(p => p.id === id1);
        if (pair1.pair === id2) {
            matchingPairsGame.matched.push(id1, id2);
            document.querySelectorAll('.selected').forEach(c => c.classList.add('matched'));
            if (matchingPairsGame.matched.length === matchingPairsGame.pairs.length) {
                document.getElementById('matching-pairs-result').textContent = '🎉 恭喜完成所有配對！';
            }
        } else {
            setTimeout(() => document.querySelectorAll('.selected:not(.matched)').forEach(c => c.classList.remove('selected')), 1000);
        }
        matchingPairsGame.selected = [];
    }
}

function playSound(text, lang) {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    }
}

function playAnswerSound(isCorrect) {
    document.getElementById(isCorrect ? 'correct-sound' : 'wrong-sound').play().catch(e => {});
}

function openProfileModal() { document.getElementById('profile-modal').style.display = 'flex'; }
function closeProfileModal() { document.getElementById('profile-modal').style.display = 'none'; }

function renderAvatars() {
    const avatarList = document.getElementById('avatar-list');
    avatarList.innerHTML = '';
    avatars.forEach(avatar => {
        const div = document.createElement('div');
        div.className = 'avatar-option';
        div.dataset.icon = avatar.icon;
        div.innerHTML = `<i class="${avatar.icon}"></i>`;
        div.onclick = () => {
            document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
            div.classList.add('selected');
        };
        avatarList.appendChild(div);
    });
}

function loadUserProfile() {
    const savedNickname = localStorage.getItem('userNickname');
    const savedAvatar = localStorage.getItem('userAvatar');

    if (savedNickname) {
        document.getElementById('profile-nickname').textContent = savedNickname;
        document.getElementById('nickname-input').value = savedNickname;
    }

    if (savedAvatar) {
        document.getElementById('profile-avatar').innerHTML = `<i class="${savedAvatar}"></i>`;
        document.querySelectorAll('.avatar-option').forEach(option => {
            if (option.dataset.icon === savedAvatar) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    } else {
        // 預設選擇第一個頭像
        document.getElementById('profile-avatar').innerHTML = `<i class="${avatars[0].icon}"></i>`;
        document.querySelector(`.avatar-option[data-icon="${avatars[0].icon}"]`).classList.add('selected');
    }
}


function getQuizTypeName(type) {
    const names = { consonants: '聲母', vowels: '韻母', mixed: '注音綜合', uppercase: '大寫字母', lowercase: '小寫字母', 'alphabet-mixed': '英文綜合' };
    return names[type] || '測驗';
}

function saveProfile() {
    const nicknameInput = document.getElementById('nickname-input').value;
    const selectedAvatar = document.querySelector('.avatar-option.selected');

    if (nicknameInput) {
        localStorage.setItem('userNickname', nicknameInput);
        document.getElementById('profile-nickname').textContent = nicknameInput;
    }

    if (selectedAvatar) {
        const avatarIcon = selectedAvatar.dataset.icon;
        localStorage.setItem('userAvatar', avatarIcon);
        document.getElementById('profile-avatar').innerHTML = `<i class="${avatarIcon}"></i>`;
    }

    closeProfileModal();
    alert('個人設定已儲存！');
}

function clearUserRewards() {
    if (confirm('確定要清除所有收藏的獎勵嗎？此操作無法復原。')) {
        userRewards = [];
        localStorage.setItem('zhuyinRewards', JSON.stringify(userRewards));
        displayRewards();
        updateStatistics();
        alert('所有收藏的獎勵已清除！');
    }
}

function startFreeLottery() {
    const lotteryBtn = document.getElementById('lottery-btn');
    const freeLotteryBtn = document.getElementById('free-lottery-btn');

    lotteryBtn.disabled = true;
    freeLotteryBtn.disabled = true;

    const lotteryItem = document.getElementById('lottery-item');
    lotteryItem.classList.add('spinning');

    setTimeout(() => {
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        lotteryItem.classList.remove('spinning');
        lotteryItem.innerHTML = `<i class="${randomReward.icon}"></i>`;
        
        userRewards.push({ ...randomReward, date: new Date().toLocaleDateString() });
        localStorage.setItem('zhuyinRewards', JSON.stringify(userRewards));

        displayRewards();
        updateLotteryButton();
        updateStatistics();
        displayRecords();
        alert(`恭喜獲得：${randomReward.name}！`);

        lotteryBtn.disabled = false;
        freeLotteryBtn.disabled = false;
    }, 2000);
}

function deleteRewardItem(index) {
    if (confirm('確定要刪除這筆獎勵嗎？')) {
        userRewards.splice(index, 1);
        localStorage.setItem('zhuyinRewards', JSON.stringify(userRewards));
        displayRewards();
        updateStatistics();
        alert('獎勵已刪除！');
    }
}


Object.assign(window, {
    showSection, startQuiz, selectAnswer, startLottery, switchRewardTab, startMatchingPairsGame,
    openProfileModal, closeProfileModal, saveProfile
});
