document.addEventListener("DOMContentLoaded", () => {

  /* ======================
     Globals & State
  ====================== */
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  const playlistsData = JSON.parse(localStorage.getItem("playlists")) || {};
  let playlists = playlistsData[user.username] || [];

  let currentIndex = null;
  let playQueue = [];
  let currentPlayIndex = 0;

  const playerFrame = document.getElementById("playerFrame");
  const playAllBtn = document.getElementById("sidebarPlayAllBtn");

  /* ======================
     Load playlists
  ====================== */
  function loadPlaylists() {
    const list = document.getElementById("playlistList");
    list.innerHTML = "";

    // Hide Play All until playlist is selected
    playAllBtn.classList.add("d-none");

    playlists.forEach((pl, i) => {
      const li = document.createElement("li");
      li.className = "list-group-item playlist-item";
      li.textContent = pl.name;
      li.onclick = () => selectPlaylist(i);
      list.appendChild(li);
    });

    if (playlists.length > 0) {
      selectPlaylist(0);
    }
  }

  /* ======================
     Select playlist
  ====================== */
  function selectPlaylist(index) {
    currentIndex = index;

    document.querySelectorAll(".playlist-item").forEach((el, i) =>
      el.classList.toggle("active", i === index)
    );

    document.getElementById("playlistTitle").textContent =
      playlists[index].name;

    document.getElementById("controls").classList.remove("d-none");
    playAllBtn.classList.remove("d-none");

    renderSongs();
  }

  /* ======================
     Render songs
  ====================== */
  function renderSongs(filter = "") {
    const container = document.getElementById("songs");
    container.innerHTML = "";

    const videos = playlists[currentIndex]?.videos || [];

    videos
      .filter(v =>
        v.snippet.title.toLowerCase().includes(filter)
      )
      .forEach((video, i) => {
        video.rating = video.rating || 0;

        const div = document.createElement("div");
        div.className =
          "list-group-item d-flex justify-content-between align-items-center song-card";

        div.innerHTML = `
          <div>
            <strong style="cursor:pointer"
                    onclick="playSingle('${video.id.videoId}')">
              ▶ ${video.snippet.title}
            </strong><br>

            Rating:
            ${[1,2,3,4,5].map(n =>
              `<span style="cursor:pointer"
                     onclick="rateSong(${i},${n})">
                ${n <= video.rating ? "⭐" : "☆"}
              </span>`
            ).join("")}
          </div>

          <button class="btn btn-sm btn-outline-danger"
                  onclick="deleteSong(${i})">
            Delete
          </button>
        `;

        container.appendChild(div);
      });
  }

  /* ======================
     Play single
  ====================== */
  window.playSingle = function (videoId) {
    playQueue = [];

    playerFrame.src =
      `https://www.youtube.com/embed/${videoId}?autoplay=1`;

    bootstrap.Modal
      .getOrCreateInstance(document.getElementById("playerModal"))
      .show();
  };

  /* ======================
     Play all (sidebar)
  ====================== */
  playAllBtn.onclick = () => {
    if (currentIndex === null) return;

    const videos = playlists[currentIndex].videos || [];
    if (videos.length === 0) return;

    playQueue = videos.map(v => v.id.videoId);
    currentPlayIndex = 0;
    playNext();
  };

  function playNext() {
    if (currentPlayIndex >= playQueue.length) return;

    playerFrame.src =
      `https://www.youtube.com/embed/${playQueue[currentPlayIndex]}?autoplay=1`;

    currentPlayIndex++;

    bootstrap.Modal
      .getOrCreateInstance(document.getElementById("playerModal"))
      .show();
  }

  /* ======================
     Stop player on close
  ====================== */
  document
    .getElementById("playerModal")
    .addEventListener("hidden.bs.modal", () => {
      playerFrame.src = "";
      playQueue = [];
    });

  /* ======================
     Search inside playlist
  ====================== */
  document.getElementById("songSearch").oninput = e =>
    renderSongs(e.target.value.toLowerCase());

  /* ======================
     Sort
  ====================== */
  window.sortSongs = function (type) {
    const videos = playlists[currentIndex].videos;

    if (type === "alpha") {
      videos.sort((a, b) =>
        a.snippet.title.localeCompare(b.snippet.title)
      );
    } else {
      videos.sort((a, b) =>
        (b.rating || 0) - (a.rating || 0)
      );
    }

    save();
    renderSongs();
  };

  /* ======================
     Rate song
  ====================== */
  window.rateSong = function (i, rating) {
    playlists[currentIndex].videos[i].rating = rating;
    save();
    renderSongs();
  };

  /* ======================
     Delete song
  ====================== */
  window.deleteSong = function (i) {
    playlists[currentIndex].videos.splice(i, 1);
    save();
    renderSongs();
  };

  /* ======================
     Create playlist
  ====================== */
  window.createPlaylist = function () {
    const name = document.getElementById("newPlaylistName").value.trim();
    if (!name) return;

    playlists.push({ name, videos: [] });
    save();
    loadPlaylists();
  };

  /* ======================
     Delete playlist
  ====================== */
  document.getElementById("deletePlaylistBtn").onclick = () => {
    if (currentIndex === null) return;

    playlists.splice(currentIndex, 1);
    save();
    location.reload();
  };

  /* ======================
     Save
  ====================== */
  function save() {
    playlistsData[user.username] = playlists;
    localStorage.setItem("playlists", JSON.stringify(playlistsData));
  }

  /* ======================
     Init
  ====================== */
  loadPlaylists();

});
