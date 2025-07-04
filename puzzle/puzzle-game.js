// 拼圖遊戲主程式
const board = document.getElementById('puzzle-board');
const sizeSelect = document.getElementById('size');
const resetBtn = document.getElementById('reset');
const hintBtn = document.getElementById('hint');
const timerSpan = document.getElementById('timer');
const uploadInput = document.getElementById('upload');
const previewImg = document.getElementById('preview-img');
const messageDiv = document.getElementById('message');
const moveSound = document.getElementById('move-sound');
const hintCountSpan = document.getElementById('hint-count');

let size = parseInt(sizeSelect.value);
let pieces = [];
let timer = 0;
let timerInterval = null;
let imgSrc = previewImg.src;
let hintCount = 3;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createPieces() {
  pieces = [];
  board.innerHTML = '';
  board.style.gridTemplateRows = `repeat(${size}, 1fr)`;
  board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  
  // 調整背景圖片尺寸以配合新的設計（580px而非600px）
  const imageSize = 580;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const idx = row * size + col;
      const piece = document.createElement('div');
      piece.className = 'puzzle-piece';
      piece.style.backgroundImage = `url('${imgSrc}')`;
      piece.style.backgroundPosition = `-${col * (imageSize / size)}px -${row * (imageSize / size)}px`;
      piece.style.backgroundSize = `${imageSize}px ${imageSize}px`;
      piece.dataset.originalRow = row;
      piece.dataset.originalCol = col;
      piece.dataset.currentRow = row;
      piece.dataset.currentCol = col;
      piece.draggable = true;
      
      piece.addEventListener('dragstart', e => {
        const currentRow = parseInt(piece.dataset.currentRow);
        const currentCol = parseInt(piece.dataset.currentCol);
        e.dataTransfer.setData('from-row', currentRow);
        e.dataTransfer.setData('from-col', currentCol);
        piece.classList.add('dragging');
      });
      
      piece.addEventListener('dragend', () => {
        piece.classList.remove('dragging');
        // 移除所有目標樣式
        pieces.forEach(p => p.element.classList.remove('drop-target'));
      });
      
      piece.addEventListener('dragover', e => {
        e.preventDefault();
        // 添加拖拉目標樣式
        piece.classList.add('drop-target');
      });
      
      piece.addEventListener('dragleave', () => {
        piece.classList.remove('drop-target');
      });
      
      // 添加點擊選擇功能
      piece.addEventListener('click', () => {
        if (selectedPiece === piece) {
          // 如果點擊已選中的塊，取消選擇
          piece.classList.remove('selected');
          selectedPiece = null;
        } else if (selectedPiece) {
          // 如果已有選中的塊，則交換
          swapPieces(selectedPiece, piece);
          selectedPiece.element.classList.remove('selected');
          selectedPiece = null;
        } else {
          // 選中當前塊
          selectPiece(piece);
        }
      });
      
      piece.addEventListener('drop', e => {
        e.preventDefault();
        piece.classList.remove('drop-target');
        
        const fromRow = Number(e.dataTransfer.getData('from-row'));
        const fromCol = Number(e.dataTransfer.getData('from-col'));
        const toRow = parseInt(piece.dataset.currentRow);
        const toCol = parseInt(piece.dataset.currentCol);
        
        // 只有不同格子才交換
        if (fromRow !== toRow || fromCol !== toCol) {
          const fromPiece = getPiece(fromRow, fromCol);
          const toPiece = getPiece(toRow, toCol);
          if (fromPiece && toPiece) {
            swapPieces(fromPiece, toPiece);
          }
        }
      });
      
      board.appendChild(piece);
      pieces.push({ row, col, element: piece, originalRow: row, originalCol: col });
    }
  }
}

// 互換兩個拼圖塊
function swapPieces(pieceA, pieceB) {
  // 播放移動音效
  try {
    moveSound.currentTime = 0;
    moveSound.play().catch(e => console.log('Move sound failed:', e));
  } catch (e) {
    console.log('Move sound error:', e);
  }
  
  // 交換 row/col
  const tempRow = pieceA.row;
  const tempCol = pieceA.col;
  pieceA.row = pieceB.row;
  pieceA.col = pieceB.col;
  pieceB.row = tempRow;
  pieceB.col = tempCol;
  
  // 更新 dataset
  pieceA.element.dataset.currentRow = pieceA.row;
  pieceA.element.dataset.currentCol = pieceA.col;
  pieceB.element.dataset.currentRow = pieceB.row;
  pieceB.element.dataset.currentCol = pieceB.col;
  
  // 立即渲染
  renderPieces();
  checkWin();
}

function getPiece(row, col) {
  return pieces.find(p => p.row === row && p.col === col);
}

function renderPieces() {
  pieces.forEach(piece => {
    piece.element.style.gridRowStart = piece.row + 1;
    piece.element.style.gridColumnStart = piece.col + 1;
    // 確保 dataset 與實際位置同步
    piece.element.dataset.currentRow = piece.row;
    piece.element.dataset.currentCol = piece.col;
  });
}

function randomize() {
  // 打亂拼圖
  let arr = [];
  for (let i = 0; i < size * size; i++) arr.push(i);
  shuffle(arr);
  
  for (let i = 0; i < pieces.length; i++) {
    pieces[i].row = Math.floor(arr[i] / size);
    pieces[i].col = arr[i] % size;
  }
  renderPieces();
}

function checkWin() {
  let win = pieces.every(piece => {
    const isCorrect = piece.row === piece.originalRow && piece.col === piece.originalCol;
    console.log(`Piece (${piece.originalRow},${piece.originalCol}) at (${piece.row},${piece.col}): ${isCorrect}`);
    return isCorrect;
  });
  
  console.log('Check win result:', win);
  
  if (win) {
    clearInterval(timerInterval);
    
    // 播放勝利音效
    try {
      winSound.currentTime = 0;
      winSound.play().catch(e => console.log('Win sound failed:', e));
    } catch (e) {
      console.log('Win sound error:', e);
    }
    
    // 觸發過關特效動畫
    showWinAnimation();
    
    messageDiv.textContent = `🎉🌟 太棒了！拼圖完成！🌟🎉\n⏰ 用時：${timerSpan.textContent} ⏰\n🏆 你真是拼圖大師！�`;
    messageDiv.className = 'celebration-message';
    
    console.log('Game won!');
  }
}

function startGame() {
  clearInterval(timerInterval);
  timer = 0;
  timerSpan.textContent = '00:00';
  messageDiv.textContent = '';
  messageDiv.className = ''; // 清除慶祝樣式
  createPieces();
  randomize();
  renderPieces();
  timerInterval = setInterval(() => {
    timer++;
    timerSpan.textContent = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;
  }, 1000);
  hintCount = 3;
  hintCountSpan.textContent = hintCount;
  hintBtn.style.opacity = '1';
  hintBtn.style.cursor = 'pointer';
}

sizeSelect.addEventListener('change', () => {
  size = parseInt(sizeSelect.value);
  startGame();
});
resetBtn.addEventListener('click', startGame);
hintBtn.addEventListener('click', () => {
  if (hintCount <= 0) {
    alert('💔 提示次數已用完！再努力試試看吧！💪');
    return;
  }
  
  let wrongPieces = pieces.filter(piece => 
    piece.row !== piece.originalRow || piece.col !== piece.originalCol
  );
  
  if (wrongPieces.length === 0) {
    alert('🎉 拼圖已經完成了！你真厲害！🌟');
    return;
  }
  
  // 隨機選擇一個錯位的拼圖塊進行提示
  const randomPiece = wrongPieces[Math.floor(Math.random() * wrongPieces.length)];
  
  randomPiece.element.style.boxShadow = '0 0 15px 3px #ff9800';
  randomPiece.element.style.animation = 'pulse 1s ease-in-out 3';
  
  setTimeout(() => {
    randomPiece.element.style.boxShadow = '';
    randomPiece.element.style.animation = '';
  }, 3000);
  
  hintCount--;
  hintCountSpan.textContent = hintCount;
  
  if (hintCount === 0) {
    hintBtn.style.opacity = '0.5';
    hintBtn.style.cursor = 'not-allowed';
  }
});
uploadInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) {
    uploadInput.classList.remove('file-selected');
    return;
  }
  
  // 添加選擇成功的視覺效果
  uploadInput.classList.add('file-selected');
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    imgSrc = evt.target.result;
    previewImg.src = imgSrc;
    startGame();
    
    // 短暫顯示成功提示後恢復原狀
    setTimeout(() => {
      uploadInput.classList.remove('file-selected');
    }, 2000);
  };
  reader.readAsDataURL(file);
});

// 添加拖拉上傳功能
uploadInput.addEventListener('dragover', e => {
  e.preventDefault();
  uploadInput.classList.add('drag-over');
});

uploadInput.addEventListener('dragleave', e => {
  e.preventDefault();
  uploadInput.classList.remove('drag-over');
});

uploadInput.addEventListener('drop', e => {
  e.preventDefault();
  uploadInput.classList.remove('drag-over');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      uploadInput.files = files;
      uploadInput.dispatchEvent(new Event('change'));
    }
  }
});

// 原圖點擊放大功能
const imageModal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImg');
const magnifier = document.getElementById('magnifier');

previewImg.addEventListener('click', () => {
  modalImg.src = imgSrc;
  imageModal.style.display = 'block';
});

imageModal.addEventListener('click', () => {
  imageModal.style.display = 'none';
});

// 放大鏡效果
previewImg.addEventListener('mouseenter', (e) => {
  magnifier.style.display = 'block';
  // 使用requestAnimationFrame確保DOM更新後再添加class
  requestAnimationFrame(() => {
    magnifier.classList.add('show');
  });
  console.log('Mouse entered preview image - magnifier shown immediately');
});

previewImg.addEventListener('mousemove', (e) => {
  const rect = previewImg.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // 計算放大鏡位置
  const magnifierSize = 150;
  const zoom = 3; // 放大倍數
  const offset = 25; // 偏移距離
  
  // 智能定位放大鏡，避免超出螢幕
  let magnifierX = e.clientX + offset;
  let magnifierY = e.clientY + offset;
  
  // 檢查右邊界
  if (magnifierX + magnifierSize + 10 > window.innerWidth) {
    magnifierX = e.clientX - magnifierSize - offset;
  }
  
  // 檢查下邊界
  if (magnifierY + magnifierSize + 10 > window.innerHeight) {
    magnifierY = e.clientY - magnifierSize - offset;
  }
  
  // 檢查左邊界
  if (magnifierX < 10) {
    magnifierX = e.clientX + offset;
  }
  
  // 檢查上邊界
  if (magnifierY < 10) {
    magnifierY = e.clientY + offset;
  }
  
  magnifier.style.left = magnifierX + 'px';
  magnifier.style.top = magnifierY + 'px';
  
  // 精確計算背景位置
  const imageDisplayWidth = rect.width;
  const imageDisplayHeight = rect.height;
  
  // 確保座標在圖片範圍內
  const clampedX = Math.max(0, Math.min(x, imageDisplayWidth));
  const clampedY = Math.max(0, Math.min(y, imageDisplayHeight));
  
  // 計算相對位置百分比
  const xPercent = clampedX / imageDisplayWidth;
  const yPercent = clampedY / imageDisplayHeight;
  
  // 計算放大後的背景尺寸
  const bgWidth = imageDisplayWidth * zoom;
  const bgHeight = imageDisplayHeight * zoom;
  
  // 計算背景位置，讓滑鼠指向的像素精確出現在放大鏡中心
  const bgX = -(xPercent * bgWidth) + magnifierSize / 2;
  const bgY = -(yPercent * bgHeight) + magnifierSize / 2;
  
  magnifier.style.backgroundImage = `url('${imgSrc}')`;
  magnifier.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;
  magnifier.style.backgroundPosition = `${bgX}px ${bgY}px`;
});

previewImg.addEventListener('mouseleave', () => {
  magnifier.classList.remove('show');
  // 延遲隱藏，等待動畫完成
  setTimeout(() => {
    magnifier.style.display = 'none';
  }, 200);
  console.log('Mouse left preview image');
});

// 過關特效動畫
function showWinAnimation() {
  // 1. 讓所有拼圖塊閃爍
  pieces.forEach((piece, index) => {
    setTimeout(() => {
      piece.element.classList.add('piece-flash');
      piece.element.classList.add('win-animation');
    }, index * 100);
  });
  
  // 2. 創建煙火特效
  createFireworks();
  
  // 3. 創建彩色紙屑
  createConfetti();
  
  // 4. 清理動畫效果
  setTimeout(() => {
    pieces.forEach(piece => {
      piece.element.classList.remove('piece-flash', 'win-animation');
    });
    messageDiv.classList.remove('celebration-message');
  }, 5000);
}

function createFireworks() {
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const firework = document.createElement('div');
      firework.className = 'firework';
      
      // 隨機位置
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.2;
      
      firework.style.left = x + 'px';
      firework.style.top = y + 'px';
      
      document.body.appendChild(firework);
      
      // 動畫結束後移除元素
      setTimeout(() => {
        if (firework.parentNode) {
          document.body.removeChild(firework);
        }
      }, 2000);
    }, i * 300);
  }
}

function createConfetti() {
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      
      // 隨機位置和顏色
      const x = Math.random() * window.innerWidth;
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#a8e6cf', '#ff8b94'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      confetti.style.left = x + 'px';
      confetti.style.top = '-10px';
      confetti.style.background = color;
      confetti.style.animationDelay = Math.random() * 2 + 's';
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      
      document.body.appendChild(confetti);
      
      // 動畫結束後移除元素
      setTimeout(() => {
        if (confetti.parentNode) {
          document.body.removeChild(confetti);
        }
      }, 5000);
    }, i * 50);
  }
}

// 鍵盤支援
let selectedPiece = null;

function selectPiece(piece) {
  // 清除之前的選擇
  if (selectedPiece) {
    selectedPiece.element.classList.remove('selected');
  }
  
  selectedPiece = piece;
  piece.element.classList.add('selected');
}

// 鍵盤事件處理
document.addEventListener('keydown', (e) => {
  if (!selectedPiece) return;
  
  const currentRow = selectedPiece.row;
  const currentCol = selectedPiece.col;
  let targetRow = currentRow;
  let targetCol = currentCol;
  
  switch(e.key) {
    case 'ArrowUp':
      targetRow = Math.max(0, currentRow - 1);
      break;
    case 'ArrowDown':
      targetRow = Math.min(size - 1, currentRow + 1);
      break;
    case 'ArrowLeft':
      targetCol = Math.max(0, currentCol - 1);
      break;
    case 'ArrowRight':
      targetCol = Math.min(size - 1, currentCol + 1);
      break;
    case 'Enter':
    case ' ':
      // 空格或回車選擇/交換
      if (targetRow !== currentRow || targetCol !== currentCol) {
        const targetPiece = getPiece(targetRow, targetCol);
        if (targetPiece) {
          swapPieces(selectedPiece, targetPiece);
        }
      }
      return;
    case 'Escape':
      // ESC 取消選擇
      selectedPiece.element.classList.remove('selected');
      selectedPiece = null;
      return;
    default:
      return;
  }
  
  // 移動選擇
  if (targetRow !== currentRow || targetCol !== currentCol) {
    const targetPiece = getPiece(targetRow, targetCol);
    if (targetPiece) {
      selectPiece(targetPiece);
    }
  }
  
  e.preventDefault();
});

window.onload = startGame;
