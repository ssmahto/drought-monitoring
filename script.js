// Initialize the map
var map = L.map('map').setView([20.5937, 78.9629], 5);

// Replace with your ESRI basemap or other basemap configuration
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri'
}).addTo(map);

// Variable to hold the highlighted layer
var highlightedLayer = null;

//===================================================================
// Sample drought-affected areas
var droughtAreas = [
    {
        name: "Area 1",
        lat: 23.2599,
        lon: 77.4126,
        severity: "Severe"
    },
    {
        name: "Area 2",
        lat: 28.7041,
        lon: 77.1025,
        severity: "Moderate"
    },
    {
        name: "Area 3",
        lat: 19.0760,
        lon: 72.8777,
        severity: "Mild"
    }
];

// Add markers for drought-affected areas to the map
droughtAreas.forEach(function(area) {
    var marker = L.marker([area.lat, area.lon]).addTo(map);
    marker.bindPopup("<b>" + area.name + "</b><br>Severity: " + area.severity);
});

//===================================================================
// Function to handle state click event
function onStateClick(e, feature) {
    // Remove existing highlighted layer if any
    if (highlightedLayer) {
        map.removeLayer(highlightedLayer);
    }
    
    var stateName = feature.properties.STATE; // Adjust property name as per your shapefile
    
    // Highlight the clicked state boundary
    highlightedLayer = L.geoJSON(feature, {
        style: {
            color: '#01FFF4',
            weight: 3,
            fillOpacity: 0.0
        }
    }).addTo(map);
    
    // Popup content for the clicked state
    var popupContent = `
        <b>State:</b> ${stateName}<br>
        <b>FID:</b> ${feature.properties.FID}<br>
        <b>State LGD:</b> ${feature.properties.State_LGD}
    `;
    
    L.popup()
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(map);
}

// Event listener to handle map clicks
map.on('click', function(e) {
    // Remove highlighted layer if any when clicking outside state boundary
    if (highlightedLayer) {
        map.removeLayer(highlightedLayer);
        highlightedLayer = null; // Reset highlightedLayer variable
    }
});

//===================================================================
// Load and display the SPI data from CSV
fetch('SPI/data.csv')
    .then(response => response.text())
    .then(csvData => {
        // Convert CSV to GeoJSON
        var geoJsonData = csvToGeoJson(csvData);

        // Add GeoJSON layer to map
        L.geoJSON(geoJsonData, {
            onEachFeature: function (feature, layer) {
                var lat = feature.geometry.coordinates[1];
                var lon = feature.geometry.coordinates[0];
                var SPI = feature.properties.SPI;
                
                // Define the bounds of the rectangle
                var bounds = [[lat - 0.125, lon - 0.125], [lat + 0.125, lon + 0.125]];
                
                // Create the rectangle
                var rectangle = L.rectangle(bounds, {
                    color: getColor(SPI),
                    weight: 1,
                    fillOpacity: 0.8
                }).bindPopup(`<b>SPI Value:</b> ${SPI}`);

                // Add the rectangle to the map
                rectangle.addTo(map);
            }
        });
    })
    .catch(error => console.error('Error loading CSV:', error));

// Function to convert CSV data to GeoJSON
function csvToGeoJson(csvData) {
    var csvRows = csvData.split(/\r?\n|\r/);
    var headers = csvRows[0].split(',');
    var geoJsonFeatures = [];

    for (var i = 1; i < csvRows.length; i++) {
        var row = csvRows[i].split(',');
        var feature = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(row[1]), parseFloat(row[0])] // [longitude, latitude]
            }
        };

        for (var j = 0; j < headers.length; j++) {
            if (headers[j] !== 'latitude' && headers[j] !== 'longitude') {
                feature.properties[headers[j]] = parseFloat(row[j]);
            }
        }

        geoJsonFeatures.push(feature);
    }

    return {
        type: 'FeatureCollection',
        features: geoJsonFeatures
    };
}

// Define the function to determine the color based on SPI value
function getColor(SPI) {
    if (SPI <= -1) {
        return '#0000ff'; // Blue for SPI <= -1
    } else if (SPI > -1 && SPI <= 0) {
        return '#00ffff'; // Cyan for -1 < SPI <= 0
    } else if (SPI > 0 && SPI <= 1) {
        return '#ffff00'; // Yellow for 0 < SPI <= 1
    } else if (SPI > 1 && SPI <= 2) {
        return '#ff7f00'; // Orange for 1 < SPI <= 2
    } else if (SPI > 2 && SPI <= 3) {
        return '#ff0000'; // Red for 2 < SPI <= 3
    } else if (SPI > 3 && SPI <= 4) {
        return '#7f0000'; // Dark Red for 3 < SPI <= 4
    } else {
        return 'whitesmoke'; // Green for SPI > 4
    }
}









//============== Country/State shapefile =============================================
//=======================================================================
// Load and display the shapefile for state boundaries
fetch("shapefiles/STATE_BOUNDARY.zip")
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }
        return response.arrayBuffer();
    })
    .then(buffer => {
        return shp(buffer);
    })
    .then(geojson => {
        // Add GeoJSON layer to map for state boundaries
        L.geoJSON(geojson, {
            style: function (feature) {
                return {
                    color: 'black',
                    weight: 2,
                    fillOpacity: 0.2
                };
            },
            onEachFeature: function (feature, layer) {
                layer.on({
                    click: function (e) {
                        onStateClick(e, feature);
                    }
                });
                // Popup content for each state boundary
                var popupContent = `
                    <b>FID:</b> ${feature.properties.FID}<br>
                    <b>State:</b> ${feature.properties.STATE}<br>
                    <b>State LGD:</b> ${feature.properties.State_LGD}
                `;
                layer.bindPopup(popupContent);
            }
        }).addTo(map);
    })
    .catch(error => console.error("Error loading shapefile:", error));