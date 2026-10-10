// Trip budget estimator. Deterministic and free to run: no network, no AI.
// Prices come ONLY from structured prices businesses saved in business_services.
// Menu files are never read. Anything without a usable price stays unknown.
(function () {
  const CATS = ['STAY', 'FOOD', 'ACTIVITY', 'TRANSPORT'];
  // Which planner category a business's directory category supplies.
  const CAT_OF_SLUG = { hotels:'STAY', restaurants:'FOOD', coffee:'FOOD', tourism:'ACTIVITY',
    'travel-services':'ACTIVITY', transportation:'TRANSPORT' };
  // Business pricing units with a direct meaning in a day plan. PER_HOUR has
  // no quantity here, so it is skipped rather than guessed.
  const UNIT = { PER_NIGHT:'PER_NIGHT', PER_PERSON:'PER_PERSON', PER_PERSON_NIGHT:'PER_PERSON_NIGHT',
    PER_MEAL:'PER_MEAL', PER_DAY:'PER_DAY', PER_TRIP:'PER_TRIP', FIXED:'PER_TRIP', PER_ITEM:'PER_GROUP' };
  // Fixed, visible assumptions. Shown to the user with every estimate.
  const ASSUME = { perRoom:2, mealsPerDay:3, activitiesPerDay:1, ridesPerDay:1 };
  const OCC_KEY = { STAY:'xNights', FOOD:'xMeals', ACTIVITY:'xActivities', TRANSPORT:'xRides' };

  const num = (v) => { const s = String(v == null ? '' : v).trim().replace(',', '.'); return /^\d+(\.\d+)?$/.test(s) ? Number(s) : null; };

  function ctxFor(days, travellers) {
    return { days, travellers, nights:Math.max(days - 1, 0),
      rooms:Math.max(1, Math.ceil(travellers / ASSUME.perRoom)) };
  }

  function quantity(cat, unit, c) {
    const per = cat === 'FOOD' ? ASSUME.mealsPerDay : cat === 'ACTIVITY' ? ASSUME.activitiesPerDay : ASSUME.ridesPerDay;
    const occ = cat === 'STAY' ? c.nights : c.days * per;
    const occF = { n:occ, key:OCC_KEY[cat] }, ppl = { n:c.travellers, key:'xPeople' };
    switch (unit) {
      case 'PER_PERSON': case 'PER_MEAL': return { qty:occ * c.travellers, factors:[occF, ppl] };
      case 'PER_GROUP': return { qty:occ, factors:[occF] };
      case 'PER_DAY': return { qty:c.days, factors:[{ n:c.days, key:'xDays' }] };
      case 'PER_NIGHT': return { qty:c.nights * c.rooms, factors:[{ n:c.nights, key:'xNights' }, { n:c.rooms, key:'xRooms' }] };
      case 'PER_PERSON_NIGHT': return { qty:c.nights * c.travellers, factors:[{ n:c.nights, key:'xNights' }, ppl] };
      case 'PER_TRIP': return { qty:1, factors:[{ n:1, key:'xOnce' }] };
      default: return null;
    }
  }

  // Rates are only ever typed by the user ("1 USD = x ETB / y AED").
  function convert(amount, from, to, money) {
    if (from === to) return amount;
    const r = { USD:1, ETB:num(money.usdEtb), AED:num(money.usdAed) };
    if (!r[from] || !r[to]) return null;
    return amount / r[from] * r[to];
  }

  function categoryOf(svc) {
    if (svc.price_unit === 'PER_NIGHT' || svc.price_unit === 'PER_PERSON_NIGHT') return 'STAY';
    if (svc.price_unit === 'PER_MEAL') return 'FOOD';
    return CAT_OF_SLUG[svc.categorySlug] || null;
  }

  function costCandidate(svc, cat, days, travellers, money) {
    const unit = UNIT[svc.price_unit];
    if (!unit) return { skip:'unit' };
    const c = ctxFor(days, travellers), q = quantity(cat, unit, c);
    if (!q) return { skip:'unit' };
    const native = Number(svc.price) * q.qty;
    const total = convert(native, svc.currency, money.currency, money);
    if (total == null) return { skip:'rate', currency:svc.currency };
    const perDay = new Array(days).fill(0);
    if (unit === 'PER_TRIP') perDay[0] = total;
    else if (cat === 'STAY' || unit === 'PER_NIGHT' || unit === 'PER_PERSON_NIGHT') {
      for (let i = 0; i < c.nights && i < days; i++) perDay[i] = total / c.nights;
    } else for (let i = 0; i < days; i++) perDay[i] = total / days;
    return { svc, cat, unit, q, total, perDay };
  }

  // Up to n entries spread evenly across a sorted list, keeping both ends.
  function spread(list, n) {
    if (list.length <= n) return list;
    const out = [];
    for (let i = 0; i < n; i++) out.push(list[Math.round(i * (list.length - 1) / (n - 1))]);
    return out.filter((x, i, a) => a.indexOf(x) === i);
  }

  function build(input, days) {
    const { services, travellers, money, startDate } = input;
    const end = startDate ? new Date(new Date(startDate).getTime() + (days - 1) * 86400000).toISOString().slice(0, 10) : '';
    const byCat = {}, needRate = new Set();
    let skippedUnit = 0, skippedDates = 0;
    CATS.forEach(c => { byCat[c] = []; });
    services.forEach(svc => {
      const cat = categoryOf(svc);
      if (!cat) return;
      if (startDate && ((svc.available_from && svc.available_from > end) || (svc.available_to && svc.available_to < startDate))) { skippedDates++; return; }
      const r = costCandidate(svc, cat, days, travellers, money);
      if (r.skip === 'rate') needRate.add(r.currency);
      else if (r.skip) skippedUnit++;
      else byCat[cat].push(r);
    });
    CATS.forEach(c => { byCat[c] = spread(byCat[c].sort((a, b) => a.total - b.total), 8); });
    return { byCat, needRate:[...needRate], skippedUnit, skippedDates };
  }

  function targetIndex(style, n) { return style === 'BUDGET' ? 0 : style === 'LUXURY' ? n - 1 : Math.floor((n - 1) / 2); }

  function choose(byCat, style, budget) {
    const cats = CATS.filter(c => byCat[c].length);
    const target = {}; cats.forEach(c => { target[c] = targetIndex(style, byCat[c].length); });
    let best = null, cheapest = null;
    const walk = (i, idx, total) => {
      if (i === cats.length) {
        const dist = cats.reduce((n, c) => n + Math.abs(idx[c] - target[c]), 0);
        if (!cheapest || total < cheapest.total) cheapest = { idx:{ ...idx }, total };
        if (budget == null || total <= budget + 1e-9) {
          if (!best || dist < best.dist || (dist === best.dist && total > best.total)) best = { idx:{ ...idx }, total, dist };
        }
        return;
      }
      const c = cats[i];
      byCat[c].forEach((cand, k) => { idx[c] = k; walk(i + 1, idx, total + cand.total); });
    };
    walk(0, {}, 0);
    return { cats, target, best, cheapest };
  }

  // input: { services, days, travellers, style, money, startDate }
  function estimate(input) {
    const style = input.style === 'PREMIUM' ? 'MID' : (input.style || 'MID');
    const budget = num(input.money.amount);
    const hasBudget = budget != null && budget > 0;
    const b = build(input, input.days);
    const ch = choose(b.byCat, style, hasBudget ? budget : null);
    const pickIdx = ch.best ? ch.best.idx : (ch.cheapest ? ch.cheapest.idx : {});
    const picks = {};
    CATS.forEach(c => { picks[c] = (pickIdx[c] != null) ? b.byCat[c][pickIdx[c]] : null; });
    const total = CATS.reduce((n, c) => n + (picks[c] ? picks[c].total : 0), 0);
    const unknown = CATS.filter(c => !picks[c]);
    const adjusted = ch.best && hasBudget ? ch.cats.filter(c => ch.best.idx[c] < ch.target[c]) : [];
    const out = { style, budget, hasBudget, picks, total, unknown, adjusted, assume:ASSUME,
      ctx:ctxFor(input.days, input.travellers), needRate:b.needRate,
      skippedUnit:b.skippedUnit, skippedDates:b.skippedDates,
      fits: !hasBudget || !!ch.best, remaining: hasBudget ? budget - total : null };
    if (hasBudget && !ch.best && ch.cheapest) {
      out.cheapestTotal = ch.cheapest.total;
      for (let d = input.days - 1; d >= 1; d--) {
        const bd = build(input, d), cd = choose(bd.byCat, style, budget);
        if (cd.best && cd.cats.length === ch.cats.length) { out.maxDays = d; break; }
      }
    }
    return out;
  }

  window.TripBudget = { CATS, ASSUME, estimate, convert, num };
})();
