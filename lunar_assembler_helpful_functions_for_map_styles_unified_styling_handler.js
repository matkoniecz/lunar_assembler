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

function isMatcherMatchingFeature(match, feature) {
  if ("value" in match === false) {
    // matches any key
    if (match["key"] in feature.properties) {
      return true;
    }
  } else if (feature.properties[match["key"]] == match["value"]) {
    return true;
  }
  return false;
}

function getMatchFromUnifiedStyling(feature, property, styleRules) {
  var k = -1;
  while (k + 1 < styleRules.length) {
    k += 1;
    const rule = styleRules[k];
    if (property in rule === false) {
      continue;
    }
    var i = rule["matches"].length;
    while (i--) {
      const match = rule["matches"][i];
      if (Array.isArray(match)) {
        // multiple rules, all must be matched
        var m = match.length;
        var success = true;
        while (m--) {
          if (isMatcherMatchingFeature(match[m], feature) == false) {
            success = false;
          }
        }
        if (success) {
          return rule[property];
        }
      } else {
        // single key=* or key=value match
        if (isMatcherMatchingFeature(match, feature)) {
          return rule[property];
        }
      }
    }
  }
  return "none";
}

function stylingSummary(rule) {
  var returned = "";
  if ("area_color" in rule) {
    returned += '<div style="display: inline; color:' + rule["area_color"] + '"> ■ </div>';
  }
  if ("line_color" in rule) {
    returned += '<div style="display: inline; color:' + rule["line_color"] + '"> ┃ </div>';
  }
  return returned;
}

function keyWithWikiLink(key) {
  var url = "https://wiki.openstreetmap.org/wiki/Key:" + encodeURIComponent(key);
  return '<a href="' + url + '">' + key + "</a>";
}

function valueWithWikiLink(key, value) {
  var url = "https://wiki.openstreetmap.org/wiki/Tag:" + encodeURIComponent(key + "=" + value);
  return '<a href="' + url + '">' + value + "</a>";
}

function linkedAndDescribedTag(key, value, description) {
  if (value == undefined) {
    return keyWithWikiLink(key) + "=* - " + description;
  } else {
    return keyWithWikiLink(key) + "=" + valueWithWikiLink(key, value) + " - " + description;
  }
}

function generateLegendEntry(key, value, rule) {
  return "<li>" + stylingSummary(rule) + " " + linkedAndDescribedTag(key, value, rule["description"]) + "</li>\n";
}

function addLegendEntriesForDataStraightFromOpenStreetMap(rule) {
  returned = "";
  var i = rule["matches"].length;
  while (i--) {
    const match = rule["matches"][i];
    if (Array.isArray(match)) {
      // multiple rules, all must be matched
      var actualFiters = [];
      var m = match.length;
      while (m--) {
        if (match[m]["role"] === "supplementary_obvious_filter") {
          continue;
        }
        actualFiters.push(match[m]);
      }
      if (actualFiters.length != 1) {
        throw "unsupported to have multiple actual filters! - on " + JSON.stringify(match);
      }
      returned += generateLegendEntry(actualFiters[0]["key"], actualFiters[0]["value"], rule);
    } else {
      // single key=* or key=value match
      returned += generateLegendEntry(match["key"], match["value"], rule);
    }
  }
  return returned;
}

function addLegendEntriesForProcessedElements(rule) {
  returned = "";
  returned += "<li>" + stylingSummary(rule) + " " + rule["description"] + " - this is generated using:\n";
  returned += "<ul>";
  var length = rule["automatically_generated_using"].length;
  var i = -1;
  while (i + 1 < length) {
    i += 1;
    const match = rule["automatically_generated_using"][i];
    if (Array.isArray(match)) {
      // multiple rules, all must be matched
      var actualFiters = [];
      var m = match.length;
      while (m--) {
        if (match[m]["role"] === "supplementary_obvious_filter") {
          continue;
        }
        actualFiters.push(match[m]);
      }
      if (actualFiters.length != 1) {
        throw "unsupported to have multiple actual filters! - on " + JSON.stringify(match);
      }
      returned += "<li>" + linkedAndDescribedTag(actualFiters[0]["key"], actualFiters[0]["value"], actualFiters[0]["purpose"]) + "</li>\n";
    } else {
      // single key=* or key=value match
      returned += "<li>" + linkedAndDescribedTag(match["key"], match["value"], match["purpose"]) + "</li>\n";
    }
  }
  returned += "</ul>\n";
  returned += "</li>\n";
  return returned;
}

// for high zoom:
// generateLegend(highZoomMapStyle().unifiedStyling())
// in console
function generateLegend(styleRules) {
  var returned = "";
  returned += '<p>Note: width styling is <a href="https://github.com/matkoniecz/lunar_assembler/issues/87">currently not shown</a> in the legend</p> ';
  returned += "<!--automatically generated by generateLegend function-->\n";
  returned += "<ul>\n";
  var k = -1;
  while (k + 1 < styleRules.length) {
    k++;
    const rule = styleRules[k];

    if ("automatically_generated_using" in rule) {
      returned += addLegendEntriesForProcessedElements(rule);
    } else {
      returned += addLegendEntriesForDataStraightFromOpenStreetMap(rule);
    }
  }
  returned += "</ul>";
  return returned;
}

function generateTaginfoListing(styleRules) {
  var returned = [];
  var k = -1;
  while (k + 1 < styleRules.length) {
    k++;
    const rule = styleRules[k];

    if ("automatically_generated_using" in rule) {
      returned.push(...addTaginfoListingForProcessedElements(rule));
    } else {
      returned.push(...addTaginfoListingForDataStraightFromOpenStreetMap(rule));
    }
  }
  return returned;
}

function addTaginfoListingForDataStraightFromOpenStreetMap(rule) {
  returned = [];
  var i = rule["matches"].length;
  while (i--) {
    var match = null;
    if (Array.isArray(rule["matches"][i])) {
      match = rule["matches"][i];
    } else {
      match = [rule["matches"][i]];
    }
    // multiple rules, all must be matched
    var m = match.length;
    while (m--) {
      if (match[m]["role"] === "supplementary_obvious_filter") {
        continue;
      }
      var pushed = { key: match[m]["key"], value: match[m]["value"], description: rule["description"] };
      if ("value" in match[m] == false) {
        delete pushed["value"];
      }
      returned.push(pushed);
    }
  }
  return returned;
}

function addTaginfoListingForProcessedElements(rule) {
  returned = [];
  var length = rule["automatically_generated_using"].length;
  var i = -1;
  while (i + 1 < length) {
    i += 1;
    var match = null;
    if (Array.isArray(match)) {
      match = rule["automatically_generated_using"][i];
    } else {
      match = [rule["automatically_generated_using"][i]];
    }
    var m = match.length;
    while (m--) {
      if (match[m]["role"] === "supplementary_obvious_filter") {
        continue;
      }
      var pushed = { key: match[m]["key"], value: match[m]["value"], description: match[m]["purpose"] };
      if ("value" in match[m] == false) {
        delete pushed["value"];
      }
      returned.push(pushed);
    }
  }
  return returned;
}
