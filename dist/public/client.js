const socket = io();
const params = new URLSearchParams(window.location.search);
const username = params.get('username');
const room = params.get('room');

const form = document.getElementById('chat-form');
const input = document.getElementById('message');
const chatBox = document.getElementById('chat-box');
const typingNotice = document.getElementById('typing');
const userCount = document.getElementById('user-count');

let typingTimeout;

socket.emit('joinRoom', { username, room });

form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value.trim()) {
        socket.emit('chat message', input.value);
        input.value = '';
        socket.emit('stop typing');
    }
});

input.addEventListener('input', () => {
    socket.emit('typing');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('stop typing'), 1000);
});

// Getting Number of user
socket.on('userCount', (count) => {
    document.getElementById('user-count').textContent = `${count}`;
});

// List of users
socket.on('userList', (users) => {
    const userListDiv = document.getElementById('user-list');
    userListDiv.innerHTML = 'Users: ' + users.join(', ');
});


// Receive previous chat history
socket.on('chatHistory', (messages) => {
    chatBox.innerHTML = '';
    messages.forEach(({ user, text }) => {
        appendMessage(user, text);
    });
});

// Real-time chat
socket.on('chat message', ({ user, text }) => {
    appendMessage(user, text);
});

function appendMessage(user, text) {
    const msgDiv = document.createElement('div');
    const isSelf = user === username;

    msgDiv.classList.add('msg', isSelf ? 'right-msg' : 'left-msg');
    msgDiv.innerHTML = `
        <div class="msg-img" style="background-image: url(${isSelf ?
            'https://image.flaticon.com/icons/svg/145/145867.svg' :
            'https://image.flaticon.com/icons/svg/327/327779.svg'})">
        </div>

        <div class="msg-bubble">
            <div class="msg-info">
                <div class="msg-info-name">${user}</div>
                <div class="msg-info-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>

            <div class="msg-text">${text}</div>
        </div>
    `;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Typing indication
socket.on('typing', (user) => {
    typingNotice.textContent = `${user} is typing...`;
});

socket.on('stop typing', () => {
    typingNotice.textContent = '';
});
