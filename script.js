document.addEventListener("DOMContentLoaded", function () {
    const USER_AGENT = "ArtistSearchPage/1.0.0 ( connor.dale@xplortechnologies.com )";
    let form = document.querySelector("form");
    let tableContainer = document.getElementById("tableContainer");
    let tableBody = document.getElementById("tableBody");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        let singerName = document.getElementById("singer_name").value;

        // Clear table rows
        tableBody.innerHTML = "";

        // Fetch artist data from MusicBrainz API
        let artistId = await getArtistId(singerName);
        if (artistId) {
            let releases = await getArtistReleases(artistId);
            if (releases) {

                releases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                releases.forEach(function (releases) {
                    let row = tableBody.insertRow();
                    let cell1 = row.insertCell(0);
                    let cell2 = row.insertCell(1);
                    let cell3 = row.insertCell(2);

                    cell1.textContent = releases.title;
                    cell2.textContent = releases.date;
                    cell3.textContent = releases.country;
                });

                // Show the table container
                tableContainer.style.display = "block";
            }
        }
    });

    async function getArtistId(artistName) {
        let apiUrl = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(artistName)}&limit=1&fmt=json`;

        try {
            let response = await fetch(apiUrl, {
                headers: {
                    "User-Agent": USER_AGENT
                }
            });
            let data = await response.json();
            if (data.artists && data.artists.length > 0) {
                console.log(data.artists[0].id);
                return data.artists[0].id;
            } else {
                console.log("Artist not found.");
                showAlert("Oppsies, I don't think they're a real artist!")
                return null;
            }
        } catch (error) {
            console.error("Error fetching artist data:", error);
            showAlert("Well then, something went wrong, try again later!")
            return null;
        }
    }

    async function getArtistReleases(artistId) {
        let uniqueReleases = {}; // Object to store unique releases
        let apiUrl = `https://musicbrainz.org/ws/2/release?artist=${artistId}&limit=100&offset=0&fmt=json`;
    
        try {
            let currentPage = 0;
            let totalPages = 1; // Start with 1 to ensure at least one loop iteration
    
            while (currentPage < totalPages) {
                let response = await fetch(apiUrl, {
                    headers: {
                        "User-Agent": USER_AGENT
                    }
                });
    
                let data = await response.json();
                if (data.releases && data.releases.length > 0) {
                    // Filter out releases with titles starting with "(" or "["
                    let filteredReleases = data.releases.filter(release => 
                        !/^[\(\[]/.test(release.title)
                    );
    
                    // Add unique releases to the object
                    filteredReleases.forEach(release => {
                        if (!uniqueReleases[release.title]) {
                            uniqueReleases[release.title] = release;
                        }
                    });
    
                    // Update pagination values
                    currentPage++;
                    totalPages = Math.ceil(data["release-count"] / data["release-group-count"]);
                    apiUrl = `https://musicbrainz.org/ws/2/release?artist=${artistId}&limit=100&offset=${currentPage * 100}&fmt=json`;
                } else {
                    break; // No more releases to fetch
                }
            }
    
            // Convert the object values back to an array
            return Object.values(uniqueReleases);
        } catch (error) {
            console.error("Error fetching releases data:", error);
            showAlert("An error occurred while fetching releases data.");
            return null;
        }
    }
    

    function showAlert(message) {
        alert(message);
    }
});