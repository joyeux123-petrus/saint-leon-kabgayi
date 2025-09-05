// Mobile menu toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuButton.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
});

// Hero video carousel
const videoFiles = [
  'images/0.mp4',
  'images/1.mp4',
  'images/2.mp4',
  'images/3.mp4',
  'images/4.mp4'
];
let currentVideo = 0;
const heroVideo = document.getElementById('heroVideo');

function playNextVideo() {
  if (heroVideo) {
    heroVideo.src = videoFiles[currentVideo];
    heroVideo.load();
    const playPromise = heroVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was prevented.
        // We can try to play again after a user interaction.
      });
    }
    currentVideo = (currentVideo + 1) % videoFiles.length;
  }
}

if (heroVideo) {
  heroVideo.addEventListener('ended', playNextVideo);
  // Start with the first video
  playNextVideo();

  // Try to force autoplay on mobile after user gesture
  document.body.addEventListener('touchstart', () => {
    if (!heroVideo.playing) {
      heroVideo.play();
    }
  }, { once: true });
}