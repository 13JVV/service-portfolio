(function () {
  var nodes = Array.from(document.querySelectorAll('.node'));
  if (!nodes.length) return;
  var timer = 0;
  nodes.forEach(function (node, index) {
    node.addEventListener('pointerenter', function () {
      clearTimeout(timer);
      if (typeof activate === 'function') activate(index);
    }, true);
    node.addEventListener('pointerleave', function (event) {
      event.stopImmediatePropagation();
      clearTimeout(timer);
      var x = event.clientX, y = event.clientY;
      timer = setTimeout(function () {
        var rect = node.getBoundingClientRect();
        var inPanel = x >= rect.left - 34 && x <= rect.right + 34 && y >= rect.top - 34 && y <= rect.bottom + 34;
        var target = document.elementFromPoint(x, y);
        if (!inPanel && !target?.closest('.node') && typeof activate === 'function') activate(-1);
      }, 220);
    }, true);
  });
})();
