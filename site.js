(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function p2(n) { return n < 10 ? '0' + n : '' + n; }

  /* Footer year */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* Timecodes (hero viewfinder and contact form) */
  var tcs = document.querySelectorAll('.tc, .tc-live');
  if (tcs.length && !reduce) {
    var start = performance.now() + 83000;
    setInterval(function () {
      var f = Math.floor((performance.now() - start) / (1000 / 24)) + 2000;
      var fr = f % 24, s = Math.floor(f / 24) % 60, m = Math.floor(f / 1440) % 60, h = Math.floor(f / 86400);
      var t = p2(h) + ':' + p2(m) + ':' + p2(s) + ':' + p2(fr);
      tcs.forEach(function (e) { e.textContent = t; });
    }, 42);
  }

  /* Skills timeline */
  var head = document.getElementById('head');
  var clips = document.querySelectorAll('.clip');
  if (head && clips.length) {
    var T = [
      ["Photography", "Live event coverage and photo editing, from the first frame on the floor to the final gallery."],
      ["Videography", "Event filming and pre-production, so the footage works when it reaches the edit."],
      ["Video editing", "Montages, promo videos, highlight reels and content edits built for the platforms they run on."],
      ["Event coordination", "Planning and tournament operations, plus on-site support on show day."],
      ["Social and content", "Account management, content strategy and copywriting that keep a community engaged."]
    ];
    var pick = function (c) {
      clips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      var t = T[+c.dataset.t], p = +c.dataset.p / 100, sec = p * 60;
      head.style.setProperty('--p', p);
      document.getElementById('mt').textContent = t[0];
      document.getElementById('md').textContent = c.dataset.d || t[1];
      document.getElementById('ms').textContent = 'Clip: ' + c.dataset.l;
      document.getElementById('mtc').textContent = '00:00:' + p2(Math.floor(sec)) + ':' + p2(Math.floor((sec % 1) * 24));
    };
    clips.forEach(function (c) { c.addEventListener('click', function () { pick(c); }); });
    pick(clips[0]);
  }

  /* Photos: until a photo file exists, show a labelled placeholder that says where to save it */
  function label(box, text) {
    var l = box.querySelector('.ph-label');
    if (!l) { l = document.createElement('span'); l.className = 'ph-label'; box.appendChild(l); }
    l.textContent = text;
    box.classList.add('missing');
  }
  function missing(img) {
    var box = img.closest('.pc-img, .shot, .al-img, .alt');
    if (!box) return;
    label(box, 'Add ' + (img.getAttribute('src') || '').replace(/^(\.\.\/)+/, ''));
    img.remove();
  }
  document.querySelectorAll('.pc-img img, .shot img, .al-img img, .alt img').forEach(function (img) {
    if (img.complete && !img.naturalWidth) missing(img);
    else img.addEventListener('error', function () { missing(img); });
  });

  /* Videos: paste a YouTube or Vimeo link into data-video on a .shot.video block */
  function embedUrl(u) {
    var m;
    if ((m = u.match(/(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/)))
      return 'https://www.youtube.com/embed/' + m[1];
    if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)))
      return 'https://player.vimeo.com/video/' + m[1];
    return '';
  }
  document.querySelectorAll('.video').forEach(function (box) {
    var src = embedUrl((box.getAttribute('data-video') || '').trim());
    if (src) {
      var f = document.createElement('iframe');
      f.src = src; f.loading = 'lazy'; f.allowFullscreen = true;
      f.title = box.getAttribute('data-title') || 'Project video';
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      box.appendChild(f);
    } else {
      label(box, 'Add a YouTube or Vimeo link in data-video');
    }
  });

  /* Photocards: tilt toward the pointer and slide the foil shine with it */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    var vars = ['--rx', '--ry', '--mx', '--my'];
    document.querySelectorAll('.pcard').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--rx', ((0.5 - y) * 9).toFixed(2) + 'deg');
        c.style.setProperty('--ry', ((x - 0.5) * 11).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      c.addEventListener('pointerleave', function () {
        vars.forEach(function (k) { c.style.removeProperty(k); });
      });
    });
  }

  /* Videos: a YouTube video ID in data-yt sets the link and loads the thumbnail; with no ID the card shows an "add a link" placeholder */
  document.querySelectorAll('[data-yt]').forEach(function (a) {
    var id = (a.getAttribute('data-yt') || '').trim();
    var box = a.classList.contains('alt') ? a : a.querySelector('.vd-img');
    if (id) {
      a.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
      var im = document.createElement('img');
      im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
      im.src = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg';
      box.insertBefore(im, box.firstChild);
    } else if (box) {
      label(box, 'Add a YouTube link');
      a.addEventListener('click', function (e) { e.preventDefault(); });
    }
  });

  /* Home: Featured albums / Featured videos tabs that slide over */
  var tabs = document.querySelectorAll('.ftabs [role="tab"]'), track = document.querySelector('.ftrack'), fview = document.querySelector('.fview');
  if (tabs.length && track && fview) {
    var panels = [document.getElementById('pn-albums'), document.getElementById('pn-videos')];
    var cur = 0;
    var fit = function () { var h = panels[cur].offsetHeight; if (h) fview.style.height = (h + 44) + 'px'; };  // skip while the page is hidden (height 0)
    var show = function (i, focus) {
      cur = i;
      tabs.forEach(function (t, k) { var on = k === i; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
      panels.forEach(function (p, k) { p.setAttribute('aria-hidden', k === i ? 'false' : 'true'); if (k === i) p.removeAttribute('inert'); else p.setAttribute('inert', ''); });
      track.classList.toggle('v', i === 1);
      fit();
      if (focus) tabs[i].focus();
    };
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { show(k); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(k === 0 ? 1 : 0, true); }
      });
    });
    if (window.ResizeObserver) { var ro = new ResizeObserver(fit); panels.forEach(function (p) { ro.observe(p); }); }  // re-fit whenever content size changes (fonts, images, coming back to the page)
    window.addEventListener('pageshow', fit);
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);
    panels.forEach(function (p) { p.querySelectorAll('img').forEach(function (im) { im.addEventListener('load', fit); }); });
    if (location.hash === '#videos') { show(1); } else { fit(); }
    window.addEventListener('hashchange', function () { if (location.hash === '#videos') { show(1); } else if (location.hash === '#albums') { show(0); } });
  }

  /* All-albums page: filter tabs */
  var fb = document.querySelectorAll('.filters button');
  fb.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f');
      fb.forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      (b.closest('section') || document).querySelectorAll('.alt, .vd[data-cat]').forEach(function (t) { t.hidden = f !== 'all' && t.getAttribute('data-cat') !== f; });
    });
  });

  /* Contact page form. With a Formspree link in data-endpoint it sends in the background and stays on the page;
     without one it falls back to opening an email draft. */
  var cf = document.getElementById('cform');
  if (cf) {
    var note = document.getElementById('cnote'), send = cf.querySelector('.cp-send');
    var endpoint = (cf.getAttribute('data-endpoint') || '').trim(), mailTo = cf.getAttribute('data-email');
    if (endpoint) { note.textContent = 'Your message goes straight to my inbox.'; send.textContent = 'Send message'; }
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = cf.elements, bad = false;
      ['name', 'email', 'msg'].forEach(function (k) {
        var ok = f[k].value.trim() && (k !== 'email' || /^\S+@\S+\.\S+$/.test(f[k].value.trim()));
        f[k].classList.toggle('bad', !ok); if (!ok) bad = true;
      });
      if (bad) { note.textContent = 'Please fill in your name, a valid email and a short message.'; return; }

      if (endpoint) {
        send.disabled = true; send.textContent = 'Sending...';
        fetch(endpoint, { method: 'POST', body: new FormData(cf), headers: { Accept: 'application/json' } })
          .then(function (r) {
            if (!r.ok) throw new Error('bad status');
            cf.classList.add('done');
            document.getElementById('cthanks').hidden = false;
          })
          .catch(function () {
            send.disabled = false; send.textContent = 'Send message';
            note.textContent = 'Sorry, that did not send. Please try again, or email me directly at ' + mailTo + '.';
          });
        return;
      }

      var body = 'Name: ' + f.name.value.trim() + '\nEmail: ' + f.email.value.trim() + '\nNeed: ' + f.type.value +
        (f.when.value.trim() ? '\nWhen: ' + f.when.value.trim() : '') + '\n\n' + f.msg.value.trim();
      var url = 'mailto:' + mailTo + '?subject=' + encodeURIComponent('Project enquiry: ' + f.type.value) + '&body=' + encodeURIComponent(body);
      note.textContent = 'Opening your email app. If nothing opens, email me directly at ' + mailTo + '.';
      window.location.href = url;
    });
  }

  /* Always-on motion: keep it light, and let people stop it */
  var root = document.documentElement;
  try { if (localStorage.getItem('calm') === '1') root.classList.add('still'); } catch (e) {}

  // Pause the animations in sections that are scrolled out of view
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('off', !e.isIntersecting); });
    }, { rootMargin: '120px' });
    document.querySelectorAll('section, .ticker').forEach(function (el) { io.observe(el); });
  }

  // Footer link: pause or resume all animation (remembered on this device)
  document.querySelectorAll('footer .wrap').forEach(function (w) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'calm';
    var sync = function () {
      var on = root.classList.contains('still');
      b.textContent = on ? 'Play animations' : 'Pause animations';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    b.addEventListener('click', function () {
      root.classList.toggle('still');
      try { localStorage.setItem('calm', root.classList.contains('still') ? '1' : '0'); } catch (e) {}
      document.querySelectorAll('.calm').forEach(function (x) { x.dispatchEvent(new Event('sync')); });
    });
    b.addEventListener('sync', sync);
    sync();
    w.appendChild(b);
  });

  // Curved film strip: skill phrases scroll along the strip, sprocket holes move with them
  document.querySelectorAll('.ticker').forEach(function (strip) {
    var svg = strip.querySelector('svg'), tp = svg.querySelector('textPath'), holes = svg.querySelectorAll('.hole');
    var COPIES = 4, ph = (strip.getAttribute('data-phrases') || '').split('|'), NS = 'http://www.w3.org/2000/svg';
    var build = function (parent) {
      for (var r = 0; r < COPIES; r++) ph.forEach(function (t) {
        parent.appendChild(document.createTextNode(t + '   '));
        var s = document.createElementNS(NS, 'tspan'); s.setAttribute('class', 'sep'); s.textContent = '\u25AA   ';
        parent.appendChild(s);
      });
    };
    build(tp);
    var L = 0, off = 0, last = 0, visible = true;
    // Length of one set = full text divided by the number of copies
    var measure = function () { try { L = svg.querySelector('text').getComputedTextLength() / COPIES; } catch (e) { L = 0; } };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { rootMargin: '100px' }).observe(strip);
    window.addEventListener('load', measure);
    var lastMeasure = 0;
    var tick = function (t) {
      var dt = Math.min(64, t - last); last = t;
      // Re-measure until we have a real length, then every few seconds (fonts can change it)
      if (L <= 0 || t - lastMeasure > 4000) { lastMeasure = t; var prev = L; measure(); if (L <= 0) L = prev > 0 ? prev : 600; }
      if (!reduce && visible && !document.hidden && !root.classList.contains('still')) {
        off = (off + dt * 0.045) % L;               // px per ms
        tp.setAttribute('startOffset', (-off).toFixed(1));
        holes.forEach(function (h) { h.style.strokeDashoffset = (off % 25).toFixed(1); });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
})();
