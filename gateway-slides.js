// Photo slideshows for Home, Trip Planner and Business Directory.
// EDIT HERE to change photos or captions. A slide whose file is missing is
// skipped automatically. Real photographs only.
(function () {
  if (window.__gwSlides) return; window.__gwSlides = true;
  const S = (src, en, am, ar, pen, pam, par) => ({ src, cap:{ en, am, ar }, place:{ en:pen, am:pam, ar:par } });
  const ET = ['Ethiopia', 'ኢትዮጵያ', 'إثيوبيا'], AE = ['United Arab Emirates', 'ተባበሩት አረብ ኤምሬትስ', 'الإمارات العربية المتحدة'];
  // Remote photos come from Wikimedia Commons (stable Special:FilePath links,
  // resized by Commons to 1600px). Licences and authors: img/slides/CREDITS.txt
  // Each photo: the local copy in img/slides/ is tried first; if it is not
  // there yet, the Commons link is used. Upload the local files and the site
  // stops depending on Commons with no further code change.
  const WM = (f) => 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(f) + '?width=1600';
  const LW = (local, f) => [ 'img/slides/' + local, WM(f) ];
  const P = {
    burj: LW('burj-khalifa-skyline.jpg', 'Burj_Khalifa_(worlds_tallest_building)_and_the_Dubai_skyline_(25781049892).jpg'),
    burj2: LW('burj-khalifa.jpg', 'Dubai_Skyline_mit_Burj_Khalifa_(18241030269).jpg'),
    marina: LW('dubai-marina.jpg', 'Dubai_Marina_Skyline.jpg'),
    lalibela: LW('lalibela.jpg', 'Bete_Giyorgis_Lalibela.jpg'),
    coffee: LW('coffee-ceremony.jpg', 'Coffee_ceremony_of_Ethiopia_and_Eritrea_4.jpg'),
    souk: LW('spice-souk.jpg', 'Spice_Souq_Dubai_10.jpg'),
    downtown: LW('downtown-dubai.jpg', 'Downtown_Dubai.Burj_Khalifa.jpg')
  };
  const COFFEE = S(P.coffee,
    'Life is too short for bad coffee. ☕ Ethiopian coffee culture has entered the chat.',
    'ሕይወት ለመጥፎ ቡና በጣም አጭር ናት። ☕ የኢትዮጵያ የቡና ባህል ውይይቱን ተቀላቅሏል።',
    'الحياة أقصر من أن نشرب قهوة سيئة. ☕ ثقافة القهوة الإثيوبية انضمت إلى المحادثة.', ...ET);
  const SLIDES = {
    // Ethiopia and the UAE alternate.
    home: [
      S('attractions/wonchi-crater-lake.png', 'Wonchi Crater Lake', 'የወንጪ ሐይቅ', 'بحيرة ونشي البركانية', ...ET),
      S(P.burj, 'Burj Khalifa and the Dubai skyline', 'ቡርጅ ኸሊፋና የዱባይ ሰማይ መስመር', 'برج خليفة وأفق دبي', ...AE),
      S(P.lalibela, 'Bete Giyorgis, Lalibela', 'ቤተ ጊዮርጊስ፣ ላሊበላ', 'كنيسة بيت جيورجيس، لاليبيلا', ...ET),
      S(P.marina, 'Dubai Marina', 'ዱባይ ማሪና', 'مرسى دبي', ...AE),
      COFFEE,
      S(P.souk, 'Spice souk, Deira', 'የቅመም ገበያ፣ ዴይራ', 'سوق التوابل، ديرة', ...AE),
      S(P.downtown, 'Downtown Dubai', 'የዱባይ መሀል ከተማ', 'وسط مدينة دبي', ...AE),
      S('attractions/unity-park.png', 'Unity Park, Addis Ababa', 'አንድነት ፓርክ፣ አዲስ አበባ', 'حديقة الوحدة، أديس أبابا', ...ET)
    ],
    trip: [
      S(P.marina, 'Dubai Marina', 'ዱባይ ማሪና', 'مرسى دبي', ...AE),
      S(P.lalibela, 'Rock-hewn churches of Lalibela', 'የላሊበላ ውቅር አብያተ ክርስቲያናት', 'كنائس لاليبيلا المنحوتة', ...ET),
      S(P.burj2, 'Burj Khalifa', 'ቡርጅ ኸሊፋ', 'برج خليفة', ...AE),
      COFFEE,
      S('attractions/arba-minch-forty-springs.png', 'Arba Minch, forty springs', 'አርባ ምንጭ', 'أربا منش، الينابيع الأربعون', ...ET),
      S('attractions/gorgora-eco-resort.png', 'Gorgora, Lake Tana', 'ጎርጎራ፣ ጣና ሐይቅ', 'غورغورا، بحيرة تانا', ...ET)
    ],
    directory: [
      S('img/asset-6.jpg', 'Addis Ababa city centre', 'የአዲስ አበባ መሀል ከተማ', 'وسط مدينة أديس أبابا', ...ET),
      S(P.downtown, 'Downtown Dubai business district', 'የዱባይ የንግድ ቀጠና', 'منطقة الأعمال في وسط دبي', ...AE),
      S(P.coffee, 'Coffee: from Ethiopian homes to Gulf cafés', 'ቡና፣ ከኢትዮጵያ ቤቶች እስከ ገልፍ ካፌዎች', 'القهوة: من البيوت الإثيوبية إلى مقاهي الخليج', ...ET),
      S(P.souk, 'Traders at the spice souk', 'በቅመም ገበያው ያሉ ነጋዴዎች', 'تجار سوق التوابل', ...AE),
      S('attractions/unity-park.png', 'Unity Park, Addis Ababa', 'አንድነት ፓርክ፣ አዲስ አበባ', 'حديقة الوحدة، أديس أبابا', ...ET),
      S(P.marina, 'Dubai Marina', 'ዱባይ ማሪና', 'مرسى دبي', ...AE)
    ]
  };
  window.GW_SLIDES = SLIDES;

  const RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches:false };
  const lang = () => { try { return localStorage.getItem('gateway.lang') || 'en'; } catch (e) { return 'en'; } };
  const INTERVAL = 4800, FADE = 1200;
  const ok = {};   // src -> true/false once probed
  // Each photo gets 8 s to load; a slow or blocked one is treated as missing
  // so it can never hold up the rest of the slideshow.
  const probe = (src) => new Promise(res => {
    if (src in ok) return res(ok[src]);
    const im = new Image(); let done = false;
    const fin = (v) => { if (done) return; done = true; clearTimeout(tm); res(ok[src] = v); };
    const tm = setTimeout(() => fin(false), 8000);
    im.onload = () => fin(true); im.onerror = () => fin(false); im.src = src;
  });

  class Slides extends HTMLElement {
    connectedCallback() {
      if (this._on) return; this._on = true;
      this.style.cssText += ';position:absolute;inset:0;display:block;overflow:hidden;background:#0c2948';
      this.all = SLIDES[this.set] || [];
      this.list = this.all.slice(0, 1);       // first slide shows at once (static fallback)
      this.i = 0; this.layers = [];
      this.build();
      // Add each photo the moment it loads, keeping the original order.
      this.all.forEach(sl => this.resolve(sl).then(good => {
        if (!this._on || !good || this.list.includes(sl)) return;
        const cur = this.list[this.i];
        this.list = this.all.filter(x => x === sl || this.list.includes(x));
        this.i = Math.max(0, this.list.indexOf(cur));
        this.renderDots(); this.start();
      }));
      this.io = window.IntersectionObserver ? new IntersectionObserver(es => { this.vis = es[0].isIntersecting; this.start(); }) : null;
      this.vis = true; this.io && this.io.observe(this);
      this.onVis = () => this.start(); document.addEventListener('visibilitychange', this.onVis);
      this.onJ = (e) => this.jumpTo(e.detail && e.detail.to && e.detail.to.label); window.addEventListener('gw-journey', this.onJ);
    }
    async resolve(sl) {
      const opts = sl.opts || (sl.opts = Array.isArray(sl.src) ? sl.src.slice() : [sl.src]);
      for (const u of opts) if (await probe(u)) { sl.src = u; return true; }
      return false;
    }
    disconnectedCallback() { this._on = false; clearTimeout(this.tm); this.io && this.io.disconnect(); document.removeEventListener('visibilitychange', this.onVis); window.removeEventListener('gw-journey', this.onJ); }
    build() {
      this.innerHTML = '';
      for (let k = 0; k < 2; k++) {
        const im = document.createElement('img');
        im.alt = ''; im.decoding = 'async'; im.draggable = false;
        im.style.cssText = 'position:absolute;inset:-2%;width:104%;height:104%;object-fit:cover;opacity:0;transition:opacity ' + FADE + 'ms ease;will-change:opacity,transform';
        this.appendChild(im); this.layers.push(im);
      }
      const shade = document.createElement('div');
      shade.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to top,rgba(6,20,34,.86) 0%,rgba(6,20,34,.25) 50%,rgba(6,20,34,.05) 100%);pointer-events:none';
      this.appendChild(shade);
      this.cap = document.createElement('div');
      this.cap.style.cssText = 'position:absolute;inset-inline:0;bottom:0;padding:16px 18px 18px;display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;justify-content:space-between';
      this.cap.innerHTML = '<div aria-live="polite" style="display:flex;flex-direction:column;gap:3px;min-width:0;transition:opacity .5s ease"><span data-c style="font-size:16px;font-weight:700;color:#fff;line-height:1.25"></span><span data-p style="font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#e2c877"></span></div><div data-dots style="display:flex;gap:2px;flex-wrap:wrap"></div>';
      this.appendChild(this.cap);
      this.front = 0; this.show(0, true);
    }
    renderDots() {
      const box = this.cap.querySelector('[data-dots]'); box.innerHTML = '';
      if (this.list.length < 2) return;
      this.list.forEach((s, k) => {
        const b = document.createElement('button');
        b.type = 'button'; b.setAttribute('aria-label', s.cap[lang()] || s.cap.en);
        b.style.cssText = 'width:28px;height:28px;padding:0;border:0;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center';
        b.innerHTML = '<span style="display:block;height:6px;border-radius:3px;transition:all .4s ease;width:' + (k === this.i ? 18 : 6) + 'px;background:' + (k === this.i ? '#d7a62a' : 'rgba(255,255,255,.55)') + '"></span>';
        b.addEventListener('click', () => { this.show(k); this.start(true); });
        box.appendChild(b);
      });
    }
    show(k, first) {
      const s = this.list[k]; if (!s) return;
      this.i = k;
      const next = this.layers[first ? 0 : 1 - this.front], prev = this.layers[this.front];
      next.src = s.src; next.alt = s.cap[lang()] || s.cap.en;
      const kb = !RM.matches;
      const ox = (k % 2 ? -1 : 1) * 1.2, oy = (k % 3 - 1) * 0.8;
      next.style.transition = 'opacity ' + FADE + 'ms ease, transform ' + (INTERVAL + FADE) + 'ms linear';
      next.style.transform = kb ? 'scale(1.0) translate(0,0)' : 'none';
      requestAnimationFrame(() => {
        next.style.opacity = '1';
        if (kb) requestAnimationFrame(() => { next.style.transform = 'scale(1.07) translate(' + ox + '%,' + oy + '%)'; });
        if (!first && prev !== next) prev.style.opacity = '0';
      });
      if (!first) this.front = 1 - this.front;
      const L = lang(), c = this.cap.firstChild;
      c.style.opacity = '0';
      setTimeout(() => { c.querySelector('[data-c]').textContent = s.cap[L] || s.cap.en; c.querySelector('[data-p]').textContent = s.place[L] || s.place.en; c.style.opacity = '1'; }, first ? 0 : 350);
      this.dir = (document.documentElement.dir || getComputedStyle(this).direction);
      this.renderDots();
    }
    start(reset) {
      clearTimeout(this.tm);
      if (RM.matches || !this.vis || document.hidden || this.list.length < 2) return;
      this.tm = setTimeout(() => { this.show((this.i + 1) % this.list.length); this.start(); }, reset ? INTERVAL * 1.5 : INTERVAL);
    }
    jumpTo(label) {
      if (!label || this.list.length < 2) return;
      const L = String(label).toLowerCase();
      const k = this.list.findIndex(s => Object.values(s.cap).some(c => c && (c.toLowerCase().includes(L) || L.includes(c.toLowerCase().split(',')[0]))));
      if (k >= 0 && k !== this.i) { this.show(k); this.start(true); }
    }
  }
  const def = (tag, set) => customElements.get(tag) || customElements.define(tag, class extends Slides { get set() { return set; } });
  def('gw-slides-home', 'home'); def('gw-slides-trip', 'trip'); def('gw-slides-directory', 'directory');
})();
