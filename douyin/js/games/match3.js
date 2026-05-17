var Match3Game = (function() {
  var GRID_SIZE = 8;
  var COLORS = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#a55eea', '#ff6b81'];
  var TARGET_SCORE = 1000;
  var MAX_MOVES = 20;

  var container, canvas, ctx;
  var grid = [];
  var selectedCell = null;
  var score = 0;
  var movesLeft = MAX_MOVES;
  var isAnimating = false;
  var cellSize = 50;
  var padding = 5;
  var offsetX = 0, offsetY = 0;
  var animatingCells = [];
  var gameStarted = false;
  var gameEnded = false;

  function init(containerElement) {
    container = containerElement;
    if (!container) return;

    var width = GRID_SIZE * (cellSize + padding) + padding + 200;
    var height = GRID_SIZE * (cellSize + padding) + padding + 80;

    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.background = '#06070c';
    canvas.style.borderRadius = '8px';
    canvas.style.display = 'block';
    ctx = canvas.getContext('2d');

    container.appendChild(canvas);

    canvas.addEventListener('mousedown', handleInput);
    canvas.addEventListener('touchstart', handleTouchInput, { passive: false });

    initGrid();
    draw();
  }

  function initGrid() {
    grid = [];
    for (var row = 0; row < GRID_SIZE; row++) {
      grid[row] = [];
      for (var col = 0; col < GRID_SIZE; col++) {
        grid[row][col] = createCell(row, col);
      }
    }
    while (findMatches().length > 0) {
      removeMatches(findMatches());
      fillEmptyCells();
    }
  }

  function createCell(row, col) {
    return {
      type: Math.floor(Math.random() * COLORS.length),
      row: row,
      col: col,
      x: col * (cellSize + padding) + padding,
      y: row * (cellSize + padding) + padding + 60,
      targetX: col * (cellSize + padding) + padding,
      targetY: row * (cellSize + padding) + padding + 60,
      scale: 1,
      alpha: 1
    };
  }

  function handleInput(e) {
    if (isAnimating || !gameStarted || gameEnded) return;
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    processClick(x, y);
  }

  function handleTouchInput(e) {
    e.preventDefault();
    if (isAnimating || !gameStarted || gameEnded) return;
    var rect = canvas.getBoundingClientRect();
    var touch = e.touches[0];
    var x = touch.clientX - rect.left;
    var y = touch.clientY - rect.top;
    processClick(x, y);
  }

  function processClick(x, y) {
    var col = Math.floor((x - padding) / (cellSize + padding));
    var row = Math.floor((y - padding - 60) / (cellSize + padding));

    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

    if (!selectedCell) {
      selectedCell = { row: row, col: col };
    } else {
      if (isAdjacent(selectedCell, { row: row, col: col })) {
        trySwap(selectedCell.row, selectedCell.col, row, col);
      }
      selectedCell = null;
    }
    draw();
  }

  function isAdjacent(a, b) {
    var dr = Math.abs(a.row - b.row);
    var dc = Math.abs(a.col - b.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  function trySwap(r1, c1, r2, c2) {
    isAnimating = true;
    swap(r1, c1, r2, c2);

    animateSwap(function() {
      var matches = findMatches();
      if (matches.length > 0) {
        movesLeft--;
        processMatches(matches);
      } else {
        swap(r1, c1, r2, c2);
        animateSwap(function() {
          isAnimating = false;
          draw();
          checkGameEnd();
        });
      }
    });
  }

  function swap(r1, c1, r2, c2) {
    var temp = grid[r1][c1];
    grid[r1][c1] = grid[r2][c2];
    grid[r2][c2] = temp;
    grid[r1][c1].row = r1;
    grid[r1][c1].col = c1;
    grid[r2][c2].row = r2;
    grid[r2][c2].col = c2;
    updateTargets();
  }

  function updateTargets() {
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        grid[r][c].targetX = c * (cellSize + padding) + padding;
        grid[r][c].targetY = r * (cellSize + padding) + padding + 60;
      }
    }
  }

  function animateSwap(callback) {
    var frames = 10;
    var currentFrame = 0;

    function step() {
      currentFrame++;
      draw();
      if (currentFrame < frames) {
        requestAnimationFrame(step);
      } else {
        callback();
      }
    }
    step();
  }

  function findMatches() {
    var matches = [];
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE - 2; c++) {
        if (grid[r][c].type === grid[r][c+1].type && grid[r][c].type === grid[r][c+2].type) {
          matches.push({ row: r, col: c });
          matches.push({ row: r, col: c + 1 });
          matches.push({ row: r, col: c + 2 });
        }
      }
    }
    for (var c = 0; c < GRID_SIZE; c++) {
      for (var r = 0; r < GRID_SIZE - 2; r++) {
        if (grid[r][c].type === grid[r+1][c].type && grid[r][c].type === grid[r+2][c].type) {
          matches.push({ row: r, col: c });
          matches.push({ row: r + 1, col: c });
          matches.push({ row: r + 2, col: c });
        }
      }
    }
    var unique = [];
    for (var i = 0; i < matches.length; i++) {
      var exists = false;
      for (var j = 0; j < unique.length; j++) {
        if (unique[j].row === matches[i].row && unique[j].col === matches[i].col) {
          exists = true;
          break;
        }
      }
      if (!exists) unique.push(matches[i]);
    }
    return unique;
  }

  function processMatches(matches) {
    score += matches.length * 10;
    animateRemove(matches, function() {
      removeMatches(matches);
      dropCells();
      fillEmptyCells();

      setTimeout(function() {
        updateTargets();
        animateDrop(function() {
          var newMatches = findMatches();
          if (newMatches.length > 0) {
            processMatches(newMatches);
          } else {
            isAnimating = false;
            draw();
            checkGameEnd();
          }
        });
      }, 50);
    });
  }

  function removeMatches(matches) {
    for (var i = 0; i < matches.length; i++) {
      grid[matches[i].row][matches[i].col] = null;
    }
  }

  function dropCells() {
    for (var c = 0; c < GRID_SIZE; c++) {
      var emptyRow = GRID_SIZE - 1;
      for (var r = GRID_SIZE - 1; r >= 0; r--) {
        if (grid[r][c] !== null) {
          if (r !== emptyRow) {
            grid[emptyRow][c] = grid[r][c];
            grid[emptyRow][c].row = emptyRow;
            grid[r][c] = null;
          }
          emptyRow--;
        }
      }
    }
  }

  function fillEmptyCells() {
    for (var c = 0; c < GRID_SIZE; c++) {
      for (var r = 0; r < GRID_SIZE; r++) {
        if (grid[r][c] === null) {
          grid[r][c] = createCell(r, c);
          grid[r][c].y = -(GRID_SIZE - r) * (cellSize + padding);
        }
      }
    }
  }

  function animateRemove(matches, callback) {
    var frames = 15;
    var currentFrame = 0;

    function step() {
      currentFrame++;
      var progress = currentFrame / frames;
      for (var i = 0; i < matches.length; i++) {
        var cell = grid[matches[i].row][matches[i].col];
        if (cell) {
          cell.scale = 1 - progress;
          cell.alpha = 1 - progress;
        }
      }
      draw();
      if (currentFrame < frames) {
        requestAnimationFrame(step);
      } else {
        callback();
      }
    }
    step();
  }

  function animateDrop(callback) {
    var frames = 12;
    var currentFrame = 0;

    function step() {
      currentFrame++;
      var progress = easeOutBounce(currentFrame / frames);
      for (var r = 0; r < GRID_SIZE; r++) {
        for (var c = 0; c < GRID_SIZE; c++) {
          var cell = grid[r][c];
          if (cell) {
            cell.x = cell.x + (cell.targetX - cell.x) * 0.3;
            cell.y = cell.y + (cell.targetY - cell.y) * 0.3;
          }
        }
      }
      draw();
      if (currentFrame < frames) {
        requestAnimationFrame(step);
      } else {
        for (var r = 0; r < GRID_SIZE; r++) {
          for (var c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c]) {
              grid[r][c].x = grid[r][c].targetX;
              grid[r][c].y = grid[r][c].targetY;
            }
          }
        }
        callback();
      }
    }
    step();
  }

  function easeOutBounce(t) {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }

  function checkGameEnd() {
    if (movesLeft <= 0 || score >= TARGET_SCORE) {
      gameEnded = true;
      draw();
    }
  }

  function draw() {
    ctx.fillStyle = '#06070c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';

    var infoX = GRID_SIZE * (cellSize + padding) + padding + 20;
    ctx.fillText('分数: ' + score, infoX, 30);
    ctx.fillText('步数: ' + movesLeft, infoX, 55);
    ctx.fillText('目标: ' + TARGET_SCORE, infoX, 80);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText('灯塔零点协议', infoX, 110);
    ctx.fillText('三消挑战', infoX, 130);

    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var cell = grid[r][c];
        if (cell) {
          drawCell(cell);
        }
      }
    }

    if (selectedCell) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        selectedCell.col * (cellSize + padding) + padding - 2,
        selectedCell.row * (cellSize + padding) + padding + 58,
        cellSize + 4,
        cellSize + 4
      );
    }

    if (gameEnded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      if (score >= TARGET_SCORE) {
        ctx.fillStyle = '#2ed573';
        ctx.fillText('挑战成功!', canvas.width / 2, canvas.height / 2 - 20);
      } else {
        ctx.fillStyle = '#ff4757';
        ctx.fillText('挑战失败', canvas.width / 2, canvas.height / 2 - 20);
      }

      ctx.font = '18px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('最终得分: ' + score, canvas.width / 2, canvas.height / 2 + 15);
    }
  }

  function drawCell(cell) {
    var x = cell.x;
    var y = cell.y;
    var size = cellSize * cell.scale;
    var offset = (cellSize - size) / 2;

    ctx.save();
    ctx.globalAlpha = cell.alpha;

    var gradient = ctx.createLinearGradient(x + offset, y + offset, x + offset + size, y + offset + size);
    var baseColor = COLORS[cell.type];

    gradient.addColorStop(0, lightenColor(baseColor, 30));
    gradient.addColorStop(1, darkenColor(baseColor, 30));

    ctx.fillStyle = gradient;
    roundRect(ctx, x + offset, y + offset, size, size, 8);
    ctx.fill();

    ctx.strokeStyle = lightenColor(baseColor, 50);
    ctx.lineWidth = 2;
    roundRect(ctx, x + offset, y + offset, size, size, 8);
    ctx.stroke();

    var highlightGradient = ctx.createLinearGradient(x + offset, y + offset, x + offset, y + offset + size * 0.4);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    roundRect(ctx, x + offset + 2, y + offset + 2, size - 4, size * 0.4, 6);
    ctx.fill();

    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function lightenColor(color, percent) {
    var num = parseInt(color.replace('#', ''), 16);
    var amt = Math.round(2.55 * percent);
    var R = (num >> 16) + amt;
    var G = (num >> 8 & 0x00FF) + amt;
    var B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  function darkenColor(color, percent) {
    var num = parseInt(color.replace('#', ''), 16);
    var amt = Math.round(2.55 * percent);
    var R = (num >> 16) - amt;
    var G = (num >> 8 & 0x00FF) - amt;
    var B = (num & 0x0000FF) - amt;
    return '#' + (
      0x1000000 +
      (R > 0 ? R : 0) * 0x10000 +
      (G > 0 ? G : 0) * 0x100 +
      (B > 0 ? B : 0)
    ).toString(16).slice(1);
  }

  function start() {
    gameStarted = true;
    gameEnded = false;
    score = 0;
    movesLeft = MAX_MOVES;
    selectedCell = null;
    isAnimating = false;
    initGrid();
    draw();
  }

  function getResult() {
    return {
      success: score >= TARGET_SCORE,
      score: score
    };
  }

  function destroy() {
    if (canvas && canvas.parentNode) {
      canvas.removeEventListener('mousedown', handleInput);
      canvas.removeEventListener('touchstart', handleTouchInput);
      canvas.parentNode.removeChild(canvas);
    }
    container = null;
    canvas = null;
    ctx = null;
    grid = [];
    selectedCell = null;
    score = 0;
    movesLeft = MAX_MOVES;
    isAnimating = false;
    gameStarted = false;
    gameEnded = false;
  }

  return {
    init: init,
    start: start,
    getResult: getResult,
    destroy: destroy
  };
})();

if (typeof window !== 'undefined') {
  window.Match3Game = Match3Game;
}
