/* Lịch ôn theo SM-2 rút gọn.

   Bốn mức tự chấm: 0 quên · 1 khó · 2 được · 3 dễ.
   Quên thì thẻ về mốc 0 và quay lại ngay trong phiên; các mức còn lại giãn
   khoảng cách theo hệ số dễ (ease), càng nhớ lâu thì càng lâu gặp lại. */

window.LC = window.LC || {};

LC.srs = (function () {
  'use strict';

  var DAY = 86400000;
  var FIRST = [1, 3, 7];        // ba mốc đầu cố định cho dễ đoán
  var EASE_MIN = 1.3;
  var EASE_MAX = 2.6;
  var EASE_START = 2.2;

  function blank() {
    return { ease: EASE_START, interval: 0, due: 0, reps: 0, lapses: 0, wrong: 0, starred: false };
  }

  function startOfToday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /** Khoảng cách (ngày) nếu người học chấm mức này — dùng để in lên nút. */
  function preview(progress, grade) {
    var p = progress || blank();
    if (grade === 0) return 0;
    // Hai lần đầu đi theo mốc cố định (1 / 3 / 7) cho dễ đoán,
    // từ lần thứ ba mới giãn theo hệ số dễ.
    if (p.reps === 0) return FIRST[grade - 1];
    if (p.reps === 1 && grade === 2) return FIRST[2];

    var ease = p.ease;
    if (grade === 1) ease -= 0.15;
    else if (grade === 3) ease += 0.1;
    ease = Math.max(EASE_MIN, Math.min(EASE_MAX, ease));

    var base = p.interval || 1;
    var factor = grade === 1 ? 1.2 : grade === 3 ? ease * 1.3 : ease;
    return Math.max(1, Math.round(base * factor));
  }

  /** Áp kết quả chấm, trả về bản tiến độ mới. */
  function apply(progress, grade) {
    var p = progress ? Object.assign({}, progress) : blank();
    var days = preview(p, grade);

    if (grade === 0) {
      p.lapses += 1;
      p.wrong += 1;
      p.reps = 0;
      p.interval = 0;
      p.ease = Math.max(EASE_MIN, p.ease - 0.2);
      p.due = startOfToday();      // vẫn tính là đến hạn hôm nay
      return p;
    }

    if (grade === 1) p.ease = Math.max(EASE_MIN, p.ease - 0.15);
    else if (grade === 3) p.ease = Math.min(EASE_MAX, p.ease + 0.1);

    p.reps += 1;
    p.interval = days;
    p.due = startOfToday() + days * DAY;
    return p;
  }

  function isDue(progress, now) {
    if (!progress || !progress.reps && !progress.due) return false;
    return progress.due <= (now || Date.now());
  }

  function isNew(progress) {
    return !progress || (progress.reps === 0 && !progress.due);
  }

  /** Thẻ coi như đã thuộc khi khoảng ôn vượt 20 ngày. */
  function isLearned(progress) {
    return !!progress && progress.interval >= 21;
  }

  function label(days) {
    if (days <= 0) return 'lát nữa';
    if (days === 1) return '1 ngày';
    if (days < 30) return days + ' ngày';
    var months = Math.round(days / 30);
    return months + ' tháng';
  }

  return {
    blank: blank, apply: apply, preview: preview, label: label,
    isDue: isDue, isNew: isNew, isLearned: isLearned, startOfToday: startOfToday
  };
})();
