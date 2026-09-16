/* Điều hướng, dựng màn hình và nối các thao tác lại với nhau. */

(function () {
  'use strict';

  var esc = LC.text.escapeHtml;

  var DATA = window.VOCAB || { cards: [], topics: [], generatedAt: '' };
  var CARDS = DATA.cards || [];
  var TOPICS = DATA.topics || [];
  var TOPIC_ZH = {
    'dia-danh': '地名',
    'tu-vung': '词汇',
    'danh-thang-tq': '名胜',
    'cum-tu': '短语'
  };

  var state = {
    view: 'home',
    prefs: { topics: [], direction: 'vi2zh', mode: 'flash', size: 20, only: null },
    session: null,
    item: null,
    question: null,
    revealed: false,
    answered: null,
    browseTopics: [],
    voice: null
  };

  function $(id) { return document.getElementById(id); }
  function on(el, type, fn) { if (el) el.addEventListener(type, fn); }

  function topicName(id) {
    var found = TOPICS.filter(function (t) { return t.id === id; })[0];
    return found ? found.name : id;
  }

  function toast(message) {
    var el = $('toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(el._timer);
    el._timer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  /* ───────────────────────────────────────────────────────── điều hướng ── */

  var VIEWS = ['home', 'setup', 'study', 'result', 'browse', 'stats'];

  function show(view) {
    state.view = view;
    VIEWS.forEach(function (name) {
      $('view-' + name).hidden = (name !== view);
    });
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      var active = link.getAttribute('data-nav') === view ||
        (view === 'setup' && link.getAttribute('data-nav') === 'home');
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
  }

  function route() {
    var hash = window.location.hash.replace(/^#\/?/, '');
    if (hash === 'browse') { renderBrowse(); show('browse'); return; }
    if (hash === 'stats') { renderStats(); show('stats'); return; }
    if (hash === 'setup') { renderSetup(); show('setup'); return; }
    if (hash === 'study' && state.session) { show('study'); return; }
    renderHome();
    show('home');
  }

  function go(hash) {
    if (window.location.hash === hash) route();
    else window.location.hash = hash;
  }

  /* ─────────────────────────────────────────────────────────── trang chủ ── */

  function countBy(filter) {
    var now = Date.now();
    return CARDS.filter(function (card) {
      return filter(LC.store.get(card.id), card, now);
    }).length;
  }

  function renderHome() {
    $('home-total').textContent = CARDS.length;
    $('foot-count').textContent = CARDS.length;
    $('foot-date').textContent = DATA.generatedAt || '—';

    var due = countBy(function (p, c, now) { return LC.srs.isDue(p, now); });
    $('due-count').textContent = due;
    $('due-hint').textContent = due
      ? 'Ôn đúng hạn thì mỗi thẻ chỉ tốn vài giây.'
      : 'Chưa thẻ nào tới hạn — chọn một chủ đề bên dưới để học thẻ mới.';
    $('btn-review').disabled = false;
    $('btn-review').textContent = due ? 'Ôn ngay' : 'Học thẻ mới';

    $('starred-count').textContent = countBy(function (p) { return p && p.starred; });
    $('hard-count').textContent = countBy(function (p) { return p && p.wrong >= 2; });
    $('new-count').textContent = countBy(function (p) { return LC.srs.isNew(p); });

    document.querySelectorAll('[data-quick]').forEach(function (btn) {
      var kind = btn.getAttribute('data-quick');
      var n = parseInt(btn.querySelector('.quick__meta span').textContent, 10);
      btn.disabled = !n;
      btn.title = n ? '' : 'Chưa có thẻ nào trong nhóm này';
      void kind;
    });

    var grid = $('topic-grid');
    grid.innerHTML = TOPICS.map(function (topic) {
      var cards = CARDS.filter(function (c) { return c.topics.indexOf(topic.id) !== -1; });
      var learned = cards.filter(function (c) { return LC.srs.isLearned(LC.store.get(c.id)); }).length;
      var pct = cards.length ? Math.round(learned / cards.length * 100) : 0;
      return '<button class="topic" type="button" data-topic="' + esc(topic.id) + '">' +
        '<span class="topic__zh">' + esc(TOPIC_ZH[topic.id] || '') + '</span>' +
        '<span class="topic__name">' + esc(topic.name) + '</span>' +
        '<span class="topic__meta">' + learned + '/' + cards.length + ' thuộc · ' + pct + '%</span>' +
        '<span class="meter"><span class="meter__fill" style="width:' + pct + '%"></span></span>' +
        '</button>';
    }).join('');

    grid.querySelectorAll('[data-topic]').forEach(function (btn) {
      on(btn, 'click', function () {
        state.prefs.topics = [btn.getAttribute('data-topic')];
        state.prefs.only = null;
        go('#/setup');
      });
    });
  }

  /* ──────────────────────────────────────────────────────── cấu hình phiên ── */

  var MODE_NOTES = {
    flash: 'Tự chấm sau khi lật — nhanh nhất để quét lại nhiều thẻ.',
    choice: 'Bốn lựa chọn lấy từ cùng chủ đề, không đoán được bằng loại trừ.',
    type: 'Gõ vào ô trên trang. Chấm bỏ qua hoa thường và dấu thanh; đáp án chữ Hán nhận cả pinyin.'
  };

  function renderSetup() {
    var box = $('setup-topics');
    box.innerHTML = TOPICS.map(function (topic) {
      var active = state.prefs.topics.indexOf(topic.id) !== -1;
      return '<button class="chip" type="button" aria-pressed="' + active + '" ' +
        'data-topic="' + esc(topic.id) + '">' + esc(topic.name) +
        ' <span class="chip__n">' + topic.count + '</span></button>';
    }).join('');

    box.querySelectorAll('[data-topic]').forEach(function (chip) {
      on(chip, 'click', function () {
        var id = chip.getAttribute('data-topic');
        var at = state.prefs.topics.indexOf(id);
        if (at === -1) state.prefs.topics.push(id);
        else state.prefs.topics.splice(at, 1);
        chip.setAttribute('aria-pressed', at === -1);
        updateSummary();
      });
    });

    syncSegmented('setup-direction', state.prefs.direction);
    syncSegmented('setup-mode', state.prefs.mode);
    syncSegmented('setup-size', String(state.prefs.size));
    $('mode-note').textContent = MODE_NOTES[state.prefs.mode];
    updateSummary();
  }

  function syncSegmented(id, value) {
    $(id).querySelectorAll('button').forEach(function (btn) {
      btn.setAttribute('aria-checked', btn.getAttribute('data-value') === value);
    });
  }

  function bindSegmented(id, key, parse) {
    on($(id), 'click', function (event) {
      var btn = event.target.closest('button[data-value]');
      if (!btn) return;
      var value = btn.getAttribute('data-value');
      state.prefs[key] = parse ? parse(value) : value;
      syncSegmented(id, value);
      if (key === 'mode') $('mode-note').textContent = MODE_NOTES[value];
      updateSummary();
    });
  }

  function updateSummary() {
    var available = LC.session.create(CARDS, Object.assign({}, state.prefs, { size: 0 })).total;
    var picked = state.prefs.size > 0 ? Math.min(state.prefs.size, available) : available;
    var scope = state.prefs.topics.length
      ? state.prefs.topics.map(topicName).join(', ')
      : 'tất cả chủ đề';
    $('setup-summary').textContent = available
      ? picked + ' thẻ từ ' + scope + '.'
      : 'Không còn thẻ nào khớp — bỏ bớt bộ lọc.';
    $('btn-start').disabled = !available;
  }

  /* ──────────────────────────────────────────────────────── màn hình học ── */

  function startSession(extra) {
    var prefs = Object.assign({}, state.prefs, extra || {});
    state.prefs = prefs;
    LC.store.prefs({ direction: prefs.direction, mode: prefs.mode, size: prefs.size });
    var session = LC.session.create(CARDS, prefs);
    if (!session.total) { toast('Không có thẻ nào khớp lựa chọn.'); return; }
    state.session = session;
    go('#/study');
    showCurrent();
  }

  function showCurrent() {
    var session = state.session;
    if (!session || session.index >= session.queue.length) { finish(); return; }

    var item = session.queue[session.index];
    var q = LC.session.question(item.card, item.direction);
    state.item = item;
    state.question = q;
    state.revealed = false;
    state.answered = null;

    $('study-pos').textContent = session.index + 1;
    $('study-total').textContent = session.queue.length;
    var pct = Math.round(session.index / session.queue.length * 100);
    $('progress-fill').style.width = pct + '%';
    $('progress').setAttribute('aria-valuenow', pct);

    $('card-topic').textContent = topicName(item.card.topics[0]);
    var progress = LC.store.get(item.card.id);
    $('btn-star').setAttribute('aria-pressed', !!(progress && progress.starred));

    $('prompt-label').textContent = q.promptLabel;
    var prompt = $('prompt');
    prompt.textContent = q.prompt;
    prompt.className = 'card__prompt' +
      (q.promptKind === 'zh' ? ' is-zh' : q.promptKind === 'pinyin' ? ' is-pinyin' : '');

    var context = $('prompt-context');
    if (item.card.context && q.promptKind !== 'zh') {
      context.textContent = '(' + item.card.context + ')';
      context.hidden = false;
    } else {
      context.hidden = true;
    }

    $('card-back').hidden = true;
    $('verdict').hidden = true;
    $('grade').hidden = true;
    $('btn-next').hidden = true;
    $('answer-type').hidden = true;
    $('answer-choice').hidden = true;
    $('btn-flip').hidden = true;

    if (state.prefs.mode === 'type') {
      $('answer-type').hidden = false;
      var input = $('type-input');
      input.value = '';
      input.placeholder = q.hint;
      input.disabled = false;
      $('type-submit').disabled = false;
      setTimeout(function () { input.focus(); }, 40);
    } else if (state.prefs.mode === 'choice') {
      renderChoices(item, q);
      $('answer-choice').hidden = false;
    } else {
      $('btn-flip').hidden = false;
    }
  }

  function renderChoices(item, q) {
    var options = LC.text.shuffle(
      LC.session.distractors(item.card, item.direction, CARDS).concat([q.answer])
    );
    var box = $('answer-choice');
    box.innerHTML = options.map(function (value) {
      return '<button class="choice' + (q.answerKind === 'zh' ? ' is-zh' : '') +
        '" type="button" data-value="' + esc(value) + '">' + esc(value) + '</button>';
    }).join('');

    box.querySelectorAll('.choice').forEach(function (btn) {
      on(btn, 'click', function () {
        var correct = LC.text.tidy(btn.getAttribute('data-value')) === LC.text.tidy(q.answer);
        box.querySelectorAll('.choice').forEach(function (other) {
          other.disabled = true;
          var isAnswer = LC.text.tidy(other.getAttribute('data-value')) === LC.text.tidy(q.answer);
          if (isAnswer) other.classList.add('choice--right');
          else if (other === btn) other.classList.add('choice--wrong');
        });
        judge(correct);
      });
    });
  }

  /** Chấm tự động cho trắc nghiệm và gõ đáp án. */
  function judge(correct) {
    state.answered = correct;
    reveal();
    var verdict = $('verdict');
    verdict.hidden = false;
    verdict.className = 'verdict ' + (correct ? 'verdict--right' : 'verdict--wrong');
    verdict.textContent = correct ? 'Chính xác' : 'Chưa đúng — xem lại thẻ này';
    grade(correct ? 2 : 0, true);
  }

  function reveal() {
    var card = state.item.card;
    state.revealed = true;

    $('rev-zh').textContent = card.zh;
    var py = $('rev-py');
    py.textContent = card.pinyin;
    if (card.pinyinAuto) py.setAttribute('data-auto', '1');
    else py.removeAttribute('data-auto');
    $('rev-vi').textContent = card.vi + (card.context ? ' (' + card.context + ')' : '');

    var alt = $('rev-alt');
    var variants = card.altZh.concat(card.altVi);
    if (variants.length) {
      alt.textContent = 'Cách nói khác: ' + variants.join(' · ');
      alt.hidden = false;
    } else {
      alt.hidden = true;
    }

    var note = $('rev-note');
    if (card.note) { note.textContent = card.note; note.hidden = false; }
    else note.hidden = true;

    $('card-back').hidden = false;
    $('btn-flip').hidden = true;
    $('btn-speak').hidden = !state.voice;

    if (state.prefs.mode === 'flash') {
      var progress = LC.store.get(card.id);
      $('g-hard').textContent = LC.srs.label(LC.srs.preview(progress, 1));
      $('g-good').textContent = LC.srs.label(LC.srs.preview(progress, 2));
      $('g-easy').textContent = LC.srs.label(LC.srs.preview(progress, 3));
      $('grade').hidden = false;
    }
  }

  function grade(value, auto) {
    var session = state.session;
    var item = state.item;
    var card = item.card;

    var progress = LC.store.get(card.id) || LC.srs.blank();
    var starred = progress.starred;
    var next = LC.srs.apply(progress, value);
    next.starred = starred;
    LC.store.set(card.id, next);
    LC.store.markStudied();

    if (!item.repeat) {
      if (value === 0) {
        session.wrong += 1;
        session.missed.push(card);
      } else {
        session.right += 1;
      }
    }
    if (value === 0) LC.session.requeue(session, item);

    if (auto) {
      $('grade').hidden = true;
      $('btn-next').hidden = false;
      setTimeout(function () { $('btn-next').focus(); }, 40);
    } else {
      advance();
    }
  }

  function advance() {
    state.session.index += 1;
    showCurrent();
  }

  function finish() {
    var session = state.session;
    var minutes = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000));
    $('res-right').textContent = session.right;
    $('res-wrong').textContent = session.wrong;
    $('res-time').textContent = minutes + '′';

    var total = session.right + session.wrong;
    var pct = total ? Math.round(session.right / total * 100) : 0;
    $('result-line').textContent = total
      ? 'Bạn nhớ được ' + pct + '% số thẻ trong phiên này.'
      : 'Phiên này chưa chấm thẻ nào.';

    var missedBlock = $('result-missed-block');
    if (session.missed.length) {
      $('result-missed').innerHTML = session.missed.map(function (card) {
        return '<li><span class="list__zh">' + esc(card.zh) + '</span>' +
          '<span class="list__vi">' + esc(card.vi) + '</span>' +
          '<span class="list__py">' + esc(card.pinyin) + '</span></li>';
      }).join('');
      missedBlock.hidden = false;
    } else {
      missedBlock.hidden = true;
    }

    state.session = null;
    show('result');
  }

  /* ───────────────────────────────────────────────────────────── tra cứu ── */

  function renderBrowse() {
    var box = $('browse-topics');
    if (!box.dataset.ready) {
      box.innerHTML = TOPICS.map(function (topic) {
        return '<button class="chip" type="button" aria-pressed="false" ' +
          'data-topic="' + esc(topic.id) + '">' + esc(topic.name) +
          ' <span class="chip__n">' + topic.count + '</span></button>';
      }).join('');
      box.querySelectorAll('[data-topic]').forEach(function (chip) {
        on(chip, 'click', function () {
          var id = chip.getAttribute('data-topic');
          var at = state.browseTopics.indexOf(id);
          if (at === -1) state.browseTopics.push(id);
          else state.browseTopics.splice(at, 1);
          chip.setAttribute('aria-pressed', at === -1);
          renderBrowseList();
        });
      });
      box.dataset.ready = '1';
    }
    renderBrowseList();
  }

  function renderBrowseList() {
    var query = LC.text.fold($('search-input').value);
    var rows = CARDS.filter(function (card) {
      if (state.browseTopics.length &&
        !card.topics.some(function (t) { return state.browseTopics.indexOf(t) !== -1; })) {
        return false;
      }
      if (!query) return true;
      var haystack = LC.text.fold(card.vi + card.pinyin + card.altVi.join('') +
        card.altPinyin.join('')) + LC.text.tidy(card.zh + card.altZh.join(''));
      return haystack.indexOf(query) !== -1 ||
        LC.text.tidy(card.zh).indexOf(LC.text.tidy($('search-input').value)) !== -1;
    });

    $('browse-count').textContent = rows.length + ' / ' + CARDS.length + ' thẻ';
    var list = $('browse-list');
    if (!rows.length) {
      list.innerHTML = '<li class="empty">Không tìm thấy thẻ nào khớp.</li>';
      return;
    }
    list.innerHTML = rows.map(function (card) {
      return '<li>' +
        '<span class="list__zh">' + esc(card.zh) + '</span>' +
        '<span class="list__vi">' + esc(card.vi) + '</span>' +
        '<span class="list__py">' + esc(card.pinyin) + '</span>' +
        (card.context ? '<span class="list__ctx">' + esc(card.context) + '</span>' : '') +
        '</li>';
    }).join('');
  }

  /* ───────────────────────────────────────────────────────────── tiến độ ── */

  function renderStats() {
    var learned = 0, learning = 0, fresh = 0;
    CARDS.forEach(function (card) {
      var p = LC.store.get(card.id);
      if (LC.srs.isLearned(p)) learned++;
      else if (LC.srs.isNew(p)) fresh++;
      else learning++;
    });
    $('st-learned').textContent = learned;
    $('st-learning').textContent = learning;
    $('st-new').textContent = fresh;
    $('st-streak').textContent = LC.store.streak();

    $('stat-bars').innerHTML = TOPICS.map(function (topic) {
      var cards = CARDS.filter(function (c) { return c.topics.indexOf(topic.id) !== -1; });
      var done = 0, doing = 0;
      cards.forEach(function (c) {
        var p = LC.store.get(c.id);
        if (LC.srs.isLearned(p)) done++;
        else if (!LC.srs.isNew(p)) doing++;
      });
      var n = cards.length || 1;
      return '<div class="bar">' +
        '<div class="bar__head"><span>' + esc(topic.name) + '</span>' +
        '<span class="bar__num">' + done + '/' + cards.length + '</span></div>' +
        '<div class="bar__track">' +
        '<span class="bar__seg bar__seg--learned" style="width:' + (done / n * 100) + '%"></span>' +
        '<span class="bar__seg bar__seg--learning" style="width:' + (doing / n * 100) + '%"></span>' +
        '</div></div>';
    }).join('') +
      '<p class="bar__legend">' +
      '<span><span class="dot dot--learned"></span>Đã thuộc</span>' +
      '<span><span class="dot dot--learning"></span>Đang học</span>' +
      '<span><span class="dot dot--new"></span>Chưa học</span></p>';

    $('data-msg').textContent = LC.store.isAvailable()
      ? '' : 'Trình duyệt đang chặn bộ nhớ cục bộ — tiến độ sẽ mất khi đóng trang.';
  }

  /* ────────────────────────────────────────────────────────── phát âm ── */

  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    var voices = window.speechSynthesis.getVoices();
    state.voice = voices.filter(function (v) { return /^zh/i.test(v.lang); })[0] || null;
  }

  function speak(text) {
    if (!state.voice) return;
    try {
      window.speechSynthesis.cancel();
      var utter = new SpeechSynthesisUtterance(text);
      utter.voice = state.voice;
      utter.lang = state.voice.lang;
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    } catch (err) {
      toast('Trình duyệt không phát âm được thẻ này.');
    }
  }

  /* ─────────────────────────────────────────────────────────── giao diện ── */

  function initTheme() {
    var saved = null;
    try { saved = window.localStorage.getItem('lc.theme'); } catch (err) { /* bỏ qua */ }
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    }
    on($('theme-toggle'), 'click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      if (!current) {
        current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { window.localStorage.setItem('lc.theme', next); } catch (err) { /* bỏ qua */ }
    });
  }

  function bindKeys() {
    document.addEventListener('keydown', function (event) {
      if (state.view !== 'study') return;
      var tag = (event.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (!state.revealed && state.prefs.mode === 'flash') reveal();
        else if (!$('btn-next').hidden) advance();
        return;
      }
      if (state.revealed && state.prefs.mode === 'flash' && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        grade(parseInt(event.key, 10) - 1, false);
      }
    });
  }

  function bind() {
    on($('btn-review'), 'click', function () {
      var due = countBy(function (p, c, now) { return LC.srs.isDue(p, now); });
      startSession({ topics: [], only: due ? 'due' : 'new', size: 20 });
    });
    on($('btn-custom'), 'click', function () { state.prefs.only = null; go('#/setup'); });

    document.querySelectorAll('[data-quick]').forEach(function (btn) {
      on(btn, 'click', function () {
        startSession({ topics: [], only: btn.getAttribute('data-quick'), size: 20 });
      });
    });

    bindSegmented('setup-direction', 'direction');
    bindSegmented('setup-mode', 'mode');
    bindSegmented('setup-size', 'size', function (v) { return parseInt(v, 10); });
    on($('btn-start'), 'click', function () { startSession({ only: null }); });

    on($('btn-flip'), 'click', reveal);
    on($('btn-next'), 'click', advance);
    on($('btn-quit'), 'click', function () {
      if (state.session && state.session.right + state.session.wrong > 0) finish();
      else { state.session = null; go('#/'); }
    });

    on($('grade'), 'click', function (event) {
      var btn = event.target.closest('[data-grade]');
      if (btn) grade(parseInt(btn.getAttribute('data-grade'), 10), false);
    });

    on($('answer-type'), 'submit', function (event) {
      event.preventDefault();
      if (state.revealed) return;
      var input = $('type-input');
      judge(LC.text.matches(input.value, state.question.accepted));
      input.disabled = true;
      $('type-submit').disabled = true;
    });

    on($('btn-star'), 'click', function () {
      var starred = LC.store.toggleStar(state.item.card.id);
      $('btn-star').setAttribute('aria-pressed', starred);
      toast(starred ? 'Đã đánh dấu thẻ này.' : 'Đã bỏ đánh dấu.');
    });

    on($('btn-speak'), 'click', function () { speak(state.item.card.zh); });

    on($('btn-again'), 'click', function () { startSession({}); });
    on($('btn-home'), 'click', function () { go('#/'); });

    on($('search-input'), 'input', renderBrowseList);

    on($('btn-export'), 'click', function () {
      var blob = new Blob([LC.store.exportJson()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'bien-du-lich-tien-do.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      $('data-msg').textContent = 'Đã tải file sao lưu.';
    });

    on($('btn-import'), 'click', function () { $('import-file').click(); });
    on($('import-file'), 'change', function (event) {
      var file = event.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          LC.store.importJson(String(reader.result));
          renderStats();
          $('data-msg').textContent = 'Đã nạp tiến độ từ file sao lưu.';
        } catch (err) {
          $('data-msg').textContent = 'Không đọc được file: ' + err.message;
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    });

    on($('btn-reset'), 'click', function () {
      if (!window.confirm('Xoá toàn bộ tiến độ trên máy này? Thao tác này không hoàn tác được.')) return;
      LC.store.reset();
      renderStats();
      $('data-msg').textContent = 'Đã xoá tiến độ.';
    });

    window.addEventListener('hashchange', route);
  }

  /* ──────────────────────────────────────────────────────────────── khởi động ── */

  function boot() {
    if (!CARDS.length) {
      $('home-total').textContent = '0';
      toast('Không nạp được dữ liệu từ vựng.');
      return;
    }
    LC.store.load();

    var saved = LC.store.prefs();
    if (saved) {
      state.prefs.direction = saved.direction || state.prefs.direction;
      state.prefs.mode = saved.mode || state.prefs.mode;
      state.prefs.size = typeof saved.size === 'number' ? saved.size : state.prefs.size;
    }

    initTheme();
    bind();
    bindKeys();

    pickVoice();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = pickVoice;
    }

    route();

    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () { /* offline là tuỳ chọn */ });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
