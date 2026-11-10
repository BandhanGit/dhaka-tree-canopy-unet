# Tree Canopy Mapping in Badda, Dhaka

I tested a small U-Net model for mapping tree canopy in Badda using
2021 Sentinel-2 imagery and digitized canopy polygons.

## Data

- Sentinel-2 surface reflectance from Google Earth Engine
- Blue, Green, Red, NIR and NDVI bands
- Digitized 2021 tree canopy reference
- 10 m spatial resolution

## Method

I divided the study area into spatially separated training,
validation and test regions. I trained a small U-Net in PyTorch
using data augmentation and early stopping.

I also compared the model with an NDVI threshold classifier.

## Results

| Model | Precision | Recall | F1 | IoU |
|---|---:|---:|---:|---:|
| U-Net | 0.254 | 0.815 | 0.387 | 0.240 |
| NDVI | 0.305 | 0.681 | 0.421 | 0.267 |

The NDVI baseline performed better in F1 and IoU.

![Canopy comparison](results/Badda_Canopy_Comparison_2021.png)

## Limitations

Sentinel-2 has a 10 m resolution, which limits detailed mapping
of small urban tree crowns. The model was tested in one ward,
and the test region was examined during earlier experiments,
so these results are exploratory.

The imagery and original canopy polygons are not included.
Running the code

I used Google Earth Engine to prepare the 2021 Sentinel-2 imagery and tree canopy reference for Badda. The GEE code is in gee_preprocessing.js.
The script uses my uploaded Badda boundary and digitized tree canopy polygons. It exports a GeoTIFF with five input bands, the tree reference, and the study area mask.
I used this file in Google Colab to train and test the U-Net model. The file path in the notebook needs to be changed if someone wants to run it using their own Google Drive.

Data availability
The Sentinel-2 imagery is available through Google Earth Engine. I have not uploaded the original Badda boundary or tree canopy polygons to GitHub. The repository contains the code and results from my analysis.
