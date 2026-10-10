// Shared header: notification bell (every signed-in user) and Admin link
// (admin / super_admin only). Display only. What each person can read or mark
// read is enforced by RLS: user_notifications -> own rows only;
// admin_notifications -> admins only. Realtime applies the same rules.
(function () {
  if (window.__gwRoleLoaded) return;
  window.__gwRoleLoaded = true;
  const URL_ = 'https://pkkghdlqliiyhtwirwmn.supabase.co';
  const KEY = 'sb_publishable_BKME7ruHF2UOnwYq_siezg_zetEcY45'; // public key; RLS applies
  const S = window.__gwNotes = { user:null, admin:false, items:[], unread:0, open:false, ready:false };
  window.__gwAdmin = false;
  const emit = () => window.dispatchEvent(new Event('gw-role'));
  let db = null, chans = [], timer = null;

  async function load() {
    if (!S.user) { S.items = []; S.unread = 0; emit(); return; }
    let own = db.from('user_notifications').select('id,kind,title,business_id,entity_type,entity_id,created_at,read_at')
      .is('dismissed_at', null).order('created_at', { ascending:false }).limit(30);
    if (S.noDismiss) own = db.from('user_notifications').select('id,kind,title,business_id,entity_type,entity_id,created_at,read_at')
      .order('created_at', { ascending:false }).limit(30);
    const adm = S.admin ? db.from('admin_notifications').select('id,kind,title,business_id,created_at,read_at')
      .order('created_at', { ascending:false }).limit(30) : null;
    let [a, b] = await Promise.all([own, adm]);
    if (a && a.error && !S.noDismiss && /dismissed_at/.test(a.error.message || '')) { S.noDismiss = true; return load(); }
    const rows = [];
    if (a && !a.error) a.data.forEach(r => rows.push({ ...r, src:'user' }));   // table missing before 0023: ignored
    if (b && !b.error) b.data.forEach(r => rows.push({ ...r, src:'admin' }));
    rows.sort((x, y) => (y.created_at > x.created_at ? 1 : -1));
    S.items = rows.slice(0, 40);
    S.unread = rows.filter(r => !r.read_at).length;
    S.ready = true;
    window.__gwUnread = S.unread;
    emit();
  }
  const reload = () => { clearTimeout(timer); timer = setTimeout(load, 300); };

  function listen() {
    chans.forEach(c => db.removeChannel(c)); chans = [];
    if (!S.user || !db.channel) return;
    const sub = (name, table) => db.channel(name).on('postgres_changes', { event:'*', schema:'public', table }, reload).subscribe();
    chans.push(sub('gw-bell-user', 'user_notifications'));
    if (S.admin) chans.push(sub('gw-bell-admin', 'admin_notifications'));
  }

  async function check(user) {
    let admin = false;
    if (user) {
      const r = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
      admin = !!(r.data && (r.data.role === 'admin' || r.data.role === 'super_admin'));
    }
    const changed = (S.user && S.user.id) !== (user && user.id) || admin !== S.admin;
    S.user = user; S.admin = admin; S.checked = true; window.__gwAdmin = admin;
    if (changed) { listen(); }
    load();
  }

  async function markRead(list) {
    const now = new Date().toISOString();
    const by = (src) => list.filter(r => r.src === src && !r.read_at).map(r => r.id);
    const u = by('user'), a = by('admin');
    list.forEach(r => { r.read_at = r.read_at || now; });
    S.unread = S.items.filter(r => !r.read_at).length; emit();
    await Promise.all([
      u.length ? db.from('user_notifications').update({ read_at:now }).in('id', u) : null,
      a.length ? db.from('admin_notifications').update({ read_at:now }).in('id', a) : null
    ]);
    load();
    window.dispatchEvent(new Event('gw-bell-read'));
  }

  const HOME = 'home.dc.html';
  const PROTECTED = /(User Dashboard|Business Dashboard|Admin Dashboard|Business Registration|user-dashboard|business-dashboard|admin-dashboard|business-registration)\.dc\.html$/i;
  async function signOut() {
    try { if (db) await db.auth.signOut(); } catch (e) {}
    // Belt and braces: remove any stored Supabase session for this project.
    try { Object.keys(localStorage).filter(k => /^sb-.*-auth-token/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {}
    S.user = null; S.admin = false; S.items = []; S.unread = 0; window.__gwAdmin = false; emit();
    location.replace(HOME);
  }

  async function dismiss(r) {
    if (!r || r.src !== 'user' || S.noDismiss) return;
    S.items = S.items.filter(x => x !== r);
    S.unread = S.items.filter(x => !x.read_at).length; emit();
    await db.from('user_notifications').update({ dismissed_at:new Date().toISOString(), read_at:r.read_at || new Date().toISOString() }).eq('id', r.id);
    load();
  }

  function start(tries) {
    if (!window.__gatewaySupabase && window.supabase) window.__gatewaySupabase = window.supabase.createClient(URL_, KEY);
    db = window.__gatewaySupabase;
    if (!db) { if (tries < 300) setTimeout(() => start(tries + 1), 100); return; }
    db.auth.getSession().then(({ data }) => check(data && data.session ? data.session.user : null));
    db.auth.onAuthStateChange((ev, session) => {
      check(session ? session.user : null);
      // Signed out (here or in another tab): leave protected pages at once.
      if (ev === 'SIGNED_OUT' && PROTECTED.test(decodeURIComponent(location.pathname))) location.replace(HOME);
    });
    window.addEventListener('gw-notes-changed', reload);
  }
  start(0);

  // ---------- text ----------
  const L = {
    en: { signIn:'Sign in', signOut:'Sign out', admin:'Admin', notes:'Notifications', markAll:'Mark all read', markRead:'Mark read', none:'No notifications yet.', open:'Open', fromAdmin:'Admin',
      BUSINESS_REGISTERED:'New business registered', APPROVAL_PENDING:'Approval pending', BUSINESS_EDITED:'Business details edited',
      PRICE_CHANGED:'Price changed', MENU_UPLOADED:'Menu uploaded', DOCUMENT_UPLOADED:'Verification document uploaded',
      CLAIM_SUBMITTED:'Ownership claim submitted', REPORT_SUBMITTED:'Content report submitted', USER_REGISTERED:'New account',
      WELCOME:'Welcome to the Ethiopia–UAE Gateway', ROLE_CHANGED:'Your account role changed', OWNERSHIP_GRANTED:'You are now the owner of this listing',
      CLAIM_RECEIVED:'Someone claimed your listing', CLAIM_APPROVED:'Your ownership claim was approved', CLAIM_REJECTED:'Your ownership claim was rejected',
      REPORT_FILED:'A report was filed about your listing', REPORT_RESOLVED:'Your report was resolved', REPORT_DISMISSED:'Your report was reviewed',
      FEATURED:'Your listing is now featured', LISTING_PUBLISHED:'Your listing is published', LISTING_HIDDEN:'Your listing was unpublished',
      LISTING_DRAFT:'Your listing was moved to draft', DOCUMENT_APPROVED:'Document approved', DOCUMENT_REJECTED:'Document rejected',
      VERIFICATION_VERIFIED:'Your business is verified', VERIFICATION_REJECTED:'Verification was not approved',
      VERIFICATION_UNDER_REVIEW:'Verification is under review', VERIFICATION_PENDING:'Verification submitted',
      VERIFICATION_NEEDS_INFO:'More information is needed for verification', dismiss:'Dismiss',
      NEW_ENQUIRY:'New customer enquiry', REGISTRATION_SUBMITTED:'Registration submitted — pending review', TRIP_SAVED:'Trip saved', TRIP_UPDATED:'Trip updated',
      TRIP_REMINDER_D14:'Your trip starts in 14 days', TRIP_REMINDER_D7:'Your trip starts in 7 days', TRIP_REMINDER_D3:'Your trip starts in 3 days',
      TRIP_REMINDER_D1:'Your trip starts tomorrow', TRIP_REMINDER_D0:'Your trip starts today', TRIP_REMINDER_D30:'Your trip starts in 30 days', TRIP_REMINDER_D21:'Your trip starts in 21 days', TRIP_REMINDER_D2:'Your trip starts in 2 days',
      LISTING_PENDING:'Your listing is pending review', LISTING_ARCHIVED:'Your listing was archived', VERIFICATION_UNSUBMITTED:'Verification not submitted', VERIFICATION_DOCUMENTS_REQUIRED:'Documents required for verification' },
    am: { NEW_ENQUIRY:'አዲስ የደንበኛ ጥያቄ', dismiss:'አስወግድ', BUSINESS_REGISTERED:'አዲስ ንግድ ተመዝግቧል', APPROVAL_PENDING:'ማጽደቅ በመጠባበቅ ላይ', BUSINESS_EDITED:'የንግድ መረጃ ተሻሽሏል', PRICE_CHANGED:'ዋጋ ተቀይሯል', MENU_UPLOADED:'የምግብ ዝርዝር ተጭኗል', DOCUMENT_UPLOADED:'የማረጋገጫ ሰነድ ተጭኗል', CLAIM_SUBMITTED:'የባለቤትነት ጥያቄ ቀርቧል', REPORT_SUBMITTED:'የይዘት ሪፖርት ቀርቧል', USER_REGISTERED:'አዲስ መለያ', WELCOME:'እንኳን ወደ ኢትዮጵያ–ዩኤኢ መግቢያ በደህና መጡ', ROLE_CHANGED:'የመለያዎ ሚና ተቀይሯል', OWNERSHIP_GRANTED:'አሁን የዚህ ዝርዝር ባለቤት ነዎት', CLAIM_RECEIVED:'አንድ ሰው ዝርዝርዎን ጠይቋል', CLAIM_APPROVED:'የባለቤትነት ጥያቄዎ ጸድቋል', CLAIM_REJECTED:'የባለቤትነት ጥያቄዎ ውድቅ ተደርጓል', REPORT_FILED:'ስለ ዝርዝርዎ ሪፖርት ቀርቧል', REPORT_RESOLVED:'ሪፖርትዎ ተፈቷል', REPORT_DISMISSED:'ሪፖርትዎ ታይቷል', FEATURED:'ዝርዝርዎ አሁን ተለይቶ ቀርቧል', LISTING_PUBLISHED:'ዝርዝርዎ ታትሟል', LISTING_HIDDEN:'ዝርዝርዎ ከሕትመት ወርዷል', LISTING_DRAFT:'ዝርዝርዎ ወደ ረቂቅ ተመልሷል', LISTING_PENDING:'ዝርዝርዎ ግምገማ እየጠበቀ ነው', LISTING_ARCHIVED:'ዝርዝርዎ ተቀምጧል', DOCUMENT_APPROVED:'ሰነዱ ጸድቋል', DOCUMENT_REJECTED:'ሰነዱ ውድቅ ተደርጓል', VERIFICATION_VERIFIED:'ንግድዎ ተረጋግጧል', VERIFICATION_REJECTED:'ማረጋገጫው አልጸደቀም', VERIFICATION_UNDER_REVIEW:'ማረጋገጫው በግምገማ ላይ ነው', VERIFICATION_PENDING:'ማረጋገጫ ቀርቧል', VERIFICATION_NEEDS_INFO:'ለማረጋገጫ ተጨማሪ መረጃ ያስፈልጋል', VERIFICATION_DOCUMENTS_REQUIRED:'ለማረጋገጫ ሰነዶች ያስፈልጋሉ', VERIFICATION_UNSUBMITTED:'ማረጋገጫ አልቀረበም', REGISTRATION_SUBMITTED:'ምዝገባው ቀርቧል — ግምገማ እየጠበቀ ነው', TRIP_SAVED:'ጉዞው ተቀምጧል', TRIP_UPDATED:'ጉዞው ተዘምኗል', TRIP_REMINDER_D30:'ጉዞዎ በ30 ቀናት ይጀምራል', TRIP_REMINDER_D21:'ጉዞዎ በ21 ቀናት ይጀምራል', TRIP_REMINDER_D14:'ጉዞዎ በ14 ቀናት ይጀምራል', TRIP_REMINDER_D7:'ጉዞዎ በ7 ቀናት ይጀምራል', TRIP_REMINDER_D3:'ጉዞዎ በ3 ቀናት ይጀምራል', TRIP_REMINDER_D2:'ጉዞዎ በ2 ቀናት ይጀምራል', TRIP_REMINDER_D1:'ጉዞዎ ነገ ይጀምራል', TRIP_REMINDER_D0:'ጉዞዎ ዛሬ ይጀምራል',
      signIn:'ይግቡ', signOut:'ውጣ', admin:'አስተዳደር', notes:'ማሳወቂያዎች', markAll:'ሁሉንም እንደተነበበ ምልክት አድርግ', markRead:'ተነቧል', none:'እስካሁን ማሳወቂያ የለም።', open:'ክፈት', fromAdmin:'አስተዳደር' },
    ar: { NEW_ENQUIRY:'استفسار جديد من عميل', dismiss:'إخفاء', BUSINESS_REGISTERED:'تسجيل شركة جديدة', APPROVAL_PENDING:'بانتظار الموافقة', BUSINESS_EDITED:'تعديل بيانات شركة', PRICE_CHANGED:'تغيير سعر', MENU_UPLOADED:'رفع قائمة أسعار', DOCUMENT_UPLOADED:'رفع مستند توثيق', CLAIM_SUBMITTED:'طلب ملكية جديد', REPORT_SUBMITTED:'بلاغ عن محتوى', USER_REGISTERED:'حساب جديد', WELCOME:'مرحباً بك في بوابة إثيوبيا–الإمارات', ROLE_CHANGED:'تغيّر دور حسابك', OWNERSHIP_GRANTED:'أصبحت مالك هذا الإدراج', CLAIM_RECEIVED:'طلب أحدهم ملكية إدراجك', CLAIM_APPROVED:'تمت الموافقة على طلب الملكية', CLAIM_REJECTED:'رُفض طلب الملكية', REPORT_FILED:'قُدّم بلاغ عن إدراجك', REPORT_RESOLVED:'عولج بلاغك', REPORT_DISMISSED:'رُوجع بلاغك', FEATURED:'أصبح إدراجك مميزاً', LISTING_PUBLISHED:'نُشر إدراجك', LISTING_HIDDEN:'أُلغي نشر إدراجك', LISTING_DRAFT:'أُعيد إدراجك إلى المسودة', LISTING_PENDING:'إدراجك بانتظار المراجعة', LISTING_ARCHIVED:'أُرشف إدراجك', DOCUMENT_APPROVED:'قُبل المستند', DOCUMENT_REJECTED:'رُفض المستند', VERIFICATION_VERIFIED:'تم توثيق شركتك', VERIFICATION_REJECTED:'لم يُقبل التوثيق', VERIFICATION_UNDER_REVIEW:'التوثيق قيد المراجعة', VERIFICATION_PENDING:'قُدّم طلب التوثيق', VERIFICATION_NEEDS_INFO:'مطلوب معلومات إضافية للتوثيق', VERIFICATION_DOCUMENTS_REQUIRED:'مستندات مطلوبة للتوثيق', VERIFICATION_UNSUBMITTED:'لم يُقدَّم التوثيق', REGISTRATION_SUBMITTED:'قُدّم التسجيل — بانتظار المراجعة', TRIP_SAVED:'حُفظت الرحلة', TRIP_UPDATED:'حُدّثت الرحلة', TRIP_REMINDER_D30:'تبدأ رحلتك بعد 30 يوماً', TRIP_REMINDER_D21:'تبدأ رحلتك بعد 21 يوماً', TRIP_REMINDER_D14:'تبدأ رحلتك بعد 14 يوماً', TRIP_REMINDER_D7:'تبدأ رحلتك بعد 7 أيام', TRIP_REMINDER_D3:'تبدأ رحلتك بعد 3 أيام', TRIP_REMINDER_D2:'تبدأ رحلتك بعد يومين', TRIP_REMINDER_D1:'تبدأ رحلتك غداً', TRIP_REMINDER_D0:'تبدأ رحلتك اليوم',
      signIn:'تسجيل الدخول', signOut:'خروج', admin:'الإدارة', notes:'الإشعارات', markAll:'تعليم الكل كمقروء', markRead:'مقروء', none:'لا توجد إشعارات بعد.', open:'فتح', fromAdmin:'الإدارة' }
  };
  const lang = () => { try { return localStorage.getItem('gateway.lang') || 'en'; } catch (e) { return 'en'; } };
  const tr = (k) => { const l = L[lang()] || L.en; return l[k] || L.en[k] || null; };
  const label = (kind) => tr(kind) || String(kind || '').replace(/_/g, ' ').toLowerCase().replace(/^./, c => c.toUpperCase());
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const when = (d) => { try { return new Date(d).toLocaleString(undefined, { dateStyle:'medium', timeStyle:'short' }); } catch (e) { return ''; } };
  const target = (r) => r.src === 'admin' ? 'admin-dashboard.dc.html'
    : r.entity_type === 'trip' ? 'user-dashboard.dc.html#saved-trips'
    : r.entity_type === 'enquiry' ? 'business-dashboard.dc.html#enquiries'
    : r.business_id ? 'business-dashboard.dc.html' : 'user-dashboard.dc.html';

  const BELL = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';
  const BTN = 'border:1px solid #d7dcd6;background:#fff;color:#137a54;font-size:13px;font-weight:600;min-height:40px;padding:0 12px;border-radius:9px;cursor:pointer;font-family:inherit';

  // One shared panel on <body>, positioned under whichever bell opened it.
  let panel = null, anchor = null;
  function closePanel() { if (panel) { panel.remove(); panel = null; anchor = null; document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', esc_); window.removeEventListener('resize', closePanel); } }
  function outside(e) { if (panel && !panel.contains(e.target) && !(anchor && anchor.contains(e.target))) closePanel(); }
  function esc_(e) { if (e.key === 'Escape') closePanel(); }
  function drawPanel() {
    if (!panel || !anchor) return;
    const rect = anchor.getBoundingClientRect(), vw = window.innerWidth, w = Math.min(380, vw - 24);
    const rtl = document.documentElement.dir === 'rtl' || getComputedStyle(anchor).direction === 'rtl';
    let left = rtl ? rect.left : rect.right - w; left = Math.max(12, Math.min(left, vw - w - 12));
    panel.style.cssText = 'position:fixed;z-index:1000;top:' + Math.round(rect.bottom + 8) + 'px;left:' + Math.round(left) + 'px;width:' + w + 'px;max-height:min(70vh,520px);display:flex;flex-direction:column;background:#fffdf8;border:1px solid #e3e7e3;border-radius:16px;box-shadow:0 18px 40px rgba(7,29,53,.18);overflow:hidden;font-family:' + getComputedStyle(anchor).fontFamily.replace(/'/g, '"') + ';color:#17212b;direction:' + (rtl ? 'rtl' : 'ltr');
    const rows = S.items.map((r, i) => {
      const unread = !r.read_at;
      return '<div style="display:flex;gap:10px;align-items:flex-start;padding:12px 16px;border-top:1px solid #eef0ea;background:' + (unread ? '#fffaef' : 'transparent') + '">' +
        '<span style="flex:none;width:8px;height:8px;border-radius:50%;margin-top:7px;background:' + (unread ? '#c0392b' : 'transparent') + '"></span>' +
        '<div style="min-width:0;flex:1">' +
          '<div style="font-size:14px;font-weight:' + (unread ? 700 : 600) + ';color:#071d35;line-height:1.35">' + esc(label(r.kind)) + '</div>' +
          (r.title ? '<div style="font-size:13px;color:#3d4a56;margin-top:2px;word-break:break-word">' + esc(r.title) + '</div>' : '') +
          '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px;font-size:12px;color:#697581">' +
            '<span>' + esc(when(r.created_at)) + '</span>' + (r.src === 'admin' ? '<span style="font-weight:700;color:#137a54">' + esc(tr('fromAdmin')) + '</span>' : '') + '</div>' +
          '<div style="display:flex;gap:6px;margin-top:8px">' +
            '<a href="' + target(r) + '" data-open="' + i + '" style="' + BTN + ';display:inline-flex;align-items:center;text-decoration:none">' + esc(tr('open')) + '</a>' +
            (unread ? '<button data-read="' + i + '" style="' + BTN + ';color:#17212b">' + esc(tr('markRead')) + '</button>' : '') +
            (r.src === 'user' && !S.noDismiss ? '<button data-dismiss="' + i + '" style="' + BTN + ';color:#697581">' + esc(tr('dismiss')) + '</button>' : '') +
          '</div></div></div>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 16px">' +
        '<span style="font-size:15px;font-weight:700;color:#071d35">' + esc(tr('notes')) + (S.unread ? ' (' + S.unread + ')' : '') + '</span>' +
        (S.unread ? '<button data-all="1" style="' + BTN + '">' + esc(tr('markAll')) + '</button>' : '') + '</div>' +
      '<div style="overflow-y:auto;-webkit-overflow-scrolling:touch">' + (rows || '<div style="padding:22px 16px;text-align:center;font-size:13.5px;color:#697581;border-top:1px solid #eef0ea">' + esc(tr('none')) + '</div>') + '</div>';
  }
  function openPanel(btn) {
    if (panel && anchor === btn) return closePanel();
    closePanel();
    anchor = btn; panel = document.createElement('div'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', tr('notes'));
    panel.addEventListener('click', (e) => {
      const t = e.target.closest('[data-read],[data-all],[data-open],[data-dismiss]'); if (!t) return;
      if (t.dataset.dismiss != null) { dismiss(S.items[+t.dataset.dismiss]); return; }
      if (t.dataset.all) markRead(S.items);
      else if (t.dataset.read != null) markRead([S.items[+t.dataset.read]]);
      else { const r = S.items[+t.dataset.open]; if (r && !r.read_at) markRead([r]);
        try { if (r && r.business_id) sessionStorage.setItem('gw.openBiz', r.business_id); } catch (x) {} if (r && r.src === 'admin') { try { sessionStorage.setItem('gw.adminTab', 'notes'); } catch (x) {} window.dispatchEvent(new Event('gw-open-notes')); } closePanel(); }
    });
    document.body.appendChild(panel);
    document.addEventListener('mousedown', outside, true);
    document.addEventListener('keydown', esc_);
    window.addEventListener('resize', closePanel);
    drawPanel();
    load();
  }
  window.addEventListener('gw-role', drawPanel);

  // <gw-admin-bar>: bell + Admin link (Home). <gw-admin-bell>: bell only.
  class HeaderNotes extends HTMLElement {
    connectedCallback() { this._r = () => this.render(); window.addEventListener('gw-role', this._r); this.render(); }
    disconnectedCallback() { window.removeEventListener('gw-role', this._r); if (anchor && this.contains(anchor)) closePanel(); }
    render() {
      const signedIn = !!S.user, link = this.tagName === 'GW-ADMIN-BAR' && S.admin, n = S.unread;
      this.style.display = signedIn ? 'flex' : 'none';
      this.style.alignItems = 'center'; this.style.gap = '6px'; this.style.flex = 'none';
      if (!signedIn) { if (anchor && this.contains(anchor)) closePanel(); this.innerHTML = ''; return; }
      const aria = tr('notes') + (n ? ' (' + n + ')' : '');
      const key = n + '|' + link + '|' + lang();
      if (this._key === key) return; this._key = key;
      const wasOpen = anchor && this.contains(anchor);
      this.innerHTML =
        '<button type="button" data-gw="bell" aria-haspopup="dialog" aria-label="' + esc(aria) + '" title="' + esc(aria) + '" style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border-radius:11px;border:1px solid #d7dcd6;background:#fff;color:#17212b;cursor:pointer;box-sizing:border-box">' + BELL +
          (n > 0 ? '<span style="position:absolute;top:3px;inset-inline-end:2px;min-width:18px;height:18px;padding:0 5px;box-sizing:border-box;border-radius:999px;background:#c0392b;color:#fff;font-size:11px;font-weight:700;line-height:18px;text-align:center">' + (n > 99 ? '99+' : n) + '</span>' : '') + '</button>' +
        (link ? '<a href="admin-dashboard.dc.html" style="display:inline-flex;align-items:center;min-height:44px;padding:0 13px;border-radius:10px;border:1px solid #d7dcd6;background:#fff;color:#137a54;font-size:13px;font-weight:600;white-space:nowrap;box-sizing:border-box">' + esc(tr('admin')) + '</a>' : '');
      const bell = this.querySelector('[data-gw="bell"]');
      bell.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openPanel(bell); });
      if (wasOpen) { anchor = bell; drawPanel(); }
    }
  }
  // <gw-auth-button>: the one Sign in / Sign out control used in every header.
  // Shows nothing until the session check finishes, so a signed-in user never
  // sees "Sign in" flash. variant="menu" is the full-width mobile-menu style.
  const AUTH_STYLE = {
    bar: 'display:inline-flex;align-items:center;justify-content:center;min-height:44px;box-sizing:border-box;border:1px solid #d7dcd6;background:#fff;color:#17212b;font-size:13px;font-weight:600;padding:0 16px;border-radius:10px;white-space:nowrap;cursor:pointer;font-family:inherit;text-decoration:none',
    menu: 'display:flex;align-items:center;justify-content:center;width:100%;min-height:50px;margin-top:6px;box-sizing:border-box;border:1px solid #d7dcd6;border-radius:10px;background:#fff;color:#17212b;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:none'
  };
  class AuthButton extends HTMLElement {
    connectedCallback() { this._r = () => this.render(); window.addEventListener('gw-role', this._r); window.addEventListener('storage', this._r); this.render(); }
    disconnectedCallback() { window.removeEventListener('gw-role', this._r); window.removeEventListener('storage', this._r); }
    render() {
      const menu = this.getAttribute('variant') === 'menu';
      this.style.display = menu ? 'block' : 'inline-flex'; this.style.flex = 'none';
      if (!S.checked) { this.style.visibility = 'hidden'; if (this._key !== 'wait') { this._key = 'wait'; this.innerHTML = '<span style="' + AUTH_STYLE[menu ? 'menu' : 'bar'] + '">' + esc(tr('signIn')) + '</span>'; } return; }
      this.style.visibility = 'visible';
      const key = (S.user ? 'out' : 'in') + '|' + lang() + '|' + menu;
      if (this._key === key) return; this._key = key;
      const st = AUTH_STYLE[menu ? 'menu' : 'bar'];
      if (S.user) {
        this.innerHTML = '<button type="button" style="' + st + '">' + esc(tr('signOut')) + '</button>';
        const b = this.querySelector('button');
        b.addEventListener('click', (e) => { e.preventDefault(); b.disabled = true; b.style.opacity = '.6'; signOut(); });
      } else {
        this.innerHTML = '<a href="sign-in.dc.html" style="' + st + '">' + esc(tr('signIn')) + '</a>';
      }
    }
  }
  if (!customElements.get('gw-auth-button')) customElements.define('gw-auth-button', AuthButton);

  if (!customElements.get('gw-admin-bar')) customElements.define('gw-admin-bar', class extends HeaderNotes {});
  if (!customElements.get('gw-admin-bell')) customElements.define('gw-admin-bell', class extends HeaderNotes {});
})();
