document.getElementById('join-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const room = document.getElementById('room').value;
    window.location.href = `/chat.html?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}`;
});
