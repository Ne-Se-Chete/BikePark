let map, marker, apiKey, bikeSpotMarkers = [], bikeSpotSuggestionsMarkers = [], allStandTypes = {};

async function loadGoogleMapsScript() {
    try {
        apiKey = "A" + "IzaSyC" + "NdMoF5vzR" + "JcfLeMYOg" + "ZWlVAZ" + "-" + "mZZ" + "-8g4";

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=myMap`;
        script.async = true;
        script.defer = true;

        document.head.appendChild(script);
    }

    catch (error) {
        console.error("Error loading Google Maps map:", error);
    }
}

loadGoogleMapsScript();

async function getBikeParkSpots() {
    try {
        const response = await fetch("/services/ts/BikePark/api/BikeParkService.ts/BikeStandData");

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
        const response = await fetch("/services/ts/BikePark/api/BikeParkService.ts/BikeStandSuggestionData");

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
    const sofiaCoords = { lat: 42.6977, lng: 23.3219 };
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
        const response = await fetch("/services/ts/BikePark/api/BikeParkService.ts/StandTypesData");

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

    fetch("/services/ts/BikePark/api/BikeParkService.ts/BikeStandSuggestion", {
        method: "POST",
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
        const { Location, SlotCount, StandTypeName, Latitude, Longitude } = stand;
        const position = { lat: parseFloat(Latitude), lng: parseFloat(Longitude) };
        const bikeSpotMarker = new google.maps.Marker({
            position,
            map: map,
        });

        bikeSpotMarker.addListener("click", () => {
            showBikeSpotInfo(Location, SlotCount, StandTypeName, Latitude, Longitude);
        });

        bikeSpotMarkers.push(bikeSpotMarker);
    });
}

function displayBikeParkSuggestions(suggestions) {
    clearAllMarkers();

    suggestions.forEach(suggestion => {
        const { Location, SlotCount, StandTypeName, Latitude, Longitude } = suggestion;
        const position = { lat: parseFloat(Latitude), lng: parseFloat(Longitude) };
        const bikeSpotSuggestionMarker = new google.maps.Marker({
            position,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "blue",
                fillOpacity: 1,
                scale: 8,  // adjust size as needed
                strokeColor: "darkblue",
                strokeWeight: 2,
            }
        });

        bikeSpotSuggestionMarker.addListener("click", () => {
            showBikeSpotInfo(Location, SlotCount, StandTypeName, Latitude, Longitude);
        });

        bikeSpotSuggestionsMarkers.push(bikeSpotSuggestionMarker);
    });
}


function showBikeSpotInfo(name, slotCount, standType, latitude, longitude) {
    document.getElementById("infoName").textContent = name;
    document.getElementById("infoSlotCount").textContent = slotCount;
    document.getElementById("infoStandType").textContent = standType;
    document.getElementById("infoStandType").textContent = standType;

    getAddress(latitude, longitude).then(address => {
        document.getElementById("infoAddress").textContent = address || "Address not found";
    });

    document.getElementById("bikeSpotInfoSidebar").classList.add("open");
    document.querySelector(".container").classList.add("shift-left");
}

document.getElementById("closeSidebarButton").addEventListener("click", () => {
    document.getElementById("bikeSpotInfoSidebar").classList.remove("open");
    document.querySelector(".container").classList.remove("shift-left");
});

$('#bikeSpotModal').on('hidden.bs.modal', function () {
    document.getElementById("bikeSpotForm").reset();
    document.getElementById("standType").innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Stand Type";
    document.getElementById("standType").appendChild(defaultOption);
});

async function getAddress(latitude, longitude) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK") {
            return data.results[0].formatted_address;
        }

        else {
            console.error("Geocode error:", data.status);
            return null;
        }
    }

    catch (error) {
        console.error("Error fetching address:", error);
        return null;
    }
}

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
