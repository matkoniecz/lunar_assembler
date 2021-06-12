/*
    lunar_assembler - tool for generating SVG files from OpenStreetMap data. Available as a website.
    Copyright (C) 2021 Mateusz Konieczny

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, under version 3 of the
    License only.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

function motorizedRoadValuesArray() {
  return [
    "motorway",
    "motorway_link",
    "trunk",
    "trunk_link",
    "primary",
    "primary_link",
    "secondary",
    "secondary_link",
    "tertiary",
    "tertiary_link",
    "unclassified",
    "residential",
    "service",
    "track",
    "road",
    "busway",
    "raceway",
    "escape",
    "living_street",
  ];
}

function railwayLinearValuesArray() {
  return [
    "rail",
    "disused",
    "tram",
    "subway",
    "narrow_gauge",
    "light_rail",
    "preserved",
    "construction",
    "miniature",
    "monorail",
  ];
}

function pedestrianWaysValuesArray() {
  return [
    "footway",
    "path",
    "steps",
    "pedestrian",
  ];
}

function linearGenerallyImpassableBarrierValuesArray() {
  // kerb intentionally skipped
  return ["fence", "wall", "hedge", "retaining_wall", "hedge_bank", "wire_fence", "city_wall", "guard_rail"]
}