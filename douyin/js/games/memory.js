(function() {
    'use strict';

    var SYMBOLS = ['🔑', '📻', '💊', '🩸', '🔦', '📝', '⚓', '🗝️'];
    var MAX_ATTEMPTS = 30;
    var GRID_SIZE = 4;
    var TOTAL_PAIRS = 8;

    function MemoryGame() {
        this.container = null;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.attempts = 0;
        this.isLocked = false;
        this.gameStarted = false;
        this.gameEnded = false;
        this.onGameEnd = null;
    }

    MemoryGame.prototype.init = function(containerElement) {
        if (!containerElement) {
            console.error('MemoryGame: 容器元素不能为空');
            return this;
        }
        this.container = containerElement;
        this._createGameStructure();
        return this;
    };

    MemoryGame.prototype._createGameStructure = function() {
        this.container.innerHTML = '';
        this.container.className = 'memory-game-container';

        var header = document.createElement('div');
        header.className = 'memory-game-header';
        header.innerHTML =
            '<div class="memory-game-stat"><span class="stat-label">尝试次数</span><span id="memory-attempts" class="stat-value">0</span><span class="stat-max">/ ' + MAX_ATTEMPTS + '</span></div>' +
            '<div class="memory-game-stat"><span class="stat-label">已配对</span><span id="memory-pairs" class="stat-value">0</span><span class="stat-max">/ ' + TOTAL_PAIRS + '</span></div>';
        this.container.appendChild(header);

        var grid = document.createElement('div');
        grid.className = 'memory-grid';
        grid.id = 'memory-grid';
        this.container.appendChild(grid);

        var style = document.createElement('style');
        style.textContent = this._getStyles();
        this.container.appendChild(style);
    };

    MemoryGame.prototype.start = function(callback) {
        if (this.gameStarted) {
            this.reset();
        }
        this.gameStarted = true;
        this.gameEnded = false;
        this.onGameEnd = callback || null;
        this._initCards();
        this._renderCards();
        this._updateStats();
        return this;
    };

    MemoryGame.prototype.reset = function() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.attempts = 0;
        this.isLocked = false;
        this.gameEnded = false;
        var grid = document.getElementById('memory-grid');
        if (grid) grid.innerHTML = '';
        this._updateStats();
    };

    MemoryGame.prototype._initCards = function() {
        this.cards = [];
        var cardSymbols = SYMBOLS.concat(SYMBOLS);
        cardSymbols = this._shuffle(cardSymbols);

        for (var i = 0; i < cardSymbols.length; i++) {
            this.cards.push({
                id: i,
                symbol: cardSymbols[i],
                isFlipped: false,
                isMatched: false
            });
        }
    };

    MemoryGame.prototype._shuffle = function(array) {
        var currentIndex = array.length;
        var temporaryValue, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    };

    MemoryGame.prototype._renderCards = function() {
        var grid = document.getElementById('memory-grid');
        if (!grid) return;
        grid.innerHTML = '';

        for (var i = 0; i < this.cards.length; i++) {
            var card = this._createCardElement(this.cards[i]);
            grid.appendChild(card);
        }
    };

    MemoryGame.prototype._createCardElement = function(cardData) {
        var card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.id = cardData.id;

        var inner = document.createElement('div');
        inner.className = 'memory-card-inner';

        var front = document.createElement('div');
        front.className = 'memory-card-front';
        front.innerHTML = '<span class="card-symbol">' + cardData.symbol + '</span>';

        var back = document.createElement('div');
        back.className = 'memory-card-back';
        back.innerHTML = '<span class="card-pattern">?</span>';

        inner.appendChild(front);
        inner.appendChild(back);
        card.appendChild(inner);

        card.addEventListener('click', this._onCardClick.bind(this));
        card.addEventListener('touchend', this._onCardTouch.bind(this));

        return card;
    };

    MemoryGame.prototype._onCardTouch = function(e) {
        e.preventDefault();
        this._onCardClick(e);
    };

    MemoryGame.prototype._onCardClick = function(e) {
        if (this.isLocked || this.gameEnded) return;

        var cardEl = e.currentTarget;
        var cardId = parseInt(cardEl.dataset.id, 10);
        var card = this.cards[cardId];

        if (!card || card.isFlipped || card.isMatched) return;

        this._flipCard(card, cardEl);
        this.flippedCards.push({ card: card, element: cardEl });

        if (this.flippedCards.length === 2) {
            this.attempts++;
            this._updateStats();
            this._checkMatch();
        }
    };

    MemoryGame.prototype._flipCard = function(card, element) {
        card.isFlipped = true;
        element.classList.add('flipped');
    };

    MemoryGame.prototype._unflipCard = function(card, element) {
        card.isFlipped = false;
        element.classList.remove('flipped');
    };

    MemoryGame.prototype._checkMatch = function() {
        var first = this.flippedCards[0];
        var second = this.flippedCards[1];
        var self = this;

        this.isLocked = true;

        if (first.card.symbol === second.card.symbol) {
            first.card.isMatched = true;
            second.card.isMatched = true;
            first.element.classList.add('matched');
            second.element.classList.add('matched');
            self.matchedPairs++;
            self._updateStats();
            self.flippedCards = [];
            self.isLocked = false;

            if (self.matchedPairs === TOTAL_PAIRS) {
                setTimeout(function() {
                    self._endGame(true);
                }, 500);
            }

            if (self.attempts >= MAX_ATTEMPTS && self.matchedPairs < TOTAL_PAIRS) {
                setTimeout(function() {
                    self._endGame(false);
                }, 500);
            }
        } else {
            first.element.classList.add('wrong');
            second.element.classList.add('wrong');

            setTimeout(function() {
                self._unflipCard(first.card, first.element);
                self._unflipCard(second.card, second.element);
                first.element.classList.remove('wrong');
                second.element.classList.remove('wrong');
                self.flippedCards = [];
                self.isLocked = false;

                if (self.attempts >= MAX_ATTEMPTS && self.matchedPairs < TOTAL_PAIRS) {
                    self._endGame(false);
                }
            }, 1000);
        }
    };

    MemoryGame.prototype._updateStats = function() {
        var attemptsEl = document.getElementById('memory-attempts');
        var pairsEl = document.getElementById('memory-pairs');

        if (attemptsEl) attemptsEl.textContent = this.attempts;
        if (pairsEl) pairsEl.textContent = this.matchedPairs;
    };

    MemoryGame.prototype._endGame = function(success) {
        this.gameEnded = true;
        this.isLocked = true;

        if (typeof this.onGameEnd === 'function') {
            this.onGameEnd({
                success: success,
                attempts: this.attempts,
                pairs: this.matchedPairs
            });
        }
    };

    MemoryGame.prototype.getResult = function() {
        return {
            success: this.matchedPairs === TOTAL_PAIRS,
            attempts: this.attempts,
            pairs: this.matchedPairs,
            totalPairs: TOTAL_PAIRS,
            maxAttempts: MAX_ATTEMPTS
        };
    };

    MemoryGame.prototype.destroy = function() {
        if (this.container) {
            this.container.innerHTML = '';
            this.container.className = '';
        }
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.attempts = 0;
        this.isLocked = false;
        this.gameStarted = false;
        this.gameEnded = false;
        this.container = null;
        this.onGameEnd = null;
    };

    MemoryGame.prototype._getStyles = function() {
        return '.memory-game-container{font-family:"Segoe UI",system-ui,sans-serif;user-select:none;-webkit-user-select:none;width:100%;max-width:420px;margin:0 auto;padding:16px;box-sizing:border-box}.memory-game-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding:12px 16px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:8px;border:1px solid rgba(74,158,255,0.2);box-shadow:0 4px 15px rgba(0,0,0,0.3)}.memory-game-stat{display:flex;align-items:center;gap:6px}.stat-label{color:#8892b0;font-size:12px;text-transform:uppercase;letter-spacing:1px}.stat-value{color:#4a9eff;font-size:20px;font-weight:bold;min-width:24px;text-align:center}.stat-max{color:#5a6a8a;font-size:14px}.memory-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;perspective:1000px}.memory-card{aspect-ratio:1;cursor:pointer;position:relative}.memory-card-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 0.5s cubic-bezier(0.4,0,0.2,1)}.memory-card.flipped .memory-card-inner{transform:rotateY(180deg)}.memory-card-front,.memory-card-back{position:absolute;width:100%;height:100%;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:28px}.memory-card-back{background:linear-gradient(145deg,#0f0f23 0%,#1a1a3e 50%,#0f0f23 100%);border:2px solid #2d3a5c;box-shadow:inset 0 0 20px rgba(74,158,255,0.1),0 4px 8px rgba(0,0,0,0.3);transition:border-color 0.3s,box-shadow 0.3s}.memory-card:hover .memory-card-back{border-color:#4a9eff;box-shadow:inset 0 0 25px rgba(74,158,255,0.2),0 6px 12px rgba(74,158,255,0.2)}.memory-card-front{background:linear-gradient(145deg,#1e2747 0%,#243056 100%);border:2px solid #3d4d7a;transform:rotateY(180deg);box-shadow:0 4px 12px rgba(0,0,0,0.4)}.memory-card.matched .memory-card-front{border-color:#00ff88;background:linear-gradient(145deg,#1a3a2e 0%,#244036 100%);box-shadow:0 0 20px rgba(0,255,136,0.3)}.memory-card.wrong .memory-card-back{border-color:#ff4757;animation:shake 0.4s ease-in-out}@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}.card-symbol{filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))}.card-pattern{color:#4a9eff;font-size:32px;font-weight:bold;text-shadow:0 0 10px rgba(74,158,255,0.5)}@media(max-width:400px){.memory-grid{gap:6px}.memory-card-front,.memory-card-back{font-size:22px}.card-pattern{font-size:26px}}';
    };

    window.MemoryGame = MemoryGame;
})();
