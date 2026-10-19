import { useEffect, useRef } from 'react'

// ── SVG icon strings ───────────────────────────────────────────────────
const ICONS = [
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h2"/></svg>`,
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="12" width="4" height="8"/><rect x="10" y="8" width="4" height="12"/><rect x="17" y="4" width="4" height="16"/></svg>`,
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
  `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`,
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H4a2 2 0 0 0-2 2v3a4 4 0 0 0 4 4"/><path d="M17 4h3a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4"/><rect x="7" y="2" width="10" height="9" rx="1"/></svg>`,
]

// ── Grid layout: 18 slots in a 4-col grid ─────────────────────────────
const GRID_COLS  = 4
const GRID_ROWS  = 5

function buildSlots(W: number, H: number) {
  /**
   * Divides the panel into a grid of slots.
   * Each slot has a center point with small random jitter
   * so icons don't sit in a perfect grid.
   * This ensures even distribution with no overlaps.
   */
  const cellW = W / GRID_COLS
  const cellH = (H * 0.75) / GRID_ROWS  // use top 75% — bottom reserved for text

  const slots: { x: number; y: number }[] = []
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const jx = (Math.random() - 0.5) * cellW * 0.35
      const jy = (Math.random() - 0.5) * cellH * 0.35
      slots.push({
        x: cellW * col + cellW / 2 + jx,
        y: cellH * row + cellH / 2 + jy,
      })
    }
  }
  // Shuffle slots so assignment isn't row-by-row
  return slots.sort(() => Math.random() - 0.5).slice(0, 18)
}

interface FloatingIcon {
  el:        HTMLDivElement
  slotIndex: number
  baseX:     number
  baseY:     number
  sz:        number
  t:         number
  speed:     number
  ampX:      number
  ampY:      number
  rotAmp:    number
  pushX:     number
  pushY:     number
  destroyed: boolean
}

interface Fragment {
  el:      HTMLDivElement
  px:      number
  py:      number
  vx:      number
  vy:      number
  rot:     number
  rotV:    number
  cs:      number
  born:    number
  lifeMs:  number
  opacity: number
  isDot:   boolean
}

export default function FloatingIconCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const W = container.offsetWidth
    const H = container.offsetHeight
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const c = containerRef.current!

    const icons:     (FloatingIcon | null)[] = []
    const fragments: Fragment[]              = []
    const slots      = buildSlots(W, H)
    const occupiedSlots = new Set<number>()

    let rafId: number

    // ── Find emptiest slot for respawn ─────────────────────────────────
    function findBestSlot(excludeSlot: number): number {
      /**
       * Picks the slot that is:
       * 1. Not currently occupied by any icon
       * 2. Furthest from all current icon positions
       * This prevents respawning on top of existing icons.
       */
      const candidates = slots
        .map((_, i) => i)
        .filter(i => i !== excludeSlot && !occupiedSlots.has(i))

      if (candidates.length === 0) {
        // All slots occupied — pick random non-source slot
        return slots
          .map((_, i) => i)
          .filter(i => i !== excludeSlot)[Math.floor(Math.random() * (slots.length - 1))]
      }

      // Score each candidate by distance from nearest icon
      let bestSlot  = candidates[0]
      let bestScore = -1

      for (const ci of candidates) {
        const slotPos = slots[ci]
        let minDist   = Infinity

        for (const ico of icons) {
          if (!ico || ico.destroyed) continue
          const rect = ico.el.getBoundingClientRect()
          const cr   = c.getBoundingClientRect()
          const ix   = rect.left + ico.sz / 2 - cr.left
          const iy   = rect.top  + ico.sz / 2 - cr.top
          const d    = Math.sqrt((ix - slotPos.x)**2 + (iy - slotPos.y)**2)
          if (d < minDist) minDist = d
        }

        if (minDist > bestScore) {
          bestScore = minDist
          bestSlot  = ci
        }
      }

      return bestSlot
    }

    // ── Fragment physics loop ──────────────────────────────────────────
    function physicsLoop(now: number) {
      let i = fragments.length
      while (i--) {
        const f    = fragments[i]
        const age  = now - f.born
        const life = age / f.lifeMs

        if (life >= 1) {
          f.el.remove()
          fragments.splice(i, 1)
          continue
        }

        f.px  += f.vx
        f.py  += f.vy
        f.vy  += 0.18       // gravity
        f.vx  *= 0.993      // drag
        f.vy  *= 0.993

        if (!f.isDot) {
          // Bounce off edges
          if (f.px < 0)          { f.px = 0;          f.vx =  Math.abs(f.vx) * 0.55 }
          if (f.px > W - f.cs)   { f.px = W - f.cs;   f.vx = -Math.abs(f.vx) * 0.55 }
          if (f.py < 0)          { f.py = 0;           f.vy =  Math.abs(f.vy) * 0.5  }
          if (f.py > H - f.cs)   { f.py = H - f.cs;   f.vy = -Math.abs(f.vy) * 0.45; f.vx *= 0.7 }
        }

        f.rot  += f.rotV
        f.rotV *= 0.97
        f.opacity = life < 0.6 ? 1 : 1 - ((life - 0.6) / 0.4)

        f.el.style.left    = `${f.px}px`
        f.el.style.top     = `${f.py}px`
        f.el.style.transform = `rotate(${f.rot}deg)`
        f.el.style.opacity = String(f.opacity)
      }

      rafId = requestAnimationFrame(physicsLoop)
    }

    // ── Spawn fragment ─────────────────────────────────────────────────
    function spawnFragment(cx: number, cy: number, html: string, sz: number, vx: number, vy: number) {
      const cs  = sz * (0.3 + Math.random() * 0.45)
      const el  = document.createElement('div')
      el.style.cssText = `
        position:absolute;width:${cs}px;height:${cs}px;
        left:${cx - cs/2}px;top:${cy - cs/2}px;
        border-radius:8px;
        background:rgba(255,255,255,0.12);
        border:0.5px solid rgba(255,255,255,0.3);
        pointer-events:none;z-index:22;
        display:flex;align-items:center;justify-content:center;
        overflow:hidden;will-change:transform,opacity;
      `
      el.innerHTML = html
      c.appendChild(el)
      fragments.push({
        el, px: cx - cs/2, py: cy - cs/2,
        vx, vy, rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 18,
        cs, born: performance.now(),
        lifeMs: 1400 + Math.random() * 800,
        opacity: 1, isDot: false,
      })
    }

    function spawnDot(cx: number, cy: number, angle: number, speed: number) {
      const ps  = 2.5 + Math.random() * 5
      const el  = document.createElement('div')
      const cols = ['rgba(255,255,255,0.95)', 'rgba(255,210,235,0.85)', 'rgba(220,180,210,0.7)']
      el.style.cssText = `
        position:absolute;width:${ps}px;height:${ps}px;
        left:${cx - ps/2}px;top:${cy - ps/2}px;
        border-radius:50%;
        background:${cols[Math.floor(Math.random() * 3)]};
        pointer-events:none;z-index:21;
        will-change:transform,opacity;
      `
      c.appendChild(el)
      fragments.push({
        el, px: cx - ps/2, py: cy - ps/2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: 0, rotV: 0, cs: ps,
        born: performance.now(),
        lifeMs: 1800 + Math.random() * 600,
        opacity: 1, isDot: true,
      })
    }

    // ── Explosion ──────────────────────────────────────────────────────
    function explode(ico: FloatingIcon) {
      const rect = ico.el.getBoundingClientRect()
      const cr   = c.getBoundingClientRect()
      const cx   = rect.left + ico.sz / 2 - cr.left
      const cy   = rect.top  + ico.sz / 2 - cr.top
      const html = ico.el.innerHTML

      // 8 icon fragments
      for (let q = 0; q < 8; q++) {
        const angle = (Math.PI * 2 * q / 8) + (Math.random() - 0.5) * 0.7
        const speed = 4 + Math.random() * 9
        spawnFragment(cx, cy, html, ico.sz,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - 2
        )
      }

      // 28 dot particles
      for (let i = 0; i < 28; i++) {
        const angle = (Math.PI * 2 * i / 28) + (Math.random() - 0.5) * 0.4
        spawnDot(cx, cy, angle, 3 + Math.random() * 10)
      }

      // 3 wave rings
      for (let r = 0; r < 3; r++) {
        const ring = document.createElement('div')
        const md   = Math.max(W, H) * 3
        ring.style.cssText = `
          position:absolute;width:${md}px;height:${md}px;
          left:${cx - md/2}px;top:${cy - md/2}px;
          border-radius:50%;
          border:${r === 0 ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.2)'};
          pointer-events:none;z-index:8;
          transform:scale(0);opacity:0;
        `
        c.appendChild(ring)
        setTimeout(() => {
          ring.style.transition = `transform ${0.7 + r * 0.12}s cubic-bezier(0.25,0.46,0.45,0.94), opacity ${0.55 + r * 0.1}s ease-out`
          ring.style.transform  = 'scale(1)'
          ring.style.opacity    = '0'
        }, r * 100 + 10)
        setTimeout(() => ring.remove(), r * 100 + 900)
      }

      // Panel flash
      const flash = document.createElement('div')
      flash.style.cssText = `
        position:absolute;inset:0;z-index:6;pointer-events:none;
        background:rgba(255,255,255,0.08);
      `
      c.appendChild(flash)
      setTimeout(() => { flash.style.transition = 'opacity 0.35s'; flash.style.opacity = '0' }, 30)
      setTimeout(() => flash.remove(), 400)

      // Push neighbors
      for (const other of icons) {
        if (!other || other === ico || other.destroyed) continue
        const oRect = other.el.getBoundingClientRect()
        const ix    = oRect.left + other.sz / 2 - cr.left
        const iy    = oRect.top  + other.sz / 2 - cr.top
        const dx    = ix - cx
        const dy    = iy - cy
        const dist  = Math.sqrt(dx * dx + dy * dy) || 1
        const force = Math.max(0, (300 - dist)) / 300 * 60
        other.pushX += (dx / dist) * force
        other.pushY += (dy / dist) * force
      }
    }

    // ── Create floating icon ───────────────────────────────────────────
    function createIcon(index: number, slotIndex: number, svgIndex: number, spawnDelay = 0) {
      const slot = slots[slotIndex]
      const sz   = 34 + Math.floor(Math.random() * 12)  // 34-46px
      const el   = document.createElement('div')

      el.style.cssText = `
        position:absolute;
        width:${sz}px;height:${sz}px;
        left:${slot.x - sz/2}px;top:${slot.y - sz/2}px;
        border-radius:12px;
        background:rgba(255,255,255,0.1);
        border:0.5px solid rgba(255,255,255,0.2);
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;z-index:5;
        opacity:0;
        transform:scale(0.1) rotate(180deg);
        transition:none;
        will-change:transform,opacity;
      `
      el.innerHTML = ICONS[svgIndex % ICONS.length]

      el.addEventListener('mouseenter', () => {
        el.style.background    = 'rgba(255,255,255,0.2)'
        el.style.borderColor   = 'rgba(255,255,255,0.5)'
      })
      el.addEventListener('mouseleave', () => {
        el.style.background    = 'rgba(255,255,255,0.1)'
        el.style.borderColor   = 'rgba(255,255,255,0.2)'
      })

      const ico: FloatingIcon = {
        el, slotIndex,
        baseX:  slot.x - sz / 2,
        baseY:  slot.y - sz / 2,
        sz, t: Math.random() * Math.PI * 2,
        speed: (2 * Math.PI) / ((5 + Math.random() * 5) * 60),
        ampX:  6 + Math.random() * 14,
        ampY:  8 + Math.random() * 16,
        rotAmp: 4 + Math.random() * 12,
        pushX: 0, pushY: 0,
        destroyed: false,
      }

      // Float animation tick
      // warmup ramps amplitude from 0 → 1 over 60 frames (~1s)
      // this prevents the jump when JS takes over from CSS transition
      let warmup = 0
      const WARMUP_FRAMES = 60

      function tick() {
        if (ico.destroyed) return

        // Gradually increase amplitude from 0 to full
        // so the first frame of JS movement is near-zero displacement
        const blend = Math.min(warmup / WARMUP_FRAMES, 1)
        warmup++

        ico.t     += ico.speed
        const fx   = Math.cos(ico.t * 0.7) * ico.ampX * blend
        const fy   = Math.sin(ico.t)       * ico.ampY * blend
        ico.pushX *= 0.84
        ico.pushY *= 0.84
        const rot  = Math.sin(ico.t * 0.8) * ico.rotAmp * blend
        el.style.transform = `translate(${fx + ico.pushX}px,${fy + ico.pushY}px) rotate(${rot}deg)`
        requestAnimationFrame(tick)
      }

      setTimeout(() => {
        // 1. Append hidden at correct position
        c.appendChild(el)

        // 2. Use transitionend to know EXACTLY when spawn is done
        //    — no setTimeout guessing
        const onTransitionEnd = (e: TransitionEvent) => {
          if (e.propertyName !== 'transform') return
          el.removeEventListener('transitionend', onTransitionEnd)
          // 3. Clear all CSS transitions before JS takes over transform
          el.style.transition = 'background 0.2s, border-color 0.2s'
          el.style.opacity    = '1'
          // 4. Start JS float loop — it now owns transform fully
          requestAnimationFrame(tick)
        }
        el.addEventListener('transitionend', onTransitionEnd)

        // 5. Trigger spawn animation after two frames
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.45s ease, transform 0.65s cubic-bezier(0.34,1.56,0.64,1)'
            el.style.opacity    = '1'
            el.style.transform  = 'scale(1) rotate(0deg)'
          })
        })
      }, spawnDelay)

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        if (ico.destroyed) return
        ico.destroyed = true
        occupiedSlots.delete(slotIndex)
        explode(ico)
        el.remove()

        setTimeout(() => {
          // occupiedSlots already cleared when icon was destroyed
          // find best empty slot now
          const newSlot = findBestSlot(slotIndex)
          const newSvg  = Math.floor(Math.random() * ICONS.length)

          // Mark slot occupied BEFORE creating so findBestSlot
          // won't assign it to two icons if two respawn at same time
          occupiedSlots.add(newSlot)

          const newIcon = createIcon(index, newSlot, newSvg, 0)
          icons[index]  = newIcon
        }, 1000 + Math.random() * 800)
      })

      return ico
    }

    // ── Init 18 icons in 18 unique slots ──────────────────────────────
    const shuffledSlots = slots.map((_, i) => i).sort(() => Math.random() - 0.5)

    for (let i = 0; i < 18; i++) {
      const slotIndex = shuffledSlots[i]
      occupiedSlots.add(slotIndex)
      const ico = createIcon(i, slotIndex, i % ICONS.length, i * 55)
      icons.push(ico)
    }

    rafId = requestAnimationFrame(physicsLoop)

    return () => {
      cancelAnimationFrame(rafId)
      // Cleanup all DOM elements
      icons.forEach(ico => ico?.el.remove())
      fragments.forEach(f => f.el.remove())
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    />
  )
}