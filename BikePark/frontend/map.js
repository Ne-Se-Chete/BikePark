async function loadGoogleMapsScript() {
    try {
        const response = await fetch("http://localhost:8080/services/ts/BikePark/api/BikeParkService.ts/ApiKey/1");

        if (!response.ok) {
            throw new Error("Failed to fetch API key");
        }

        let apiKey = await response.text();
        apiKey = apiKey.replace(/^"(.*)"$/, '$1');

        console.log("ApiKey:", apiKey);
        console.log("Map src: ", `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=myMap`);

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

let map, marker;

function myMap() {
    const sofiaCoords = { lat: 42.6977, lng: 23.3219 }; //Sofia, Bulgaria
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
        toggleButtons(false, false);
    });

    document.getElementById("submitMarkerButton").addEventListener("click", () => {
        if (marker) {
            submitMarker(marker.position);
            removeMarker();
            toggleButtons(false, false);
        }
    });
}

function addMarker(location) {
    marker = new google.maps.Marker({
        position: location,
        map: map
    });
}

function removeMarker() {
    if (marker) {
        marker.setMap(null);
        marker = null;
    }
}

function submitMarker(location) {
    console.log("Marker submitted with coordinates:", location.lat(), location.lng());
}

function toggleButtons(submitEnabled, removeEnabled) {
    document.getElementById("submitMarkerButton").disabled = !submitEnabled;
    document.getElementById("removeMarkerButton").disabled = !removeEnabled;
}
