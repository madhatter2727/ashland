# ASHLAND

A horde shooter in the browser, set in Ashland: a grand amusement park that closed one wet evening and never
opened again. Built on three.js and WebGL shaders.

ASHLAND is a **setting reskin of [Hordefall](https://github.com/madhatter2727/hordefall)**. The guns, movement,
perks, shop, wall-buys, horde AI, enemies and throwables are Hordefall's, unchanged, except that mouse look is about 2x faster. The world is new.

**Play:** https://ashland-lac.vercel.app

![Park street, with the Palace of Hours and the drop tower behind it](docs/street.jpg)

## The park
- **The main gate and park street** (south): two painted timber pylons with RIDES and AMUSEMENTS bands carry
  an iron arch that spells ASHLAND in bulb letters, most of them dead. There are ticket booths and rusted
  turnstiles. Inside the gate, torn park banners hang from iron poles along a street of old boardwalk lodges.
  The lodges are clapboard in chalky yellow, oxidized teal, carnival red and cream, with steep shingle
  gables, deep porches, and shops on the ground floors: Souvenirs, Salt Water Taffy, Photographs and a Penny
  Arcade. Hotel Vesper still has its dead neon sign.
- **The Palace of Hours** (north): the park's great dark ride, a crumbling attraction castle. Lopsided
  turrets with flared shingle cones (one roof stove in) rise over a crenellated curtain wall hung with torn
  show banners. The clock keep is stopped at 11:47, a cogwheel arch frames the entrance, and a huge broken
  marquee hangs over it.
- **The hub** (centre): open paving around the old bandstand, a faded park guide map, abandoned popcorn
  carts, and finger posts pointing to the rides and games.
- **The Midway** (east): game halls under an iron colonnade, painted game booths with lit prize shelves,
  scrolled crest boards and dead bulbs, and a gilded carousel standing still. The great coaster rises over
  the wall.
- **The Gardens and the flume** (west): an iron-and-glass orangery, and the dry splash pool of the old flume
  ride with a boat stranded in it under the broken trough.
- **On the skyline**, all scenery only: the Iron Comet coaster, the Grand Wheel (a stopped 44 m Ferris wheel),
  the Plummet (a 58 m drop tower with its seats stuck high), and the Sky Swings (a wave swinger jammed at a
  tilt).
- **Locked areas** (buy with F): **The Clock Terrace** (a stone terrace before the Palace, up a stair behind a
  chained iron gate) and **The Grotto** (the old rock-cut boat-ride hall behind an iron-banded shutter).

| | |
|---|---|
| ![Main gate and park street](docs/gate.jpg) | ![The Palace of Hours](docs/palace.jpg) |
| ![The hub](docs/hub.jpg) | ![Boardwalk lodges](docs/hotel.jpg) |

## How it looks the way it does
- All surfaces use Poly Haven CC0 PBR texture sets (albedo, normal, AO/roughness/metal) for herringbone paving,
  marble, sandstone, red brick, slate, painted clapboard, plywood, peeling murals, verdigris copper, rusted
  iron and velvet. They are
  box-projected in world space, so texel density stays the same on every piece.
- The architecture is procedural and modelled, not boxes: lathed columns with fluting, entasis and capitals,
  extruded cornices and string courses, arches with keystones, pediments, balustrades, mansards with
  dormers, domes with ribs and lanterns, and iron railings. Static pieces are merged per material.
- Real CC0 models: iron gates, statues, lion heads, lanterns, a chandelier, urns, benches, shrubs, weeds,
  ferns and mossy rocks. The heaviest models are decimated so the game stays smooth on laptop GPUs.
- One shared weather shader adds grime and damp rising from the ground, rain streaks under ledges, moss on
  upward-facing stone, wet sheen, gold leaf flaking off the gilding, and puddles with animated rain ripples.
- Lighting is an overcast dusk HDRI (kloppenheim_01_puresky) for image-based lighting and reflections, a
  low sun behind the Palace, a slate cloud deck, rain haze and fog, and warm failing gas lamps.

## Controls
| | |
|---|---|
| WASD | move |
| Shift | sprint |
| C / Ctrl | crouch (slide while sprinting) |
| Space | jump |
| Left mouse | fire |
| Right mouse | aim down sights |
| R | reload |
| 1 / 2 / 3, mouse wheel | switch weapon |
| Esc | pause |

## Weapons
- **AR-7 Vanguard**: full-auto assault rifle with iron sights and a learnable recoil pattern.
- **KS-12 Breacher**: pump shotgun with 10 pellets, shell-by-shell reload you can interrupt by firing, and iron sights.
- **MR-30 Longbow**: semi-auto marksman rifle that pierces one target. It has a collimated red-dot sight drawn by a shader, so the dot appears only through the glass.

## Tech
- Viewmodel rendered in its own scene. Spring-damper kick, sway, inertia and bob; heavier guns move slower.
- Two recoil layers: aim recoil that recovers over time, and a separate visual camera kick.
- Hitscan with head, body and limb zones, damage falloff, hit, headshot and kill markers, damage numbers, and hitstop on kills.
- Enemies are 15-joint skeletons drawn with instanced meshes. They run a procedural gait, flinch and stagger when hit, and turn into Verlet ragdolls with a dissolve shader on death.
- Horde AI: a flow field over a navigation heightmap, flanking, separation steering, and leaps onto high ground.
- Post chain: GTAO (high quality only), bloom, ACES tone mapping, color grade, vignette, damage vignette.
- Audio is layered WebAudio synthesis with a convolution reverb tail.

```
npm install
npm run dev
```
