document.addEventListener("DOMContentLoaded", () => {

  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  const playlistsData = JSON.parse(localStorage.getItem("playlists")) || {};
  let playlists = playlistsData[user.username] || [];

  let currentIndex = null;
  let playQueue = [];
  let currentPlayIndex = 0;

  let ytPlayer = null;
  let pendingVideoId = null;

  const playAllBtn = document.getElementById("playAllBtn");

  /* ======================
     Load playlists
  ====================== */
  function loadPlaylists() {
    const list = document.getElementById("playlistList");
    list.innerHTML = "";
    playAllBtn.classList.add("d-none");

    playlists.forEach((pl, i) => {
      const li = document.createElement("li");
      li.className = "list-group-item playlist-item";
      li.textContent = pl.name;
      li.onclick = () => selectPlaylist(i);
      list.appendChild(li);
    });

    if (playlists.length > 0) selectPlaylist(0);
  }

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

  function renderSongs(filter = "") {
    const container = document.getElementById("songs");
    container.innerHTML = "";

    const videos = playlists[currentIndex]?.videos || [];

    videos
      .filter(v => v.snippet.title.toLowerCase().includes(filter))
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
            </strong>
          </div>
          <button class="btn btn-sm btn-outline-danger"
            onclick="deleteSong(${i})">
            Delete
          </button>
        `;

        container.appendChild(div);
      });
  }

  function playVideoById(videoId) {
    pendingVideoId = videoId;

    if (ytPlayer) {
      ytPlayer.loadVideoById(videoId);
    }

    bootstrap.Modal
      .getOrCreateInstance(document.getElementById("playerModal"))
      .show();
  }

  function playNext() {
    currentPlayIndex++;
    if (currentPlayIndex >= playQueue.length) return;
    playVideoById(playQueue[currentPlayIndex]);
  }

  window.playSingle = function (videoId) {
    playQueue = [];
    currentPlayIndex = 0;
    playVideoById(videoId);
  };

  playAllBtn.onclick = () => {
    if (currentIndex === null) return;

    const videos = playlists[currentIndex].videos || [];
    if (!videos.length) return;

    playQueue = videos.map(v => v.id.videoId);
    currentPlayIndex = 0;
    playVideoById(playQueue[0]);
  };

  /* ======================
     YouTube API
  ====================== */
  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player("playerFrame", {
      height: "500",
      width: "100%",
      playerVars: { autoplay: 1, rel: 0 },
      events: {
        onReady: () => {
          if (pendingVideoId) {
            ytPlayer.loadVideoById(pendingVideoId);
          }
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.ENDED) {
            playNext();
          }
        }
      }
    });
  };

  document
    .getElementById("playerModal")
    .addEventListener("hidden.bs.modal", () => {
      if (ytPlayer) ytPlayer.stopVideo();
      playQueue = [];
      currentPlayIndex = 0;
      pendingVideoId = null;
    });

  function save() {
    playlistsData[user.username] = playlists;
    localStorage.setItem("playlists", JSON.stringify(playlistsData));
  }

  loadPlaylists();
});
