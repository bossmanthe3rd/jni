/*
 * A panel edge cut the way a crisp pouch is cut: crimped along the top like
 * the heat seal, crimped down both sides like the pouch's side seals, and torn
 * along the bottom like a pack just ripped open.
 *
 * One call returns everything that has to agree about that edge -- the closed
 * path the panel is clipped to, the same path the doodle procession rides, and
 * the timing for that ride -- so the fill and the doodles cannot drift apart.
 *
 * All units are the panel's own pixels. Teeth are sized in pixels, not
 * percentages, so a phone-width panel gets fewer teeth rather than a saw blade.
 */

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TOOTH_R = 4 // every peak and valley is filleted, so nothing riding it snaps
/*
 * The panel's four corners are rounded generously, so the procession sweeps
 * round them instead of pivoting on a point. A corner may reach most of the
 * way along the tooth beside it (CORNER_REACH of it) -- held to the usual half,
 * the first tooth would cap it at a nub.
 */
const CORNER_R = 30
const CORNER_REACH = 0.75

/*
 * How far either side of a vertex a doodle takes to swing round to the next
 * stretch's heading, px. The fillets alone are only a few px long, so turning
 * inside them would read as a snap at every tooth.
 */
const TURN = 12

/*
 * Slower up, quicker down: speed is 1 + GRAVITY * (drop per unit travelled).
 * Only the teeth get it -- on the long straight sides the same rule would pile
 * every doodle up the left side and empty the right.
 */
const GRAVITY = 0.5

/**
 * The seal's teeth between two points on it, not including either end: peaks
 * at y = 0, valleys at y = depth, alternating. `from` and `to` are the levels
 * the two ends sit at, and the count of half-teeth is chosen so the run lands
 * on the right one -- odd to get from a peak to a valley, even to stay put.
 */
function crimp(x0, x1, from, to, period, depth) {
  const span = x1 - x0
  let m = Math.round(span / (period / 2))
  if ((m % 2 === 1) !== (from !== to)) m += m * (period / 2) < span ? 1 : -1
  if (m < 1) return []
  const out = []
  for (let k = 1; k < m; k += 1) {
    const peak = (k % 2 === 1) === (from === 'valley')
    out.push({ x: x0 + (k * span) / m, y: peak ? 0 : depth, r: TOOTH_R })
  }
  return out
}

/**
 * The torn bottom, right to left: irregular widths, irregular depths, a low
 * point and a high point in turn. Seeded, so it tears the same way each load.
 */
function tear(w, h, { step, depth }, rnd) {
  const [minStep, maxStep] = step
  const [minDepth, maxDepth] = depth
  const high = () => h - (minDepth + rnd() * (maxDepth - minDepth))
  const low = () => h - rnd() * 4

  const out = [{ x: w, y: high(), r: CORNER_R, reach: CORNER_REACH }]
  let x = w
  let up = false
  for (;;) {
    x -= minStep + rnd() * (maxStep - minStep)
    if (x < minStep * 0.8) break
    out.push({ x, y: up ? high() : low(), r: TOOTH_R })
    up = !up
  }
  out.push({ x: 0, y: high(), r: CORNER_R, reach: CORNER_REACH })
  return out
}

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y })
const len = (v) => Math.hypot(v.x, v.y)
const unit = (v) => {
  const l = len(v) || 1
  return { x: v.x / l, y: v.y / l }
}
const f = (n) => n.toFixed(1)

function quadLength(a, c, b) {
  let total = 0
  let prev = a
  for (let i = 1; i <= 12; i += 1) {
    const t = i / 12
    const u = 1 - t
    const p = {
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    }
    total += len(sub(p, prev))
    prev = p
  }
  return total
}

/**
 * @param {number} w  panel width, px
 * @param {number} h  panel height, px
 * @param {object} o
 *   seal   { period, depth }        crimp teeth along the top
 *   side   { period, depth } | null crimp teeth down both sides; null leaves
 *                                   them straight
 *   tear   { step:[min,max], depth:[min,max] }  the torn bottom
 *   shelf  { x, width } | null      a flat run in the seal, for something to
 *                                   rest on (the mascot's hands)
 *   seed   number
 * @returns {{ w, h, d, ride, turn }} `d` is the closed loop, clockwise from
 *   the top left corner. `ride` times the travel along it: `p` is the share of
 *   the path's length reached at `t`, the share of the loop's time. `turn` is
 *   the heading along the edge at `t`, in degrees, unwrapped -- it climbs by a
 *   full 360 over the loop, so nothing ever spins the long way round.
 */
export function jaggedEdge(w, h, o) {
  const { seal, shelf = null, seed = 1 } = o
  const D = seal.depth
  const rnd = mulberry32(seed * 2654435761)

  // --- the outline, as filleted vertices --------------------------------------
  // The seal's two corners are its outermost peaks.
  const top = [{ x: 0, y: 0, r: CORNER_R, reach: CORNER_REACH }]
  if (shelf) {
    const s0 = Math.max(0, shelf.x - shelf.width / 2)
    const s1 = Math.min(w, shelf.x + shelf.width / 2)
    // The shelf is the straight run between its two ends, at valley level.
    top.push(...crimp(0, s0, 'peak', 'valley', seal.period, D))
    top.push({ x: s0, y: D, r: TOOTH_R })
    top.push({ x: s1, y: D, r: TOOTH_R })
    top.push(...crimp(s1, w, 'valley', 'peak', seal.period, D))
  } else {
    top.push(...crimp(0, w, 'peak', 'peak', seal.period, D))
  }
  top.push({ x: w, y: 0, r: CORNER_R, reach: CORNER_REACH })

  const bottom = tear(w, h, o.tear, rnd)

  // The side seals run from the seal's corner down to where the tear begins,
  // peaks on the panel's outer edge and valleys cut in by the side depth.
  // crimp() works along one axis, so each side is laid out along y and turned
  // onto its edge; the left one is walked bottom to top, the way the loop goes.
  const side = o.side === undefined ? seal : o.side
  let right = []
  let left = []
  if (side) {
    right = crimp(0, bottom[0].y, 'peak', 'peak', side.period, side.depth).map((q) => ({
      x: w - q.y,
      y: q.x,
      r: TOOTH_R,
    }))
    left = crimp(0, bottom[bottom.length - 1].y, 'peak', 'peak', side.period, side.depth)
      .map((q) => ({ x: q.y, y: q.x, r: TOOTH_R }))
      .reverse()
  }

  const verts = [...top, ...right, ...bottom, ...left]
  const n = verts.length

  // Which stretches run down or up a side. They ride at an even pace: the
  // gravity rule would speed every tooth on the way down the right and slow
  // every one on the way up the left, piling the procession up that side.
  const sideFrom = new Set()
  const rightFrom = top.length - 1
  for (let i = rightFrom; i <= rightFrom + right.length; i += 1) sideFrom.add(i)
  const leftFrom = top.length + right.length + bottom.length - 1
  for (let i = leftFrom; i < n; i += 1) sideFrom.add(i)

  // --- fillet each vertex ------------------------------------------------------
  const cut = verts.map((P, i) => {
    const A = verts[(i - 1 + n) % n]
    const B = verts[(i + 1) % n]
    const reach = P.reach ?? 0.5
    const r = Math.min(P.r, len(sub(P, A)) * reach, len(sub(B, P)) * reach)
    const ui = unit(sub(P, A))
    const uo = unit(sub(B, P))
    return {
      P,
      in: { x: P.x - ui.x * r, y: P.y - ui.y * r },
      out: { x: P.x + uo.x * r, y: P.y + uo.y * r },
    }
  })

  const d = [`M ${f(cut[0].out.x)} ${f(cut[0].out.y)}`]
  const pieces = []
  for (let k = 1; k <= n; k += 1) {
    const i = k % n
    const from = cut[k - 1].out
    const to = cut[i].in
    const v = sub(to, from)
    const l = len(v)
    const side = sideFrom.has(k - 1)
    const speed = side || l === 0 ? 1 : Math.min(1.4, Math.max(0.6, 1 + (GRAVITY * v.y) / l))
    pieces.push({ line: true, len: l, heading: (Math.atan2(v.y, v.x) * 180) / Math.PI, speed })
    d.push(`L ${f(to.x)} ${f(to.y)}`)

    const c = cut[i]
    pieces.push({ line: false, len: quadLength(c.in, c.P, c.out) })
    d.push(`Q ${f(c.P.x)} ${f(c.P.y)} ${f(c.out.x)} ${f(c.out.y)}`)
  }
  d.push('Z')

  // A fillet takes the average pace of the two stretches it joins.
  pieces.forEach((pc, j) => {
    if (pc.line) return
    const next = pieces[(j + 1) % pieces.length]
    pc.speed = (pieces[j - 1].speed + next.speed) / 2
  })

  // Unwrap the headings so each differs from the last by the turn actually
  // taken at the vertex between them, never by a lap.
  let prevHeading = null
  for (const pc of pieces) {
    if (!pc.line) continue
    if (prevHeading !== null) {
      let dh = pc.heading - prevHeading
      while (dh > 180) dh -= 360
      while (dh <= -180) dh += 360
      pc.heading = prevHeading + dh
    }
    prevHeading = pc.heading
  }

  // --- the ride ----------------------------------------------------------------
  const total = pieces.reduce((s, pc) => s + pc.len, 0)
  const time = pieces.reduce((s, pc) => s + pc.len / pc.speed, 0)
  const ride = []
  const turn = []
  let s = 0
  let t = 0
  for (const pc of pieces) {
    const dt = pc.len / pc.speed
    if (pc.line) {
      ride.push({ p: s / total, t: t / time })
      // Hold the stretch's heading along its middle; the swing to the next
      // one happens across the vertex, TURN px either side of it.
      const hold = Math.min(TURN, pc.len / 2)
      turn.push({ t: (t + hold / pc.speed) / time, angle: pc.heading })
      if (pc.len > 2 * hold) turn.push({ t: (t + dt - hold / pc.speed) / time, angle: pc.heading })
    }
    s += pc.len
    t += dt
  }
  ride.push({ p: 1, t: 1 })

  // Close the heading loop: 0 and 100% sit between the last hold and the
  // first, a lap apart, so the restart is invisible.
  const first = turn[0]
  const last = turn[turn.length - 1]
  const lap = last.angle - first.angle > 180 ? 360 : last.angle - first.angle < -180 ? -360 : 0
  const k = (1 - last.t) / (1 - last.t + first.t)
  const seam = last.angle - lap + (first.angle - (last.angle - lap)) * k
  turn.unshift({ t: 0, angle: seam })
  turn.push({ t: 1, angle: seam + lap })

  return { w, h, d: d.join(' '), ride, turn }
}

function interpolate(stops, t, key) {
  for (let i = 1; i < stops.length; i += 1) {
    const a = stops[i - 1]
    const b = stops[i]
    if (t <= b.t) {
      const k = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t)
      return a[key] + (b[key] - a[key]) * k
    }
  }
  return stops[stops.length - 1][key]
}

/** Where a doodle sits `t` of the way through the loop: distance share and heading. */
export function rideAt(geometry, t) {
  return { p: interpolate(geometry.ride, t, 'p'), angle: interpolate(geometry.turn, t, 'angle') }
}
