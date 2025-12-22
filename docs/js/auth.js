// ==========================
// AUTH GUARD
// ==========================
function requireAuth() {
  const user = sessionStorage.getItem("currentUser");
  if (!user) window.location.replace("login.html");
}

// ==========================
// NAVBAR INJECTION
// ==========================
function loadNavbar() {
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!user) return;

  const navbar = document.createElement("nav");
  navbar.className = "navbar navbar-expand-lg navbar-dark bg-dark px-4";

  navbar.innerHTML = `
    <a class="navbar-brand fw-bold" href="search.html">🎵 MusicApp</a>

    <ul class="navbar-nav ms-3">
      <li class="nav-item">
        <a class="nav-link" href="search.html">Search</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="playlists.html">Playlists</a>
      </li>
    </ul>

    <div class="ms-auto d-flex align-items-center">
      <img
        src="${user.avatar}"
        alt="avatar"
        class="rounded-circle me-2"
        width="40"
        height="40"
        onerror="this.src='https://i.pravatar.cc/100?u=default';"
      />
      <span class="text-white me-3">${user.username}</span>
      <button class="btn btn-outline-light btn-sm" id="logoutBtn">Logout</button>
    </div>
  `;

  document.body.prepend(navbar);

  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("currentUser");
    window.location.replace("login.html");
  });
}

// ==========================
// NO BACK NAVIGATION
// ==========================
function blockBackNavigation() {
  history.pushState(null, "", location.href);
  window.onpopstate = () => history.pushState(null, "", location.href);
}
