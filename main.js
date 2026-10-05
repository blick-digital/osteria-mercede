/* Osteria Mercede — interactions
   Photos: drop real files at the paths in `src` fields below (or in data-src attributes
   in index.html). Until the file exists, a placeholder is shown automatically. */

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
if (matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.globalTimeline.timeScale(8);

/* ---------- photo placeholders → real images when files exist ---------- */
function hydrate(root = document) {
  root.querySelectorAll('.ph[data-src]').forEach(el => {
    if (el.dataset.hydrated) return;
    el.dataset.hydrated = '1';
    const img = new Image();
    img.onload = () => { el.style.backgroundImage = `url("${el.dataset.src}")`; el.classList.add('has-img'); };
    img.src = el.dataset.src;
  });
}

/* ============================================================
   1 · HERO — plate with 5 pastas
   ============================================================ */
const ASSET_V = 3;   // bump when plate / side photos are replaced, so browsers drop cached copies
const pastas = [
  { name: 'Spaghetti alla Carbonara', short: 'Carbonara', slug: 'carbonara', h: 42, src: 'assets/pasta/carbonara.webp', full: true,
    desc: 'Crisp guanciale, egg yolk, Pecorino Romano and black pepper. Roman, and never with cream.' },
  { name: 'Cacio e Pepe', short: 'Cacio e Pepe', slug: 'cacio-e-pepe', h: 48, src: 'assets/pasta/cacio-e-pepe.webp', full: true,
    desc: 'Hand-cut tonnarelli, aged Pecorino and toasted pepper. Three ingredients, nowhere to hide.' },
  { name: 'Tagliatelle al Ragù', short: 'Tagliatelle', slug: 'tagliatelle-ragu', h: 14, src: 'assets/pasta/tagliatelle-ragu.webp', full: true,
    desc: 'Egg pasta pulled by hand, folded into a Bolognese ragù simmered for six slow hours.' },
  { name: 'Trofie al Pesto', short: 'Trofie al Pesto', mshort: 'Trofie', slug: 'trofie-pesto', h: 100, src: 'assets/pasta/trofie-pesto.webp', full: true,
    desc: 'Twisted Ligurian trofie, Genovese basil, pine nuts, Parmigiano and green olive oil.' },
  { name: 'Spaghetti alle Vongole', short: 'Vongole', slug: 'vongole', h: 28, src: 'assets/pasta/vongole.webp', full: true,
    desc: 'Clams, garlic, white wine and parsley. The whole sea on a plate, with no shortcuts.' },
  { name: 'Bucatini all’Amatriciana', short: 'Amatriciana', slug: 'amatriciana', h: 8, src: 'assets/pasta/amatriciana.webp', full: true,
    desc: 'Hollow bucatini, guanciale, San Marzano tomato and a snowfall of Pecorino.' },
  { name: 'Penne all’Arrabbiata', short: 'Arrabbiata', slug: 'arrabbiata', h: 2, src: 'assets/pasta/arrabbiata.webp', full: true,
    desc: 'Penne rigate in an angry sauce of garlic, chili and sweet tomato. Simple, loud, Roman.' },
];
const N = pastas.length, MID = (N - 1) / 2;
const isMobile = () => matchMedia('(max-width:820px)').matches;

const well = document.getElementById('well');
const orbit = document.getElementById('orbit');
const marker = document.getElementById('marker');
const plate = document.getElementById('plate');
const plateWrap = document.getElementById('plateWrap');
const dishName = document.getElementById('dishName');
const dishDesc = document.getElementById('dishDesc');
const counter = document.getElementById('counter');
const hero = document.getElementById('hero');

const dishes = pastas.map((p, i) => {
  const d = document.createElement('div');
  d.className = 'dish';
  d.innerHTML = `<div class="ph" data-label="${p.short}" data-src="${p.src}?v=${ASSET_V}" style="--h:${p.h}"></div>`;
  (p.full ? plate : well).appendChild(d);   // `full` photos already include the plate, so they cover it entirely
  return d;
});

const NS = 'http://www.w3.org/2000/svg';
const ORBIT_K = 1.07;   // orbit radius relative to the plate (desktop)
const svg = document.createElementNS(NS, 'svg');
orbit.appendChild(svg);
const orbitLine = orbit.querySelector('.orbit-line');
const stepDeg = () => parseFloat(getComputedStyle(hero).getPropertyValue('--step')) || 24;
let angles = [];   // label centres on the arc (deg), filled by buildOrbit
const angleOf = i => angles[i] ?? (i - MID) * stepDeg();
let cur = 0, busy = false, pending = null;
let labels = [];

// names are set on an arc that follows the orbit line
function buildOrbit() {
  if (isMobile()) return buildOrbitFit();
  angles = [];
  const r = plateWrap.offsetWidth / 2 * ORBIT_K + 4;
  const half = stepDeg() / 2 * .94;
  svg.innerHTML = '';
  labels = pastas.map((p, i) => {
    const a = angleOf(i), pt = d => [r * Math.sin(d * Math.PI / 180), -r * Math.cos(d * Math.PI / 180)];
    const [x1, y1] = pt(a - half), [x2, y2] = pt(a + half);
    const path = document.createElementNS(NS, 'path');
    path.id = `arc${i}`;
    path.setAttribute('d', `M${x1} ${y1}A${r} ${r} 0 0 1 ${x2} ${y2}`);
    path.setAttribute('fill', 'none');
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('class', 'orb-label' + (i === cur ? ' on' : ''));
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dy', '-6');
    t.innerHTML = `<textPath href="#arc${i}" startOffset="50%">${p.short}</textPath>`;
    t.addEventListener('click', () => goTo(i));
    svg.append(path, t);
    return t;
  });
}

// phone: names are laid out one after another by their real text width with one equal gap (equal angular
// slots made short names look far apart), and the row is kept inside the screen
function buildOrbitFit() {
  const r = orbitLine.offsetWidth / 2 + 14;             // labels sit just outside the ring
  // arc length the whole row may take: N slots, but on a phone never wider than the screen minus a margin
  const edge = hero.clientWidth / 2 - 14;
  const span = Math.min(N * stepDeg() * Math.PI / 180, edge < r ? 2 * Math.asin(edge / r) : Infinity);
  const arc = span * r;
  const pt = (rad, rr = r) => [rr * Math.sin(rad), -rr * Math.cos(rad)];
  svg.innerHTML = '';
  // 1 · create the labels with a simple path and measure them
  const items = pastas.map((p, i) => {
    const path = document.createElementNS(NS, 'path'); path.id = `arc${i}`; path.setAttribute('fill', 'none');
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('class', 'orb-label' + (i === cur ? ' on' : ''));
    t.setAttribute('text-anchor', 'middle'); t.setAttribute('dy', '-6');
    t.innerHTML = `<textPath href="#arc${i}" startOffset="50%">${isMobile() && p.mshort || p.short}</textPath>`;
    t.addEventListener('click', () => goTo(i));
    svg.append(path, t);
    return { path, t, p };
  });
  // measure at the css font size (the textPath needs a path long enough, so give it a generous one first)
  items.forEach(o => o.path.setAttribute('d', `M${pt(-1.5)[0]} ${pt(-1.5)[1]}A${r} ${r} 0 0 1 ${pt(1.5)[0]} ${pt(1.5)[1]}`));
  let widths = items.map(o => o.t.getComputedTextLength());
  const fs0 = parseFloat(getComputedStyle(items[0].t).fontSize);
  // 2 · too long for the arc? shrink the type a little (gap is at least 1.4 em)
  let scale = Math.min(1, arc / (widths.reduce((a, b) => a + b, 0) + (N - 1) * 1.4 * fs0));
  if (scale < 1) {
    items.forEach(o => { o.t.style.fontSize = (fs0 * scale) + 'px'; });
    widths = items.map(o => o.t.getComputedTextLength());
  }
  const gap = (arc - widths.reduce((a, b) => a + b, 0)) / (N - 1);
  // 3 · place: equal gaps, centred on the top of the plate
  let x = -arc / 2;
  angles = [];
  items.forEach((o, i) => {
    const c = x + widths[i] / 2, half = (widths[i] / 2 + 3) / r;
    angles[i] = c / r * 180 / Math.PI;
    const a = c / r, [x1, y1] = pt(a - half), [x2, y2] = pt(a + half);
    o.path.setAttribute('d', `M${x1} ${y1}A${r} ${r} 0 0 1 ${x2} ${y2}`);
    x += widths[i] + gap;
  });
  labels = items.map(o => o.t);
}


// side photos: a card that flips to a new scene for every pasta
const photos = ['Left', 'Right'].map(S => {
  const fig = document.getElementById('hp' + S);
  return { fig, side: S.toLowerCase(), card: fig.querySelector('.card'), front: fig.querySelector('.front .ph'), back: fig.querySelector('.back .ph') };
});
const sceneOf = (p, side) => ({ src: `assets/hero/${p.slug}-${side}.jpg?v=${ASSET_V}`, label: `${p.short} · ${side === 'left' ? 'ambience' : 'detail'}`, h: (p.h + (side === 'left' ? 24 : 336)) % 360 });
function fillPh(el, d) {
  el.dataset.label = d.label; el.style.setProperty('--h', d.h); el.classList.remove('has-img'); el.style.backgroundImage = ''; el.dataset.src = d.src;
  const i = new Image(); i.onload = () => { if (el.dataset.src === d.src) { el.style.backgroundImage = `url("${d.src}")`; el.classList.add('has-img'); } }; i.src = d.src;
}
photos.forEach(p => fillPh(p.front, sceneOf(pastas[0], p.side)));
function flipPhotos(next, dir) {
  photos.forEach((p, k) => {
    fillPh(p.back, sceneOf(pastas[next], p.side));
    const sign = (k ? -1 : 1) * dir;
    gsap.killTweensOf([p.card, p.fig]);
    gsap.timeline({ delay: .3 + k * .12, onComplete() {
      p.front.className = p.back.className; p.front.style.cssText = p.back.style.cssText; p.front.dataset.label = p.back.dataset.label; p.front.dataset.src = p.back.dataset.src;
      gsap.set(p.card, { rotationY: 0 });
    } })
      .to(p.card, { rotationY: 180 * sign, duration: 1.05, ease: 'power3.inOut' }, 0)
      .to(p.fig, { scale: 1.07, rotationZ: sign * 2.5, duration: .52, ease: 'power2.out', yoyo: true, repeat: 1 }, 0);
  });
}

buildOrbit();
counter.textContent = `01 / 0${N}`;
gsap.set(dishes[0], { opacity: 1 });
gsap.set(marker, { rotation: angleOf(0) });
if (isMobile()) document.fonts.ready.then(() => { buildOrbit(); gsap.set(marker, { rotation: angleOf(cur) }); });   // phone only: re-measure the labels once their font is in
dishDesc.textContent = pastas[0].desc;
hydrate();

function swapText(i) {
  const tl = gsap.timeline();
  tl.to([dishName, dishDesc], { y: -10, opacity: 0, filter: 'blur(8px)', duration: .35, ease: 'power2.in', stagger: .04 })
    .add(() => {
      dishName.textContent = pastas[i].name;
      dishDesc.textContent = pastas[i].desc;
      counter.textContent = `0${i + 1} / 0${N}`;
    })
    .fromTo([dishName, dishDesc], { y: 12, opacity: 0, filter: 'blur(8px)' },
      { y: 0, opacity: 1, filter: 'blur(0px)', duration: .7, ease: 'power3.out', stagger: .06 });
}

function goTo(next) {
  if (next === cur) return;
  if (busy) { pending = next; return; }
  busy = true;
  const prev = cur; cur = next;
  labels.forEach((l, i) => l.classList.toggle('on', i === next));

  // plate: full 360° turn with velocity-driven motion blur
  let last = gsap.getProperty(plate, 'rotation');
  gsap.to(plate, {
    rotation: '+=360', duration: 1.6, ease: 'power4.inOut',
    onUpdate() {
      const r = gsap.getProperty(plate, 'rotation');
      const v = Math.abs(r - last); last = r;
      plateWrap.style.filter = `blur(${Math.min(v * .26, 3.8).toFixed(1)}px)`;
    },
    onComplete() {
      plateWrap.style.filter = 'none';
      busy = false;
      if (pending !== null) { const n = pending; pending = null; goTo(n); }
    },
  });
  // swap the pasta at the blurriest moment
  gsap.to(dishes[prev], { opacity: 0, scale: .94, duration: .6, delay: .55, ease: 'none' });
  gsap.fromTo(dishes[next], { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: .7, delay: .5, ease: 'none' });
  // marker glides to the chosen name
  gsap.to(marker, { rotation: angleOf(next), duration: 1.6, ease: 'power4.inOut' });
  swapText(next);
  flipPhotos(next, next > prev ? 1 : -1);
}

document.getElementById('prevDish').addEventListener('click', () => goTo((cur + pastas.length - 1) % pastas.length));
document.getElementById('nextDish').addEventListener('click', () => goTo((cur + 1) % pastas.length));
addEventListener('keydown', e => {
  if (scrollY > innerHeight * .6) return;
  if (e.key === 'ArrowRight') goTo((cur + 1) % pastas.length);
  if (e.key === 'ArrowLeft') goTo((cur + pastas.length - 1) % pastas.length);
});
let sx = null;
hero.addEventListener('pointerdown', e => { sx = e.clientX; });
hero.addEventListener('pointerup', e => {
  if (sx === null) return;
  const dx = e.clientX - sx; sx = null;
  if (Math.abs(dx) > 60) goTo((cur + (dx < 0 ? 1 : -1) + pastas.length) % pastas.length);
});
function fitLogo() {
  const el = document.getElementById('logoIn'), box = document.getElementById('logo');
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = '100px "Losta Masta"';
  const t = ctx.measureText('OSTERIA MERCEDE');
  const ink = t.actualBoundingBoxLeft + t.actualBoundingBoxRight;
  const k = box.clientWidth / ink;            // ink edge to ink edge = Home … Reserve
  box.style.fontSize = (100 * k) + 'px';
  el.style.marginLeft = (t.actualBoundingBoxLeft * k) + 'px';
}
fitLogo();
document.fonts.ready.then(fitLogo);
// headline block sits exactly midway between the nav bar and the dish names on the arc
function balanceHead() {
  const head = document.querySelector('.head'), logo = document.getElementById('logo');
  const tb = document.querySelector('.topbar'), nav = tb.querySelector('.nav');
  head.style.top = '';
  const mob = isMobile();   // mobile: photos are placed by CSS, the headline centres between the top bar and the photos
  if (mob) document.getElementById('hpRight').style.top = '';
  const navBottom = mob ? tb.offsetTop + tb.offsetHeight : tb.offsetTop + nav.offsetTop + nav.offsetHeight;
  const fs = parseFloat(getComputedStyle(logo).fontSize);
  const cx = document.createElement('canvas').getContext('2d');
  cx.font = `${fs}px "Losta Masta"`;
  const fm = cx.measureText('A'), up = inkMetrics('200px "Losta Masta"', 'OSTERIA').up * fs / 200;
  const baseline = (logo.offsetHeight - fs) / 2 + (fs - (fm.fontBoundingBoxAscent + fm.fontBoundingBoxDescent)) / 2 + fm.fontBoundingBoxAscent;
  const inkTop = head.offsetTop + logo.offsetTop + baseline - up;
  const descBottom = head.offsetTop + dishDesc.offsetTop + dishDesc.offsetHeight;
  const arcTop = hero.clientHeight - (plateWrap.offsetWidth / 2 * ORBIT_K + 4) - 15;
  // mobile: the description sits ~30px above the photos, but never closer than 6px to the top bar
  const photoTop = Math.min(...['hpLeft', 'hpRight'].map(id => document.getElementById(id).offsetTop));
  const delta = mob ? Math.max(photoTop - 30 - descBottom, navBottom + 6 - inkTop)
    : ((arcTop - descBottom) - (inkTop - navBottom)) / 2;
  head.style.top = (head.offsetTop + delta) + 'px';
  if (mob) return;
  // right photo: top edge level with the top of the dish name
  const dn = document.getElementById('dishName'), dcs = getComputedStyle(dn), dfs = parseFloat(dcs.fontSize);
  cx.font = `${dfs}px "Leonov SP"`;
  const dm = cx.measureText('A'), dup = inkMetrics('200px "Leonov SP"', 'PENNE').up * dfs / 200;
  const dbase = (dn.offsetHeight - (dm.fontBoundingBoxAscent + dm.fontBoundingBoxDescent)) / 2 + dm.fontBoundingBoxAscent;
  document.getElementById('hpRight').style.top = (head.offsetTop + dn.offsetTop + dbase - dup) + 'px';
}
document.fonts.ready.then(balanceHead);
addEventListener('resize', () => { fitLogo(); buildOrbit(); balanceHead(); gsap.set(marker, { rotation: angleOf(cur) }); });

// intro
gsap.timeline({ defaults: { ease: 'power3.out' } })
  .from('.logo-in', { y: 40, opacity: 0, filter: 'blur(14px)', duration: 1.4 }, 0)
  .from('.topbar > *', { y: -14, opacity: 0, duration: .9, stagger: .1 }, .3)
  .from('.dish-meta > *', { y: 14, opacity: 0, duration: .9, stagger: .1 }, .6)
  .from(plateWrap, { y: '30%', rotation: -40, opacity: 0, duration: 1.8, ease: 'power4.out' }, .2)
  .from('.orbit svg', { opacity: 0, duration: 1, delay: 1 }, 0)
  .from('.orbit-line', { opacity: 0, duration: 1.2 }, .8)
  .from('.hero-photo', { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.inOut', stagger: .15, clearProps: 'clipPath' }, .9)
  .from('.hero-photo .ph', { scale: 1.3, duration: 1.8 }, .9);


/* ============================================================
   2 · MENU — pinned, scroll swaps category
   ============================================================ */
const cats = [
  { name: 'Pasta', a: ['Carbonara', 42], b: ['Tagliatelle al ragù', 14],
    items: [['Carbonara', 16], ['Cacio e pepe', 15], ['Tagliatelle al ragù', 17], ['Trofie al pesto', 15], ['Spaghetti alle vongole', 19], ['Amatriciana', 15]] },
  { name: 'Pizza', a: ['Margherita', 20], b: ['Diavola', 8],
    items: [['Margherita', 12], ['Marinara', 10], ['Diavola', 15], ['Quattro formaggi', 16], ['Bufala e basilico', 17], ['Tartufo e funghi', 20]] },
  { name: 'Antipasti', a: ['Burrata e pomodorini', 34], b: ['Carpaccio di manzo', 190],
    items: [['Burrata e pomodorini', 14], ['Carpaccio di manzo', 16], ['Vitello tonnato', 15], ['Fritto misto di mare', 18], ['Arancini al ragù', 11], ['Bruschette miste', 10]] },
  { name: 'Secondi', a: ['Ossobuco alla milanese', 24], b: ['Branzino al forno', 200],
    items: [['Ossobuco alla milanese', 28], ['Saltimbocca alla romana', 24], ['Branzino al forno', 27], ['Tagliata di manzo', 29], ['Parmigiana di melanzane', 17], ['Cotoletta', 25]] },
  { name: 'Dolci', a: ['Tiramisù', 30], b: ['Panna cotta', 340],
    items: [['Tiramisù', 9], ['Panna cotta', 8], ['Cannolo siciliano', 8], ['Affogato', 7], ['Torta della nonna', 9], ['Gelato, tre gusti', 8]] },
  { name: 'Vini', a: ['Chianti Classico', 350], b: ['Prosecco', 50],
    items: [['Prosecco di Valdobbiadene', 8], ['Vermentino', 9], ['Chianti Classico', 10], ['Barolo', 16], ['Montepulciano d’Abruzzo', 8], ['Amaro o limoncello', 6]] },
];
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
const pad = n => String(n).padStart(2, '0');

const catsEl = document.getElementById('cats');
const listEl = document.getElementById('menuList');
const frames = ['A', 'B'].map(k => document.getElementById('frame' + k));
const menuCount = document.getElementById('menuCount');

cats.forEach((c, i) => {
  catsEl.insertAdjacentHTML('beforeend', `<li>${c.name}<sup>${pad(i + 1)}</sup></li>`);
  listEl.insertAdjacentHTML('beforeend',
    `<ul>${c.items.map(([n, p]) => `<li><b>${n}</b><i></i><span>€${p}</span></li>`).join('')}</ul>`);
  [c.a, c.b].forEach(([label, h], k) => {
    frames[k].querySelector('.layers').insertAdjacentHTML('beforeend',
      `<div class="layer" data-i="${i}"><div class="ph" data-label="${label}" data-src="assets/menu/${slug(c.name)}-${k + 1}.jpg" style="--h:${h}"></div></div>`);
  });
});
hydrate(document.getElementById('menu'));

const catLis = [...catsEl.children];
const lists = [...listEl.children];
let menuIdx = -1, z = 1;

function layoutCats(idx) {
  catLis.forEach((li, i) => li.classList.toggle('on', i === idx));
}

function setCategory(idx) {
  if (idx === menuIdx) return;
  const dir = idx > menuIdx ? 1 : -1, first = menuIdx === -1;
  menuIdx = idx;
  layoutCats(idx);
  menuCount.textContent = `Piatto ${pad(idx + 1)} / ${pad(cats.length)}`;

  // photos: wipe + de-blur + settle
  frames.forEach((f, k) => {
    const layer = f.querySelector(`.layer[data-i="${idx}"]`);
    const cap = f.querySelector('figcaption');
    layer.style.zIndex = ++z;
    if (first) { cap.textContent = cats[idx][k ? 'b' : 'a'][0]; return; }
    gsap.fromTo(layer, { clipPath: dir > 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0% 0 0% 0)', duration: 1.1, delay: k * .12, ease: 'expo.inOut' });
    gsap.fromTo(layer.firstElementChild, { scale: 1.35, filter: 'blur(14px)' },
      { scale: 1, filter: 'blur(0px)', duration: 1.3, delay: k * .12, ease: 'expo.out' });
    gsap.to(cap, { opacity: 0, y: 6, duration: .25, onComplete() {
      cap.textContent = cats[idx][k ? 'b' : 'a'][0];
      gsap.to(cap, { opacity: 1, y: 0, duration: .5 });
    } });
  });

  // price list: no blur, direction-aware (down = rises in, up = drops in)
  lists.forEach((u, i) => {
    const kids = u.children, from = dir > 0 ? 'start' : 'end';
    gsap.killTweensOf(kids);
    if (i === idx) {
      u.classList.add('on');
      gsap.fromTo(kids, { y: dir > 0 ? 16 : -16, opacity: 0 },
        { y: 0, opacity: 1, duration: .6, stagger: { each: .05, from }, delay: first ? 0 : .3, ease: 'power3.out' });
    } else if (u.classList.contains('on')) {
      gsap.to(kids, { opacity: 0, y: dir > 0 ? -10 : 10, duration: .25, stagger: { each: .02, from },
        onComplete: () => { if (menuIdx !== i) u.classList.remove('on'); } });
    }
  });
}
setCategory(0);

const n = cats.length;
const menuST = ScrollTrigger.create({
  trigger: '#menu', start: 'top top', end: () => `+=${(n - 1) * innerHeight * .9}`,
  pin: '.menu-pin', pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
  // hysteresis: a category only changes after clearly passing the midpoint, so trackpad jitter can't flip it back and forth
  onUpdate: self => {
    const p = self.progress * (n - 1);
    if (Math.abs(p - menuIdx) > .62) setCategory(Math.min(n - 1, Math.max(0, Math.round(p))));
  },
});
// click a category: switch right away and move the scroll position to match
catLis.forEach((li, i) => li.addEventListener('click', () => {
  setCategory(i);
  scrollTo({ top: menuST.start + (menuST.end - menuST.start) * i / (n - 1), behavior: 'instant' });
}));

/* ============================================================
   3 · EDITORIAL
   ============================================================ */
const ed = gsap.timeline({ scrollTrigger: { trigger: '#story', start: 'top 65%' }, defaults: { ease: 'expo.out' } });
ed.from('.ed-word', { yPercent: 110, duration: 1.4, stagger: .12 }, 0)
  .from('.ed-title .cap', { opacity: 0, y: 10, duration: 1, stagger: .15 }, .5)
  .from('#edPhoto', { clipPath: 'inset(100% 0 0 0)', duration: 1.5, ease: 'expo.inOut' }, .1)
  .from('#edPhoto .ph', { scale: 1.3, duration: 1.8 }, .1)
  .from('.callout p', { opacity: 0, y: 10, duration: .9 }, 1)
  .from('.callout .rule', { scaleX: 0, duration: 1.4 }, 1)
  .from('.ed-giant', { yPercent: 40, opacity: 0, duration: 1.6 }, .3);
gsap.to('#edPhoto .ph', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '#story', start: 'top bottom', end: 'bottom top', scrub: true } });
gsap.to('.ed-giant', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '#story', start: 'top bottom', end: 'bottom top', scrub: true } });

/* ============================================================
   4 · FINALE
   ============================================================ */
const fin = gsap.timeline({ scrollTrigger: { trigger: '#contacts', start: 'top 60%' }, defaults: { ease: 'expo.out' } });
fin.from('.finale .fin-line', { y: 50, opacity: 0, filter: 'blur(10px)', duration: 1.3, stagger: .08 }, 0)
  .from('.fin-photo', { clipPath: 'inset(50% 50% 50% 50%)', duration: 1.4, ease: 'expo.inOut' }, .2)
  .from('.finale .meta, .fine', { opacity: 0, duration: 1 }, 1);

/* ---------- nav ---------- */
document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  const id = a.dataset.go;
  const top = id === 'hero' ? 0 : id === 'menu' ? menuST.start : document.getElementById(id).getBoundingClientRect().top + scrollY;
  scrollTo({ top, behavior: 'smooth' });
}));

/* ---------- nav pill ---------- */
const navEl = document.querySelector('.nav'), navPill = document.getElementById('navPill'), navLinks = [...navEl.querySelectorAll('a')];
const movePill = a => { navPill.style.left = a.offsetLeft + 'px'; navPill.style.width = a.offsetWidth + 'px'; navLinks.forEach(l => l.classList.toggle('on', l === a)); };
navLinks.forEach(a => a.addEventListener('mouseenter', () => movePill(a)));
navEl.addEventListener('mouseleave', () => movePill(navLinks[0]));
document.fonts.ready.then(() => movePill(navLinks[0]));
addEventListener('resize', () => movePill(navLinks[0]));

/* ---------- menu: pixel-exact alignment (measured from real glyph ink) ---------- */
function inkMetrics(font, txt) {
  const c = document.createElement('canvas'); c.width = 1400; c.height = 400;
  const x = c.getContext('2d'); x.font = font; x.fillText(txt, 20, 250);
  const d = x.getImageData(0, 0, c.width, c.height).data; let top = -1, bot = -1;
  for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++)
    if (d[(y * c.width + i) * 4 + 3] > 100) { if (top < 0) top = y; bot = y; break; }
  return { up: 250 - top, down: bot - 250 + 1 };
}
function alignMenu() {
  if (isMobile()) { catsEl.style.setProperty('--dy', '0px'); document.getElementById('frameB').style.bottom = ''; return; }
  const pin = document.querySelector('.menu-pin'), pinEl = pin.getBoundingClientRect();
  const lis = [...catsEl.children], first = lis[0], last = lis[lis.length - 1];
  const cx = document.createElement('canvas').getContext('2d');
  const baseline = li => {
    const cs = getComputedStyle(li), fs = parseFloat(cs.fontSize); cx.font = `${fs}px Riviera`;
    const m = cx.measureText('A'), r = li.getBoundingClientRect();
    return r.top + (r.height - fs) / 2 + (fs - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
  };
  const fs = parseFloat(getComputedStyle(first).fontSize);
  const riv = inkMetrics(`200px Riviera`, 'PASTA'), rivB = inkMetrics(`200px Riviera`, 'VINI');
  const b = document.querySelector('.menu-list li b'), bs = parseFloat(getComputedStyle(b).fontSize);
  const goth = inkMetrics(`${bs * 8}px "Gothic 60"`, 'CARBONARA');
  const bm = (() => { cx.font = `${bs}px "Gothic 60"`; return cx.measureText('A'); })(), br = b.getBoundingClientRect();
  const listTop = br.top + (br.height - (bm.fontBoundingBoxAscent + bm.fontBoundingBoxDescent)) / 2 + bm.fontBoundingBoxAscent - goth.up / 8;
  const pastaTop = baseline(first) - riv.up * fs / 200;
  const dy = (parseFloat(getComputedStyle(first).top) || 0) + (listTop - pastaTop);
  catsEl.style.setProperty('--dy', dy + 'px');
  // right photo: bottom edge of the picture sits on the bottom of "VINI"
  const fb = document.getElementById('frameB');
  if (fb.offsetParent) {
    const viniBottom = baseline(last) + rivB.down * fs / 200;
    const lay = fb.querySelector('.layers').getBoundingClientRect();
    fb.style.bottom = (parseFloat(getComputedStyle(fb).bottom) + (lay.bottom - viniBottom)) + 'px';
  }
}
const runAlign = () => { fb0(); alignMenu(); };
const fb0 = () => { document.getElementById('frameB').style.bottom = ''; catsEl.style.removeProperty('--dy'); };
document.fonts.ready.then(() => { runAlign(); ScrollTrigger.refresh(); });
addEventListener('resize', runAlign);
