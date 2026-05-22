import { MAP_1 } from "./Map1.js";
import { MAP_2 } from "./Map2.js";
import { MAP_3 } from "./Map3.js";
import { MAP_AKAGI } from "./MapAkagi.js";
import { MAP_SADAMINE } from "./MapSadamine.js";
import { MAP_TSUKUBA } from "./MapTsukuba.js";

export const COURSE_DEFS = {
  [MAP_1.id]: MAP_1,
  [MAP_2.id]: MAP_2,
  [MAP_3.id]: MAP_3,
  [MAP_AKAGI.id]: MAP_AKAGI,
  [MAP_SADAMINE.id]: MAP_SADAMINE,
  [MAP_TSUKUBA.id]: MAP_TSUKUBA,
};

export const DEFAULT_COURSE_ID = MAP_1.id;
