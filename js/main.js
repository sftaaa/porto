(function () {
  window.__rvOK = true; // tells the head failsafe that this script started fine
  var root = document.documentElement;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var swipeOn = false;
  var btn = document.getElementById('theme');
  var hero = document.getElementById('top');
  var sky = hero.querySelector('.sky');

  /* ----- theme: follows the system until the switch is used, then remembers the choice ----- */
  try { var saved = localStorage.getItem('ss-theme'); if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved); } catch (e) {}
  function isDark() { var t = root.getAttribute('data-theme'); return t ? t === 'dark' : mq.matches; }
  function syncTheme() {
    var d = isDark();
    btn.setAttribute('aria-checked', String(d));
    btn.setAttribute('aria-label', d ? 'Mode malam aktif. Ganti ke mode terang' : 'Mode terang aktif. Ganti ke mode malam');
  }
  function setTheme(next) {
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('ss-theme', next); } catch (e) {}
    syncTheme();
  }
  btn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    /* Day/night change spreads out from the switch as a circle (View Transitions API).
       Browsers without it just swap the theme with the normal colour transitions. */
    if (!reduce && document.startViewTransition) {
      var r = btn.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add('vt');
      var t = document.startViewTransition(function () { setTheme(next); });
      t.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 750, easing: 'cubic-bezier(.4,.1,.2,1)', pseudoElement: '::view-transition-new(root)' }
        );
      }, function () {});
      t.finished.then(function () { root.classList.remove('vt'); }, function () { root.classList.remove('vt'); });
    } else {
      setTheme(next);
    }
  });
  if (mq.addEventListener) mq.addEventListener('change', syncTheme);
  syncTheme();

  /* ----- hero: pointer parallax for the paper planes ----- */
  var tx = 0, ty = 0, raf = 0;
  if (!reduce) {
    hero.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth - .5) * 2;
      ty = (e.clientY / window.innerHeight - .5) * 2;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0; sky.style.setProperty('--mx', tx.toFixed(3)); sky.style.setProperty('--my', ty.toFixed(3));
      });
    }, { passive: true });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { hero.classList.toggle('off', !en[0].isIntersecting); }).observe(hero);
  }

  /* ----- nav: active link + sliding pill ----- */
  var box = document.getElementById('links');
  var links = Array.prototype.slice.call(box.querySelectorAll('a'));
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  var ind = document.createElement('span');
  ind.className = 'ind'; ind.setAttribute('aria-hidden', 'true');
  box.insertBefore(ind, box.firstChild);
  box.classList.add('has-ind');
  var cur = null;
  function moveInd(a) {
    if (!a) { ind.style.opacity = '0'; return; }
    ind.style.opacity = '1';
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
  }
  function setCurrent(a) {
    if (a === cur) return;
    cur = a;
    links.forEach(function (l) { l.removeAttribute('aria-current'); });
    if (a) {
      a.setAttribute('aria-current', 'true');
      if (box.scrollWidth > box.clientWidth) {
        var l = a.offsetLeft, w = a.offsetWidth;
        if (l < box.scrollLeft || l + w > box.scrollLeft + box.clientWidth) box.scrollTo({ left: l - (box.clientWidth - w) / 2, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    moveInd(a);
  }
  window.addEventListener('resize', function () { moveInd(cur); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInd(cur); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting && !swipeOn) setCurrent(byId[en.target.id] || null); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ----- scroll loop: progress bar, hero parallax, spinning star ----- */
  var nav = document.querySelector('.nav');
  var star = document.querySelector('.torn-star');
  var eduBand = document.getElementById('education');
  var ticking = false;
  function frame() {
    ticking = false;
    if (swipeOn) return;
    var y = window.pageYOffset || 0;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    nav.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : '0');
    var hh = hero.offsetHeight;
    if (hh - y > window.innerHeight * .5) setCurrent(null); // still in the hero: no section is "current"
    if (totop) { totop.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : '0'); totop.classList.toggle('show', y > hh * .6); }
    if (reduce) return;
    var vel = Math.abs(y - lastY); lastY = y;
    var ma = mTrack && mTrack.getAnimations && mTrack.getAnimations()[0];
    if (ma && vel > 1) { ma.playbackRate = Math.min(1 + vel / 8, 7); clearTimeout(rateT); rateT = setTimeout(settleRate, 90); }
    if (y < hh) hero.style.setProperty('--hy', Math.max(0, Math.min(1, y / hh)).toFixed(3));
    if (star && eduBand) {
      var r = eduBand.getBoundingClientRect();
      var t = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      star.style.setProperty('--sr', (Math.max(0, Math.min(1, t)) * 100).toFixed(1) + 'deg');
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ----- scroll reveal ----- */
  var io2 = null;
  function countCard(card) {
    card.querySelectorAll('.meters li').forEach(function (li, k) {
      var v = li.querySelector('.v');
      if (!v) return;
      var fin = v.getAttribute('data-fin') || v.textContent;
      v.setAttribute('data-fin', fin);
      var target = parseInt(fin, 10);
      if (isNaN(target)) return;
      var tok = (v._tok || 0) + 1; v._tok = tok;
      var start = performance.now() + 350 + k * 90;
      v.textContent = '0%';
      (function step(t) {
        if (v._tok !== tok) return;
        var p = Math.max(0, Math.min(1, (t - start) / 1000));
        v.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + '%';
        if (p < 1) requestAnimationFrame(step); else v.textContent = fin;
      })(performance.now());
    });
  }
  function reveal(el) {
    el.classList.add('in');
    if (el.classList.contains('skill-card')) countCard(el);
  }
  function setIn(el, on) {
    el.classList.toggle('in', on);
    el.querySelectorAll('.rv').forEach(function (c) { c.classList.toggle('in', on); });
    if (on && el.classList.contains('skill-card') && !reduce) countCard(el);
  }
  function R(sel, variant, delay, cap) {
    var seen = new Map();
    document.querySelectorAll(sel).forEach(function (el) {
      var p = el.parentNode, n = seen.get(p) || 0;
      seen.set(p, n + 1);
      el.classList.add('rv');
      if (variant) variant.split(' ').forEach(function (c) { el.classList.add(c); });
      el.style.setProperty('--i', Math.min(n, cap || 6));
      el.style.setProperty('--dl', (delay || 0) + 'ms');
      if (io2) io2.observe(el); else reveal(el);
    });
  }
  if (!reduce) {
    if ('IntersectionObserver' in window) {
      io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          // also reveal things already scrolled past (deep links, fast scrolling)
          if (e.isIntersecting || e.boundingClientRect.top < 0) { reveal(e.target); io2.unobserve(e.target); }
        });
      }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    }
    document.querySelectorAll('.skill-card').forEach(function (c) {
      c.querySelectorAll('.meters li').forEach(function (li, k) { li.style.setProperty('--k', k); });
    });
    document.querySelectorAll('.tl-span, .tl-year').forEach(function (s, k) { s.style.setProperty('--k', s.classList.contains('tl-year') ? k : k - 6); });
    R('.page-head');
    R('.display', 'rv-head');
    R('.about-name', '', 120);
    R('.about p:not(.about-name)', '', 200, 3);
    R('.about .chips li', 'rv-pop', 350, 8);
    R('.polaroid-wrap', 'rv-pop', 150);
    R('.edu-card', 'rv-l', 150);
    R('.torn-star', 'rv-star', 100);
    R('.tl', '', 0);
    R('.intern', '', 100);
    R('.skills-head', 'ro');
    R('#skillFilters .chip', 'rv-pop', 150);
    R('.skill-card', '', 100, 5);
    R('.proj-head .filters .chip', 'rv-pop', 250);
    R('.project .p-top h3', 'rv-head');
    R('.project .p-top .sticker', 'rv-stamp', 450);
    R('.project h4', '', 120);
    R('.project .sub', '', 180);
    R('.project .bullets li', '', 220, 5);
    R('.project .chips li', 'rv-pop', 500, 6);
    R('.project .p-media', 'rv-zoom', 150);
    R('.exp-lede', '', 100);
    R('.cert', '', 0, 3);
    R('.c-row', '', 0, 2);
  }

  /* ----- extras: floating sparks, contact word wave, back-to-top, marquee speed ----- */
  var totop = document.getElementById('totop');
  var mTrack = document.querySelector('.m-track'), lastY = window.pageYOffset || 0, rateT = 0;
  function settleRate() {
    var a = mTrack && mTrack.getAnimations && mTrack.getAnimations()[0];
    if (!a) return;
    var r = a.playbackRate + (1 - a.playbackRate) * .1;
    if (Math.abs(1 - r) < .03) r = 1;
    a.playbackRate = r;
    if (r !== 1) requestAnimationFrame(settleRate);
  }
  if (!reduce) {
    var decos = {
      about:      [{ top: '6%', right: '5%', w: '2.6rem', c: 'var(--yellow)', t: 8 }, { bottom: '7%', left: '3%', w: '1.7rem', c: 'var(--cream)', t: 10 }],
      internship: [{ top: '9%', right: '7%', w: '2.3rem', c: 'var(--yellow)', t: 9 }, { bottom: '6%', left: '46%', w: '1.5rem', c: 'var(--cream)', t: 7 }],
      projects:   [{ top: '2.5%', right: '4%', w: '2.4rem', c: 'var(--yellow)', t: 8 }, { top: '40%', left: '1.5%', w: '1.5rem', c: 'var(--cream)', t: 11 }],
      contact:    [{ top: '12%', left: '44%', w: '2.8rem', c: 'var(--yellow)', t: 9 }, { bottom: '9%', right: '6%', w: '2rem', c: 'var(--cream)', t: 7 }, { top: '62%', left: '3%', w: '1.5rem', c: 'var(--yellow)', t: 10 }]
    };
    Object.keys(decos).forEach(function (id) {
      var band = document.getElementById(id);
      if (!band) return;
      decos[id].forEach(function (d, k) {
        var el = document.createElement('div');
        el.className = 'deco'; el.setAttribute('aria-hidden', 'true');
        ['top', 'right', 'bottom', 'left'].forEach(function (side) { if (d[side]) el.style[side] = d[side]; });
        el.style.setProperty('--w', d.w); el.style.setProperty('--c', d.c);
        el.style.setProperty('--t', d.t + 's'); el.style.setProperty('--dl2', (-k * 2.3) + 's');
        el.innerHTML = '<svg viewBox="0 0 40 40"><use href="#spark"/></svg>';
        band.appendChild(el);
      });
    });
    var tog = document.querySelector('.contact .display em');
    if (tog) {
      var word = tog.textContent;
      tog.innerHTML = '<span class="sr">' + word + '</span><span aria-hidden="true" style="white-space:nowrap">' +
        word.split('').map(function (ch, i) { return '<span class="ch2" style="--i:' + i + '">' + ch + '</span>'; }).join('') + '</span>';
    }
  }

  /* ----- internship cards <-> timeline ----- */
  function mark(id, on) {
    document.querySelectorAll('[data-id="' + id + '"]').forEach(function (n) { n.classList.toggle('on', on); });
  }
  document.querySelectorAll('.intern').forEach(function (c) {
    var id = c.getAttribute('data-id');
    ['mouseenter', 'focusin'].forEach(function (ev) { c.addEventListener(ev, function () { mark(id, true); }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { c.addEventListener(ev, function () { mark(id, false); }); });
  });
  document.querySelectorAll('.tl-span').forEach(function (s) {
    var id = s.getAttribute('data-id');
    s.addEventListener('mouseenter', function () { mark(id, true); });
    s.addEventListener('mouseleave', function () { mark(id, false); });
  });

  /* ----- internship detail view: click a card (or its timeline bar) to open its page ----- */
  var intList = document.querySelector('.interns');
  var intOpen = null, intFrom = null;
  document.querySelectorAll('.int-panel').forEach(function (pn) {
    Array.prototype.forEach.call(pn.children, function (c, k) { c.style.setProperty('--i', k); });
  });
  function intTop() {
    var slide = swipeOn ? document.getElementById('internship') : null;
    if (slide) slide.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else document.querySelector('#internship .page-head').scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }
  function clearOn() { document.querySelectorAll('#internship .on').forEach(function (n) { n.classList.remove('on'); }); }
  function openIntern(id, from) {
    var panel = document.getElementById('int-' + id);
    if (!panel || intOpen) return;
    intOpen = id; intFrom = from || null;
    document.querySelectorAll('.tl-span').forEach(function (s) { s.classList.toggle('sel', s.getAttribute('data-id') === id); });
    function show() {
      clearOn();
      intList.hidden = true; intList.classList.remove('swap-out');
      panel.hidden = false;
      intTop();
      panel.focus({ preventScroll: true });
    }
    if (!reduce) { intList.classList.add('swap-out'); setTimeout(show, 200); } else show();
  }
  function closeIntern() {
    if (!intOpen) return;
    var panel = document.getElementById('int-' + intOpen), from = intFrom;
    intOpen = null; intFrom = null;
    document.querySelectorAll('.tl-span.sel').forEach(function (s) { s.classList.remove('sel'); });
    function back() {
      clearOn();
      panel.hidden = true; panel.classList.remove('swap-out');
      intList.hidden = false;
      var cards = intList.querySelectorAll('.intern');
      cards.forEach(function (c) { c.classList.remove('in'); });
      void intList.offsetWidth;
      cards.forEach(function (c) { c.classList.add('in'); });
      intTop();
      var b = from && from.querySelector('.intern-open');
      if (b) b.focus({ preventScroll: true });
    }
    if (!reduce) { panel.classList.add('swap-out'); setTimeout(back, 200); } else back();
  }
  document.querySelectorAll('.intern-open').forEach(function (b) {
    b.addEventListener('click', function () { var li = b.closest('.intern'); openIntern(li.getAttribute('data-id'), li); });
  });
  document.querySelectorAll('.tl-span').forEach(function (s) {
    s.addEventListener('click', function () {
      var id = s.getAttribute('data-id');
      openIntern(id, document.querySelector('.intern[data-id="' + id + '"]'));
    });
  });
  document.querySelectorAll('.int-back').forEach(function (b) { b.addEventListener('click', closeIntern); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && intOpen && lb.hidden) closeIntern(); });
  /* ----- filters: fade out, then the matching cards rise back in ----- */
  function updateFlip() {
    var n = 0;

    var projectSection = document.getElementById('projects');
    var expanded = projectSection.classList.contains('projects-expanded');

    document.querySelectorAll('.project').forEach(function (p) {

      // Abaikan project yang sedang disembunyikan
      if (p.hidden) return;

      // Abaikan project tambahan sebelum tombol diklik
      if (p.classList.contains('project-extra') && !expanded) return;

      p.classList.toggle('flip', n % 2 === 1);
      n++;
    });
  }
  function bindFilter(groupId, itemSel, attr, after) {
    var group = document.getElementById(groupId);
    var items = Array.prototype.slice.call(document.querySelectorAll(itemSel));
    var pending = null;
    function flush() { if (pending) { clearTimeout(pending.t); var fn = pending.fn; pending = null; fn(); } }
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-f]');
      if (!b) return;
      flush();
      var f = b.getAttribute('data-f');
      group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var hide = [], show = [];
      items.forEach(function (it) {
        var want = f === 'all' || it.getAttribute(attr) === f;
        if (!want && !it.hidden) hide.push(it);
        if (want && it.hidden) show.push(it);
      });
      function done() {
        hide.forEach(function (it) { it.hidden = true; it.classList.remove('swap-out'); setIn(it, false); });
        show.forEach(function (it) { it.hidden = false; setIn(it, false); });
        if (after) after();
        void group.offsetWidth; // flush styles so the reveal transitions actually play
        show.forEach(function (it, j) { it.style.setProperty('--i', Math.min(j, 5)); setIn(it, true); });
      }
      if (hide.length && !reduce) {
        hide.forEach(function (it) { it.classList.add('swap-out'); });
        pending = { fn: done, t: setTimeout(flush, 210) };
      } else {
        done();
      }
    });
  }

  bindFilter('skillFilters', '#skillGrid .skill-card', 'data-cat');
  bindFilter('projFilters', '.project', 'data-type', updateFlip);
  updateFlip();

  /* ===== FILTER KHUSUS PROJECT ORGANIZATION ===== */

  var featuredOrganization = document.querySelector(
    '#projects .project-org-featured'
  );

  var projectFilterButtons = document.querySelectorAll(
    '#projFilters [data-f]'
  );

  // Project 6 disembunyikan pada tampilan awal
  if (featuredOrganization) {
    featuredOrganization.hidden = true;
  }

  // Atur Project 6 berdasarkan kategori yang dipilih

  projectFilterButtons.forEach(function(button) {

    button.addEventListener('click', function() {

      if (!featuredOrganization) return;

      var selectedCategory = button.getAttribute('data-f');

      var expanded = projectSection.classList.contains(
        'projects-expanded'
      );

      if (selectedCategory === 'organization') {
        featuredOrganization.hidden = false;
      } 
      else if (
        selectedCategory === 'all' ||
        selectedCategory === 'semua'
      ) {
        featuredOrganization.hidden = !expanded;
      } 
      else {
        featuredOrganization.hidden = true;
      }

      updateFlip();

    });

  });



  /* ===== TOMBOL TAMPILKAN LEBIH BANYAK PROJECT ===== */

  var projectSection = document.getElementById('projects');
  var projectMoreButton = document.getElementById('showMoreProjects');
  var projectMoreWrap = document.getElementById('projectMoreWrap');

  if (projectSection && projectMoreButton && projectMoreWrap) {

    projectMoreButton.addEventListener('click', function () {

      var extraProjects = projectSection.querySelectorAll('.project-extra');

      if (extraProjects.length === 0) {
        return;
      }

      projectSection.classList.add('projects-expanded');

      // Tampilkan Project 6 juga
      if (featuredOrganization) {
        featuredOrganization.hidden = false;
      }

      // Sembunyikan tombol setelah diklik
      projectMoreWrap.hidden = true;

      updateFlip();

      projectMoreButton.setAttribute('aria-expanded', 'true');

    });

  }

  /* ================================================ */


  /* ----- 3D tilt + magnetic buttons (mouse only) ----- */
  if (fine && !reduce) {
    document.querySelectorAll('.polaroid, .shot, .intern, .edu-card').forEach(function (el) {
      var max = el.classList.contains('shot') ? 4 : 8;
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--ry', (px * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-py * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--gx', ((px + .5) * 100).toFixed(1) + '%'); el.style.setProperty('--gy', ((py + .5) * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); });
    });
    document.querySelectorAll('.cta, .btn').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.translate = ((e.clientX - r.left - r.width / 2) * .22).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function () { el.style.translate = ''; });
    });
  }

  /* ----- lightbox: the screenshot flies from its thumbnail to the full view and back ----- */
  var lb = document.getElementById('lightbox'), lbImg = document.getElementById('lbImg'), lbCap = document.getElementById('lbCap'), lbClose = document.getElementById('lbClose');
  var opener = null, lbBusy = false;
  function flipFrames(from, to) {
    return [
      { transformOrigin: '0 0', transform: 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(' + (from.width / to.width) + ',' + (from.height / to.height) + ')' },
      { transformOrigin: '0 0', transform: 'none' }
    ];
  }
  function openLb(shot) {
    var img = shot.querySelector('img');
    opener = shot;
    var from = shot.getBoundingClientRect();
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = shot.getAttribute('data-cap') || '';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
    if (reduce || !lb.animate) return;
    lbImg.style.opacity = '0'; // stay invisible until the image has decoded and has its real size
    function go() {
      var to = lbImg.getBoundingClientRect();
      lbImg.style.opacity = '';
      shot.style.visibility = 'hidden';
      lb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
      lbImg.animate(flipFrames(from, to), { duration: 440, easing: 'cubic-bezier(.2,.8,.2,1)' });
      lbCap.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 350, delay: 220, easing: 'ease-out', fill: 'backwards' });
    }
    (lbImg.decode ? lbImg.decode() : Promise.resolve()).then(go, go);
  }
  function finishClose() {
    if (lb.getAnimations) lb.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
    lb.hidden = true;
    lbImg.style.opacity = '';
    document.body.style.overflow = '';
    lbBusy = false;
    if (opener) { opener.style.visibility = ''; opener.focus(); }
  }
  function closeLb() {
    if (lb.hidden || lbBusy) return;
    if (reduce || !lb.animate) { finishClose(); return; }
    lbBusy = true;
    var thumb = opener ? opener.getBoundingClientRect() : null;
    var onScreen = thumb && thumb.bottom > 0 && thumb.top < innerHeight && thumb.right > 0 && thumb.left < innerWidth;
    var a = lb.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in', fill: 'forwards' });
    if (onScreen) {
      lbImg.animate(flipFrames(thumb, lbImg.getBoundingClientRect()).reverse(), { duration: 320, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
    } else {
      lbImg.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94)' }], { duration: 320, fill: 'forwards' });
    }
    lbCap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' });
    a.onfinish = finishClose;
  }
  document.addEventListener('click', function (e) {
    var s = e.target.closest('.shot');
    if (s && lb.hidden) openLb(s);
  });
  lbClose.addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'Tab') { e.preventDefault(); lbClose.focus(); }
  });

  /* ----- copy buttons ----- */
  var live = document.getElementById('copyLive');
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    var original = b.textContent;
    b.addEventListener('click', function () {
      var el = document.getElementById(b.getAttribute('data-copy'));
      var text = el.textContent.trim();
      function done(ok) {
        b.textContent = ok ? 'Tersalin' : 'Tekan lama untuk salin';
        live.textContent = ok ? 'Tersalin ke papan klip' : 'Teks sudah terpilih, salin secara manual';
        if (ok) { b.classList.remove('ok'); void b.offsetWidth; b.classList.add('ok'); }
        setTimeout(function () { b.textContent = original; b.classList.remove('ok'); }, 2000);
      }
      function fallback() {
        var ok = false;
        try {
          var r = document.createRange(); r.selectNodeContents(el);
          var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
          ok = document.execCommand('copy');
        } catch (e) {}
        done(ok);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
      } else { fallback(); }
    });
  });

  /* ----- SWIPE MODE: each section becomes a full-screen slide you can swipe left/right ----- */
  var slideIds = ['top', 'about', 'education', 'internship', 'skills', 'projects', 'experience', 'contact'];
  var slideNames = ['Home', 'About', 'Education', 'Internship', 'Skill', 'Project', 'Experience', 'Contact'];
  var slideEls = slideIds.map(function (id) { return document.getElementById(id); });
  var N = slideEls.length, si = 0, drag = null, suppress = false, wheelLock = 0;
  var modeBtn = document.getElementById('modeBtn'), modeCta = document.getElementById('modeCta');
  var ui = null, dots = [], prevBtn = null, nextBtn = null, hint = null, hintT = 0;
  var heroAnimSel = '.hero .eyebrow, .hero h1 .ch, .name-pill, .hero-tags li, .cta, .cta-ghost, .hills path, .p-a, .p-b';
  var CHEV_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var CHEV_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  function buildUI() {
    ui = document.createElement('div');
    ui.className = 'pager-ui';
    ui.innerHTML =
      '<button class="pg-arrow pg-prev" type="button" aria-label="Halaman sebelumnya">' + CHEV_L + '</button>' +
      '<button class="pg-arrow pg-next" type="button" aria-label="Halaman berikutnya">' + CHEV_R + '</button>' +
      '<div class="dots" role="group" aria-label="Pilih halaman"></div>' +
      '<div class="swipe-hint" aria-hidden="true">' + CHEV_L.replace('<svg ', '<svg class="l" ') + '<span></span>' + CHEV_R.replace('<svg ', '<svg class="r" ') + '</div>';
    document.body.appendChild(ui);
    var wrap = ui.querySelector('.dots');
    slideNames.forEach(function (name, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', name);
      b.addEventListener('click', function () { goTo(i); });
      wrap.appendChild(b); dots.push(b);
    });
    prevBtn = ui.querySelector('.pg-prev'); nextBtn = ui.querySelector('.pg-next'); hint = ui.querySelector('.swipe-hint');
    prevBtn.addEventListener('click', function () { goTo(si - 1); });
    nextBtn.addEventListener('click', function () { goTo(si + 1); });
  }
  function showHint() {
    if (!hint) return;
    hint.querySelector('span').textContent = fine ? 'Geser atau tekan ← →' : 'Geser kiri / kanan';
    hint.classList.add('show');
    clearTimeout(hintT); hintT = setTimeout(hideHint, 3800);
  }
  function hideHint() { if (hint) hint.classList.remove('show'); }

  /* Position every slide from the current index plus the finger offset (dx, in px). */
  function layout(dx) {
    var W = document.documentElement.clientWidth || window.innerWidth;
    slideEls.forEach(function (s, i) {
      var p = (i - si) + (dx || 0) / W, a = Math.abs(p), c = Math.min(a, 1), st = s.style;
      if (i < si) st.transformOrigin = '100% 50%';
      else if (i > si) st.transformOrigin = '0% 50%';
      else if (dx) st.transformOrigin = dx < 0 ? '100% 50%' : '0% 50%';
      st.visibility = a > 1.35 ? 'hidden' : 'visible';
      st.transform = a < .0005 ? 'none' :
        'perspective(1400px) translate3d(' + (p * 100).toFixed(3) + '%,0,0) rotateY(' + (p * 12).toFixed(2) + 'deg) scale(' + (1 - .08 * c).toFixed(4) + ')';
      st.opacity = (1 - .45 * c).toFixed(3);
      st.zIndex = String(10 - Math.round(c * 5));
      st.pointerEvents = i === si ? 'auto' : 'none';
      st.setProperty('--pd', Math.max(-1.2, Math.min(1.2, p)).toFixed(3));
      s.inert = i !== si;
    });
    hero.style.setProperty('--hy', Math.min(1, Math.abs(-si + (dx || 0) / W)).toFixed(3));
    if (star) star.style.setProperty('--sr', (-((2 - si) + (dx || 0) / W) * 90).toFixed(1) + 'deg');
  }
  function syncUI() {
    dots.forEach(function (d, k) { if (k === si) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    if (prevBtn) prevBtn.disabled = si === 0;
    if (nextBtn) nextBtn.disabled = si === N - 1;
    nav.style.setProperty('--p', (si / (N - 1)).toFixed(4));
    setCurrent(si === 0 ? null : byId[slideIds[si]]);
  }
  /* Replay a slide's entrance animations every time you arrive on it */
  function replay(s) {
    if (reduce) return;
    if (s === hero) {
      var els = document.querySelectorAll(heroAnimSel);
      els.forEach(function (el) { el.style.animation = 'none'; });
      void hero.offsetWidth;
      els.forEach(function (el) { el.style.animation = ''; });
      return;
    }
    var items = s.querySelectorAll('.rv');
    items.forEach(function (el) { el.classList.remove('in'); });
    void s.offsetWidth;
    items.forEach(function (el) { if (io2) io2.observe(el); else reveal(el); });
  }
  function goTo(i) {
    i = Math.max(0, Math.min(N - 1, i));
    if (i !== si) {
      si = i;
      var s = slideEls[si];
      s.scrollTop = 0;
      replay(s);
      syncUI();
      try { history.replaceState(null, '', '#' + slideIds[si]); } catch (e) {}
      try { s.focus({ preventScroll: true }); } catch (e) {}
    }
    layout(0);
  }

  /* ----- touch / pen swipe with a live drag ----- */
  document.addEventListener('pointerdown', function (e) {
    if (!swipeOn || !lb.hidden || e.pointerType === 'mouse' || !e.isPrimary || !e.target.closest('.slide')) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lock: null, dx: 0, v: 0, lx: e.clientX, lt: performance.now() };
  }, { passive: true });
  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.lock) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.lock = Math.abs(dx) > Math.abs(dy) * 1.3 ? 'x' : 'y';
      if (drag.lock === 'x') { root.classList.add('dragging'); hideHint(); }
    }
    if (drag.lock !== 'x') return;
    var now = performance.now();
    drag.v = (e.clientX - drag.lx) / Math.max(1, now - drag.lt);
    drag.lx = e.clientX; drag.lt = now;
    if ((si === 0 && dx > 0) || (si === N - 1 && dx < 0)) dx *= .3; // rubber-band at the ends
    drag.dx = dx;
    layout(dx);
  }, { passive: true });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag; drag = null;
    if (d.lock !== 'x') return;
    suppress = true; setTimeout(function () { suppress = false; }, 60);
    root.classList.remove('dragging');
    var W = document.documentElement.clientWidth || window.innerWidth;
    var fling = Math.abs(d.v) > .5, dir = 0;
    if (Math.abs(d.dx) > W * .2 || fling) dir = (fling ? d.v : d.dx) < 0 ? 1 : -1;
    goTo(si + dir);
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);
  document.addEventListener('click', function (e) { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);

  /* ----- trackpad two-finger swipe, keyboard arrows, nav/anchor links ----- */
  document.addEventListener('wheel', function (e) {
    if (!swipeOn || !lb.hidden) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5 && Math.abs(e.deltaX) > 12) {
      e.preventDefault();
      var now = Date.now();
      if (now - wheelLock > 750) goTo(si + (e.deltaX > 0 ? 1 : -1));
      wheelLock = now; // inertia keeps the lock until the gesture has really ended
    }
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
    if (!swipeOn || !lb.hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') { goTo(si + 1); hideHint(); }
    else if (e.key === 'ArrowLeft') { goTo(si - 1); hideHint(); }
  });
  document.addEventListener('click', function (e) {
    if (!swipeOn) return;
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var i = slideIds.indexOf(a.getAttribute('href').slice(1));
    if (i < 0) return;
    e.preventDefault();
    goTo(i);
  });

  /* ----- switching between scroll mode and swipe mode ----- */
  function updateModeUI(on) {
    var label = on ? 'Kembali ke mode scroll' : 'Ganti ke mode swipe (geser kiri/kanan)';
    modeBtn.setAttribute('aria-pressed', String(on));
    modeBtn.setAttribute('aria-label', label);
    modeBtn.title = label;
    modeCta.textContent = on ? '↕ Kembali ke mode scroll' : '↔ Coba mode swipe';
  }
  function setSwipe(on, initial) {
    if (on === swipeOn) return;
    if (on) {
      var idx = 0, hi = slideIds.indexOf((location.hash || '').slice(1));
      if (initial && hi > 0) idx = hi;
      else slideEls.forEach(function (s, k) { if (s.getBoundingClientRect().top <= window.innerHeight * .45) idx = k; });
      swipeOn = true; si = idx;
      if (!ui) buildUI();
      root.classList.add('swipe', 'dragging');
      slideEls.forEach(function (s) { s.classList.add('slide'); s.setAttribute('tabindex', '-1'); s.scrollTop = 0; });
      layout(0);
      syncUI();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          root.classList.remove('dragging');
          replay(slideEls[si]);
          if (!initial) showHint();
        });
      });
    } else {
      var target = slideEls[si];
      swipeOn = false; hideHint();
      root.classList.remove('swipe', 'dragging');
      slideEls.forEach(function (s) {
        s.classList.remove('slide'); s.removeAttribute('tabindex'); s.inert = false;
        ['transform', 'transformOrigin', 'opacity', 'visibility', 'zIndex', 'pointerEvents'].forEach(function (pr) { s.style[pr] = ''; });
        s.style.removeProperty('--pd');
      });
      hero.style.setProperty('--hy', '0');
      var prevB = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      if (si === 0) window.scrollTo(0, 0); else target.scrollIntoView({ block: 'start' });
      root.style.scrollBehavior = prevB;
      frame();
    }
    updateModeUI(on);
    try { localStorage.setItem('ss-mode', on ? 'swipe' : 'scroll'); } catch (e) {}
  }
  function toggleMode() {
    var next = !swipeOn;
    if (!reduce && document.startViewTransition) {
      root.classList.add('vt-mode');
      var t = document.startViewTransition(function () { setSwipe(next); });
      var clear = function () { root.classList.remove('vt-mode'); };
      t.finished.then(clear, clear);
    } else {
      setSwipe(next);
    }
  }
  modeBtn.addEventListener('click', toggleMode);
  modeCta.addEventListener('click', toggleMode);
  updateModeUI(false);
  try { if (localStorage.getItem('ss-mode') === 'swipe') setSwipe(true, true); } catch (e) {}

  frame();
})();
