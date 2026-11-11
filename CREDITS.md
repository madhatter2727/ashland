# Credits & Licenses

**ASHLAND is a setting reskin of [Hordefall](https://github.com/madhatter2727/hordefall).** The weapons, shooting,
movement, perks, shop and wall-buy systems, horde AI, enemies, throwables and audio are Hordefall's, unchanged.
Only the world was rebuilt: the city block became Ashland, a fairy-tale theme park.

All third-party assets ship optimized (meshopt + quantized GLB, WebP textures) from the originals below.
No paid kits, no copyrighted park/film IP: every building, sign and ride in the park is procedural and original.

## Poly Haven (CC0 1.0, https://polyhaven.com/license)
Ashland's assets (all CC0, downloaded from polyhaven.com):
- **HDRI:** kloofendal_48d_partly_cloudy_puresky (1k) -> `public/assets/hdr/sky_day.hdr` (late-afternoon daylight and reflections)
- **Textures** (`public/assets/tex/`, albedo / normal / AO-rough-metal):
  herringbone_pavement_03, marble_tiles, marble_01, white_sandstone_blocks_02, red_bricks_04, medieval_red_brick,
  red_plaster_weathered, roof_slates_02, green_metal_rust, metal_plate_02, rusty_metal_02, mossy_stone_wall,
  rock_wall_08, mossy_cobblestone, forest_leaves_02, leaf_scattered_gravel, brown_mud_leaves_01,
  weathered_planks, wood_peeling_paint_weathered, velour_velvet, tree_bark_03, distressed_painted_planks,
  plywood, peeling_painted_wall, old_planks_02, white_stucco, cobblestone_color; and greyscale, tintable
  albedos made from clay_roof_tiles_02 (`roof_tiles_tint`), brick_pavement_02 (`brick_pave_tint`) and
  terracotta_floor_tiles (`terracotta_tint`)
- **Models** (`public/assets/models/`): large_iron_gate, horse_statue_01, gothic_statue, lion_head,
  marble_bust_01, street_lamp_02, modular_street_seating, Lantern_01, Chandelier_01, ornate_mirror_01,
  brass_vase_01, shrub_02, shrub_04, nettle_plant, weed_plant_02, fern_02, rock_moss_set_01,
  dead_tree_trunk_02. Several heavy models (Lantern_01, brass_vase_01, gothic_statue, horse_statue_01,
  large_iron_gate, lion_head, nettle_plant, ornate_mirror_01, shrub_02, shrub_04, street_lamp_02) are shipped
  decimated with gltf-transform for laptop GPUs.

### Inherited from Hordefall (Poly Haven, CC0)
Hordefall used these Poly Haven assets; the ones Ashland no longer ships were removed from the repo:
- HDRI: the_sky_is_on_fire (replaced)
- Textures: road_damaged, concrete_pavement, red_brick_03, plastered_wall_04, concrete_wall_008, rusted_shutter,
  rusty_metal_02 (still used), damaged_concrete_floor_02, rusty_corrugated_iron
- Models: modular_urban_apartments_facade, modular_fire_escape, covered_car, concrete_road_barrier,
  exterior_aircon_unit, street_lamp_01, metal_trash_can, trashbag, old_tyre, fire_hydrant, utility_box_01,
  rollershutter_door, modular_metal_gutter, barrel_03, wooden_crate_01, water_manhole_cover

## Characters
- **zombie.glb**: "Male City Zombie" by Rikindle3D, OpenGameArt.org, listed as **CC0**.
  Converted from FBX with FBX2glTF and decimated. Note: its bundled animation set looks Mixamo-derived.
  If that matters for redistribution, swap it for a fully self-authored rig.
  The boss is the same rig, bulked through bone scaling, with procedural armor plates, spikes and an ember shader.

## Code
- three.js (MIT), Vite (MIT), meshoptimizer decoder (MIT)
- Asset optimization: glTF-Transform CLI (MIT), used offline only

Everything else (the park architecture and its procedural geometry, the roller coaster skeleton, signage,
weather/wetness shaders, weapons, gore, audio synthesis) is original to this repo or to Hordefall.
