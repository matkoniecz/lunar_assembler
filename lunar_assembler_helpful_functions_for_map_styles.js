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

function findMergeGroupObject(dataGeojson, code) {
  var i = dataGeojson.features.length;
  var found = undefined;
  while (i--) {
    var feature = dataGeojson.features[i];
    //lunar_assembler_merge_group is applied by lunar assembler, see mergeAsRequestedByMapStyle function
    if (feature.properties["lunar_assembler_merge_group"] == code) {
      if (found != undefined) {
        showError("more than one area of " + code + " type what is unexpected, things may break. This is a bug, please report it on https://github.com/matkoniecz/lunar_assembler/issues");
      }
      found = feature;
    }
  }
  if (found == undefined) {
    console.warn("findMergeGroupObject failed to find " + code + " - if not expected please report at https://github.com/matkoniecz/lunar_assembler/issues");
  }
  return found;
}
