const API_KEY = "AIzaSyDdUzLjJ0gLRaQw1qSPXub8IDXGABuVFDo";

/* ============================
   Auth & user
============================ */
const user = JSON.parse(sessionStorage.getItem("currentUser"));
document.getElementById("welcomeName").textContent = user.username;
document.getElementById("userAvatar").src = user.avatar;

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const playerFrame = document.getElementById("playerFrame");

let selectedVideo = null;

/* ============================
   Playlist helpers
============================ */
function getUserPlaylists() {
  const playlistsData = JSON.parse(localStorage.getItem("playlists")) || {};
  const userPlaylists = playlistsData[user.username] || [];

  userPlaylists.forEach(pl => {
    if (!Array.isArray(pl.videos)) pl.videos = [];
  });

  return userPlaylists;
}

function isVideoInPlaylist(videoId, playlist) {
  return playlist?.videos?.some(v => v.id?.videoId === videoId);
}

function isVideoInAnyPlaylist(videoId) {
  return getUserPlaylists().some(pl =>
    isVideoInPlaylist(videoId, pl)
  );
}

/* ============================
   Stop video on modal close
============================ */
document
  .getElementById("playerModal")
  .addEventListener("hidden.bs.modal", () => {
    playerFrame.src = "";
  });

/* ============================
   Search trigger (button + Enter)
============================ */
function performSearch() {
  const q = searchInput.value.trim();
  if (!q) return;

  history.replaceState(null, "", `?q=${encodeURIComponent(q)}`);
  search(q);
}

searchBtn.addEventListener("click", performSearch);

searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    performSearch();
  }
});

/* ============================
   Query string restore
============================ */
const params = new URLSearchParams(window.location.search);
const initialQ = params.get("q");
if (initialQ) {
  searchInput.value = initialQ;
  search(initialQ);
}

/* ============================
   Search
============================ */
async function search(q) {
  resultsDiv.innerHTML = `<div class="text-muted">Loading…</div>`;

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
      q
    )}&maxResults=9&key=${API_KEY}`
  );

  const data = await res.json();
  resultsDiv.innerHTML = "";

  if (!data.items?.length) {
    resultsDiv.innerHTML = `<div class="text-muted">No results found.</div>`;
    return;
  }

  data.items.forEach(item => {
    const videoId = item.id.videoId;
    const exists = isVideoInAnyPlaylist(videoId);

    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    col.innerHTML = `
      <div class="card h-100 shadow-sm border-0 position-relative">
        ${
          exists
            ? `<span class="position-absolute top-0 end-0 m-2 text-success fs-4">✔</span>`
            : ""
        }

        <img
          src="${item.snippet.thumbnails.high.url}"
          class="card-img-top"
          style="cursor:pointer"
          onclick="playVideo('${videoId}')"
        />

        <div class="card-body d-flex flex-column">
          <h6 class="card-title text-truncate" title="${item.snippet.title}">
            ${item.snippet.title}
          </h6>

          <button
            class="btn btn-sm mt-auto ${
              exists ? "btn-warning" : "btn-outline-primary"
            }"
            onclick='openPlaylistModal(${JSON.stringify(item)})'>
            ➕ Add to Playlist
          </button>
        </div>
      </div>
    `;

    resultsDiv.appendChild(col);
  });
}

/* ============================
   Player
============================ */
function playVideo(videoId) {
  playerFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("playerModal")
  ).show();
}

/* ============================
   Playlist modal logic
============================ */
const playlistSelect = document.getElementById("playlistSelect");
const newPlaylistName = document.getElementById("newPlaylistName");
const modeExisting = document.getElementById("modeExisting");
const modeNew = document.getElementById("modeNew");

modeExisting.addEventListener("change", () => {
  playlistSelect.disabled = false;
  newPlaylistName.disabled = true;
  newPlaylistName.value = "";
});

modeNew.addEventListener("change", () => {
  playlistSelect.disabled = true;
  playlistSelect.value = "";
  newPlaylistName.disabled = false;
  newPlaylistName.focus();
});

function openPlaylistModal(video) {
  selectedVideo = video;
  document.getElementById("modalVideoTitle").textContent =
    video.snippet.title;

  playlistSelect.innerHTML = "";
  getUserPlaylists().forEach((pl, i) => {
    const exists = isVideoInPlaylist(video.id.videoId, pl);
    playlistSelect.innerHTML += `
      <option value="${i}" ${exists ? "disabled" : ""}>
        ${pl.name}${exists ? " (Already)" : ""}
      </option>
    `;
  });

  modeExisting.checked = true;
  modeExisting.dispatchEvent(new Event("change"));

  document
    .getElementById("alreadyExistsMsg")
    .classList.toggle(
      "d-none",
      !isVideoInAnyPlaylist(video.id.videoId)
    );

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("playlistModal")
  ).show();
}

/* ============================
   Save to playlist
============================ */
document.getElementById("saveToPlaylist").onclick = () => {
  const playlistsData = JSON.parse(localStorage.getItem("playlists")) || {};
  playlistsData[user.username] = playlistsData[user.username] || [];

  let playlist;

  if (modeNew.checked) {
    const name = newPlaylistName.value.trim();
    if (!name) {
      alert("Please enter a playlist name.");
      return;
    }
    playlist = { name, videos: [] };
    playlistsData[user.username].push(playlist);
  } else {
    const index = playlistSelect.value;
    playlist = playlistsData[user.username][index];
    if (!playlist) return;
  }

  playlist.videos = playlist.videos || [];

  if (
    playlist.videos.some(
      v => v.id?.videoId === selectedVideo.id.videoId
    )
  ) {
    alert("This song already exists in this playlist.");
    return;
  }

  playlist.videos.push(selectedVideo);
  localStorage.setItem("playlists", JSON.stringify(playlistsData));

  bootstrap.Toast.getOrCreateInstance(
    document.getElementById("saveToast")
  ).show();
};
