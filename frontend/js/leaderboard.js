document.addEventListener('DOMContentLoaded', function() {
  const leaderboardGrid = document.getElementById('leaderboard-grid');
  if (!leaderboardGrid) return;
  fetch('/api/leaderboard')
    .then(res => res.json())
    .then(data => {
      leaderboardGrid.innerHTML = data.leaderboard.map((student, i) => `
        <div class="leaderboard-card glass-card">
          <div class="leaderboard-rank">${i+1}</div>
          <div class="leaderboard-name">${student.name}</div>
          <div class="leaderboard-class">${student.class}</div>
          <div class="leaderboard-score">${student.score}</div>
        </div>
      `).join('');
    });
});
