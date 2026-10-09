/* Dựng một phiên học: chọn thẻ nào, hỏi theo chiều nào, chấm ra sao. */

window.LC = window.LC || {};

LC.session = (function () {
  'use strict';

  var DIRECTIONS = ['vi2zh', 'zh2vi', 'py2zh'];

  /** Thứ tự ưu tiên: thẻ đến hạn trước, rồi thẻ mới, rồi thẻ còn lại. */
  function pick(cards, prefs) {
    var now = Date.now();
    var pool = cards.filter(function (card) {
      if (!prefs.topics.length) return true;
      return card.topics.some(function (t) { return prefs.topics.indexOf(t) !== -1; });
    });

    if (prefs.only === 'starred') {
      pool = pool.filter(function (c) { var p = LC.store.get(c.id); return p && p.starred; });
    } else if (prefs.only === 'hard') {
      pool = pool.filter(function (c) { var p = LC.store.get(c.id); return p && p.wrong >= 2; });
    } else if (prefs.only === 'new') {
      pool = pool.filter(function (c) { return LC.srs.isNew(LC.store.get(c.id)); });
    } else if (prefs.only === 'due') {
      pool = pool.filter(function (c) { return LC.srs.isDue(LC.store.get(c.id), now); });
    }

    var due = [], fresh = [], rest = [];
    pool.forEach(function (card) {
      var p = LC.store.get(card.id);
      if (LC.srs.isDue(p, now)) due.push(card);
      else if (LC.srs.isNew(p)) fresh.push(card);
      else rest.push(card);
    });

    LC.text.shuffle(due);
    LC.text.shuffle(fresh);
    LC.text.shuffle(rest);

    var ordered = due.concat(fresh, rest);
    if (prefs.size > 0) ordered = ordered.slice(0, prefs.size);
    return ordered;
  }

  function directionFor(prefs) {
    if (prefs.direction !== 'mixed') return prefs.direction;
    return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  }

  /** Nội dung câu hỏi và tập đáp án được chấp nhận cho một thẻ. */
  function question(card, direction) {
    // Thẻ hỏi đáp (môn Lịch sử): câu hỏi đã viết sẵn, chỉ có một chiều.
    if (card.kind === 'qa') {
      return {
        promptLabel: 'Câu hỏi',
        prompt: card.q,
        promptKind: 'qa',
        answerLabel: 'Đáp án',
        answer: card.a,
        answerKind: 'zh',
        accepted: [card.a].concat(card.altA || []),
        hint: 'Gõ đáp án bằng chữ Hán'
      };
    }
    if (direction === 'zh2vi') {
      return {
        promptLabel: 'Chữ Hán',
        prompt: card.zh,
        promptKind: 'zh',
        answerLabel: 'Tiếng Việt',
        answer: card.vi,
        answerKind: 'vi',
        accepted: [card.vi].concat(card.altVi),
        hint: 'Gõ nghĩa tiếng Việt'
      };
    }
    if (direction === 'py2zh') {
      return {
        promptLabel: 'Pinyin',
        prompt: card.pinyin,
        promptKind: 'pinyin',
        answerLabel: 'Chữ Hán',
        answer: card.zh,
        answerKind: 'zh',
        accepted: [card.zh].concat(card.altZh, [card.pinyin], card.altPinyin),
        hint: 'Gõ chữ Hán hoặc pinyin'
      };
    }
    return {
      promptLabel: 'Tiếng Việt',
      prompt: card.vi,
      promptKind: 'vi',
      answerLabel: 'Chữ Hán',
      answer: card.zh,
      answerKind: 'zh',
      accepted: [card.zh].concat(card.altZh, [card.pinyin], card.altPinyin),
      hint: 'Gõ chữ Hán hoặc pinyin'
    };
  }

  /** Ba đáp án nhiễu, ưu tiên cùng chủ đề để không đoán được bằng loại trừ. */
  function distractors(card, direction, allCards) {
    var q = question(card, direction);
    var field = card.kind === 'qa' ? 'a' : (q.answerKind === 'vi' ? 'vi' : 'zh');
    var correct = LC.text.tidy(q.answer);

    var sameTopic = allCards.filter(function (other) {
      return other.id !== card.id &&
        LC.text.tidy(other[field]) !== correct &&
        other.topics.some(function (t) { return card.topics.indexOf(t) !== -1; });
    });
    var others = allCards.filter(function (other) {
      return other.id !== card.id && LC.text.tidy(other[field]) !== correct;
    });

    var pool = LC.text.shuffle(sameTopic.slice());
    if (pool.length < 3) pool = pool.concat(LC.text.shuffle(others.slice()));

    var out = [];
    var seen = {};
    seen[correct] = true;
    for (var i = 0; i < pool.length && out.length < 3; i++) {
      var value = pool[i][field];
      var key = LC.text.tidy(value);
      if (seen[key]) continue;
      seen[key] = true;
      out.push(value);
    }
    return out;
  }

  function create(cards, prefs) {
    var chosen = pick(cards, prefs);
    var queue = chosen.map(function (card) {
      return { card: card, direction: directionFor(prefs), repeat: false };
    });
    return {
      prefs: prefs,
      queue: queue,
      total: queue.length,
      index: 0,
      right: 0,
      wrong: 0,
      missed: [],
      startedAt: Date.now()
    };
  }

  /** Thẻ bị quên quay lại cuối hàng đợi, đánh dấu để không đếm trùng. */
  function requeue(session, item) {
    if (item.repeat) return;
    var again = { card: item.card, direction: item.direction, repeat: true };
    session.queue.push(again);
  }

  return {
    create: create, question: question, distractors: distractors, requeue: requeue
  };
})();
