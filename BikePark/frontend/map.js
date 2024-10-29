let map, marker, bikeSpotMarkers = [], bikeSpotSuggestionsMarkers = [];

async function loadGoogleMapsScript() {
    try {
        const response = await fetch("http://localhost:8080/services/ts/BikePark/api/BikeParkService.ts/ApiKey/1");

        if (!response.ok) {
            throw new Error("Failed to fetch API key");
        }

        let apiKey = await response.text();
        apiKey = apiKey.replace(/^"(.*)"$/, '$1');

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=myMap`;
        script.async = true;
        script.defer = true;

        document.head.appendChild(script);
    } catch (error) {
        console.error("Error loading Google Maps API key:", error);
    }
}

loadGoogleMapsScript();

async function getBikeParkSpots() {
    try {
        const response = await fetch("http://localhost:8080/services/ts/BikePark/api/BikeParkService.ts/BikeStandData");

        if (!response.ok) {
            throw new Error("Failed to fetch bike stands");
        }

        const bikeStands = await response.json();
        displayBikeParkSpots(bikeStands);
    }

    catch (error) {
        console.error("Error fetching bike park spots:", error);
    }
}

async function getBikeParkSuggestions() {
    try {
        const response = await fetch("http://localhost:8080/services/ts/BikePark/api/BikeParkService.ts/BikeStandSuggestionData");

        if (!response.ok) {
            throw new Error("Failed to fetch bike stands");
        }

        const bikeStandSuggestions = await response.json();
        displayBikeParkSuggestions(bikeStandSuggestions);
    }

    catch (error) {
        console.error("Error fetching bike park suggestions:", error);
    }
}

function myMap() {
    const sofiaCoords = { lat: 42.6977, lng: 23.3219 }; // Sofia, Bulgaria
    const mapProp = {
        center: sofiaCoords,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

    google.maps.event.addListener(map, 'click', function (event) {
        if (!marker) {
            addMarker(event.latLng);
            toggleButtons(true, true);
        }
    });

    document.getElementById("removeMarkerButton").addEventListener("click", () => {
        removeMarker();
    });

    document.getElementById("submitMarkerButton").addEventListener("click", () => {
        if (marker) {
            document.getElementById("spotLatitude").value = marker.position.lat();
            document.getElementById("spotLongitude").value = marker.position.lng();

            loadStandTypes().then(() => {
                $('#bikeSpotModal').modal('show');
            });
        }
    });

    document.getElementById("Bike Spots").addEventListener("click", getBikeParkSpots);
    document.getElementById("Suggestions").addEventListener("click", getBikeParkSuggestions);
    document.getElementById("Home").addEventListener("click", clearAllMarkers);
}

function addMarker(location) {
    marker = new google.maps.Marker({
        position: location,
        map: map
    });
}

async function loadStandTypes() {
    try {
        const response = await fetch("http://localhost:8080/services/ts/BikePark/api/BikeParkService.ts/StandTypesData");

        if (!response.ok) {
            throw new Error("Failed to fetch stand types");
        }

        const standTypes = await response.json();
        const standTypeSelect = document.getElementById("standType");

        standTypes.forEach(type => {
            const option = document.createElement("option");
            option.value = type.Id;
            option.textContent = type.Name;
            standTypeSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading stand types:", error);
    }
}


document.getElementById("finalSubmitButton").addEventListener("click", () => {
    const name = document.getElementById("spotName").value;
    const slotCount = document.getElementById("slotCount").value;
    const standType = document.getElementById("standType").value;
    const latitude = document.getElementById("spotLatitude").value;
    const longitude = document.getElementById("spotLongitude").value;

    const data = {
        Location: name,
        SlotCount: parseInt(slotCount, 10),
        StandType: standType,
        Latitude: parseFloat(latitude),
        Longitude: parseFloat(longitude),
    };

    console.log("Data: ", data);

    fetch("http://localhost:8080/services/ts/BikePark/api/BikeParkService.ts/BikeStandSuggestion", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to submit bike spot suggestion");
            }
            return response.json();
        })
        .then(data => {
            console.log("Bike spot suggestion submitted successfully:", data);
            $('#bikeSpotModal').modal('hide');
            removeMarker();
        })
        .catch(error => {
            console.error("Error submitting bike park suggestion:", error);
        });
});


function toggleButtons(submitEnabled, removeEnabled) {
    document.getElementById("submitMarkerButton").disabled = !submitEnabled;
    document.getElementById("removeMarkerButton").disabled = !removeEnabled;
}

function displayBikeParkSpots(bikeStands) {
    clearAllMarkers();

    bikeStands.forEach(stand => {
        const { Latitude, Longitude } = stand;
        const position = { lat: Latitude, lng: Longitude };
        const bikeSpotMarker = new google.maps.Marker({
            position,
            map: map,
        });

        bikeSpotMarkers.push(bikeSpotMarker);
    });
}

function displayBikeParkSuggestions(suggestions) {
    clearAllMarkers();

    suggestions.forEach(stand => {
        const { Latitude, Longitude } = stand;
        const position = { lat: Latitude, lng: Longitude };
        const bikeSpotSuggestionMarker = new google.maps.Marker({
            position,
            map: map,
        });

        bikeSpotSuggestionsMarkers.push(bikeSpotSuggestionMarker);
    });
}

$('#bikeSpotModal').on('hidden.bs.modal', function () {
    document.getElementById("bikeSpotForm").reset();
    document.getElementById("standType").innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Stand Type";
    document.getElementById("standType").appendChild(defaultOption);
});

function removeMarker() {
    if (marker) {
        marker.setMap(null);
        marker = null;

        toggleButtons(false, false);
    }
}

function clearBikeSpotMarkers() {
    bikeSpotMarkers.forEach(marker => marker.setMap(null));
    bikeSpotMarkers = [];
}

function clearBikeSuggestionMarkers() {
    bikeSpotSuggestionsMarkers.forEach(marker => marker.setMap(null));
    bikeSpotSuggestionsMarkers = [];
}

function clearAllMarkers() {
    clearBikeSpotMarkers();
    clearBikeSuggestionMarkers();
    removeMarker()
}
