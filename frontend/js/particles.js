// Simple animated particles background
const container = document.getElementById('particles-container');
if (container) {
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.position = 'absolute';
    p.style.left = Math.random() * window.innerWidth + 'px';
    p.style.top = Math.random() * window.innerHeight + 'px';
    p.style.width = p.style.height = (Math.random() * 4 + 2) + 'px';
    p.style.background = '#38bdf8';
    p.style.borderRadius = '50%';
    p.style.opacity = 0.4;
    container.appendChild(p);
  }
}
