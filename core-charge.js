(function () {
  var core = document.querySelector('#core-button');
  var about = document.querySelector('#about-dialog');
  if (!core || !about) return;
  var charge = 0, charging = false, revealed = false, last = performance.now();
  function start() { charging = true; }
  function stop() { charging = false; }
  document.addEventListener('pointermove', function (event) {
    var rect = core.getBoundingClientRect();
    var dx = event.clientX - (rect.left + rect.width / 2);
    var dy = event.clientY - (rect.top + rect.height / 2);
    var radius = Math.min(rect.width, rect.height) / 2;
    charging = Math.sqrt(dx * dx + dy * dy) <= radius;
  }, true);
  window.addEventListener('blur', stop);
  core.addEventListener('focus', start);
  core.addEventListener('blur', stop);
  function tick(now) {
    var delta = Math.min((now - last) / 1000, .05);
    last = now;
    charge = Math.max(0, Math.min(1, charge + (charging ? 1 : -1) * delta * .46));
    core.style.setProperty('--charge', charge.toFixed(3));
    var red = Math.round(247 * (1 - charge));
    var green = Math.round(136 * (1 - charge));
    var blue = Math.round(75 * (1 - charge));
    core.style.setProperty('--core-text', 'rgb(' + red + ' ' + green + ' ' + blue + ')');
    core.classList.toggle('charged', charge >= .999);
    if (charge >= .999 && !revealed) {
      revealed = true;
      if (!about.open) about.showModal();
    } else if (charge <= 0.001) {
      revealed = false;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
