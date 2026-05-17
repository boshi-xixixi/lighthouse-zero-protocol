(function() {
    'use strict';

    const CONFIG = {
        gridSize: 4,
        maxMoves: 80,
        colors: {
            background: '#06070c',
            tileGradientStart: '#1a1d2e',
            tileGradientEnd: '#0f1119',
            tileBorder: '#2a2d3e',
            tileHover: '#252840',
            text: '#e0e0e0',
            textGlow: '#4a9eff',
            counter: '#6b7280',
            success: '#10b981',
            failure: '#ef4444'
        },
        animation: {
            duration: 150,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
    };

    class SlidingGame {
        constructor() {
            this.container = null;
            this.grid = [];
            this.emptyPos = { row: 3, col: 3 };
            this.moves = 0;
            this.isPlaying = false;
            this.tileElements = [];
            this.moveCounterEl = null;
            this.gameBoardEl = null;
            this.onComplete = null;
            this.onFail = null;
        }

        init(containerElement) {
            if (!containerElement) {
                console.error('SlidingGame: 容器元素不能为空');
                return this;
            }

            this.container = containerElement;
            this._createGameStructure();
            this._bindEvents();
            
            return this;
        }

        start() {
            this._initializeGrid();
            this._shuffle();
            this._renderGrid();
            this.moves = 0;
            this.isPlaying = true;
            this._updateMoveCounter();
            
            return this;
        }

        getResult() {
            const isSolved = this._checkWin();
            return {
                success: isSolved && this.moves <= CONFIG.maxMoves,
                moves: this.moves,
                isComplete: isSolved
            };
        }

        destroy() {
            if (this.container) {
                this.container.innerHTML = '';
            }
            this._unbindEvents();
            this.container = null;
            this.grid = [];
            this.tileElements = [];
            this.isPlaying = false;
            
            return this;
        }

        _createGameStructure() {
            this.container.innerHTML = `
                <style>
                    .sliding-game {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        user-select: none;
                        -webkit-user-select: none;
                        touch-action: manipulation;
                    }
                    
                    .sliding-game-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        padding: 12px 16px;
                        background: linear-gradient(135deg, ${CONFIG.colors.tileGradientStart}, ${CONFIG.colors.tileGradientEnd});
                        border: 1px solid ${CONFIG.colors.tileBorder};
                        border-radius: 8px;
                    }
                    
                    .sliding-game-title {
                        color: ${CONFIG.colors.text};
                        font-size: 14px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    }
                    
                    .sliding-game-counter {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .sliding-game-moves {
                        color: ${CONFIG.colors.counter};
                        font-size: 13px;
                        font-weight: 500;
                    }
                    
                    .sliding-game-moves-value {
                        color: ${CONFIG.colors.textGlow};
                        font-size: 18px;
                        font-weight: 700;
                        min-width: 30px;
                        text-align: center;
                    }
                    
                    .sliding-game-max {
                        color: ${CONFIG.colors.counter};
                        font-size: 12px;
                    }
                    
                    .sliding-game-board {
                        display: grid;
                        grid-template-columns: repeat(${CONFIG.gridSize}, 1fr);
                        gap: 6px;
                        padding: 12px;
                        background: linear-gradient(135deg, rgba(26, 29, 46, 0.5), rgba(15, 17, 25, 0.5));
                        border: 1px solid ${CONFIG.colors.tileBorder};
                        border-radius: 12px;
                        aspect-ratio: 1;
                    }
                    
                    .sliding-tile {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, ${CONFIG.colors.tileGradientStart}, ${CONFIG.colors.tileGradientEnd});
                        border: 1px solid ${CONFIG.colors.tileBorder};
                        border-radius: 8px;
                        font-size: clamp(18px, 4vw, 28px);
                        font-weight: 700;
                        color: ${CONFIG.colors.text};
                        cursor: pointer;
                        transition: all ${CONFIG.animation.duration}ms ${CONFIG.animation.easing};
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .sliding-tile::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 50%;
                        background: linear-gradient(180deg, rgba(255,255,255,0.05), transparent);
                        border-radius: 8px 8px 0 0;
                        pointer-events: none;
                    }
                    
                    .sliding-tile:hover:not(.empty) {
                        background: linear-gradient(135deg, ${CONFIG.colors.tileHover}, ${CONFIG.colors.tileGradientEnd});
                        border-color: ${CONFIG.colors.textGlow};
                        transform: scale(1.02);
                        box-shadow: 0 0 20px rgba(74, 158, 255, 0.2);
                    }
                    
                    .sliding-tile:active:not(.empty) {
                        transform: scale(0.98);
                    }
                    
                    .sliding-tile.empty {
                        background: transparent;
                        border: 1px dashed rgba(42, 45, 62, 0.5);
                        cursor: default;
                        box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
                    }
                    
                    .sliding-tile.moving {
                        z-index: 10;
                        box-shadow: 0 8px 32px rgba(74, 158, 255, 0.3);
                    }
                    
                    .sliding-tile.correct {
                        color: ${CONFIG.colors.success};
                        text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
                    }
                    
                    @media (max-width: 480px) {
                        .sliding-game-board {
                            gap: 4px;
                            padding: 8px;
                        }
                        
                        .sliding-tile {
                            border-radius: 6px;
                        }
                    }
                </style>
                <div class="sliding-game">
                    <div class="sliding-game-header">
                        <div class="sliding-game-title">灯塔零点协议 · 滑块解密</div>
                        <div class="sliding-game-counter">
                            <span class="sliding-game-moves">步数</span>
                            <span class="sliding-game-moves-value" id="sliding-move-count">0</span>
                            <span class="sliding-game-max">/ ${CONFIG.maxMoves}</span>
                        </div>
                    </div>
                    <div class="sliding-game-board" id="sliding-game-board"></div>
                </div>
            `;

            this.moveCounterEl = this.container.querySelector('#sliding-move-count');
            this.gameBoardEl = this.container.querySelector('#sliding-game-board');
        }

        _initializeGrid() {
            this.grid = [];
            let num = 1;
            
            for (let row = 0; row < CONFIG.gridSize; row++) {
                this.grid[row] = [];
                for (let col = 0; col < CONFIG.gridSize; col++) {
                    if (row === CONFIG.gridSize - 1 && col === CONFIG.gridSize - 1) {
                        this.grid[row][col] = 0;
                        this.emptyPos = { row, col };
                    } else {
                        this.grid[row][col] = num++;
                    }
                }
            }
        }

        _shuffle() {
            const shuffleMoves = 100 + Math.floor(Math.random() * 50);
            
            for (let i = 0; i < shuffleMoves; i++) {
                const neighbors = this._getMovableTiles();
                const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                this._swapTiles(randomNeighbor.row, randomNeighbor.col, false);
            }
            
            this.moves = 0;
        }

        _getMovableTiles() {
            const neighbors = [];
            const { row, col } = this.emptyPos;
            
            const directions = [
                { row: row - 1, col: col },
                { row: row + 1, col: col },
                { row: row, col: col - 1 },
                { row: row, col: col + 1 }
            ];
            
            for (const dir of directions) {
                if (dir.row >= 0 && dir.row < CONFIG.gridSize &&
                    dir.col >= 0 && dir.col < CONFIG.gridSize) {
                    neighbors.push(dir);
                }
            }
            
            return neighbors;
        }

        _isAdjacent(row, col) {
            const { row: emptyRow, col: emptyCol } = this.emptyPos;
            const rowDiff = Math.abs(row - emptyRow);
            const colDiff = Math.abs(col - emptyCol);
            
            return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
        }

        _swapTiles(row, col, animate = true) {
            const { row: emptyRow, col: emptyCol } = this.emptyPos;
            
            this.grid[emptyRow][emptyCol] = this.grid[row][col];
            this.grid[row][col] = 0;
            this.emptyPos = { row, col };
            
            if (animate) {
                this._animateTileSwap(row, col, emptyRow, emptyCol);
            }
        }

        _animateTileSwap(fromRow, fromCol, toRow, toCol) {
            const fromIndex = fromRow * CONFIG.gridSize + fromCol;
            const toIndex = toRow * CONFIG.gridSize + toCol;
            
            const fromTile = this.tileElements[fromIndex];
            const toTile = this.tileElements[toIndex];
            
            if (!fromTile || !toTile) return;
            
            fromTile.classList.add('moving');
            
            const fromRect = fromTile.getBoundingClientRect();
            const toRect = toTile.getBoundingClientRect();
            
            const deltaX = toRect.left - fromRect.left;
            const deltaY = toRect.top - fromRect.top;
            
            fromTile.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            
            setTimeout(() => {
                fromTile.classList.remove('moving');
                fromTile.style.transform = '';
                this._renderGrid();
            }, CONFIG.animation.duration);
        }

        _renderGrid() {
            if (!this.gameBoardEl) return;
            
            this.gameBoardEl.innerHTML = '';
            this.tileElements = [];
            
            for (let row = 0; row < CONFIG.gridSize; row++) {
                for (let col = 0; col < CONFIG.gridSize; col++) {
                    const value = this.grid[row][col];
                    const tile = document.createElement('div');
                    tile.className = 'sliding-tile' + (value === 0 ? ' empty' : '');
                    tile.dataset.row = row;
                    tile.dataset.col = col;
                    
                    if (value !== 0) {
                        tile.textContent = value;
                        
                        const correctValue = row * CONFIG.gridSize + col + 1;
                        if (value === correctValue && correctValue !== CONFIG.gridSize * CONFIG.gridSize) {
                            tile.classList.add('correct');
                        }
                    }
                    
                    this.gameBoardEl.appendChild(tile);
                    this.tileElements.push(tile);
                }
            }
        }

        _handleTileClick(e) {
            if (!this.isPlaying) return;
            
            const tile = e.target.closest('.sliding-tile');
            if (!tile || tile.classList.contains('empty')) return;
            
            const row = parseInt(tile.dataset.row);
            const col = parseInt(tile.dataset.col);
            
            if (this._isAdjacent(row, col)) {
                this.moves++;
                this._updateMoveCounter();
                
                this._swapTiles(row, col, true);
                
                setTimeout(() => {
                    this._checkGameState();
                }, CONFIG.animation.duration + 50);
            }
        }

        _updateMoveCounter() {
            if (this.moveCounterEl) {
                this.moveCounterEl.textContent = this.moves;
                
                if (this.moves > CONFIG.maxMoves * 0.8) {
                    this.moveCounterEl.style.color = CONFIG.colors.failure;
                } else if (this.moves > CONFIG.maxMoves * 0.6) {
                    this.moveCounterEl.style.color = '#f59e0b';
                }
            }
        }

        _checkGameState() {
            if (this._checkWin()) {
                this.isPlaying = false;
                this._showResult(true);
                if (this.onComplete) this.onComplete(this.getResult());
            } else if (this.moves >= CONFIG.maxMoves) {
                this.isPlaying = false;
                this._showResult(false);
                if (this.onFail) this.onFail(this.getResult());
            }
        }

        _checkWin() {
            let expected = 1;
            for (let row = 0; row < CONFIG.gridSize; row++) {
                for (let col = 0; col < CONFIG.gridSize; col++) {
                    if (row === CONFIG.gridSize - 1 && col === CONFIG.gridSize - 1) {
                        if (this.grid[row][col] !== 0) return false;
                    } else {
                        if (this.grid[row][col] !== expected++) return false;
                    }
                }
            }
            return true;
        }

        _showResult(success) {
            if (!this.gameBoardEl) return;
            
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: ${success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: 700;
                color: ${success ? CONFIG.colors.success : CONFIG.colors.failure};
                text-shadow: 0 0 20px ${success ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
                animation: fadeIn 0.3s ease-out;
                z-index: 100;
            `;
            overlay.textContent = success ? '✓ 解密成功' : '✗ 任务失败';
            
            this.gameBoardEl.style.position = 'relative';
            this.gameBoardEl.appendChild(overlay);
            
            if (!document.querySelector('#sliding-result-style')) {
                const style = document.createElement('style');
                style.id = 'sliding-result-style';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; transform: scale(0.9); }
                        to { opacity: 1; transform: scale(1); }
                    }
                `;
                document.head.appendChild(style);
            }
        }

        _bindEvents() {
            if (this.container) {
                this._clickHandler = (e) => this._handleTileClick(e);
                this.container.addEventListener('click', this._clickHandler);
                
                this._touchHandler = (e) => {
                    e.preventDefault();
                    this._handleTileClick(e);
                };
                this.container.addEventListener('touchend', this._touchHandler);
            }
        }

        _unbindEvents() {
            if (this.container) {
                if (this._clickHandler) {
                    this.container.removeEventListener('click', this._clickHandler);
                }
                if (this._touchHandler) {
                    this.container.removeEventListener('touchend', this._touchHandler);
                }
            }
        }
    }

    window.SlidingGame = SlidingGame;

})();
