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