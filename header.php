<?php
// includes/header.php – Responsive navigation bar
?>
<header>
  <nav class="navbar" aria-label="Main navigation">
    <div class="nav-logo">
      <a href="index.php">Plot Twisters<span class="dot">!</span></a>
    </div>
    <ul class="nav-links">
      <li><a href="index.php" class="nav-item active">Home</a></li>
      <li><a href="chi-siamo.php" class="nav-item">Chi Siamo</a></li>
      <li><a href="lettura.php" class="nav-item">Letture</a></li>
      <li><a href="eventi.php" class="nav-item">Eventi</a></li>
      <li><a href="login.php" class="nav-item">Area Privata</a></li>
    </ul>
    <button class="theme-toggle" id="theme-toggle" aria-label="Cambia tema">🌙</button>
    <button class="menu-toggle" id="menu-toggle" aria-label="Apri menu" onclick="toggleSidebar(true)">☰</button>
  </nav>
</header>
