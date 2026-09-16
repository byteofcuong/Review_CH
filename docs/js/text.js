/* Chuẩn hoá và so khớp chuỗi.
   Người học gõ trên điện thoại nên chấm phải khoan dung: bỏ qua hoa thường,
   dấu thanh pinyin, dấu tiếng Việt, dấu câu và khoảng trắng thừa. */

window.LC = window.LC || {};

LC.text = (function () {
  'use strict';

  var PUNCT = /[\s‐-―\-_/,.;:!?'"()（）［］\[\]{}、，。；：！？「」『』“”‘’·~～]/g;

  /** Bỏ dấu thanh pinyin và dấu tiếng Việt: 'Xiàlóng Wān' -> 'xialongwan'. */
  function fold(value) {
    if (!value) return '';
    return String(value)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(PUNCT, '')
      .trim();
  }

  /** Chuẩn hoá nhẹ, giữ dấu — dùng để so chữ Hán. */
  function tidy(value) {
    if (!value) return '';
    return String(value).normalize('NFC').toLowerCase().replace(PUNCT, '').trim();
  }

  /** Người học gõ đúng một trong các đáp án được chấp nhận? */
  function matches(input, answers) {
    var typed = fold(input);
    var typedRaw = tidy(input);
    if (!typed && !typedRaw) return false;
    for (var i = 0; i < answers.length; i++) {
      var answer = answers[i];
      if (!answer) continue;
      if (typedRaw && typedRaw === tidy(answer)) return true;
      var folded = fold(answer);
      if (typed && folded && typed === folded) return true;
    }
    return false;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Trộn ngẫu nhiên tại chỗ (Fisher–Yates). */
  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
    }
    return list;
  }

  return { fold: fold, tidy: tidy, matches: matches, escapeHtml: escapeHtml, shuffle: shuffle };
})();
