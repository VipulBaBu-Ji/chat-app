const socket = io();

let username = "";

while (!username) {
    username = prompt("Enter your username:");
}

socket.emit("join", username);

const msgInput = document.getElementById("msg");
const messages = document.getElementById("messages");

function send() {
    let msg = msgInput.value.trim();
    if (!msg) return;

    if (msg.startsWith("/msg")) {
        let parts = msg.split(" ");
        let to = parts[1];
        let text = parts.slice(2).join(" ");
        socket.emit("privateMessage", { to, msg: text });
    } else {
        socket.emit("chatMessage", msg);
    }

    addMessage("You: " + msg, "me");
    msgInput.value = "";
}

socket.on("message", (data) => {
    addMessage(`[${data.time}] ${data.user}: ${data.text}`, "other");
});

socket.on("privateMessage", (data) => {
    addMessage(`🔒 ${data.from}: ${data.text}`, "private");
});

socket.on("users", (users) => {
    let list = document.getElementById("users");
    list.innerHTML = "";

    users.forEach(u => {
        let li = document.createElement("li");
        li.innerText = u;
        list.appendChild(li);
    });
});

msgInput.addEventListener("input", () => {
    socket.emit("typing");
});

socket.on("typing", (user) => {
    document.getElementById("typing").innerText = `${user} is typing...`;

    setTimeout(() => {
        document.getElementById("typing").innerText = "";
    }, 1000);
});

function addMessage(text, type) {
    let div = document.createElement("div");
    div.classList.add("msg", type);
    div.innerText = text;

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}