/* Matheuso ✦ Art Director — roteador (hash) + renderização a partir de window.DATA */
(function(){
  var D = window.DATA, app = document.getElementById('app'), view = null;
  var current = null, first = true, paneTop = 0;
  var ioLoad = null, ioPlay = null, ioRv = null, ioBr = null, brRaf = 0, mqTimer = null, fitTimer = null;
  var ROOT = document.documentElement;
  var SITE = 'Matheuso ✦ Sr. Art Director';
  /* troféu 🏆 só aparece se o aparelho desenhar o emoji em cor (senão ficaria um quadradinho) */
  (function(){
    try {
      var c = document.createElement('canvas'); c.width = c.height = 28;
      var x = c.getContext('2d'); x.textBaseline = 'top';
      x.font = '20px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      x.fillText('\uD83C\uDFC6', 2, 2);
      var d = x.getImageData(0, 0, 28, 28).data;
      for (var i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 60 && (Math.abs(d[i] - d[i + 1]) > 14 || Math.abs(d[i + 1] - d[i + 2]) > 14)) { ROOT.classList.add('emoji-ok'); break; }
      }
    } catch (e) {}
  })();
  if ('IntersectionObserver' in window) ROOT.classList.add('rv-on');

  function route(){
    return location.hash.replace(/^#\/?/, '').split('?')[0].replace(/\/$/, '');
  }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

  /* ------------------------------------------------------------ barras (persistentes: não reiniciam ao trocar de página) */
  function top(){
    var nav = D.nav.map(function(n){ return '<a href="' + n[1] + '">' + n[0] + '</a>'; }).join('');
    return '<header class="top"><div class="top-in"><div class="mq" aria-hidden="true"><div class="lp" data-mq="loop"><div class="lp-g"><span>' + D.unit + '</span></div></div></div><nav class="nav" aria-label="principal">' + nav + '</nav></div></header>';
  }
  function foot(){
    return '<footer class="foot" aria-hidden="true"><div class="lp" data-mq="loop"><div class="lp-g"><span>' + D.unit + '</span></div></div></footer>';
  }

  /* ------------------------------------------------------------ mídia */
  function img(m, extra, cls){
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + m.s + '" alt="" loading="lazy" decoding="async" draggable="false"' + (extra || '') + '>';
  }
  function cropStyle(c){ return ' style="left:' + c[0] + '%;top:' + c[1] + '%;width:' + c[2] + '%;height:' + c[3] + '%"'; }
  function cell(c){
    if (c.k === 'col') {
      return '<div class="col" style="--a:' + c.a + '">' + c.cells.map(cell).join('') + '</div>';
    }
    var st = ' style="--a:' + c.a + '"', inner = '', cls = 'cell rv';
    if (c.k === 'i') {
      if (c.c) { cls += ' crop'; inner = img(c, cropStyle(c.c)); } else inner = img(c);
    } else if (c.k === 'm') {
      cls += ' v';
      inner = '<video data-src="' + c.s + '" poster="' + c.p + '" muted loop playsinline preload="none" disablepictureinpicture tabindex="-1"></video>';
    } else if (c.k === 'x') {
      cls += ' v';
      /* autoplay + mudo + loop (muted=1 é o que permite o autoplay nos navegadores) */
      inner = '<iframe data-src="https://player.vimeo.com/video/' + c.id + '?autoplay=1&muted=1&loop=1&autopause=0&title=0&byline=0&portrait=0" title="Vimeo" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    }
    return '<div class="' + cls + '"' + st + '>' + inner + '</div>';
  }
  function credits(cr){
    return '<section class="cred"><div class="cred-g">' + cr.map(function(s){
      return '<div class="sec rv' + (/^(projeto|ficha t[eé]cnica)$/i.test(s.l.trim()) ? ' caps' : '') + '"><div class="sec-l">' + s.l + '</div>' + s.p.map(function(p){
        return '<p class="t' + (p.b ? ' b' : '') + (p.u ? ' u' : '') + (p.j ? ' j' : '') + '">' + p.h + '</p>';
      }).join('') + '</div>';
    }).join('') + '</div></section>';
  }

  /* ------------------------------------------------------------ páginas (só o conteúdo de #view) */
  function project(key, cls){
    var p = D.pages[key];
    return '<main class="page ' + (cls || '') + '"><section class="gal" aria-label="' + esc(p.t) + '">' +
      p.rows.map(function(r){ return '<div class="row">' + r.map(cell).join('') + '</div>'; }).join('') +
      '</section>' + credits(p.cr) + '</main>';
  }
  function home(){
    var H = D.home;
    var cards = H.cards.map(function(c){
      var b = c.badge ? '<span class="badge" style="left:' + c.badge.l + '%;top:' + c.badge.t + '%;width:' + c.badge.w + '%;height:' + c.badge.h + '%">' +
        '<img src="' + c.badge.s + '" alt=""' + (c.badge.c ? cropStyle(c.badge.c) : '') + '></span>' : '';
      var name = c.r.replace('#/', '');
      return '<a class="card rv" href="' + c.r + '" style="--a:' + c.a + '" aria-label="' + esc(D.pages[name] ? D.pages[name].t : name) + '">' + img(c) + b + '</a>';
    }).join('');
    return '<main class="page"><div class="face"><p class="meta">' + H.meta + '</p><div class="portrait-h"><img src="' + H.face + '" alt="Matheuso" decoding="async"></div></div>' +
      '<nav class="pane" aria-label="projetos">' + cards + '</nav></main>';
  }
  function stuff(){
    var S = D.pages.stuff;
    var cells = S.cells.map(function(c){
      if (c.c) return '<div class="crop rv" style="--a:' + c.a + '">' + img(c, cropStyle(c.c)) + '</div>';
      return img(c, ' style="--a:' + c.a + '"', 'rv');
    }).join('');
    return '<main class="page stuff"><section class="st-intro"><h1 class="st-title rv">' + S.title + '</h1><pre class="art" aria-hidden="true">' + esc(S.art1) + '</pre></section>' +
      '<section class="st-gal">' + cells + '</section><section class="st-outro"><pre class="art" aria-hidden="true">' + esc(S.art2) + '</pre></section></main>';
  }
  function about(){
    var A = D.pages.about;
    var orn = A.orn.map(function(o){
      return '<pre class="orn" aria-hidden="true" style="left:' + o.x + '%;top:' + o.y + '%;font-size:' + o.fs + 'cqw;line-height:' + (o.lh / o.fs).toFixed(3) + '">' + esc(o.t) + '</pre>';
    }).join('');
    /* o player do iPod fica SOBRE a parte baixa do retrato (área vazada): não ocupa linha própria e não gera quebra/rolagem extra */
    return '<main class="page about"><div class="collage">' +
      '<div class="col-l"><p class="ab-t bio rv">' + A.left[0] + '</p><p class="ab-t awd rv">' + A.left[1] + '</p><p class="ab-t form rv">' + A.left[2] + '</p></div>' +
      '<figure class="portrait rv" style="--a:' + A.ar + '"><div class="pfig">' + img({s: A.img}, '') +
      '<div class="player"><iframe data-src="player/index.html" title="Player" allow="autoplay"></iframe></div></div>' + orn + '</figure>' +
      '<div class="col-r"><p class="ab-t exp rv">' + A.exp + '</p>' +
      '<a class="li" href="' + esc(A.li.url) + '" target="_blank" rel="noopener" aria-label="LinkedIn"><img src="' + A.li.svg + '" alt="" width="30"></a></div>' +
      '</div></main>';
  }

  /* ------------------------------------------------------------ letreiros */
  function marquees(){
    /* topo e rodapé: mesmo letreiro em loop, mesma velocidade (138,5 px/s). O menu do topo não anda. */
    [].forEach.call(app.querySelectorAll('[data-mq="loop"]'), function(f){
      var box = f.parentNode, w = box.clientWidth;
      if (!w) return;                                   // topo escondido (celular): nada a animar
      var g = f.firstElementChild, k = 0;
      g.innerHTML = '<span>' + D.unit + '</span>';
      while (g.scrollWidth < w * 1.1 && k++ < 14) g.insertAdjacentHTML('beforeend', '<span>' + D.unit + '</span>');
      while (f.children.length > 1) f.removeChild(f.lastChild);
      f.appendChild(g.cloneNode(true));
      f.style.setProperty('--dur', Math.max(6, g.scrollWidth / 138.5).toFixed(2) + 's');
    });
  }

  /* ------------------------------------------------------------ braille / dot art animados */
  function hs(a, f){ var s = Math.sin(a * 12.9898 + f * 78.233) * 43758.5453; return s - Math.floor(s); }
  function brailleStart(){
    cancelAnimationFrame(brRaf);
    if (ioBr) ioBr.disconnect();
    var items = [].map.call(view.querySelectorAll('.art,.orn'), function(el, n){
      var rows = el.textContent.split('\n').map(function(l){
        return Array.from(l).map(function(ch){ return ch.codePointAt(0); });
      });
      var w = 1; rows.forEach(function(r){ if (r.length > w) w = r.length; });
      return {el: el, rows: rows, w: w, h: rows.length, n: n, on: true};
    });
    if (!items.length) return;
    ioBr = new IntersectionObserver(function(es){
      es.forEach(function(e){ items.forEach(function(it){ if (it.el === e.target) it.on = e.isIntersecting; }); });
    });
    items.forEach(function(it){ ioBr.observe(it.el); });
    var last = 0;
    function draw(it, t){
      var f = Math.floor(t / 90);
      var p = ((t / 1000) * 0.17 + it.n * 0.43) % 1.75 - 0.35;        // posição da onda que varre a arte
      var out = '';
      for (var y = 0; y < it.h; y++) {
        var r = it.rows[y];
        for (var x = 0; x < r.length; x++) {
          var c = r[x];
          if (c < 0x2800 || c > 0x28ff) { out += String.fromCharCode(c); continue; }
          var m = c - 0x2800;
          var k = Math.max(0, 1 - Math.abs((x / it.w) * 0.75 + (y / it.h) * 0.45 - p) / 0.2);
          for (var b = 0; b < 8; b++) {
            var rn = hs(x * 7 + y * 131 + b * 17 + it.n * 3, f);
            if ((m >> b) & 1) { if (rn < k * 0.85 + 0.012) m &= ~(1 << b); }
            else if (rn > 1 - k * 0.2) m |= (1 << b);
          }
          out += String.fromCharCode(0x2800 + m);
        }
        if (y < it.h - 1) out += '\n';
      }
      it.el.textContent = out;
    }
    function tick(t){
      brRaf = requestAnimationFrame(tick);
      if (t - last < 90) return;
      last = t;
      items.forEach(function(it){ if (it.on) draw(it, t); });
    }
    brRaf = requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------ player do iPod: escala para caber sobre o retrato */
  function fitPlayer(){
    var p = app.querySelector('.about .portrait');
    if (!p) return;
    var grid = getComputedStyle(p.parentNode).display === 'grid';
    /* desktop: a imagem (só ela, sem os ornamentos) cresce até 18% a partir da base, ocupando a margem vazada acima do gorro,
       sem passar por baixo da barra do topo */
    var pz = 1;
    if (grid) {
      var r = p.getBoundingClientRect(), hb = app.querySelector('.top').getBoundingClientRect().bottom;
      pz = Math.max(1, Math.min(1.18, 1 + (r.top - hb - 8) / r.height));
    }
    p.style.setProperty('--pz', pz.toFixed(3));
    var w = p.clientWidth, ps = Math.max(0.45, Math.min(1, w * (grid ? 0.43 : (w < 420 ? 0.6 : 0.5)) / 356));
    p.style.setProperty('--ps', ps.toFixed(3));
  }

  /* ------------------------------------------------------------ carregamento lento, autoplay mudo, revelação ao rolar */
  function vimeo(f, m){ try { f.contentWindow.postMessage(JSON.stringify({method: m}), '*'); } catch (e) {} }
  function lazy(){
    [ioLoad, ioPlay, ioRv].forEach(function(o){ if (o) o.disconnect(); });
    var media = view.querySelectorAll('video[data-src],iframe[data-src]');
    ioLoad = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        var v = e.target;
        if (!v.getAttribute('src') && v.dataset.src) {
          if (v.tagName === 'VIDEO') { v.muted = true; v.defaultMuted = true; v.setAttribute('muted', ''); }
          v.setAttribute('src', v.dataset.src);
          if (v.tagName === 'IFRAME') v.addEventListener('load', function(){ v.dataset.ready = '1'; }, {once: true});
        }
        ioLoad.unobserve(v);
      });
    }, {rootMargin: '300px 0px'});
    ioPlay = new IntersectionObserver(function(es){
      es.forEach(function(e){
        var v = e.target;
        if (v.tagName === 'VIDEO') {
          if (e.isIntersecting) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function(){}); }
          else v.pause();
        } else if (v.dataset.ready && /vimeo/.test(v.getAttribute('src') || '')) {
          vimeo(v, e.isIntersecting ? 'play' : 'pause');
        }
      });
    }, {threshold: 0.12});
    media.forEach(function(el){ ioLoad.observe(el); ioPlay.observe(el); });

    ioRv = new IntersectionObserver(function(es){
      var n = 0;
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--d', Math.min(n++, 7) * 70 + 'ms');
        e.target.classList.add('in');
        setTimeout(function(t){ t.style.setProperty('--d', '0s'); t.classList.add('done'); }, 1400, e.target);
        ioRv.unobserve(e.target);
      });
    }, {rootMargin: '0px 0px -4% 0px', threshold: 0.04});
    view.querySelectorAll('.rv').forEach(function(el){ ioRv.observe(el); });
  }

  /* ------------------------------------------------------------ montagem / troca de página */
  function mount(name){
    var html, title, home_ = false;
    if (name === '') { html = home(); title = SITE; home_ = true; }
    else if (name === 'stuff') { html = stuff(); title = 'Stuff — ' + SITE; }
    else if (name === 'about') { html = about(); title = 'About — ' + SITE; }
    else if (name === 'ar') { html = project('ar', 'ar'); title = 'A.R. — ' + SITE; }
    else if (D.pages[name]) { html = project(name); title = D.pages[name].t + ' — ' + SITE; }
    else { location.replace('#/'); return false; }
    current = name;
    document.body.className = home_ ? 'pg-home' : 'pg-' + name;
    app.className = home_ ? 'home' : '';
    view.innerHTML = html;
    document.title = title;
    var pane = view.querySelector('.pane');
    if (pane && paneTop) pane.scrollTop = paneTop;
    fitPlayer(); lazy(); brailleStart();
    window.scrollTo(0, 0);
    return true;
  }

  /* elemento compartilhado: a imagem do card "vira" a primeira imagem do projeto (e volta) */
  function firstCell(){ return view.querySelector('.gal .cell'); }
  function cardOf(slug){
    return slug && /^[a-z0-9]+$/.test(slug) ? view.querySelector('.card[href="#/' + slug + '"]') : null;
  }
  function inView(el){
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  }
  function clearNames(){
    [].forEach.call(view.querySelectorAll('.card,.cell'), function(e){ if (e.style.viewTransitionName) e.style.viewTransitionName = ''; });
  }
  function markOld(prev, next){
    clearNames();
    var el = null;
    if (prev === '') el = cardOf(next);
    else if (next === '' && D.pages[prev]) el = firstCell();
    if (el && inView(el)) el.style.viewTransitionName = 'proj';
  }
  function markNew(prev, next){
    var el = null;
    if (next === '') el = cardOf(prev);
    else if (prev === '' && D.pages[next]) el = firstCell();
    if (el) el.style.viewTransitionName = 'proj';
  }
  function swapPlain(fn){
    view.classList.add('out');
    setTimeout(function(){
      fn();
      view.classList.remove('out');
      view.classList.remove('in'); void view.offsetWidth; view.classList.add('in');
    }, 140);
  }

  function go(){
    var next = route(), prev = current;
    if (!first && next === prev) return;
    var pane = view.querySelector('.pane');
    if (pane) paneTop = pane.scrollTop;
    if (first) { first = false; mount(next); return; }
    if (document.startViewTransition) {
      markOld(prev, next);
      var vt = document.startViewTransition(function(){ if (mount(next)) markNew(prev, next); });
      ['ready', 'finished', 'updateCallbackDone'].forEach(function(k){ if (vt[k] && vt[k].catch) vt[k].catch(function(){}); });
      if (vt.finished && vt.finished.then) vt.finished.then(clearNames, clearNames);
    } else {
      swapPlain(function(){ mount(next); });
    }
  }

  /* ------------------------------------------------------------ início */
  app.innerHTML = top() + '<div id="view"></div>' + foot();
  view = document.getElementById('view');
  marquees();
  window.addEventListener('hashchange', go);
  window.addEventListener('resize', function(){
    clearTimeout(mqTimer); mqTimer = setTimeout(marquees, 150);
    clearTimeout(fitTimer); fitTimer = setTimeout(fitPlayer, 60);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(marquees);
  go();
})();
