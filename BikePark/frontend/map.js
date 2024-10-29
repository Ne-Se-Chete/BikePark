let map, marker; // Global variables for the map and marker

// Initialize and add the map
function myMap() {
    const sofiaCoords = { lat: 42.6977, lng: 23.3219 }; // Initial center of the map (Sofia, Bulgaria)
    const mapProp = {
        center: sofiaCoords,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

    // Map click listener to place a marker at the selected location
    google.maps.event.addListener(map, 'click', function (event) {
        if (!marker) {  // Place marker only if one doesn't already exist
            addMarker(event.latLng);
            toggleButtons(true, true); // Enable submit and remove buttons
        }
    });

    // "Remove Marker" button functionality
    document.getElementById("removeMarkerButton").addEventListener("click", () => {
        removeMarker();
        toggleButtons(false, false); // Disable submit and remove buttons
    });

    // "Submit Marker" button functionality
    document.getElementById("submitMarkerButton").addEventListener("click", () => {
        if (marker) {
            submitMarker(marker.position);
            removeMarker();
            toggleButtons(false, false); // Disable submit and remove buttons after submission
        }
    });
}

// Function to add a marker at a chosen location
function addMarker(location) {
    marker = new google.maps.Marker({
        position: location,
        map: map
    });
}

// Function to remove the marker from the map
function removeMarker() {
    if (marker) {
        marker.setMap(null);
        marker = null;  // Reset marker variable to null
    }
}

// Function to simulate submitting the marker (e.g., to a database)
function submitMarker(location) {
    console.log("Marker submitted with coordinates:", location.lat(), location.lng());
    // Here, you would typically perform an AJAX call to save the marker data to a database
}

// Function to toggle the submit and remove button states
function toggleButtons(submitEnabled, removeEnabled) {
    document.getElementById("submitMarkerButton").disabled = !submitEnabled;
    document.getElementById("removeMarkerButton").disabled = !removeEnabled;
}
