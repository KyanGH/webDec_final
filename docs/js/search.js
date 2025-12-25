const API_KEY = "AIzaSyDdUzLjJ0gLRaQw1qSPXub8IDXGABuVFDo";

const user = JSON.parse(sessionStorage.getItem("currentUser"));
document.getElementById("welcomeName").textContent = user.username;
document.getElementById("userAvatar").src = user.avatar;

const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");
const playerFrame = document.getElementById("playerFrame");

let selectedVideo = null;

/* ============================
   Playlist helpers
============================ */
function getUserPlaylists() {
  const playlistsData = JSON.parse(localStorage.getItem("playlists")) || {};
  const userPlaylists = playlistsData[user.username] || [];

  // Normalize old playlists
  userPlaylists.forEach(pl => {
    if (!Array.isArray(pl.videos)) {
      pl.videos = [];
    }
  });

  return userPlaylists;
}


function isVideoInPlaylist(videoId, playlist) {
  if (!playlist || !Array.isArray(playlist.videos)) {
    return false;
  }
  return playlist.videos.some(v => v.id?.videoId === videoId);
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
   QueryString sync
============================ */
const params = new URLSearchParams(window.location.search);
const initialQ = params.get("q");

if (initialQ) {
  searchInput.value = initialQ;
  search(initialQ);
}

document.getElementById("searchBtn").onclick = () => {
  const q = searchInput.value.trim();
  if (!q) return;

  history.replaceState(null, "", `?q=${encodeURIComponent(q)}`);
  search(q);
};

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

  if (!data.items || data.items.length === 0) {
    resultsDiv.innerHTML = `<div class="text-muted">No results found.</div>`;
    return;
  }

  data.items.forEach(item => {
    const videoId = item.id.videoId;
    const title = item.snippet.title;
    const existsSomewhere = isVideoInAnyPlaylist(videoId);

    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    col.innerHTML = `
      <div class="card h-100 shadow-sm border-0 position-relative">

        ${existsSomewhere ? `
          <span class="position-absolute top-0 end-0 m-2 text-success fs-4">✔</span>
        ` : ``}

        <img
          src="${item.snippet.thumbnails.high.url}"
          class="card-img-top"
          style="cursor:pointer"
          onclick="playVideo('${videoId}')"
          alt="thumbnail"
        />

        <div class="card-body d-flex flex-column">
          <h6 class="card-title text-truncate" title="${title}">
            ${title}
          </h6>

          <button
            class="btn btn-sm mt-auto ${
              existsSomewhere ? "btn-warning" : "btn-outline-primary"
            }"
            onclick='openPlaylistModal(${JSON.stringify(item)})'>
            ${existsSomewhere
              ? "➕ Add to another playlist"
              : "➕ Add to Playlist"}
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
   Playlist modal
============================ */
function openPlaylistModal(video) {
  selectedVideo = video;
  document.getElementById("modalVideoTitle").textContent =
    video.snippet.title;

  const playlists = getUserPlaylists();
  const select = document.getElementById("playlistSelect");
  select.innerHTML = "";

  playlists.forEach((pl, i) => {
    const existsHere = isVideoInPlaylist(video.id.videoId, pl);
    select.innerHTML += `
      <option value="${i}" ${existsHere ? "disabled" : ""}>
        ${pl.name}${existsHere ? " (Already)" : ""}
      </option>
    `;
  });

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
   Save to playlist (defensive)
============================ */
document.getElementById("saveToPlaylist").onclick = () => {
  const playlistsData = JSON.parse(localStorage.getItem("playlists")) || {};
  playlistsData[user.username] = playlistsData[user.username] || [];

  const newName = document.getElementById("newPlaylistName").value.trim();
  const index = document.getElementById("playlistSelect").value;

  let playlist;

  if (newName) {
    playlist = { name: newName, videos: [] };
    playlistsData[user.username].push(playlist);
  } else {
    playlist = playlistsData[user.username][index];
    if (!playlist) return;
  }

  // 🔒 Ensure videos array always exists
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