document.addEventListener("DOMContentLoaded", function () {
  const USER_AGENT =
    "ArtistSearchPage/1.0.0 ( connor.dale@xplortechnologies.com )";
  let form = document.querySelector("form");
  let tableContainer = document.getElementById("tableContainer");
  let tableBody = document.getElementById("tableBody");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
  
    let submitBtn = document.getElementById("submit");
    let spinnerIcon = submitBtn.querySelector(".spinner-grow");
  
    submitBtn.disabled = true; // Disable the button while waiting
    submitBtn.querySelector("span:not(.spinner-grow)").textContent = "Loading..."; // Change the button text
    spinnerIcon.classList.remove("d-none"); // Show the spinner icon
  
    let singerName = document.getElementById("singer_name").value;
    let singerActualName = await getArtistName(singerName);

    // Clear table rows
    tableBody.innerHTML = "";

    // Fetch artist data from MusicBrainz API
    let artistId = await getArtistId(singerName);
    if (artistId) {
      let releases = await getArtistReleases(artistId);
      if (releases) {
        releases.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        releases.forEach(function (releases) {
          let row = tableBody.insertRow();
          let cell1 = row.insertCell(0);
          let cell2 = row.insertCell(1);
          let cell3 = row.insertCell(2);
          let cell4 = row.insertCell(3);

          cell1.textContent = releases.title;
          cell2.textContent = singerActualName;
          cell3.textContent = releases.country;
          cell4.textContent = releases.date;
        });

        // Show the table container
        tableContainer.style.display = "block";
      }
    }

    submitBtn.disabled = false; // Re-enable the button
    submitBtn.querySelector("span:not(.spinner-grow)").textContent = "Submit"; // Change the button text back to "Submit"
    spinnerIcon.classList.add("d-none"); // Hide the spinner icon
  });

  async function getArtistId(singerName) {
    let apiUrl = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(
      singerName
    )}&limit=1&fmt=json`;

    try {
      let response = await fetch(apiUrl, {
        headers: {
          "User-Agent": USER_AGENT,
        },
      });
      let data = await response.json();
      if (data.artists && data.artists.length > 0) {
        console.log(data.artists[0].id);
        return data.artists[0].id;
      } else {
        console.log("Artist not found.");
        showAlert("Oppsies, I don't think they're a real artist!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching artist data:", error);
      showAlert("Well then, something went wrong, try again later!");
      return null;
    }
  }

  async function getArtistName(singerName) {
    let apiUrl = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(
      singerName
    )}&limit=1&fmt=json`;

    try {
      let response = await fetch(apiUrl, {
        headers: {
          "User-Agent": USER_AGENT,
        },
      });
      let data = await response.json();
      if (data.artists && data.artists.length > 0) {
        console.log(data.artists[0].name);
        return data.artists[0].name;
      }
    } catch (error) {
      console.error("Error fetching artist data:", error);
      showAlert("Well then, something went wrong, try again later!");
      return null;
    }
  }

  async function getArtistReleases(artistId) {
    let allReleases = [];
    let apiUrl = `https://musicbrainz.org/ws/2/release?artist=${artistId}&offset=0&fmt=json`;

    try {
      let currentPage = 0;
      let totalReleases = 0; // To keep track of the total releases fetched

      while (true) {
        let response = await fetch(apiUrl, {
          headers: {
            "User-Agent": USER_AGENT,
          },
        });

        let data = await response.json();
        if (data.releases && data.releases.length > 0) {
          allReleases = allReleases.concat(data.releases);

          // Update pagination values
          totalReleases += data.releases.length;
          currentPage++;

          // Check if all releases have been fetched
          if (totalReleases >= data["release-count"]) {
            break;
          }

          // Update the API URL for the next page
          apiUrl = `https://musicbrainz.org/ws/2/release?artist=${artistId}&limit=100&offset=${
            currentPage * 100
          }&fmt=json`;
        } else {
          break; // No more releases to fetch
        }
      }

      // Group releases by title
      const groupedReleases = {};
      allReleases.forEach((release) => {
        if (!groupedReleases[release.title]) {
          groupedReleases[release.title] = release;
        }
      });

      // Convert the grouped object back to an array
      const uniqueReleases = Object.values(groupedReleases);

      return uniqueReleases;
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
