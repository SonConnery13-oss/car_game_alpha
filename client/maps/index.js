import { MAP_1 } from "./Map1.js";
import { MAP_2 } from "./Map2.js";
import { MAP_3 } from "./Map3.js";
import { MAP_AKAGI } from "./MapAkagi.js";
import { MAP_SADAMINE } from "./MapSadamine.js";
import { MAP_TSUKUBA } from "./MapTsukuba.js";
import { MAP_MONACO } from "./MapMonaco.js";
import { MAP_SPA } from "./MapSpa.js";
import { MAP_SILVERSTONE } from "./MapSilverstone.js";
import { MAP_MONZA } from "./MapMonza.js";
import { MAP_SUSPENSION } from "./MapSuspension.js";

export const COURSE_DEFS = {
  [MAP_1.id]: MAP_1,
  [MAP_2.id]: MAP_2,
  [MAP_3.id]: MAP_3,
  [MAP_AKAGI.id]: MAP_AKAGI,
  [MAP_SADAMINE.id]: MAP_SADAMINE,
  [MAP_TSUKUBA.id]: MAP_TSUKUBA,
  [MAP_MONACO.id]: MAP_MONACO,
  [MAP_SPA.id]: MAP_SPA,
  [MAP_SILVERSTONE.id]: MAP_SILVERSTONE,
  [MAP_MONZA.id]: MAP_MONZA,
  [MAP_SUSPENSION.id]: MAP_SUSPENSION,
};

export const DEFAULT_COURSE_ID = MAP_1.id;
