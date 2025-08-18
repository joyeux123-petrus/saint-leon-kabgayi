document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    var currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'index.html') {
      window.location.href = 'index1.html';
    } else if (currentPage === 'index1.html') {
      window.location.href = 'index.html';
    }
  }, 10000); // 10000 milliseconds = 10 seconds
});