
var aoi = ee.FeatureCollection('projects/ee-bandhangeo/assets/Badda_Aoi');
var trees = ee.FeatureCollection('projects/ee-bandhangeo/assets/Badda_Trees_Sample');
var region = aoi.geometry();

// Keep polygons from the mixed tree geometries
function getPolygons(feature) {
  var coords = ee.List(feature.geometry().geometries().iterate(function(part, list) {
    var geom = ee.Geometry(part);
    return ee.Algorithms.If(
      geom.type().compareTo('Polygon').eq(0),
      ee.List(list).add(geom.coordinates()),
      list
    );
  }, ee.List([])));

  return feature.set('polygon_coords', coords).set('polygon_count', coords.size());
}

var polygons = trees.map(getPolygons)
  .filter(ee.Filter.gt('polygon_count', 0))
  .map(function(feature) {
    var geom = ee.Geometry.MultiPolygon(ee.List(feature.get('polygon_coords')), null, false);
    return ee.Feature(geom.intersection(region, ee.ErrorMargin(1)));
  })
  .map(function(feature) {
    return feature.set('area_m2', feature.geometry().area(1));
  })
  .filter(ee.Filter.gt('area_m2', 0));

// Mask clouds and make a 2021 median composite
function maskClouds(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(0).and(scl.neq(1)).and(scl.neq(3))
    .and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10)).and(scl.neq(11));
  return image.updateMask(mask);
}

var image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(region)
  .filterDate('2021-01-01', '2022-01-01')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .map(maskClouds)
  .median()
  .clip(region);

var spectral = image.select(['B2', 'B3', 'B4', 'B8'])
  .multiply(0.0001)
  .rename(['Blue', 'Green', 'Red', 'NIR']);

var ndvi = spectral.normalizedDifference(['NIR', 'Red']).rename('NDVI');

// Rasterize tree polygons and mark pixels inside Badda
var treeReference = ee.Image(0).byte().paint(polygons, 1)
  .clip(region).unmask(0).rename('reference_positive_only');

var insideAoi = ee.Image.constant(1).clip(region)
  .unmask(0).rename('inside_aoi');

var exportImage = spectral.addBands(ndvi)
  .addBands(treeReference).addBands(insideAoi).toFloat();

Map.centerObject(aoi, 15);
Map.addLayer(image, {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000}, 'Sentinel-2 2021');
Map.addLayer(treeReference.selfMask(), {palette: ['00FF00']}, 'Tree reference');
Map.addLayer(aoi.style({color: 'FF0000', fillColor: '00000000'}), {}, 'Badda AOI');

// Export imagery and reference bands
Export.image.toDrive({
  image: exportImage,
  description: 'Badda_2021_UNet_Input_Reference',
  folder: 'Badda_Tree_Canopy_2021',
  fileNamePrefix: 'Badda_2021_UNet_Input_Reference',
  region: region.bounds(),
  scale: 10,
  crs: 'EPSG:32646',
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});
