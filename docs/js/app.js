/* Điều hướng, dựng màn hình và nối các thao tác lại với nhau. */

(function () {
  'use strict';

  var esc = LC.text.escapeHtml;

  var DATA = window.VOCAB || { subjects: [], generatedAt: '' };
  var SUBJECTS = DATA.subjects || [];

  var SUBJECT_ACCENT = {
    'bien-du-lich': 'cinnabar', 'phien-dich': 'jade', 'lich-su': 'ochre'
  };

  var TOPIC_ZH = {
    'dia-danh': '地名',
    'tu-vung': '词汇',
    'danh-thang-tq': '名胜',
    'cum-tu': '短语',
    'pd-to-chuc': '机构',
    'pd-khai-niem': '原则',
    'pd-xung-dot': '争端',
    'pd-thue-quan': '关税',
    'pd-phong-ve': '防卫',
    'pd-dam-phan': '谈判',
    'pd-wto': '世贸',
    'pd-trong-tai': '仲裁',
    'pd-hang-hoa': '货物',
    'pd-ngoai-giao': '外交',
    'pd-khac': '其他',
    'ls-nguyen-thuy': '原始',
    'ls-ha-thuong-chu': '夏商周',
    'ls-xuan-thu-chien-quoc': '春秋',
    'ls-tan-han': '秦汉',
    'ls-tam-quoc': '三国',
    'ls-tuy-duong': '隋唐',
    'ls-tong-nguyen': '宋元',
    'ls-minh-thanh': '明清'
  };

  var state = {
    view: 'home',
    subject: SUBJECTS.length ? SUBJECTS[0].id : '',
    prefs: {
      subject: SUBJECTS.length ? SUBJECTS[0].id : '',
      topics: [], direction: 'vi2zh', mode: 'flash', size: 20, only: null
    },
    session: null,
    item: null,
    question: null,
    revealed: false,
    answered: null,
    browseSubject: SUBJECTS.length ? SUBJECTS[0].id : '',
    browseTopics: [],
    voice: null
  };

  function $(id) { return document.getElementById(id); }
  function on(el, type, fn) { if (el) el.addEventListener(type, fn); }

  /* ──────────────────────────────────────────────────── môn và chủ đề ── */

  /** 'all' nghĩa là trộn cả hai môn trong một phiên. */
  function subjectsFor(id) {
    if (id === 'all') return SUBJECTS;
    return SUBJECTS.filter(function (s) { return s.id === id; });
  }

  function subjectById(id) {
    return subjectsFor(id)[0] || SUBJECTS[0] || { name: '', zh: '', topics: [], cards: [] };
  }

  /** Thẻ của môn đang chọn — mọi màn hình đều đi qua đây. */
  function cardsOf(id) {
    var out = [];
    subjectsFor(id).forEach(function (s) { out = out.concat(s.cards); });
    return out;
  }

  function topicsOf(id) {
    var out = [];
    subjectsFor(id).forEach(function (s) { out = out.concat(s.topics); });
    return out;
  }

  function CARDS() { return cardsOf(state.subject); }
  function TOPICS() { return topicsOf(state.subject); }

  function topicName(id) {
    var all = topicsOf('all');
    var found = all.filter(function (t) { return t.id === id; })[0];
    return found ? found.name : id;
  }

  // Tra môn của một thẻ bằng bảng dựng một lần, tránh quét lại mảng thẻ.
  var SUBJECT_OF_CARD = {};
  SUBJECTS.forEach(function (subject) {
    subject.cards.forEach(function (card) { SUBJECT_OF_CARD[card.id] = subject; });
  });

  function subjectOfCard(card) {
    return SUBJECT_OF_CARD[card.id] || null;
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
    // Màn hình học cần thanh trên thu gọn, CSS đọc class này.
    document.body.classList.toggle('is-studying', view === 'study');
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

  function countIn(cards, filter) {
    var now = Date.now();
    return cards.filter(function (card) {
      return filter(LC.store.get(card.id), card, now);
    }).length;
  }

  function countBy(filter) {
    return countIn(CARDS(), filter);
  }

  function dueIn(cards) {
    return countIn(cards, function (p, c, now) { return LC.srs.isDue(p, now); });
  }

  /** Đổi môn: chủ đề đã chọn của môn cũ không còn nghĩa nên xoá đi. */
  function setSubject(id) {
    if (state.subject === id) return;
    state.subject = id;
    state.prefs.subject = id;
    state.prefs.topics = [];
    try { window.localStorage.setItem('lc.subject', id); } catch (err) { /* bỏ qua */ }
    syncSwitcher();
  }

  /** Bộ đổi môn trên thanh trên — dùng được ở mọi màn hình. */
  function renderSwitcher() {
    var select = $('subject-switch');
    select.innerHTML = SUBJECTS.map(function (subject) {
      var due = dueIn(subject.cards);
      return '<option value="' + esc(subject.id) + '">' +
        esc(subject.zh) + ' · ' + esc(subject.short || subject.name) +
        (due ? ' (' + due + ')' : '') + '</option>';
    }).join('');
    select.value = state.subject;
    if (select.dataset.ready) return;        // chỉ gắn sự kiện một lần
    select.dataset.ready = '1';

    on(select, 'change', function () {
      var id = select.value;
      var from = state.view;
      // Đang học dở thì thoát phiên. Mỗi thẻ đã chấm được lưu ngay lúc chấm
      // nên không mất gì, chỉ là dừng phiên lại.
      var quit = !!state.session;
      state.session = null;
      setSubject(id);

      if (from === 'browse') {
        // Đang tra cứu thì ở lại đó, chỉ đổi môn đang xem.
        state.browseSubject = id;
        state.browseTopics = [];
        renderBrowse();
      } else if (from === 'stats') {
        renderStats();            // trang này vốn hiện cả hai môn
      } else {
        go('#/');
        route();
      }
      if (quit) toast('Đã chuyển môn. Tiến độ các thẻ vừa học đã lưu.');
    });
  }

  function syncSwitcher() {
    var select = $('subject-switch');
    if (select && select.value !== state.subject) select.value = state.subject;
  }

  function renderSubjectTabs(container, selected, onPick) {
    container.innerHTML = SUBJECTS.map(function (subject) {
      var due = dueIn(subject.cards);
      return '<button class="subject" type="button" role="tab"' +
        ' aria-selected="' + (subject.id === selected) + '"' +
        ' data-accent="' + esc(SUBJECT_ACCENT[subject.id] || 'cinnabar') + '"' +
        ' data-subject="' + esc(subject.id) + '">' +
        '<span class="subject__seal" aria-hidden="true">' + esc(subject.zh) + '</span>' +
        '<span class="subject__text">' +
        '<span class="subject__name">' + esc(subject.name) + '</span>' +
        '<span class="subject__meta">' + subject.cards.length + ' thẻ' +
        (due ? ' · ' + due + ' đến hạn' : '') + '</span>' +
        '</span></button>';
    }).join('');

    container.querySelectorAll('[data-subject]').forEach(function (btn) {
      on(btn, 'click', function () { onPick(btn.getAttribute('data-subject')); });
    });
  }

  function renderHome() {
    var subject = subjectById(state.subject);
    var cards = CARDS();

    $('home-total').textContent = cards.length;
    $('home-source').textContent = subject.name;
    $('hero-zh').textContent = subject.zh;
    $('home-watermark').textContent = subject.zh;
    $('foot-count').textContent = cardsOf('all').length;
    $('foot-sources').textContent = SUBJECTS.map(function (s) {
      return s.name;
    }).join(' · ');
    $('foot-date').textContent = DATA.generatedAt || '—';

    renderSwitcher();     // số thẻ đến hạn trong bộ chọn cũng cập nhật theo
    renderSubjectTabs($('subject-tabs'), state.subject, function (id) {
      setSubject(id);
      renderHome();
    });

    // Nhắc môn còn lại để không bỏ quên khi đang tập trung một môn.
    var others = SUBJECTS.filter(function (s) { return s.id !== state.subject; });
    var note = $('other-note');
    var pending = others.filter(function (s) { return dueIn(s.cards) > 0; });
    if (pending.length) {
      note.innerHTML = pending.map(function (s) {
        return 'Môn ' + esc(s.name) + ' còn <strong>' + dueIn(s.cards) +
          '</strong> thẻ đến hạn — <button type="button" data-goto="' +
          esc(s.id) + '">chuyển sang môn đó</button>';
      }).join('<br>');
      note.hidden = false;
      note.querySelectorAll('[data-goto]').forEach(function (btn) {
        on(btn, 'click', function () {
          setSubject(btn.getAttribute('data-goto'));
          renderHome();
        });
      });
    } else {
      note.hidden = true;
    }

    var due = countBy(function (p, c, now) { return LC.srs.isDue(p, now); });
    $('due-count').textContent = due;
    // Số 0 to đùng không nói lên điều gì; khi rảnh thì mời học thẻ mới luôn.
    $('today-card').classList.toggle('today--clear', due === 0);
    $('today-label').textContent = due
      ? 'Đến hạn ôn hôm nay'
      : 'Hôm nay không có thẻ nào đến hạn';
    $('due-hint').textContent = due
      ? 'Ôn đúng hạn thì mỗi thẻ chỉ tốn vài giây.'
      : 'Học thẻ mới để lấp dần ' + CARDS().length + ' thẻ của môn này.';
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
    grid.innerHTML = TOPICS().map(function (topic) {
      var inTopic = cards.filter(function (c) { return c.topics.indexOf(topic.id) !== -1; });
      var learned = inTopic.filter(function (c) { return LC.srs.isLearned(LC.store.get(c.id)); }).length;
      var pct = inTopic.length ? Math.round(learned / inTopic.length * 100) : 0;
      return '<button class="topic" type="button" data-topic="' + esc(topic.id) + '">' +
        '<span class="topic__zh">' + esc(TOPIC_ZH[topic.id] || '') + '</span>' +
        '<span class="topic__name">' + esc(topic.name) + '</span>' +
        '<span class="topic__meta">' + learned + '/' + inTopic.length + ' thuộc · ' + pct + '%</span>' +
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
    choice: 'Bốn lựa chọn lấy từ cùng môn và cùng chủ đề, không đoán được bằng loại trừ.',
    type: 'Gõ vào ô trên trang. Chấm bỏ qua hoa thường và dấu thanh; đáp án chữ Hán nhận cả pinyin.'
  };

  function renderSetup() {
    // Bộ chọn môn: hai môn cộng lựa chọn trộn cả hai.
    var picker = $('setup-subject');
    picker.innerHTML = SUBJECTS.map(function (subject) {
      return '<button type="button" role="radio" data-value="' + esc(subject.id) + '"' +
        ' aria-checked="' + (state.prefs.subject === subject.id) + '">' +
        esc(subject.name) + '</button>';
    }).join('') +
      (SUBJECTS.length > 1
        ? '<button type="button" role="radio" data-value="all" aria-checked="' +
          (state.prefs.subject === 'all') + '">Trộn cả hai</button>'
        : '');

    if (!picker.dataset.ready) {
      on(picker, 'click', function (event) {
        var btn = event.target.closest('button[data-value]');
        if (!btn) return;
        var id = btn.getAttribute('data-value');
        state.prefs.subject = id;
        if (id !== 'all') state.subject = id;
        state.prefs.topics = [];
        renderSetup();
      });
      picker.dataset.ready = '1';
    }
    syncSegmented('setup-subject', state.prefs.subject);

    var box = $('setup-topics');
    box.innerHTML = topicsOf(state.prefs.subject).map(function (topic) {
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

    // Thẻ hỏi đáp chỉ có một chiều (câu hỏi -> đáp án) nên bộ chọn chiều
    // không có nghĩa gì; ẩn đi thay vì bày ra rồi không dùng được.
    var qaOnly = subjectsFor(state.prefs.subject).every(function (sub) {
      return sub.kind === 'qa';
    });
    $('setup-direction').closest('.field').hidden = qaOnly;

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
    var pool = cardsOf(state.prefs.subject);
    var available = LC.session.create(
      pool, Object.assign({}, state.prefs, { size: 0 })).total;
    var picked = state.prefs.size > 0 ? Math.min(state.prefs.size, available) : available;
    var scope = state.prefs.topics.length
      ? state.prefs.topics.map(topicName).join(', ')
      : (state.prefs.subject === 'all' ? 'cả hai môn' : 'tất cả chủ đề');
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
    var session = LC.session.create(cardsOf(prefs.subject || state.subject), prefs);
    if (!session.total) { toast('Không có thẻ nào khớp lựa chọn.'); return; }
    state.session = session;
    // Hiện màn hình học ngay, không chờ hashchange (event đó bắn không đồng bộ
    // nên nếu dựa vào nó thì thẻ đầu tiên có thể dựng xong trước khi màn hiện).
    go('#/study');
    show('study');
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
    var groupTag = $('card-group');
    if (item.card.group) {
      groupTag.textContent = item.card.group;
      groupTag.hidden = false;
    } else {
      groupTag.hidden = true;
    }
    var progress = LC.store.get(item.card.id);
    $('btn-star').setAttribute('aria-pressed', !!(progress && progress.starred));

    $('prompt-label').textContent = q.promptLabel;
    var prompt = $('prompt');
    prompt.textContent = q.prompt;
    prompt.className = 'card__prompt' +
      (q.promptKind === 'zh' ? ' is-zh' :
       q.promptKind === 'pinyin' ? ' is-pinyin' :
       q.promptKind === 'qa' ? ' is-question' : '');

    var context = $('prompt-context');
    if (item.card.context && q.promptKind !== 'zh') {
      context.textContent = '(' + item.card.context + ')';
      context.hidden = false;
    } else {
      context.hidden = true;
    }

    $('card-back').hidden = true;
    $('gloss').hidden = true;
    closeGloss();                 // thẻ mới luôn bắt đầu ở trạng thái đóng
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
    // Đáp án nhiễu phải lấy trong cùng môn: trộn thuật ngữ WTO vào thẻ địa
    // danh du lịch thì đoán ra ngay mà không cần biết nghĩa.
    var subject = subjectOfCard(item.card);
    var pool = subject ? subject.cards : cardsOf('all');
    var options = LC.text.shuffle(
      LC.session.distractors(item.card, item.direction, pool).concat([q.answer])
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

  /** Nghĩa tiếng Việt luôn đóng lại khi sang thẻ mới. */
  function closeGloss() {
    $('gloss-body').hidden = true;
    $('btn-gloss').setAttribute('aria-expanded', 'false');
    $('gloss-label').textContent = 'Xem nghĩa tiếng Việt';
    $('btn-gloss').querySelector('.gloss__sign').textContent = '+';
  }

  function toggleGloss() {
    var body = $('gloss-body');
    var open = body.hidden;
    body.hidden = !open;
    $('btn-gloss').setAttribute('aria-expanded', String(open));
    $('gloss-label').textContent = open ? 'Ẩn nghĩa tiếng Việt' : 'Xem nghĩa tiếng Việt';
    $('btn-gloss').querySelector('.gloss__sign').textContent = open ? '−' : '+';
  }

  function reveal() {
    var card = state.item.card;
    var isQa = card.kind === 'qa';
    state.revealed = true;

    $('rev-zh').textContent = isQa ? card.a : card.zh;
    var py = $('rev-py');
    py.hidden = isQa;                       // câu trả lời dài, pinyin vô dụng
    if (!isQa) {
      py.textContent = card.pinyin;
      if (card.pinyinAuto) py.setAttribute('data-auto', '1');
      else py.removeAttribute('data-auto');
    }

    // Không lặp lại chính câu hỏi ở mặt sau: nếu vừa hỏi bằng tiếng Việt thì
    // đáp án cần là chữ Hán và pinyin, hiện lại tiếng Việt chỉ tốn chỗ.
    var revVi = $('rev-vi');
    if (isQa || (state.question && state.question.promptKind === 'vi')) {
      revVi.hidden = true;
    } else {
      revVi.hidden = false;
      revVi.textContent = card.vi + (card.context ? ' (' + card.context + ')' : '');
    }

    var alt = $('rev-alt');
    var variants = isQa ? (card.altA || []) : card.altZh.concat(card.altVi);
    if (variants.length) {
      alt.textContent = (isQa ? 'Cách trả lời khác: ' : 'Cách nói khác: ') +
        variants.join(' · ');
      alt.hidden = false;
    } else {
      alt.hidden = true;
    }

    // Bản dịch tiếng Việt: dựng sẵn nhưng để đóng, người học tự bấm mới mở.
    var gloss = $('gloss');
    if (isQa && (card.qVi || card.aVi)) {
      $('gloss-q').textContent = card.qVi;
      $('gloss-a').textContent = card.aVi;
      closeGloss();
      gloss.hidden = false;
    } else {
      gloss.hidden = true;
    }

    var note = $('rev-note');
    if (card.note) { note.textContent = card.note; note.hidden = false; }
    else note.hidden = true;

    $('card-back').hidden = false;
    // Gỡ rồi gán lại để animation chạy lại từ đầu ở mỗi thẻ.
    var cardEl = $('card');
    cardEl.classList.remove('is-turning');
    void cardEl.offsetWidth;
    cardEl.classList.add('is-turning');
    $('btn-flip').hidden = true;
    $('btn-speak').hidden = !state.voice;

    if (isQa) {
      // Thẻ hỏi đáp không có pinyin nên mốc ôn vẫn tính như thường.
      $('rev-zh').classList.add('reveal__zh--answer');
    } else {
      $('rev-zh').classList.remove('reveal__zh--answer');
    }

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

  function browseCards() {
    return cardsOf(state.browseSubject);
  }

  function renderBrowse() {
    renderSubjectTabs($('browse-subjects'), state.browseSubject, function (id) {
      state.browseSubject = id;
      state.browseTopics = [];
      renderBrowse();
    });

    var box = $('browse-topics');
    box.innerHTML = topicsOf(state.browseSubject).map(function (topic) {
      var active = state.browseTopics.indexOf(topic.id) !== -1;
      return '<button class="chip" type="button" aria-pressed="' + active + '" ' +
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
    renderBrowseList();
  }

  function renderBrowseList() {
    var query = LC.text.fold($('search-input').value);
    var rows = browseCards().filter(function (card) {
      if (state.browseTopics.length &&
        !card.topics.some(function (t) { return state.browseTopics.indexOf(t) !== -1; })) {
        return false;
      }
      if (!query) return true;
      if (card.kind === 'qa') {
        var hay = LC.text.fold(card.qVi + card.aVi) +
          LC.text.tidy(card.q + card.a + (card.altA || []).join(''));
        return hay.indexOf(query) !== -1 ||
          LC.text.tidy(card.q + card.a).indexOf(
            LC.text.tidy($('search-input').value)) !== -1;
      }
      var haystack = LC.text.fold(card.vi + card.pinyin + card.altVi.join('') +
        card.altPinyin.join('')) + LC.text.tidy(card.zh + card.altZh.join(''));
      return haystack.indexOf(query) !== -1 ||
        LC.text.tidy(card.zh).indexOf(LC.text.tidy($('search-input').value)) !== -1;
    });

    $('browse-count').textContent = rows.length + ' / ' + browseCards().length + ' thẻ';
    var list = $('browse-list');
    if (!rows.length) {
      list.innerHTML = '<li class="empty">Không tìm thấy thẻ nào khớp.</li>';
      return;
    }
    list.innerHTML = rows.map(function (card) {
      if (card.kind === 'qa') {
        return '<li class="list__qa">' +
          '<span class="list__q">' + esc(card.q) + '</span>' +
          '<span class="list__a">' + esc(card.a) + '</span>' +
          '</li>';
      }
      return '<li>' +
        '<span class="list__zh">' + esc(card.zh) + '</span>' +
        '<span class="list__vi">' + esc(card.vi) + '</span>' +
        '<span class="list__py">' + esc(card.pinyin) + '</span>' +
        (card.context ? '<span class="list__ctx">' + esc(card.context) + '</span>' : '') +
        (card.group ? '<span class="list__ctx">' + esc(card.group) + '</span>' : '') +
        '</li>';
    }).join('');
  }

  /* ───────────────────────────────────────────────────────────── tiến độ ── */

  function tally(cards) {
    var out = { learned: 0, learning: 0, fresh: 0, total: cards.length };
    cards.forEach(function (card) {
      var p = LC.store.get(card.id);
      if (LC.srs.isLearned(p)) out.learned++;
      else if (LC.srs.isNew(p)) out.fresh++;
      else out.learning++;
    });
    return out;
  }

  function bar(label, cards) {
    var t = tally(cards);
    var n = t.total || 1;
    return '<div class="bar">' +
      '<div class="bar__head"><span>' + esc(label) + '</span>' +
      '<span class="bar__num">' + t.learned + '/' + t.total + '</span></div>' +
      '<div class="bar__track">' +
      '<span class="bar__seg bar__seg--learned" style="width:' +
      (t.learned / n * 100) + '%"></span>' +
      '<span class="bar__seg bar__seg--learning" style="width:' +
      (t.learning / n * 100) + '%"></span>' +
      '</div></div>';
  }

  function renderStats() {
    // Con số trên cùng là tổng cả hai môn, biểu đồ bên dưới chia theo môn.
    var all = tally(cardsOf('all'));
    $('st-learned').textContent = all.learned;
    $('st-learning').textContent = all.learning;
    $('st-new').textContent = all.fresh;
    $('st-streak').textContent = LC.store.streak();

    var html = '';
    SUBJECTS.forEach(function (subject) {
      var t = tally(subject.cards);
      html += '<p class="bars__subject">' + esc(subject.name) +
        ' — ' + t.learned + '/' + t.total + ' thẻ đã thuộc</p>';
      html += subject.topics.map(function (topic) {
        return bar(topic.name, subject.cards.filter(function (c) {
          return c.topics.indexOf(topic.id) !== -1;
        }));
      }).join('');
    });
    html += '<p class="bar__legend">' +
      '<span><span class="dot dot--learned"></span>Đã thuộc</span>' +
      '<span><span class="dot dot--learning"></span>Đang học</span>' +
      '<span><span class="dot dot--new"></span>Chưa học</span></p>';
    $('stat-bars').innerHTML = html;

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
      startSession({ subject: state.subject, topics: [], only: due ? 'due' : 'new', size: 20 });
    });
    on($('btn-custom'), 'click', function () { state.prefs.only = null; go('#/setup'); });

    document.querySelectorAll('[data-quick]').forEach(function (btn) {
      on(btn, 'click', function () {
        startSession({ subject: state.subject, topics: [],
          only: btn.getAttribute('data-quick'), size: 20 });
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

    on($('btn-gloss'), 'click', toggleGloss);
    on($('btn-speak'), 'click', function () {
      var card = state.item.card;
      speak(card.kind === 'qa' ? card.a : card.zh);
    });

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
    if (!SUBJECTS.length || !cardsOf('all').length) {
      $('home-total').textContent = '0';
      toast('Không nạp được dữ liệu từ vựng.');
      return;
    }
    LC.store.load();

    // Môn đã chọn lần trước, nếu vẫn còn tồn tại trong dữ liệu.
    try {
      var lastSubject = window.localStorage.getItem('lc.subject');
      if (lastSubject && subjectsFor(lastSubject).length) {
        state.subject = lastSubject;
        state.prefs.subject = lastSubject;
        state.browseSubject = lastSubject;
      }
    } catch (err) { /* bỏ qua */ }

    var saved = LC.store.prefs();
    if (saved) {
      state.prefs.direction = saved.direction || state.prefs.direction;
      state.prefs.mode = saved.mode || state.prefs.mode;
      state.prefs.size = typeof saved.size === 'number' ? saved.size : state.prefs.size;
    }

    initTheme();
    renderSwitcher();
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
