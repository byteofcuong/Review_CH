/* Tiến độ học, lưu trong localStorage của chính người học.
   Không có máy chủ, không tài khoản — nên mọi thao tác đọc/ghi đều phải
   sống sót khi trình duyệt chặn storage (cửa sổ ẩn danh, chặn cookie). */

window.LC = window.LC || {};

LC.store = (function () {
  'use strict';

  var KEY = 'lc.progress.v1';
  var available = true;

  var state = {
    version: 1,
    cards: {},        // id -> { ease, interval, due, reps, lapses, wrong, starred }
    days: [],         // chuỗi 'YYYY-MM-DD' đã học, mới nhất ở cuối
    lastPrefs: null
  };

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1) {
          state.cards = parsed.cards || {};
          state.days = parsed.days || [];
          state.lastPrefs = parsed.lastPrefs || null;
        }
      }
    } catch (err) {
      available = false;
    }
  }

  function save() {
    if (!available) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      available = false;
    }
  }

  function get(id) {
    return state.cards[id] || null;
  }

  function set(id, progress) {
    state.cards[id] = progress;
    save();
  }

  function toggleStar(id) {
    var entry = state.cards[id] || LC.srs.blank();
    entry.starred = !entry.starred;
    state.cards[id] = entry;
    save();
    return entry.starred;
  }

  function markStudied() {
    var day = today();
    if (state.days[state.days.length - 1] !== day) {
      state.days.push(day);
      if (state.days.length > 400) state.days = state.days.slice(-400);
      save();
    }
  }

  /** Số ngày học liên tiếp tính tới hôm nay hoặc hôm qua. */
  function streak() {
    if (!state.days.length) return 0;
    var days = state.days.slice().sort();
    var cursor = new Date();
    var last = days[days.length - 1];
    var t = today();
    if (last !== t) {
      cursor.setDate(cursor.getDate() - 1);
      var y = cursor.getFullYear() + '-' +
        String(cursor.getMonth() + 1).padStart(2, '0') + '-' +
        String(cursor.getDate()).padStart(2, '0');
      if (last !== y) return 0;
    }
    var count = 0;
    var seen = {};
    days.forEach(function (d) { seen[d] = true; });
    var probe = new Date(last + 'T00:00:00');
    while (true) {
      var key = probe.getFullYear() + '-' +
        String(probe.getMonth() + 1).padStart(2, '0') + '-' +
        String(probe.getDate()).padStart(2, '0');
      if (!seen[key]) break;
      count++;
      probe.setDate(probe.getDate() - 1);
    }
    return count;
  }

  function prefs(next) {
    if (next) { state.lastPrefs = next; save(); }
    return state.lastPrefs;
  }

  function exportJson() {
    return JSON.stringify(state, null, 1);
  }

  function importJson(raw) {
    var parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || typeof parsed.cards !== 'object') {
      throw new Error('File sao lưu không đúng định dạng.');
    }
    state.cards = parsed.cards;
    state.days = parsed.days || [];
    state.lastPrefs = parsed.lastPrefs || null;
    save();
  }

  function reset() {
    state.cards = {};
    state.days = [];
    state.lastPrefs = null;
    try { window.localStorage.removeItem(KEY); } catch (err) { /* không sao */ }
  }

  return {
    load: load, get: get, set: set, all: function () { return state.cards; },
    toggleStar: toggleStar, markStudied: markStudied, streak: streak,
    prefs: prefs, exportJson: exportJson, importJson: importJson, reset: reset,
    today: today,
    isAvailable: function () { return available; }
  };
})();
