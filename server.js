const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUser,
} = require("./utils/users.js");

//set static folder
app.use(express.static(path.join(__dirname, "front-end")));

const adminName = "Chat App";

//run when client connect
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);
    //welcome current user
    socket.emit("message", formatMessage(adminName, "welcome to chatapp"));

    //Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(adminName, `${user.username} has joined the chat`)
      );

    //send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUser(user.room),
    });
  });

  //listen  for chatmessages
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  //Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(adminName, `${user.username} has left the chat`)
      );

      //send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUser(user.room),
      });
    }
  });
});

const PORT =  process.env.PORT||3000;
server.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
