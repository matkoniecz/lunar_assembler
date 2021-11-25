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

/*
This file contains code to generate entire inaccessible areas as geometries.

This way it is possible to generalize building and barriers into one area.

Useful when one does not care about internal courtyards, what exactly is in walled of gardens etc.

to use this code:

add to transformGeometryAsInitialStep()

      dataGeojson = generateAreasFromBarriers(dataGeojson);
      dataGeojson = generateRestrictedAcccessArea(dataGeojson, readableBounds);

add to unifiedStyling()

      const barrierAreaColor = "#b76b80";
      const generatedImpassableAreaColor = "black";
      returned = addRulesForDisplayOfCalculatedImpassableArea(returned, barrierAreaColor, generatedImpassableAreaColor);

obviously, colors in configuration here can be changed!
*/

function restrictiveAccessValues() {
  return ['no', 'private', 'customers'];
}

function isAccessValueRestrictive(value) {
  if(restrictiveAccessValues().indexOf(value) >= 0) {
    return true;
  }
  return false;
}

function listOfTagSetsBlockingPedestrianAccess() {
  returned = [
    {'natural': 'water'},
    {'waterway': 'riverbank'},
    {'building': undefined},
    {'waterway': 'riverbank'},
    {'area:highway': undefined, 'foot': 'no'},
  ]
  /*
  pulling parking rules here may be nice but beginning to be ridiculous
  for (const restrictive of restrictiveAccessValues()) {

  }
  */
  return returned;
}


function generateRestrictedAcccessArea(geojson, readableBounds) {
    var entireArea = readableBoundsToGeojsonGeometry(readableBounds);

    // clipping with empty area is done here to ensure that multipolygon
    // is always produced, also when no forbidden areas are present
    var areaOfUnknownState = polygonClipping.difference(entireArea, []);

    // TODO TODO TODO after moving everything
    //generated = cloneAndCollectAreasDirectlyBlockingPedestrianMovement(geojson)

    generated = [];
    featuresGivingAccess = [];
    var i = geojson.features.length;
    while (i--) {
      var feature = geojson.features[i];
      if (isFeatureMakingFreePedestrianMovementPossible(feature)) {
        featuresGivingAccess.push(feature);
      }
      const link = "https://www.openstreetmap.org/" + feature.id;
      if (feature.geometry.type != "Polygon" && feature.geometry.type != "MultiPolygon") {
        continue;
      }
      if (isAreaMakingFreePedestrianMovementImpossible(feature)) {
        var areaOfUnknownState = polygonClipping.difference(areaOfUnknownState, feature.geometry.coordinates);
        if (feature.properties["natural"] != "water" && feature.properties["waterway"] != "riverbank") {
          // water has its own special rendering and does not need this
          var cloned = JSON.parse(JSON.stringify(feature));
          cloned.properties = { native_blocked_chunk: "yes" };
          generated.push(cloned);
        }
      }
    }

    // TODO TODO TODO
    // TODO TODO TODO
    // apply areaOfUnknownState in iteration here

    //console.warn("areaOfUnknownState")
    //console.warn(JSON.stringify({ type: "MultiPolygon", coordinates: areaOfUnknownState }));

    // areaOfUnknownState is now entire area except removed blocking areas
    // now the next step is to fill areas where there is no access
    // for example private courtyard within buildings, walled of areas and so on

    var k = areaOfUnknownState.length;
    while (k--) {
      const traversableChunk = {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: areaOfUnknownState[k] },
        properties: {},
      };
      var i = featuresGivingAccess.length;
      while (i--) {
        const accessGivingFeature = featuresGivingAccess[i];

        if (turf.lineIntersect(traversableChunk, accessGivingFeature).features.length != 0) {
          traversableChunk.properties["generated_traversable_chunk"] = "yes";
          break;
        }
      }
      if (traversableChunk.properties["generated_traversable_chunk"] != "yes") {
        traversableChunk.properties["generated_blocked_chunk"] = "yes";
      }
      geojson.features.push(traversableChunk);
    }
    var k = generated.length;
    while (k--) {
      geojson.features.push(generated[k]);
    }
    return geojson;
  }

function cloneAndCollectAreasDirectlyBlockingPedestrianMovement(geojson) {

}

  function readableBoundsToGeojsonGeometry(readableBounds) {
    var entireAreaRing = [
      [readableBounds["east"], readableBounds["south"]],
      [readableBounds["east"], readableBounds["north"]],
      [readableBounds["west"], readableBounds["north"]],
      [readableBounds["west"], readableBounds["south"]],
      [readableBounds["east"], readableBounds["south"]],
    ];
    return [entireAreaRing];
  }

  function generateAreasFromBarriers(geojson) {
    generated = [];
    var i = geojson.features.length;
    while (i--) {
      var feature = geojson.features[i];
      const link = "https://www.openstreetmap.org/" + feature.id;

      if (linearGenerallyImpassableBarrierValuesArray().includes(feature.properties["barrier"]) || feature.properties["barrier"] == "yes") {
        var produced = turf.buffer(feature, 0.1, { units: "meters" });
        var cloned = JSON.parse(JSON.stringify(produced));
        cloned.properties["generated_barrier_area"] = "yes";
        generated.push(cloned);
      }
    }

    var k = generated.length;
    while (k--) {
      geojson.features.push(generated[k]);
    }
    return geojson;
  }

  function isFeatureMakingFreePedestrianMovementPossible(feature) {
    // TODO right now it is missing from legend and taginfo entries as
    // this rules compile to something obnoxiously complex
    // it would be nice to list it
    // at least partially
    var highway = feature.properties["highway"];
    var foot = feature.properties["foot"];
    var access = feature.properties["access"];
    if (motorizedRoadValuesArray().includes(highway) || ["footway", "pedestrian", "path", "steps", "cycleway"].includes(highway)) {
      if (isAccessValueRestrictive(foot)) {
        return false;
      }
      if (highway == "motorway" && foot == null) {
        // assume no for motorways, but do not discard them completely: some can be walked on foot (yes really)
        return false;
      }
      if (highway == "service" && feature.properties["service"] == "driveway") {
        if (foot != null && !isAccessValueRestrictive(foot)) {
          return true;
        }
        if (access != null && !isAccessValueRestrictive(access)) {
          return true;
        }
        return false; // assume false for driveways
      }

      if (!isAccessValueRestrictive(access) && !isAccessValueRestrictive(foot)) {
        return true;
      }
      if (isAccessValueRestrictive(access)) {
        if (foot != null && !isAccessValueRestrictive(foot)) {
          return true;
        } else {
          return false;
        }
      }
      showError("Should be impossible [isFeatureMakingFreePedestrianMovementPossible for " + JSON.stringify(feature) + "]," + reportBugMessage());
    }
  }

  function isAreaMakingFreePedestrianMovementImpossible(feature) {
    if (feature.properties["generated_barrier_area"] != null) {
      return true;
    }
    const blockingTags = listOfTagSetsBlockingPedestrianAccess();
    if(isMatchingAnyEntryInBlockingTagList(feature, blockingTags)) {
      return true;
    }
    if (isAccessValueRestrictive(feature.properties["access"]) && feature.properties["amenity"] != "parking") {
      if (feature.properties["foot"] == null || isAccessValueRestrictive(feature.properties["foot"])) {
        // TODO right now it is missing from legend and taginfo entries as
        // this rules compile to something obnoxiously complex
        return true;
      }
    }
    return false;
  }

  function isMatchingEntryInBlockingTags(feature, tagEntry) {
    for (const [key, value] of Object.entries(tagEntry)) {
      if(value == undefined) {
        // just checking presence of this key
        if(feature.properties[key] == null) {
          return false;
        }
      } else {
        if(feature.properties[key] != value) {
          return false;
        }  
      }
    } 
  return true;
  }

  function isMatchingAnyEntryInBlockingTagList(feature, blockingTagList) {
    for (const blockingTags of blockingTagList) {
      if(isMatchingEntryInBlockingTags(feature, blockingTags)) {
        return true;
      }
    }
    return false;
  }

  function addRulesForDisplayOfCalculatedImpassableArea(returned, barrierAreaColor, generatedImpassableAreaColor) {
    var barriersKeyValue = [];
    var i = linearGenerallyImpassableBarrierValuesArray().length;
    while (i--) {
      value = linearGenerallyImpassableBarrierValuesArray()[i];
      barriersKeyValue.push({ key: "barrier", value: value, purpose: "generally impassable barrier, for detecting where access is blocked" });
    }
    barriersKeyValue.push({ key: "barrier", value: "yes", purpose: "unknown barrier, assumed to be generally impassable barrier, for detecting where access is blocked" });

    returned.push({
      area_color: barrierAreaColor,
      description: "generated barrier areas",
      automatically_generated_using: barriersKeyValue,
      matches: [{ key: "generated_barrier_area", value: "yes" }],
    });

    var blockDetection = JSON.parse(JSON.stringify(barriersKeyValue));
    
    var message = "generally impassable barrier, for detecting where access is blocked"
    for (const blockingTags of listOfTagSetsBlockingPedestrianAccess()) {
        for (const [key, value] of Object.entries(blockingTags)) {
          if(value == undefined) {
            blockDetection.push({ "key": key, purpose: message });
          } else {
            blockDetection.push({ "key": key, "value": value, purpose: message });
          }
        }
    }

    returned.push({
      area_color: generatedImpassableAreaColor,
      description: "areas that are inaccessible, generated automatically",
      automatically_generated_using: blockDetection,
      matches: [
        { key: "generated_blocked_chunk", value: "yes" },
        { key: "native_blocked_chunk", value: "yes" },
      ],
    });
    // generated_traversable_chunk=yes is not rendered
    return returned;      
  }