(function() {
  'use strict';

  var _container = null;
  var _password = '';
  var _attempts = 0;
  var _maxAttempts = 10;
  var _history = [];
  var _currentInput = '';
  var _gameState = 'idle';
  var _seed = null;
  var _typewriterTimer = null;
  var _onComplete = null;

  function seededRandom(seed) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function generatePassword(seed) {
    var s = seed || Date.now();
    var chars = '0123456789';
    var pwd = '';
    for (var i = 0; i < 4; i++) {
      var idx = Math.floor(seededRandom(s + i) * 10);
      pwd += chars[idx];
    }
    return pwd;
  }

  function analyzeGuess(guess, password) {
    var result = { exact: 0, partial: 0, wrong: 0 };
    var usedInPwd = [false, false, false, false];
    var usedInGuess = [false, false, false, false];

    for (var i = 0; i < 4; i++) {
      if (guess[i] === password[i]) {
        result.exact++;
        usedInPwd[i] = true;
        usedInGuess[i] = true;
      }
    }

    for (var j = 0; j < 4; j++) {
      if (usedInGuess[j]) continue;
      for (var k = 0; k < 4; k++) {
        if (!usedInPwd[k] && guess[j] === password[k]) {
          result.partial++;
          usedInPwd[k] = true;
          break;
        }
      }
    }

    result.wrong = 4 - result.exact - result.partial;
    return result;
  }

  function typewrite(element, text, speed, callback) {
    if (_typewriterTimer) {
      clearTimeout(_typewriterTimer);
    }
    element.textContent = '';
    var idx = 0;
    function typeChar() {
      if (idx < text.length) {
        element.textContent += text[idx];
        idx++;
        _typewriterTimer = setTimeout(typeChar, speed);
      } else {
        if (callback) callback();
      }
    }
    typeChar();
  }

  function createStyles() {
    var styleId = 'code-game-styles';
    if (document.getElementById(styleId)) return;
    var css = [
      '.cg-container {',
      '  font-family: "Courier New", "Consolas", monospace;',
      '  background: #0a0f0a;',
      '  border: 2px solid #1a3d1a;',
      '  border-radius: 8px;',
      '  padding: 20px;',
      '  color: #00ff41;',
      '  max-width: 420px;',
      '  position: relative;',
      '  overflow: hidden;',
      '  box-shadow: 0 0 30px rgba(0,255,65,0.15), inset 0 0 60px rgba(0,255,65,0.03);',
      '}',
      '.cg-scanline {',
      '  position: absolute;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  pointer-events: none;',
      '  background: repeating-linear-gradient(',
      '    0deg,',
      '    transparent, transparent 2px,',
      '    rgba(0,255,65,0.015) 2px, rgba(0,255,65,0.015) 4px',
      '  );',
      '  z-index: 10;',
      '}',
      '.cg-header {',
      '  text-align: center;',
      '  border-bottom: 1px solid #1a3d1a;',
      '  padding-bottom: 12px;',
      '  margin-bottom: 16px;',
      '}',
      '.cg-title {',
      '  font-size: 16px;',
      '  font-weight: bold;',
      '  letter-spacing: 3px;',
      '  text-transform: uppercase;',
      '  color: #00ff41;',
      '  text-shadow: 0 0 8px rgba(0,255,65,0.6);',
      '  margin: 0 0 4px 0;',
      '}',
      '.cg-subtitle {',
      '  font-size: 11px;',
      '  color: #3d7a3d;',
      '  letter-spacing: 1px;',
      '}',
      '.cg-status {',
      '  display: flex;',
      '  justify-content: space-between;',
      '  align-items: center;',
      '  margin-bottom: 12px;',
      '  padding: 8px 12px;',
      '  background: rgba(0,255,65,0.04);',
      '  border: 1px solid #1a3d1a;',
      '  border-radius: 4px;',
      '  font-size: 13px;',
      '}',
      '.cg-attempts {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '}',
      '.cg-attempt-dots {',
      '  display: flex;',
      '  gap: 3px;',
      '}',
      '.cg-dot {',
      '  width: 8px; height: 8px;',
      '  border-radius: 50%;',
      '  background: #1a3d1a;',
      '  transition: background 0.3s;',
      '}',
      '.cg-dot.used {',
      '  background: #ff3333;',
      '  box-shadow: 0 0 4px rgba(255,51,51,0.5);',
      '}',
      '.cg-display {',
      '  background: #050a05;',
      '  border: 1px solid #1a3d1a;',
      '  border-radius: 6px;',
      '  padding: 14px 18px;',
      '  margin-bottom: 14px;',
      '  min-height: 52px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '}',
      '.cg-input-display {',
      '  font-size: 28px;',
      '  letter-spacing: 10px;',
      '  font-weight: bold;',
      '  color: #00ff41;',
      '  text-shadow: 0 0 12px rgba(0,255,65,0.7);',
      '  min-width: 160px;',
      '  text-align: center;',
      '}',
      '.cg-input-display .cg-cursor {',
      '  animation: cg-blink 0.8s infinite;',
      '}',
      '@keyframes cg-blink {',
      '  0%,50% { opacity: 1; }',
      '  51%,100% { opacity: 0; }',
      '}',
      '.cg-message {',
      '  font-size: 13px;',
      '  color: #3d7a3d;',
      '  min-height: 20px;',
      '  margin-bottom: 12px;',
      '  padding: 6px 10px;',
      '  background: rgba(0,255,65,0.03);',
      '  border-left: 2px solid #1a3d1a;',
      '  border-radius: 0 4px 4px 0;',
      '}',
      '.cg-history {',
      '  max-height: 180px;',
      '  overflow-y: auto;',
      '  margin-bottom: 14px;',
      '  scrollbar-width: thin;',
      '  scrollbar-color: #1a3d1a transparent;',
      '}',
      '.cg-history::-webkit-scrollbar { width: 4px; }',
      '.cg-history::-webkit-scrollbar-track { background: transparent; }',
      '.cg-history::-webkit-scrollbar-thumb { background: #1a3d1a; border-radius: 2px; }',
      '.cg-history-item {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  padding: 7px 10px;',
      '  margin-bottom: 4px;',
      '  background: rgba(0,255,65,0.02);',
      '  border: 1px solid #0f250f;',
      '  border-radius: 4px;',
      '  font-size: 13px;',
      '  animation: cg-fadeIn 0.3s ease-out;',
      '}',
      '@keyframes cg-fadeIn {',
      '  from { opacity: 0; transform: translateY(-6px); }',
      '  to { opacity: 1; transform: translateY(0); }',
      '}',
      '.cg-history-guess {',
      '  letter-spacing: 4px;',
      '  font-weight: bold;',
      '  font-size: 15px;',
      '}',
      '.cg-history-feedback {',
      '  display: flex;',
      '  gap: 4px;',
      '  font-size: 14px;',
      '}',
      '.cg-feedback-icon { width: 18px; text-align: center; }',
      '.cg-keypad {',
      '  display: grid;',
      '  grid-template-columns: repeat(3, 1fr);',
      '  gap: 8px;',
      '  margin-bottom: 12px;',
      '}',
      '.cg-key {',
      '  background: linear-gradient(180deg, #0f1f0f 0%, #0a150a 100%);',
      '  border: 1px solid #1a3d1a;',
      '  border-radius: 6px;',
      '  color: #00ff41;',
      '  font-family: "Courier New", monospace;',
      '  font-size: 20px;',
      '  font-weight: bold;',
      '  padding: 12px 0;',
      '  cursor: pointer;',
      '  transition: all 0.15s;',
      '  user-select: none;',
      '  -webkit-user-select: none;',
      '  -webkit-tap-highlight-color: transparent;',
      '  touch-action: manipulation;',
      '}',
      '.cg-key:hover {',
      '  background: linear-gradient(180deg, #152815 0%, #0f1f0f 100%);',
      '  border-color: #2d5a2d;',
      '  box-shadow: 0 0 10px rgba(0,255,65,0.15);',
      '}',
      '.cg-key:active, .cg-key.cg-active {',
      '  transform: scale(0.94);',
      '  background: #1a3d1a;',
      '  box-shadow: inset 0 0 8px rgba(0,255,65,0.2);',
      '}',
      '.cg-key:disabled {',
      '  opacity: 0.25;',
      '  cursor: not-allowed;',
      '}',
      '.cg-actions {',
      '  display: grid;',
      '  grid-template-columns: 1fr 1fr;',
      '  gap: 8px;',
      '}',
      '.cg-btn {',
      '  padding: 11px 0;',
      '  border: 1px solid #1a3d1a;',
      '  border-radius: 6px;',
      '  font-family: "Courier New", monospace;',
      '  font-size: 13px;',
      '  font-weight: bold;',
      '  letter-spacing: 1px;',
      '  cursor: pointer;',
      '  transition: all 0.15s;',
      '  user-select: none;',
      '  -webkit-user-select: none;',
      '  -webkit-tap-highlight-color: transparent;',
      '  touch-action: manipulation;',
      '}',
      '.cg-btn-submit {',
      '  background: linear-gradient(180deg, #0a2a0a 0%, #061a06 100%);',
      '  color: #00ff41;',
      '}',
      '.cg-btn-submit:hover:not(:disabled) {',
      '  background: linear-gradient(180deg, #0e3a0e 0%, #0a2a0a 100%);',
      '  box-shadow: 0 0 12px rgba(0,255,65,0.2);',
      '}',
      '.cg-btn-clear {',
      '  background: linear-gradient(180deg, #1a0a0a 0%, #120606 100%);',
      '  color: #ff4444;',
      '  border-color: #3d1a1a;',
      '}',
      '.cg-btn-clear:hover:not(:disabled) {',
      '  background: linear-gradient(180deg, #2a0e0e 0%, #1a0a0a 100%);',
      '  box-shadow: 0 0 12px rgba(255,68,68,0.15);',
      '}',
      '.cg-btn:active:not(:disabled) {',
      '  transform: scale(0.96);',
      '}',
      '.cg-btn:disabled {',
      '  opacity: 0.3;',
      '  cursor: not-allowed;',
      '}',
      '.cg-overlay {',
      '  position: absolute;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  background: rgba(5,10,5,0.92);',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  justify-content: center;',
      '  z-index: 20;',
      '  animation: cg-overlayIn 0.4s ease-out;',
      '  border-radius: 6px;',
      '}',
      '@keyframes cg-overlayIn {',
      '  from { opacity: 0; }',
      '  to { opacity: 1; }',
      '}',
      '.cg-result-icon {',
      '  font-size: 48px;',
      '  margin-bottom: 12px;',
      '}',
      '.cg-result-text {',
      '  font-size: 18px;',
      '  font-weight: bold;',
      '  letter-spacing: 2px;',
      '  margin-bottom: 8px;',
      '}',
      '.cg-result-text.win { color: #00ff41; text-shadow: 0 0 16px rgba(0,255,65,0.6); }',
      '.cg-result-text.lose { color: #ff3333; text-shadow: 0 0 16px rgba(255,51,51,0.5); }',
      '.cg-result-detail {',
      '  font-size: 13px;',
      '  color: #3d7a3d;',
      '  margin-bottom: 16px;',
      '}',
      '.cg-reveal-code {',
      '  font-size: 24px;',
      '  letter-spacing: 8px;',
      '  color: #ffaa00;',
      '  text-shadow: 0 0 10px rgba(255,170,0,0.5);',
      '  margin-bottom: 16px;',
      '}',
      '.cg-empty-state {',
      '  text-align: center;',
      '  padding: 20px;',
      '  color: #1a3d1a;',
      '  font-size: 12px;',
      '  letter-spacing: 1px;',
      '}',
      '.cg-hint-bar {',
      '  font-size: 11px;',
      '  color: #2d5a2d;',
      '  text-align: center;',
      '  padding: 6px 0;',
      '  border-top: 1px dashed #1a3d1a;',
      '  margin-top: 8px;',
      '  letter-spacing: 1px;',
      '}'
    ].join('\n');

    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildUI(container) {
    container.innerHTML = '';

    var scanline = document.createElement('div');
    scanline.className = 'cg-scanline';

    var header = document.createElement('div');
    header.className = 'cg-header';
    header.innerHTML =
      '<div class="cg-title">[ 密码破解终端 ]</div>' +
      '<div class="cg-subtitle">ZERO POINT PROTOCOL // ACCESS TERMINAL</div>';

    var status = document.createElement('div');
    status.className = 'cg-status';
    status.id = 'cg-status';
    status.innerHTML =
      '<span class="cg-attempts">' +
        '<span>剩余尝试:</span>' +
        '<span class="cg-attempt-dots" id="cg-dots"></span>' +
        '<span id="cg-remain">10</span>/10' +
      '</span>' +
      '<span id="cg-round">第 1 次尝试</span>';

    var display = document.createElement('div');
    display.className = 'cg-display';
    display.id = 'cg-display';
    display.innerHTML = '<div class="cg-input-display" id="cg-input"><span class="cg-cursor">_</span></div>';

    var message = document.createElement('div');
    message.className = 'cg-message';
    message.id = 'cg-message';
    message.textContent = '输入4位数字密码...';

    var historyEl = document.createElement('div');
    historyEl.className = 'cg-history';
    historyEl.id = 'cg-history';
    historyEl.innerHTML = '<div class="cg-empty-state">[ 暂无猜测记录 ]</div>';

    var keypad = document.createElement('div');
    keypad.className = 'cg-keypad';
    keypad.id = 'cg-keypad';
    for (var i = 1; i <= 9; i++) {
      var key = document.createElement('button');
      key.className = 'cg-key';
      key.textContent = i;
      key.dataset.value = String(i);
      keypad.appendChild(key);
    }
    var key0 = document.createElement('button');
    key0.className = 'cg-key';
    key0.textContent = '0';
    key0.dataset.value = '0';
    keypad.appendChild(key0);

    var actions = document.createElement('div');
    actions.className = 'cg-actions';
    actions.innerHTML =
      '<button class="cg-btn cg-btn-submit" id="cg-submit">[ 确认破解 ]</button>' +
      '<button class="cg-btn cg-btn-clear" id="cg-clear">[ 清除输入 ]</button>';

    var hintBar = document.createElement('div');
    hintBar.className = 'cg-hint-bar';
    hintBar.innerHTML = '✅=数字位置正确 &nbsp; ⚠️=数字存在位置错误 &nbsp; ❌=不存在';

    container.appendChild(scanline);
    container.appendChild(header);
    container.appendChild(status);
    container.appendChild(display);
    container.appendChild(message);
    container.appendChild(historyEl);
    container.appendChild(keypad);
    container.appendChild(actions);
    container.appendChild(hintBar);

    renderDots();
  }

  function renderDots() {
    var dotsEl = document.getElementById('cg-dots');
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    for (var i = 0; i < _maxAttempts; i++) {
      var dot = document.createElement('span');
      dot.className = 'cg-dot' + (i < _attempts ? ' used' : '');
      dotsEl.appendChild(dot);
    }
    var remainEl = document.getElementById('cg-remain');
    if (remainEl) remainEl.textContent = String(_maxAttempts - _attempts);
    var roundEl = document.getElementById('cg-round');
    if (roundEl) roundEl.textContent = '第 ' + (_attempts + 1) + ' 次尝试';
  }

  function updateInputDisplay() {
    var el = document.getElementById('cg-input');
    if (!el) return;
    var txt = _currentInput || '';
    el.innerHTML = txt + '<span class="cg-cursor">_</span>';
  }

  function addToHistory(guess, analysis) {
    var histEl = document.getElementById('cg-history');
    if (!histEl) return;

    var empty = histEl.querySelector('.cg-empty-state');
    if (empty) empty.remove();

    var item = document.createElement('div');
    item.className = 'cg-history-item';

    var guessSpan = document.createElement('span');
    guessSpan.className = 'cg-history-guess';
    guessSpan.textContent = guess;

    var feedbackSpan = document.createElement('span');
    feedbackSpan.className = 'cg-history-feedback';
    var fb = '';
    for (var e = 0; e < analysis.exact; e++) fb += '<span class="cg-feedback-icon">✅</span>';
    for (var p = 0; p < analysis.partial; p++) fb += '<span class="cg-feedback-icon">⚠️</span>';
    for (var w = 0; w < analysis.wrong; w++) fb += '<span class="cg-feedback-icon">❌</span>';
    feedbackSpan.innerHTML = fb;

    item.appendChild(guessSpan);
    item.appendChild(feedbackSpan);
    histEl.insertBefore(item, histEl.firstChild);

    histEl.scrollTop = 0;
  }

  function showMessage(text, isError) {
    var msgEl = document.getElementById('cg-message');
    if (!msgEl) return;
    msgEl.style.color = isError ? '#ff5555' : '#3d7a3d';
    typewrite(msgEl, text, 28);
  }

  function handleKeyInput(val) {
    if (_gameState !== 'playing') return;
    if (_currentInput.length >= 4) return;
    _currentInput += val;
    updateInputDisplay();

    var keyEls = document.querySelectorAll('.cg-key[data-value="' + val + '"]');
    for (var i = 0; i < keyEls.length; i++) {
      var k = keyEls[i];
      k.classList.add('cg-active');
      setTimeout(function(el) {
        return function() { el.classList.remove('cg-active'); };
      }(k), 120);
    }
  }

  function handleSubmit() {
    if (_gameState !== 'playing') return;
    if (_currentInput.length !== 4) {
      showMessage('>> 错误：需要输入完整的4位密码', true);
      return;
    }

    _attempts++;
    var guess = _currentInput;
    var analysis = analyzeGuess(guess, _password);
    _history.push({ guess: guess, analysis: analysis });
    addToHistory(guess, analysis);
    renderDots();

    if (analysis.exact === 4) {
      _gameState = 'won';
      showResult(true);
      return;
    }

    if (_attempts >= _maxAttempts) {
      _gameState = 'lost';
      showResult(false);
      return;
    }

    _currentInput = '';
    updateInputDisplay();

    var hints = [];
    if (analysis.exact > 0) hints.push(analysis.exact + '位完全匹配');
    if (analysis.partial > 0) hints.push(analysis.partial + '位数字存在但位置错误');
    if (analysis.wrong > 0) hints.push(analysis.wrong + '位不存在于密码中');

    showMessage('>> 分析结果：' + hints.join('，'));
  }

  function handleClear() {
    if (_gameState !== 'playing') return;
    _currentInput = '';
    updateInputDisplay();
    showMessage('>> 输入已清除，请重新输入...');
  }

  function showResult(isWin) {
    var container = _container;
    if (!container) return;

    var overlay = document.createElement('div');
    overlay.className = 'cg-overlay';

    if (isWin) {
      overlay.innerHTML =
        '<div class="cg-result-icon">🔓</div>' +
        '<div class="cg-result-text win">[ 破解成功 ]</div>' +
        '<div class="cg-result-detail">安全协议已被绕过 · 用时 ' + _attempts + ' 次</div>';
    } else {
      overlay.innerHTML =
        '<div class="cg-result-icon">🔒</div>' +
        '<div class="cg-result-text lose">[ 破解失败 ]</div>' +
        '<div class="cg-result-detail">安全协议触发 · 尝试次数已耗尽</div>' +
        '<div class="cg-reveal-code">正确密码: ' + _password + '</div>';
    }

    container.appendChild(overlay);

    if (_onComplete) {
      setTimeout(function() {
        _onComplete({ success: isWin, attempts: _attempts });
      }, 600);
    }
  }

  function bindEvents() {
    var keypad = document.getElementById('cg-keypad');
    if (keypad) {
      keypad.addEventListener('click', function(e) {
        var target = e.target.closest('.cg-key');
        if (target && target.dataset.value) {
          handleKeyInput(target.dataset.value);
        }
      });
    }

    var submitBtn = document.getElementById('cg-submit');
    if (submitBtn) submitBtn.addEventListener('click', handleSubmit);

    var clearBtn = document.getElementById('cg-clear');
    if (clearBtn) clearBtn.addEventListener('click', handleClear);

    document.addEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (_gameState !== 'playing') return;

    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleKeyInput(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      if (_currentInput.length > 0) {
        _currentInput = _currentInput.slice(0, -1);
        updateInputDisplay();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  function unbindEvents() {
    document.removeEventListener('keydown', onKeyDown);
  }

  window.CodeGame = {
    init: function(containerElement) {
      if (!(containerElement instanceof HTMLElement)) {
        throw new Error('[CodeGame] init 需要传入一个 DOM 元素作为容器');
      }
      _container = containerElement;
      createStyles();
      buildUI(_container);
      return this;
    },

    start: function(options) {
      options = options || {};
      _seed = options.seed || null;
      _maxAttempts = options.maxAttempts || 10;
      _onComplete = options.onComplete || null;

      _password = generatePassword(_seed);
      _attempts = 0;
      _history = [];
      _currentInput = '';
      _gameState = 'playing';

      buildUI(_container);
      bindEvents();

      var msgEl = document.getElementById('cg-message');
      if (msgEl) {
        setTimeout(function() {
          typewrite(msgEl, '>> 系统已初始化 · 请输入4位数字密码进行破解...', 22);
        }, 300);
      }

      return this;
    },

    getResult: function() {
      return {
        success: _gameState === 'won',
        attempts: _attempts
      };
    },

    destroy: function() {
      if (_typewriterTimer) {
        clearTimeout(_typewriterTimer);
        _typewriterTimer = null;
      }
      unbindEvents();
      if (_container) {
        _container.innerHTML = '';
        _container = null;
      }
      _gameState = 'idle';
      return this;
    }
  };

})();
