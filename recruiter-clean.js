/* Keep project pages focused on the work when viewed by a recruiter. */
(function () {
  var removeHeadings = /지원서|자기소개서|면접|예상 질문|제출 전|보완할 지점|기업 지원용|지원 서류|활용 가이드|작성 팁/i;
  var removeText = /제출 전에.*바꿔|담당 파트 채우기|기간 채우기|본인 역할이 비어 있습니다/i;
  document.documentElement.classList.add('recruiter-clean');
  document.querySelectorAll('#recruiter-interview, #recruiter-application, #s10, #g1, #g2, #g3, #g4, #g5, .part-break').forEach(function (block) { block.remove(); });
  document.querySelectorAll('section, .apply').forEach(function (block) {
    var heading = block.querySelector('h1,h2,h3,h4');
    if (heading && removeHeadings.test(heading.textContent)) block.remove();
  });
  document.querySelectorAll('.todo, .note, .sub, .sec-sub, p, li, h1, h2, h3, h4').forEach(function (el) {
    if (removeText.test(el.textContent)) {
      var row = el.closest('div');
      if (el.classList.contains('todo') && row && row.querySelector('dt')) row.remove();
      else el.remove();
    }
  });
  document.querySelectorAll('a[href]').forEach(function (link) {
    if (/^#(g|s10|apply|interview|qa)/i.test(link.getAttribute('href') || '')) link.remove();
  });
  var style = document.createElement('style');
  style.textContent = '.recruiter-clean body{overflow-x:hidden}.recruiter-clean p,.recruiter-clean li,.recruiter-clean td,.recruiter-clean dd{word-break:keep-all;overflow-wrap:break-word;line-height:1.85}.recruiter-clean h1,.recruiter-clean h2,.recruiter-clean h3,.recruiter-clean h4{word-break:keep-all;overflow-wrap:normal;line-height:1.28}.recruiter-clean .todo{display:none!important}';
  document.head.appendChild(style);
})();
