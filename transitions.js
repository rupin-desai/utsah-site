/* Video autoplay — ensure it plays immediately on every page open */
(function () {
  var v = document.querySelector('.bg-video');
  if (!v) return;

  function play() { v.play().catch(function () {}); }

  // Play as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', play);
  } else {
    play();
  }

  // Retry once the video actually has data — the initial play() above can
  // silently fail while the file is still buffering, and nothing else
  // would ever retry it for a desktop mouse-only visitor.
  v.addEventListener('loadeddata', play);
  v.addEventListener('canplay', play);

  // Safety-net watchdog: keep retrying for the first few seconds in case
  // the above events fire before listeners attach or play() is dropped.
  var attempts = 0;
  var watchdog = setInterval(function () {
    attempts++;
    if (!v.paused || attempts > 20) { clearInterval(watchdog); return; }
    play();
  }, 500);

  // Resume if tab comes back into focus
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) play();
  });

  // Resume on first touch (iOS sometimes needs this)
  document.addEventListener('touchstart', function () {
    if (v.paused) play();
  }, { once: true, passive: true });

  // Back/forward cache restore
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) play();
  });
})();
