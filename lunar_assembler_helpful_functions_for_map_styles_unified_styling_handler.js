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

function isMatcherMatchingFeature(match, feature){
  if(('value' in match) === false) {
    // matches any key
    if(match["key"] in feature.properties) {
      return true;
    }
  } else if(feature.properties[match["key"]] == match["value"]) {
    return true;
  }
  return false;
}

function getMatchFromUnifiedStyling(feature, property, styleRules) {
  var k = -1;
  while (k + 1 < styleRules.length) {
    k += 1
    const rule = styleRules[k];
    if((property in rule) === false) {
      continue;
    }
    var i = rule['matches'].length;
    while (i--) {
        const match = rule['matches'][i];
        if(Array.isArray(match)) {
          // multiple rules, all must be matched
          var m = match.length;
          var success = true;
          while (m--) {
            if(isMatcherMatchingFeature(match[m], feature) == false) {
              success = false;
            }
          }
          if(success) {
            return rule[property]
          }

        } else {
          // single key=* or key=value match
          if(isMatcherMatchingFeature(match, feature)) {
            return rule[property]
          }  
        }
      }
  }
  return "none";
}

function generateLegendEntry(key, value, rule){
  var styling_summary = ""
  if("area_color" in rule) {
    styling_summary += '<div style="display: inline; color:' + rule["area_color"] + '"> ■ </div>'
  }
  if("line_color" in rule) {
    styling_summary += '<div style="display: inline; color:' + rule["line_color"] + '"> ┃ </div>'
  }

  var url_value = "https://wiki.openstreetmap.org/wiki/Tag:" + encodeURIComponent(key + "=" + value);
  var url_key = "https://wiki.openstreetmap.org/wiki/Key:" + encodeURIComponent(key);

  var linked_key = '<a href="' + url_key + '">' + key + "</a>"
  if(value == undefined) {
    return "<li>" + styling_summary + " " + linked_key  + "=* - " + rule["description"] + "</li>\n"
  } else {
    var linked_value = '<a href="' + url_value + '">' + value + "</a>"
    return "<li>" + styling_summary + " " + linked_key + "=" + linked_value + " - " + rule["description"] + "</li>\n"

  }
}

// for high zoom:
// generateLegend(highZoomMapStyle().unifiedStyling())
// in console
function  generateLegend(styleRules){
  var returned = ""
  returned += '<p>Note: width styling is <a href="https://github.com/matkoniecz/lunar_assembler/issues/87">currently not shown</a> in the legend</p> ' 
  returned += "<!--automatically generated by generateLegend function-->\n" 
  returned += "<ul>\n"
  var k = -1;
  while (k+1 < styleRules.length) {
    k++;
    const rule = styleRules[k];
    var i = rule['matches'].length;
    while (i--) {
      const match = rule['matches'][i];
      if(Array.isArray(match)) {
        // multiple rules, all must be matched
        var actualFiters = [];
        var m = match.length;
        while (m--) {
          if(match[m]['role'] === 'supplementary_obvious_filter') {
            continue;
          }
          actualFiters.push(match[m]);
        }
        if(actualFiters.length != 1){
          throw "unsupported to have multiple actual filters!"
        }
        returned += generateLegendEntry(actualFiters[0]['key'], actualFiters[0]['value'], rule)
      } else {
        // single key=* or key=value match
        returned += generateLegendEntry(match['key'], match['value'], rule)
      }
    }
  }
  returned += "</ul>"
  return returned;
}
