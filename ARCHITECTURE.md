# Why it exists

I needed SVG generator from OpenStreetMap data that would be accessible to anyone, without requirements to install anything new.

Generated SVG must be usable as design files for laser cutter, for a [specific project](https://wiki.openstreetmap.org/wiki/Microgrants/Microgrants_2020/Proposal/Tactile_maps_for_blind_or_visually_impaired_children) (tactile maps for blind or visually impaired children).

I am not a JS expert, I prefer to ship something rather than produce piles of beautiful unused code - so first version will be as dumb as possible.

# Why JS? Why?

I started writing it as Python script, before realising that intended audience should not be assumed to be programmers (unlike say [library for automating OSM edits](https://github.com/matkoniecz/osm_bot_abstraction_layer)).

If I would jump through hoops I would be able to upgrade CLI tool into having some clunky GUI interface with self-contained installer.

Still, people would need to install random executable.

Visiting page in browser is significantly easier to use and has much lower barrier.

So despite my dislike toward JS and lack of expertise with wring JS code it is implemented as program running on website.

Note: my dislike toward JS was signifcantly reduced while writing this.

## npm rant

My dislike toward `npm` ecosystem got confirmed, at least for now. At least `npm_attempt` branch was so far massive time sink, I wasted a lot of time and I still have no working replacement. Note: while it may be a TypeScript fault or my failure to find a proper documentation... I tried really hard how to make something that would allow me to

- specify dependencies
- allow to easily update them
- generate .js bundle from that
- - skipping unused code from libraries is strongly preferable, but that is optional
- do some code linting/autoformatting

And I failed completely. Note that it is likely problem is not caused by my incopetence. I figured how to do it in Ruby and in Python, with just idcoumetation found online. And here I failed even with external help.

Note: if someone is able to point out how can I get working `leaflet-draw` (or equivalent) in TypeScript I would be thanful ( current attempt state in [https://github.com/matkoniecz/lunar_assembler/commits/npm_attempt](https://github.com/matkoniecz/lunar_assembler/commits/npm_attempt) ).

Similarly if someone knows sane way to have simple working method to manage `.js` dependencies I would appreciate it.

Fun fact: [https://docs.npmjs.com/getting-started](https://docs.npmjs.com/getting-started) has info how to upgrade to a paid account but no info how to do that.

[https://docs.npmjs.com/using-npm-packages-in-your-projects](https://docs.npmjs.com/using-npm-packages-in-your-projects) has

> Once you have installed a package in node_modules, you can use it in your code.

what explain exactly nothing how the heck I should do it

# Fundamentals

Obtains OpenStreetMap data and generates SVG map from that.

It must run as client side JS hosted on static page. Server-side solution is rejected as neither needed nor viable here. It also has nice side-effect of making potential reuse easier.

Performance is not considered during design, as main target of work would involve tiny areas. It is also intended as a feasibility test to check is it possible at all, and to identify what is bottleneck.

In addition, note that for bigger workloads you will need a database rather than running it in browser.

## Alternatives

There are some [known tools](https://wiki.openstreetmap.org/wiki/SVG) for that, but none working as client-side JS.

Some were potentially adaptable, but ignored due to having too interesting architecture. For example [Osmarender](https://wiki.openstreetmap.org/wiki/Osmarender/Convert_osm_data_from_OSM_file_to_an_SVG_image) using XSLT to transform OSM XML into SVG XML or compiling my Python scripts to JS using [pyodide](https://github.com/pyodide/pyodide).

# GUI for triggerring that

GUI for selecting rectangle that will be processed - Leaflet + Leaflet-draw plugin.

# Obtaining OSM data

Gets bounding box, ends with geojson for futher processing.

Fetching OpenStreeMap data - Overpass API

And one extra step is needed because d3 is extraspecial and is deliberately breaking RFC 7946. So it is necessary to rewind all geometries to follow left-hand rule rather than right-hand rule. And d3 for now has this trap rather than fix it and release breaking update that would [fix this mess](https://github.com/d3/d3-geo/pull/79#issuecomment-281031437).

# Generating SVG

[NOT DONE AT ALL]
Intersecting geojson data with geojson pattern (needed for some later)

Rendering geojson data as SVG.

[NOT DONE AT ALL, UNCLEAR DOABILITY]

- support for adding raster patters

Allowing to download that SVG.
