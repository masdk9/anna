document.querySelectorAll('.bi-heart').forEach(icon => {
  icon.addEventListener('click', () => {
    icon.classList.toggle('active');
  });
});

function openMenu() {
  document.getElementById("sideMenu").classList.add("open");
}

function closeMenu() {
  document.getElementById("sideMenu").classList.remove("open");
}


function openNav() {
  document.getElementById("mySidenav").style.width = "280px"; // Drawer open
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";    // Drawer close
}


