const io = require("socket.io")(8900, {
  cors: {
    origin: "http://localhost:3000",
  },
});

let users = [];

function addOnlineUsers(userOnline, socketId) {
  const isHasUserId = users.filter(
    (user) => user.userId === userOnline.currentUserId
  );

  if (!isHasUserId.length) {
    users.push({
      userId: userOnline.currentUserId,
      userSocketId: socketId,
      userProfileIdVisited: userOnline.inOtherPersonProfilePageId,
    });
  }
}

function updateUsers(usersOnline, socketId) {
  const findSameId = users.find(
    (user) => user.userId === usersOnline.currentUserId
  );

  if (!findSameId) return;

  const index = users.indexOf(findSameId);

  if (index >= 0) {
    users[index] = {
      ...users[index],
      userSocketId: socketId,
      userProfileIdVisited: usersOnline.inOtherPersonProfilePageId,
    };
  }
}

function getReceiverSocketId(incomingMessageObj) {
  const userReceiverSocketId = users?.find(
    (user) => user.userId === incomingMessageObj.receiverId
  )?.userSocketId;
  return userReceiverSocketId;
}

function removeUser(userSocketId) {
  users = users.filter((user) => user.userSocketId !== userSocketId);
}

io.on("connection", (socket) => {
  socket.on("addOnlineUsers", (usersOnline) => {
    addOnlineUsers(usersOnline, socket.id);
    updateUsers(usersOnline, socket.id);
    io.emit("usersOnline", users);
  });

  socket.on("writingStatus", (writingStatusObj) => {
    const receiverSocketId = getReceiverSocketId(writingStatusObj);
    io.to(receiverSocketId).emit("getWrittingStatus", writingStatusObj.status);
  });

  socket.on("sendPrivateMessage", (messageObj) => {
    const receiverSocketId = getReceiverSocketId(messageObj);
    io.to(receiverSocketId).emit("incommingPrivateMessage", messageObj);
  });

  socket.on("sendNotif", (messageObj) => {
    const receiverSocketId = getReceiverSocketId(messageObj);
    io.to(receiverSocketId).emit("getNotifStatus", true);
  })

  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("usersOnline", users);
  });
});
