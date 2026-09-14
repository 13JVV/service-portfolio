(function () {
  var floating = document.querySelector('.floating-label');
  var foot = document.querySelector('.floating-foot');
  var caption = document.querySelector('.detail-visual-caption');
  if (floating) new MutationObserver(function () {
    var next = floating.textContent.replace(/MOTION STUDY/g, 'PROJECT PREVIEW');
    if (next !== floating.textContent) floating.textContent = next;
  }).observe(floating, { childList: true, characterData: true, subtree: true });
  if (foot) foot.firstChild.textContent = 'PROJECT PREVIEW ';
  if (caption) caption.firstChild.textContent = 'PROJECT PREVIEW ';
})();
