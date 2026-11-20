/* Matheuso ✦ Art Director — roteador (hash) + renderização a partir de window.DATA */
(function(){
  var D = window.DATA, app = document.getElementById('app'), view = null;
  var current = null, first = true, paneTop = 0;
  var ioLoad = null, ioPlay = null, ioRv = null, mqTimer = null, fitTimer = null;
  var ROOT = document.documentElement;
  var SITE = 'Matheuso ✦ Sr. Art Director';
  /* idioma (PT / EN): o padrão é PT; a escolha fica salva no navegador. O inglês vem de i18n.js */
  var EN = window.I18N || null, LANG = 'pt';
  try { var sv = localStorage.getItem('lang'); if (EN && (sv === 'en' || sv === 'pt')) LANG = sv; } catch (e) {}
  function isEn(){ return LANG === 'en' && !!EN; }
  function tr(pt, en){ return isEn() ? en : pt; }
  document.documentElement.lang = isEn() ? 'en' : 'pt-BR';
  function rx(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function roles(html){
    EN.roles.forEach(function(r){ html = html.replace(new RegExp(rx(r[0]), 'gi'), r[1]); });
    return html;
  }
  /* troféu 🏆 só aparece se o aparelho desenhar o emoji em cor (senão ficaria um quadradinho) */
  (function(){
    try {
      var c = document.createElement('canvas'); c.width = c.height = 28;
      var x = c.getContext('2d'); x.textBaseline = 'top';
      x.font = '20px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      x.fillText('🏆', 2, 2);
      var d = x.getImageData(0, 0, 28, 28).data;
      for (var i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 60 && (Math.abs(d[i] - d[i + 1]) > 14 || Math.abs(d[i + 1] - d[i + 2]) > 14)) { ROOT.classList.add('emoji-ok'); break; }
      }
    } catch (e) {}
  })();
  if ('IntersectionObserver' in window) ROOT.classList.add('rv-on');
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function route(){
    return location.hash.replace(/^#\/?/, '').split('?')[0].replace(/\/$/, '');
  }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
  function plain(h){ var d = document.createElement('div'); d.innerHTML = String(h).replace(/<br\s*\/?>/gi, ' '); return d.textContent.replace(/\s+/g, ' ').trim(); }

  /* ------------------------------------------------------------ barras (persistentes: não reiniciam ao trocar de página) */
  function top(){
    var nav = D.nav.map(function(n){ return '<a href="' + n[1] + '">' + n[0] + '</a>'; }).join('');
    var sw = EN ? '<span class="lang" role="group" aria-label="Idioma / Language">' +
      '<button type="button" data-lang="pt" lang="pt" aria-pressed="' + (!isEn()) + '">PT</button><span aria-hidden="true">/</span>' +
      '<button type="button" data-lang="en" lang="en" aria-pressed="' + isEn() + '">EN</button></span>' : '';
    var mb = '<button type="button" class="mbtn" aria-expanded="false" aria-controls="menu"><span class="bars" aria-hidden="true"><i></i></span><span class="vh">Menu</span></button>';
    return '<header class="top"><div class="top-in">' + mb + '<div class="mq" aria-hidden="true"><div class="lp" data-mq="loop"><div class="lp-g"><span>' + D.unit + '</span></div></div></div><nav class="nav" aria-label="principal">' + nav + sw + '</nav></div></header>';
  }
  function foot(){
    return '<footer class="foot" aria-hidden="true"><div class="lp" data-mq="loop"><div class="lp-g"><span>' + D.unit + '</span></div></div></footer>';
  }

  /* ------------------------------------------------------------ mídia */
  function img(m, extra, cls){
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + m.s + '" alt="" loading="lazy" decoding="async" draggable="false"' + (extra || '') + '>';
  }
  function cropStyle(c){ return ' style="left:' + c[0] + '%;top:' + c[1] + '%;width:' + c[2] + '%;height:' + c[3] + '%"'; }
  /* vídeos com som no YouTube: a peça mostra o quadro (poster) e só carrega o player ao clicar — leve e com áudio */
  var YT = {
    micheltemluz: [{r: 1, c: 0, t: 'yt', id: '1kORePOQaLA'}, {r: 2, c: 1, t: 'ig', id: 'DMdzD9Tt_Rc'}, {r: 3, c: 0, t: 'yt', id: '0lKlEJoLrFo'}, {r: 4, c: 0, t: 'yt', id: 'Ne8hx15QQZg'}],
    luzi: [{r: 2, c: 0, t: 'yt', id: 'p5QPOXfhfPA'}, {r: 4, c: 0, t: 'yt', id: 'MBTxOBqr6Sw'}],
    braceletecash: [{r: 1, c: 0, t: 'ccv', id: 'RcXtsYKRKs6'}]   // vídeo do Behance (player da Adobe)
  };
  function ytCell(c, id, typ){
    var poster = c.p || c.s;
    return '<div class="cell v yt rv" style="--a:' + c.a + '"><button type="button" class="yt-b" data-t="' + (typ || 'yt') + '" data-yt="' + id + '"' + (c.k === 'm' ? ' data-mp4="' + c.s + '"' : '') + ' aria-label="' + tr('Assistir ao vídeo com som', 'Watch the video with sound') + '">' +
      '<img src="' + poster + '" alt="" loading="lazy" decoding="async"><span class="yt-p" aria-hidden="true">▶</span>' +
      '<span class="yt-l">' + tr('assistir com som', 'watch with sound') + ' ↗</span></button></div>';
  }
  function cell(c, eager){
    if (c.k === 'col') {
      return '<div class="col" style="--a:' + c.a + '">' + c.cells.map(function(x){ return cell(x); }).join('') + '</div>';
    }
    var st = ' style="--a:' + c.a + '"', inner = '', cls = 'cell rv';
    var ex = eager ? ' fetchpriority="high"' : '';
    if (c.k === 'i') {
      if (c.c) { cls += ' crop'; inner = img(c, cropStyle(c.c) + ex); } else inner = img(c, ex);
      if (eager) inner = inner.replace(' loading="lazy"', '');
    } else if (c.k === 'm') {
      cls += ' v';
      inner = '<video data-src="' + c.s + '" poster="' + c.p + '" muted loop playsinline preload="none" disablepictureinpicture tabindex="-1"></video>';
    } else if (c.k === 'x') {
      cls += ' v';
      /* autoplay + mudo + loop (muted=1 é o que permite o autoplay nos navegadores) */
      inner = '<iframe data-src="https://player.vimeo.com/video/' + c.id + '?autoplay=1&muted=1&loop=1&autopause=0&title=0&byline=0&portrait=0&dnt=1" title="Vimeo" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
    }
    /* Vimeo toca sozinho sem som (regra dos navegadores para autoplay); o botão liga o som. Os mp4 do site não têm faixa de áudio */
    if (c.k === 'x') inner += '<button type="button" class="snd" aria-pressed="false" aria-label="' + tr('Ligar o som', 'Turn sound on') + '"><span class="snd-i" aria-hidden="true">♪</span><span class="snd-t">' + tr('som', 'sound') + '</span></button>';
    return '<div class="' + cls + '"' + st + '>' + inner + '</div>';
  }

  /* ------------------------------------------------------------ contato (e-mail, WhatsApp, LinkedIn) */
  var CT = {mail: 'mxtheuso@gmail.com', wa: '5579998270618', waTxt: '+55 (79) 9 9827-0618'};
  var ICO = {
    'E-mail': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>',
    'WhatsApp': '<svg viewBox="0 0 24 24"><path d="M12 2.4a9.6 9.6 0 0 0-8.3 14.4L2.4 21.6l4.9-1.3A9.6 9.6 0 1 0 12 2.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.7 7.3c.2-.4.5-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.5.7c-.1.2-.2.3 0 .6.4.7 1 1.4 1.6 1.9.7.6 1.4.9 1.7 1 .2.1.4.1.5-.1l.8-.9c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.4 0 .3 0 1-.4 1.5-.4.5-1.3 1-2 1-1.3.1-2.6-.3-4.4-1.6-1.6-1.2-2.8-2.8-3.2-3.9-.5-1.3-.3-2.5.1-3.1z" fill="currentColor"/></svg>',
    'LinkedIn': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3.4a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6zM3 9.4h4v11.2H3zM9.6 9.4h3.8v1.6h.1c.5-1 1.8-2 3.7-2 4 0 4.8 2.6 4.8 6v5.6h-4v-5c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7v5.1h-4z"/></svg>'
  };  function contactItems(){
    var u = D.pages.about.li.url;
    return [
      ['E-mail', 'mailto:' + CT.mail, CT.mail, ''],
      ['WhatsApp', 'https://wa.me/' + CT.wa, CT.waTxt, ' target="_blank" rel="noopener"'],
      ['LinkedIn', u, u.replace(/^https?:\/\/(www\.)?linkedin\.com/, ''), ' target="_blank" rel="noopener"']
    ];
  }
  function contactList(cls){
    return '<ul class="cl ' + (cls || '') + '">' + contactItems().map(function(c){
      return '<li><a href="' + esc(c[1]) + '"' + c[3] + '><span class="cl-k">' + c[0] + '</span><span class="cl-v">' + esc(c[2]) + '</span><span class="cl-a" aria-hidden="true">↗</span></a></li>';
    }).join('') + '</ul>';
  }
  /* encerramento: o mesmo em todas as páginas internas (sem caixa; só linha fina, título e contatos) */
  function closing(id){
    return '<section class="close"' + (id ? ' id="' + id + '"' : '') + ' aria-labelledby="close-t"><div class="close-g">' +
      '<div class="close-h"><p class="kick">↘ ' + tr('Contato', 'Contact') + '</p>' +
      '<h2 class="close-t" id="close-t">' + tr('Vamos<br>conversar?', 'Let’s<br>talk?') + '<span class="close-s" aria-hidden="true">✶</span></h2></div>' +
      contactList() + '</div></section>';
  }

  /* ------------------------------------------------------------ textos dos projetos */
  var BOLD = /<span[^>]*font-weight:\s*700[^>]*>/i;
  /* PT: em blocos que trazem "PT … EN …" juntos, fica só o trecho em português */
  function ptOnly(h){
    var m = h.search(/<span[^>]*font-weight:\s*700[^>]*>\s*EN\s*(<br>)?\s*<\/span>/i);
    if (m > -1) h = h.slice(0, m);
    var m2 = h.search(/(<span[^>]*>\s*)?(<br>\s*)*context\s*\/\s*en/i);   // blocos com "context/en" no meio do texto
    if (m2 > -1) h = h.slice(0, m2);
    return h.replace(/<span[^>]*font-weight:\s*700[^>]*>\s*PT\s*(<br>)?\s*<\/span>/i, '').replace(/(\s|<br>)+$/, '').replace(/^(\s|<br>)+/, '');
  }
  function looksEn(h){
    var t = ' ' + plain(h).toLowerCase() + ' ';
    var en = (t.match(/\s(the|and|with|of|to|is|its|for|that|an)\s/g) || []).length;
    var pt = (t.match(/\s(de|da|do|que|com|para|uma|os|as|em|no|na)\s/g) || []).length;
    return en > pt;
  }
  /* devolve {name, extra[], texts[{l,h}], ft} no idioma atual, com o mesmo conteúdo de data.js / i18n.js */
  function projText(key){
    var p = D.pages[key], E = isEn() && EN.pages[key] ? EN.pages[key] : null;
    var cr = E ? creditsEn(p, E) : p.cr, out = {name: p.t, extra: [], texts: [], ft: null};
    cr.forEach(function(s, i){
      var l = s.l.trim(), ll = l.toLowerCase();
      if (i === 0 && /^(projeto|project)$/.test(ll)) {
        if (s.p[0]) out.name = plain(s.p[0].h) || p.t;
        s.p.slice(1).forEach(function(q){ q.h.split(/<br>/).forEach(function(x){ if (plain(x)) out.extra.push(x); }); });
      } else if (/^(ficha t[eé]cnica|credits)$/.test(ll)) {
        out.ft = s.p.map(function(q){ return q.h; }).join('<br><br>');
      } else {
        if (!E) {
          if (/\/\s*en$/.test(ll)) return;                        // bloco só em inglês: aparece no EN
          l = l.replace(/\s*\/\s*pt$/i, '');
        }
        var stop = false, h = s.p.map(function(q){
          if (E) return q.h;
          if (stop || /^context\s*\/\s*en$/i.test(plain(q.h))) { stop = true; return ''; }   // daqui pra frente é a versão em inglês
          var x = ptOnly(q.h); return looksEn(x) ? '' : x;
        }).filter(function(x){ return plain(x); }).join('<br><br>');
        if (!h || (!E && looksEn(h))) return;
        out.texts.push({l: l, h: h});
      }
    });
    return out;
  }
  /* créditos em inglês: título do projeto, contexto (e ideia) vêm de i18n.js; a ficha técnica traduz só os cargos */
  function creditsEn(p, E){
    var L = EN.labels, out = [], ctx = false;
    p.cr.forEach(function(s){
      var l = s.l.trim().toLowerCase();
      if (l === 'projeto') {
        out.push({l: L.project, p: s.p.map(function(q, n){ return n === 0 && E.proj ? {h: E.proj} : q; })});
      } else if (/^(contexto|context|insight)/.test(l)) {
        if (ctx) return;
        ctx = true;
        out.push({l: L.context, p: [{h: E.ctx}]});
        if (E.idea) out.push({l: L.idea, p: [{h: E.idea}]});
      } else {
        out.push({l: L.credits, p: s.p.map(function(q){ return {h: roles(q.h)}; })});
      }
    });
    return out;
  }
  /* ficha técnica: cada trecho em negrito vira um cargo (dt) e o que vem depois, os nomes (dd). O texto é o mesmo de data.js */
  function ftRows(h){
    var d = document.createElement('div'), rows = [], cur = null;
    d.innerHTML = h;
    function blank(s){ return !s.replace(/<br>|\s|&nbsp;/g, ''); }
    [].forEach.call(d.childNodes, function(n){
      var bold = n.nodeType === 1 && n.tagName === 'SPAN' && /font-weight:\s*700/.test(n.getAttribute('style') || '');
      if (bold) {
        var lb = n.textContent.replace(/\s+/g, ' ').trim();
        if (!lb) return;
        if (cur && blank(cur.v) && cur.l) { cur.l += ' ' + lb; cur.last = lb; } else { cur = {l: lb, last: lb, v: ''}; rows.push(cur); }
        return;
      }
      if (!cur) { cur = {l: '', v: ''}; rows.push(cur); }
      cur.v += n.nodeType === 1 ? n.outerHTML : esc(n.textContent);
    });
    rows.forEach(function(r){ r.v = r.v.replace(/\s+e\s+/g, '<br>').replace(/^(\s|<br>)+|(\s|<br>)+$/g, ''); });   // cada pessoa numa linha (sem "e" entre nomes)
    return rows.filter(function(r){ return r.l || !blank(r.v); });
  }
  /* ficha técnica: o cargo de Matheus Souza sai da lista e abre a ficha, em destaque, como "My role" */
  var ROLE = {luzi: ['Direção de arte, conteúdo e social', 'Art direction, content and social']};   // cargo corrigido à mão
  function ftHtml(h, key){
    var rows = ftRows(h);
    if (!(rows.length > 1 || (rows[0] && rows[0].l))) return '<div class="ft-raw">' + h + '</div>';
    var mine = [];
    rows = rows.filter(function(r){
      if (/meu rol|my rol/i.test(r.l)) { mine.push(r.v); return false; }
      var parts = r.v.split(/<br\s*\/?>/i), keep = parts.filter(function(x){ return !/matheus\s+souza/i.test(plain(x)); });
      if (keep.length === parts.length) return true;
      mine.push(esc(r.last || r.l));
      r.v = keep.join('<br>').replace(/^(\s|<br>)+|(\s|<br>)+$/g, '');
      return !!plain(r.v);
    });
    if (mine.length) mine = [tr('Direção de arte', 'Art direction')];   // em todas as fichas o cargo aparece como direção de arte
    if (mine.length) rows.unshift({l: 'My role', v: mine.join(' · '), me: 1});
    return '<dl class="ft">' + rows.map(function(r){
      return '<div' + (r.me ? ' class="me"' : '') + '><dt>' + esc(r.l) + '</dt><dd>' + r.v + '</dd></div>';
    }).join('') + '</dl>';
  }  function cardKeys(){ return D.home.cards.map(function(c){ return c.r.replace('#/', ''); }).filter(function(k){ return D.pages[k]; }); }
  function badgeOf(key){
    var c = D.home.cards.filter(function(x){ return x.r === '#/' + key; })[0];
    if (!c || !c.badge) return '';
    var b = c.badge, ar = (b.w * c.a / b.h).toFixed(3);
    return '<span class="ph-badge" style="aspect-ratio:' + ar + '"><img src="' + b.s + '" alt="Effie Awards"' + (b.c ? cropStyle(b.c) : '') + ' decoding="async"></span>';
  }

  /* ------------------------------------------------------------ páginas (só o conteúdo de #view) */
  function project(key, cls){
    var p = D.pages[key], E = isEn() && EN.pages[key] ? EN.pages[key] : null;
    var it = E ? E : p.intro, T = projText(key), ks = cardKeys(), n = ks.indexOf(key);
    var caps = (E ? E.caps : p.caps) || [];
    /* abertura: número, nome, frase-resumo, contexto/ideia e ficha técnica */
    var kick = '<p class="ph-k">' + (n > -1 ? '<span class="ph-n">' + ('0' + (n + 1)).slice(-2) + '</span>' : '') +
      '<span>' + tr('Projeto', 'Project') + '</span>' +
      T.extra.map(function(x){ return '<span class="ph-aw">✦ ' + x + '</span>'; }).join('') + '</p>';
    var texts = T.texts.map(function(s){
      return '<div class="ph-s"><p class="lbl">↘ ' + esc(s.l) + '</p><p class="ph-p">' + s.h + '</p></div>';
    }).join('');
    var hero = '<section class="ph">' + kick +
      '<div class="ph-g"><div class="ph-tw"><h1 class="ph-t">' + esc(T.name) + '</h1>' + badgeOf(key) + '</div>' +
      '<div class="ph-x">' + (it && it.h ? '<p class="ph-lead">' + esc(it.h) + '</p>' : '') + texts + '</div></div>' +
      (T.ft ? '<div class="ph-ftw"><p class="lbl">↘ ' + tr('Ficha técnica', 'Credits') + '</p>' + ftHtml(T.ft, key) + '</div>' : '') +
      '</section>';
    /* legendas curtas embaixo de cada linha de peças (pequenas, à esquerda) */
    var yts = YT[key] || [];
    var gal = '<section class="gal" aria-label="' + esc(p.t) + '">' + p.rows.map(function(r, i){
      var cap = [];
      if (i === 0 && it && it.p) cap.push(it.p);
      if (caps[i]) cap.push(caps[i]);
      return '<div class="row">' + r.map(function(c, j){
        var yt = yts.filter(function(y){ return y.r === i && y.c === j; })[0];
        if (yt) return ytCell(c, yt.id, yt.t);
        return cell(c, i === 0 && j === 0);
      }).join('') + '</div>' +
        (cap.length ? '<p class="cap rv"><span class="cap-n" aria-hidden="true">' + ('0' + (i + 1)).slice(-2) + '</span><span>' + cap.map(esc).join('<br>') + '</span></p>' : '');
    }).join('') + '</section>';
    return '<main class="page pj ' + (cls || '') + '">' + hero + gal + pnext(key) + '</main>';
  }
  /* anterior / próximo (ordem dos cards da home) */
  function pnext(key){
    var ks = cardKeys(), i = ks.indexOf(key), n = ks.length;
    var pv = ks[i < 0 ? n - 1 : (i - 1 + n) % n], nx = ks[i < 0 ? 0 : (i + 1) % n];
    return '<nav class="pn" aria-label="' + tr('Projetos', 'Projects') + '">' +
      '<a class="pn-p" href="#/' + pv + '"><span class="kick">← ' + tr('anterior', 'previous') + '</span><span class="pn-t">' + esc(D.pages[pv].t) + '</span></a>' +
      '<div class="pn-c"><span class="kick">' + tr('contato', 'contact') + '</span>' + contactItems().map(function(c){ return '<a href="' + esc(c[1]) + '"' + c[3] + ' aria-label="' + c[0] + '"><span class="pn-i" aria-hidden="true">' + ICO[c[0]] + '</span><span class="pn-l">' + c[0] + '</span></a>'; }).join('') + '</div>' +
      '<a class="pn-n" href="#/' + nx + '"><span class="kick">' + tr('próximo', 'next') + ' →</span><span class="pn-t">' + esc(D.pages[nx].t) + '</span></a></nav>';
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
  /* stuff: só as peças (sem título visível e sem pontilhados) */
  function stuff(){
    var S = D.pages.stuff;
    var cells = S.cells.map(function(c){
      if (c.c) return '<div class="crop rv" style="--a:' + c.a + '">' + img(c, cropStyle(c.c)) + '</div>';
      return img(c, ' style="--a:' + c.a + '"', 'rv');
    }).join('');
    return '<main class="page stuff"><h1 class="vh">' + plain(S.title) + '</h1><section class="st-gal st-only">' + cells + '</section></main>';
  }
  /* about: retrato com os pontilhados parados; o iPod do Last.fm abre a coluna da esquerda;
     experiências com o mesmo contraste de fontes dos projetos (etiqueta pequena / nome grande / cliente pequeno) */
  function about(){
    var A = D.pages.about;
    var orn = A.orn.map(function(o){
      return '<pre class="orn" aria-hidden="true" style="left:' + o.x + '%;top:' + o.y + '%;font-size:' + o.fs + 'cqw;line-height:' + (o.lh / o.fs).toFixed(3) + '">' + esc(o.t) + '</pre>';
    }).join('');
    var left = isEn() ? EN.about.left.slice() : [A.left[0].split('<br><br>⟶ Graduated')[0], A.left[1], A.left[2]];
    /* bio nova (PT / EN) */
    left[0] = isEn()
      ? 'Hey! I’m Matheus, and in case we haven’t met yet, let me get my most useless skill out of the way: I collect product placements from pop diva music videos. Yeah. I know… it’s a watery mousse.<br><br>' +
        'The useful part? 5 years as an art director, with VML, DPZ, Ana Couto and Brivia on my résumé, a class of 10+ creatives in training that I had the pleasure of leading, and a filter that, for reasons I still don’t understand, went viral in Thailand.<br><br>' +
        'In my free time, I’m a proud scrobble counter on my Last.fm, a festival regular and a part-time tweeter, in hours that add up to way more than I admit.<br><br>' +
        'Wanna set up a chat? I take my coffee without sugar.'
      : 'E aí! Eu sou o Matheus e, se a gente ainda não se conhece, já te adianto minha maior habilidade inútil: coleciono product placement de clipe de diva pop. É. Eu sei… É um mousse aguado.<br><br>' +
        'A parte útil? 5 anos como diretor de arte, com VML, DPZ, Ana Couto e Brivia no currículo, uma turma de mais de 10 criativos em formação que eu tive o prazer de liderar e um filtro que, por motivos que eu desconheço até hoje, viralizou na Tailândia.<br><br>' +
        'No tempo livre, sou contador de scrobbles no meu Last.fm com muito orgulho, frequentador assíduo de festivais e tuiteiro nas horas vagas, que são bem mais do que eu admito.<br><br>' +
        'Bora marcar um papo? Meu café é sem açúcar.';
    var exp = isEn() ? EN.about.exp : A.exp;
    function parse(h){
      var title = '', items = [];
      h.split(/<br>\s*<br>/).forEach(function(c, i){
        var lines = c.split(/<br>/).map(plain).filter(Boolean);
        if (i === 0 && lines.length) title = lines.shift();
        if (lines.length) items.push(lines);
      });
      return {t: title, items: items};
    }
    function client(x){ return x.replace(/^(principais clientes|principal cliente|main clients?)\s*:\s*/i, ''); }
    /* mesmo padrão em experiências, prêmios e formação: etiqueta pequena / nome grande / detalhe pequeno */
    function block(cls, title, rows){
      return '<section class="xp ' + cls + ' rv"><p class="lbl">↘ ' + esc(title) + '</p><ul class="xp-l">' + rows.map(function(r){
        return '<li' + (r.now ? ' class="now"' : '') + '><span class="xp-y">' + esc(r.y) + '</span><span class="xp-n">' + esc(r.n) + '</span>' +
          r.c.map(function(x){ return '<span class="xp-c">' + esc(x) + '</span>'; }).join('') + '</li>';
      }).join('') + '</ul></section>';
    }
    function dated(l){
      var hd = l[0].replace(/^✦\s*/, '').split('⟶'), y = hd.length > 1 ? hd[0].trim() : '', n = (hd.length > 1 ? hd.slice(1).join('⟶') : hd[0]).trim();
      return {y: y, n: n, c: l.slice(1).map(client), now: /atualmente|present/i.test(y)};
    }
    var ex = parse(exp), fo = parse(left[2]), aw = parse(left[1]);
    var awRows = [].concat.apply([], aw.items).map(function(x){
      var m = x.match(/^(\d+x)\s+(.*?)(?:\s@\s(.*))?$/);
      return m ? {y: m[1], n: m[2], c: m[3] ? [m[3]] : []} : {y: '', n: x, c: []};
    });
    return '<main class="page about"><div class="collage">' +
      '<div class="col-l"><p class="ab-t bio rv">' + left[0] + '</p>' + block('awd', aw.t, awRows) + block('form', fo.t, fo.items.map(dated)) + '</div>' +
      '<figure class="portrait rv" style="--a:' + A.ar + '"><div class="pfig">' + img({s: A.img}, '') + '</div>' + orn + '</figure>' +
      '<div class="col-r">' + block('exp', ex.t, ex.items.map(dated)) +
      '<div class="ab-end"><div class="ab-ct">' + '<a class="ab-ic" href="' + esc(A.li.url) + '" target="_blank" rel="noopener" aria-label="LinkedIn">' + ICO.LinkedIn + '</a>' +
        '<a class="ab-ic" href="https://wa.me/' + CT.wa + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + ICO.WhatsApp + '</a>' +
        '<a class="ab-ic" href="mailto:' + CT.mail + '" aria-label="E-mail">' + ICO['E-mail'] + '</a></div>' +
        '<div class="pl-w"><p class="pl-cap">↘ ' + tr('últimos scrobbles', 'latest scrobbles') + ' · Last.fm</p>' +
        '<div class="player pl-l"><iframe data-src="player/index.html" title="Player" allow="autoplay"></iframe></div></div></div></div>' +
      '</div></main>';
  }  /* ------------------------------------------------------------ player do iPod: escala para caber sobre o retrato */
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
    /* iPod no topo da coluna da esquerda: escala para a largura da coluna (356px é o tamanho natural) */
    /* iPod no fim da coluna da direita, ao lado dos ícones de contato */
    var cr = app.querySelector('.about .col-r'), pl = app.querySelector('.about .pl-l');
    if (cr && pl) { var w = (grid ? cr.clientWidth : Math.min(cr.parentNode.clientWidth, 420)); pl.style.setProperty('--ps', Math.max(0.5, Math.min(grid ? Math.min(0.72, window.innerHeight / 1350) : 1, w / 356)).toFixed(3)); }
  }

  /* ------------------------------------------------------------ letreiros */
  function marquees(){
    /* topo e rodapé: mesmo letreiro em loop, mesma velocidade (110,8 px/s — 20% mais lento que antes). O menu do topo não anda. */
    [].forEach.call(app.querySelectorAll('[data-mq="loop"]'), function(f){
      var box = f.parentNode, w = box.clientWidth;
      if (!w) return;                                   // topo escondido (celular): nada a animar
      var g = f.firstElementChild, k = 0;
      g.innerHTML = '<span>' + D.unit + '</span>';
      while (g.scrollWidth < w * 1.1 && k++ < 14) g.insertAdjacentHTML('beforeend', '<span>' + D.unit + '</span>');
      while (f.children.length > 1) f.removeChild(f.lastChild);
      f.appendChild(g.cloneNode(true));
      f.style.setProperty('--dur', Math.max(7.5, g.scrollWidth / 110.8).toFixed(2) + 's');
    });
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
          if (v.tagName === 'VIDEO') {
            v.muted = true; v.defaultMuted = true; v.setAttribute('muted', ''); v.preload = 'auto';
            /* se já estiver na tela quando terminar de carregar, começa a tocar (antes ficava parado) */
            v.addEventListener('canplay', function(){ if (inView(v) && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function(){}); } });
          }
          v.setAttribute('src', v.dataset.src);
          if (v.tagName === 'IFRAME') v.addEventListener('load', function(){ v.dataset.ready = '1'; }, {once: true});
        }
        ioLoad.unobserve(v);
      });
    }, {rootMargin: '400px 0px'});
    ioPlay = new IntersectionObserver(function(es){
      es.forEach(function(e){
        var v = e.target;
        if (v.tagName === 'VIDEO') {
          if (e.isIntersecting) { if (!v.dataset.snd) v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function(){}); }
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
        e.target.style.setProperty('--d', Math.min(n++, 5) * 60 + 'ms');
        e.target.classList.add('in');
        setTimeout(function(t){ t.style.setProperty('--d', '0s'); t.classList.add('done'); }, 1200, e.target);
        ioRv.unobserve(e.target);
      });
    }, {rootMargin: '0px 0px -4% 0px', threshold: 0.04});
    view.querySelectorAll('.rv').forEach(function(el){ ioRv.observe(el); });
  }
  /* botão de som dos vídeos (mp4 e Vimeo) */
  app.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('.snd') : null;
    if (!b) return;
    var on = b.getAttribute('aria-pressed') !== 'true', cellEl = b.parentNode, v = cellEl.querySelector('video'), f = cellEl.querySelector('iframe');
    if (v) {
      if (!v.getAttribute('src') && v.dataset.src) v.setAttribute('src', v.dataset.src);
      v.muted = !on; v.dataset.snd = on ? '1' : '';
      if (on) { v.volume = 1; var p = v.play(); if (p && p.catch) p.catch(function(){}); }
    } else if (f) {
      if (!f.getAttribute('src') && f.dataset.src) f.setAttribute('src', f.dataset.src);
      try {
        f.contentWindow.postMessage(JSON.stringify({method: 'setMuted', value: !on}), '*');
        f.contentWindow.postMessage(JSON.stringify({method: 'setVolume', value: on ? 1 : 0}), '*');
        if (on) f.contentWindow.postMessage(JSON.stringify({method: 'play'}), '*');
      } catch (er) {}
    }
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? tr('Desligar o som', 'Turn sound off') : tr('Ligar o som', 'Turn sound on'));
    b.querySelector('.snd-t').textContent = on ? tr('sem som', 'mute') : tr('som', 'sound');
  });  /* vídeo do YouTube: só carrega o player ao clicar (com som) */
  app.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('.yt-b') : null;
    if (!b) return;
    var id = b.getAttribute('data-yt');
    /* aberto direto do arquivo (file://) o YouTube recusa o player embutido: abre o vídeo no YouTube */
    /* aberto direto do arquivo (file://) o YouTube recusa o player embutido: toca o próprio vídeo do site, com som, no mesmo lugar */
    var typ = b.getAttribute('data-t') || 'yt';
    if (typ === 'yt' && location.protocol === 'file:' && b.getAttribute('data-mp4')) {
      var v = document.createElement('video');
      v.src = b.getAttribute('data-mp4'); v.controls = true; v.autoplay = true; v.playsInline = true;
      b.parentNode.replaceChild(v, b); var pp = v.play(); if (pp && pp.catch) pp.catch(function(){});
      return;
    }
    var f = document.createElement('iframe');
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.src = typ === 'ig' ? 'https://www.instagram.com/reel/' + id + '/embed/'
          : typ === 'ccv' ? 'https://www-ccv.adobe.io/v1/player/ccv/' + id + '/embed?api_key=behance1&bgcolor=%23000000&autoplay=true'
          : 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1&origin=' + encodeURIComponent(location.origin);
    f.title = typ === 'ig' ? 'Instagram' : typ === 'ccv' ? 'Behance' : 'YouTube';
    f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    f.allowFullscreen = true;
    b.parentNode.replaceChild(f, b);
  });
  /* abrir projetos sem espera: ao passar o mouse/tocar num card, a primeira imagem do projeto já começa a baixar */
  var warmed = {};
  function warm(e){
    var a = e.target.closest ? e.target.closest('.card') : null;
    if (!a) return;
    var k = a.getAttribute('href').replace('#/', ''), p = D.pages[k];
    if (!p || warmed[k] || !p.rows) return;
    warmed[k] = 1;
    var c = p.rows[0] && p.rows[0][0];
    if (c && c.k === 'i') (new Image()).src = c.s;
    else if (c && c.p) (new Image()).src = c.p;
  }
  app.addEventListener('mouseover', warm, {passive: true});
  app.addEventListener('touchstart', warm, {passive: true});

  /* ------------------------------------------------------------ menu (cortina vermelha que desce, lista numerada em cascata) */
  function menuHtml(){
    var items = [['#/', 'Home', '00', D.home.face]];
    D.home.cards.forEach(function(c, i){
      var k = c.r.replace('#/', '');
      if (D.pages[k]) items.push([c.r, D.pages[k].t, ('0' + (i + 1)).slice(-2), c.s]);
    });
    var S = D.pages.stuff;
    items.push(['#/stuff', 'Stuff', '✦', S.cells[0] && S.cells[0].s]);
    if (D.pages.ar) items.push(['#/ar', 'A.R.', '✦', '']);
    items.push(['#/about', tr('Sobre & contato', 'About & contact'), '→', D.pages.about.img]);
    return '<div class="menu-in"><ul class="menu-list">' + items.map(function(m){
      return '<li><a href="' + m[0] + '"' + '><span class="mn">' + m[2] + '</span><span class="mt">' + esc(m[1]) + '</span></a></li>';
    }).join('') + '</ul><div class="menu-aside"><ul class="menu-ct">' +
      contactItems().map(function(c){ return '<li><a href="' + esc(c[1]) + '"' + c[3] + '>→ ' + esc(c[2]) + '</a></li>'; }).join('') + '</ul></div></div>';
  }
  function menuToggle(open){
    var m = document.getElementById('menu'), b = app.querySelector('.mbtn');
    if (!m) return;
    var on = typeof open === 'boolean' ? open : !document.body.classList.contains('menu-open');
    if (on) { m.innerHTML = menuHtml(); [].forEach.call(m.querySelectorAll('a[href^="#/"]'), function(a){ if (a.getAttribute('href') === '#/' + current) a.setAttribute('aria-current', 'page'); }); }
    document.body.classList.toggle('menu-open', on);
    ROOT.classList.toggle('menu-open', on);
    m.setAttribute('aria-hidden', String(!on));
    if (b) b.setAttribute('aria-expanded', String(on));
  }
  app.addEventListener('click', function(e){
    if (!e.target.closest) return;
    if (e.target.closest('.mbtn')) { menuToggle(); return; }
    if (e.target.closest('#menu a')) menuToggle(false);
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') menuToggle(false); });
  app.addEventListener('mouseover', function(e){
    var a = e.target.closest ? e.target.closest('#menu [data-pv]') : null, pv = document.querySelector('.menu-pv');
    if (!a || !pv) return;
    pv.innerHTML = '<img src="' + a.getAttribute('data-pv') + '" alt="" decoding="async">';
  });
  /* ------------------------------------------------------------ montagem / troca de página */
  function mount(name, keepScroll){
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
    fitPlayer(); lazy();
    if (!keepScroll) window.scrollTo(0, 0);
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
    if (el && inView(el)) el.style.viewTransitionName = 'proj';
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

  /* ------------------------------------------------------------ troca de idioma (PT / EN) */
  function setLang(l){
    if (!EN || (l !== 'pt' && l !== 'en') || l === LANG) return;
    LANG = l;
    try { localStorage.setItem('lang', l); } catch (e) {}
    document.documentElement.lang = l === 'en' ? 'en' : 'pt-BR';
    [].forEach.call(app.querySelectorAll('[data-lang]'), function(b){
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === l));
    });
    var y = window.pageYOffset, pane = view.querySelector('.pane'), pt = pane ? pane.scrollTop : 0;
    if (current !== null) {
      mount(current, true);
      window.scrollTo(0, y);
      var np = view.querySelector('.pane'); if (np) np.scrollTop = pt;
    }
  }
  app.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('[data-lang]') : null;
    if (b) setLang(b.getAttribute('data-lang'));
  });

  /* ------------------------------------------------------------ início */
  app.innerHTML = top() + '<div class="menu" id="menu" aria-hidden="true"></div><div id="view"></div>' + foot();
  view = document.getElementById('view');
  marquees();
  window.addEventListener('hashchange', function(){ menuToggle(false); go(); });
  window.addEventListener('resize', function(){
    clearTimeout(mqTimer); mqTimer = setTimeout(marquees, 150);
    clearTimeout(fitTimer); fitTimer = setTimeout(fitPlayer, 60);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(marquees);
  go();
})();
