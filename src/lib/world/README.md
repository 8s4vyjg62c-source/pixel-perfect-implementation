# Embedded geography

`countries.json` is derived from Natural Earth 1:50m Admin 0 country boundaries,
including territories, French labels and label positions. Natural Earth data
is public domain: https://www.naturalearthdata.com/about/terms-of-use/

Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson

Paths use d3-geo's Natural Earth projection, fit to a 1000 × 565 viewBox with
22px margins. The JSON contains projected paths, country lookup and projected
country label points; no map tiles, geocoding, tracking or remote requests are
needed when displaying the map. Boundaries reflect this cartographic source,
not a statement on disputed sovereignty. Ocean territories use Oceania in the
seven-continent browsing model.

Base geography is bundled and can render without network once app resources
are loaded. This does not make the entire app installable or available on a
cold offline browser; that would require a separate offline application shell.