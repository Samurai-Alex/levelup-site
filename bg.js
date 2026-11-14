// Живий фон «Level Up» як у програмі (HabitTrackerApp/app/js/bgfx.js, levelup): кристали досвіду, частина з «+XP», і пил піднімаються вгору.
// На сайті тихіший: без хвиль, менше й блідіше; на телефоні ще вдвічі менше. Стартує після завантаження сторінки,
// на паузі, коли вкладка схована; кому в системі вимкнено анімації — фону немає.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const PAL = [['#ffffff', 4, 1], ['#1fb846', 3, 1], ['#4cc9f0', 2, 1.08], ['#a970ff', 1.5, 1.18], ['#ffcf5a', 1.2, 1.3]];   // колір, вага, яскравість — як BG_LV у програмі
  const DIM = .5, phone = matchMedia('(max-width: 700px)').matches, DEN = phone ? .2 : .4;
  const rgb = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)), rgba = (c, a) => `rgba(${rgb(c)},${a})`;
  const tint = (c, k) => '#' + rgb(c).map(v => Math.round(v + (255 - v) * k).toString(16).padStart(2, '0')).join('');
  const off = (w, h) => Object.assign(document.createElement('canvas'), {width: w, height: h});

  function start() {
    const cv = Object.assign(document.createElement('canvas'), {ariaHidden: 'true'});
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none';
    document.body.prepend(cv);
    const g = cv.getContext('2d'), k = Math.min(devicePixelRatio || 1, 2), fs = Math.round(11 * k), sum = PAL.reduce((s, x) => s + x[1], 0);
    // кристал і «+XP» малюються один раз — кадр лише копіює їх
    const look = PAL.map(([c, , r]) => { const S = 64, gem = off(S, S), a = gem.getContext('2d'), m = S / 2, gw = S * .2, gh = S * .3;
      const glow = a.createRadialGradient(m, m, 0, m, m, m); glow.addColorStop(0, rgba(c, .45)); glow.addColorStop(.35, rgba(c, .12)); glow.addColorStop(1, rgba(c, 0));
      a.fillStyle = glow; a.fillRect(0, 0, S, S);
      const body = a.createLinearGradient(0, m - gh, 0, m + gh); body.addColorStop(0, tint(c, .8)); body.addColorStop(.45, c); body.addColorStop(1, `rgb(${rgb(c).map(v => Math.round(v * .62))})`);
      a.beginPath(); a.moveTo(m, m - gh); a.lineTo(m + gw, m); a.lineTo(m, m + gh); a.lineTo(m - gw, m); a.closePath(); a.fillStyle = body; a.fill();
      a.beginPath(); a.moveTo(m, m - gh); a.lineTo(m + gw, m); a.lineTo(m, m); a.closePath(); a.fillStyle = 'rgba(255,255,255,.35)'; a.fill();
      a.strokeStyle = 'rgba(255,248,225,.7)'; a.lineWidth = 1; a.beginPath(); a.moveTo(m - gw, m); a.lineTo(m + gw, m); a.stroke();
      const xp = off(fs * 3, fs * 1.4), b = xp.getContext('2d');
      b.font = `800 ${fs}px "Segoe UI",sans-serif`; b.textAlign = 'center'; b.textBaseline = 'middle'; b.fillStyle = c; b.fillText('+XP', fs * 1.5, fs * .7);
      return {c, gem, xp, r}; });
    const pick = () => { let r = Math.random() * sum, i = 0; while ((r -= PAL[i][1]) > 0 && i < PAL.length - 1) i++; return i; };
    let w, h, m, d;
    const mk = top => { const z = Math.random(); return {x: Math.random() * w, y: top ? Math.random() * h : h + 30 * k, z, v: (12 + z * 38) * k, ph: Math.random() * 6.28, ci: pick(), xp: z > .55 && Math.random() < .3}; };
    const size = () => { w = cv.width = Math.round(innerWidth * k); h = cv.height = Math.round(innerHeight * k);
      m = Array.from({length: Math.round(50 * DEN)}, () => mk(true)); d = Array.from({length: Math.round(140 * DEN)}, () => ({x: Math.random() * w, y: Math.random() * h, r: .6 + Math.random() * 1.1, v: 3 + Math.random() * 8, ph: Math.random() * 6.28, ci: pick()})); };
    size();
    let rw; addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(() => { if (Math.abs(innerWidth * k - w) > 2) size(); }, 200); });   // на телефоні висота «стрибає» від панелі адреси — перебудова лише при зміні ширини
    let last = 0, raf = 0;
    const frame = t => { const dt = Math.min(.05, (t - (last || t)) / 1000); last = t; g.clearRect(0, 0, w, h);
      for (const p of d) { p.y -= p.v * k * dt; p.ph += dt * 2; if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
        g.fillStyle = look[p.ci].c; g.globalAlpha = (.12 + .3 * (Math.sin(p.ph) + 1) / 2) * DIM; g.beginPath(); g.arc(p.x, p.y, p.r * k, 0, 6.28); g.fill(); }
      m.forEach((p, i) => { p.y -= p.v * dt; p.ph += dt * 1.6; if (p.y < -40 * k) { m[i] = mk(false); return; }
        const L = look[p.ci], s = (18 + p.z * 30) * k * L.r, x = p.x + Math.sin(p.ph) * 5 * k;
        const a = Math.max(0, Math.min(1, Math.min(1, p.y / h * 1.6) * (.5 + p.z * .5) * (.8 + .2 * Math.sin(p.ph * 2.3)) * L.r)) * DIM;
        g.globalAlpha = a; g.drawImage(L.gem, x - s / 2, p.y - s / 2, s, s);
        if (p.xp) { g.globalAlpha = a * .85; g.drawImage(L.xp, x - L.xp.width / 2, p.y - s * .45 - L.xp.height * .8); } });
      g.globalAlpha = 1; raf = requestAnimationFrame(frame); };
    const run = () => { cancelAnimationFrame(raf); last = 0; if (!document.hidden) raf = requestAnimationFrame(frame); };
    document.addEventListener('visibilitychange', run); run();
  }
  // після завантаження сторінки й у вільну хвилину — фон не заважає першому екрану
  const go = () => (window.requestIdleCallback || setTimeout)(start, {timeout: 1500});
  if (document.readyState === 'complete') go(); else addEventListener('load', go);
})();
