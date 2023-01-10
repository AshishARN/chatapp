const path = require('path')
const { copyFileSync } = require('fs')
const publicDirectoryPath = path.join(__dirname, '../public')

const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
const port = process.env.port || 3000


app.use(express.static(publicDirectoryPath)) // to link the html file

//let count = 0


// 'io' represents the entire connection establishment 
// whereas 'socket' represents the connection between a particular client and the server
io.on('connection', (socket)=>{                   // triggers when a client is connected
    console.log('New WebSocket Connection')

    /* this was just for learning purpose, feel free to uncomment it if you don't understand
    socket.emit('countUpdated', count)                 // this name of task should match on the client-side
    socket.on('increment', ()=>{                     // this name of task should match on the server-side
        count++
        // socket.emit('countUpdated', count)       // only emits i.e. displays for the user who pressed the button
        io.emit('countUpdated', count)              // this one emits to every client i.e. connection
    })
    */
    //socket.emit('displaytext', generateMessage('--Welcome--'))    --added this statement in the 'join' block, since we now have rooms
    //socket.broadcast.emit('displaytext', generateMessage('--A new user has joined, everybody say \'Hi!\'--'))     //emit to every socket excluding the one connected

    socket.on('join', ({username, room}, callback)=>{

        const {error, user} = addUser({id: socket.id, username, room})  // socket.id is predefined by the socket when a new user joins, and it points to the user itself
        if (error)
            return callback(error)
        socket.join(user.room)              // socket.join is predefined and allocates the mentioned room name to all the sockets that join

        socket.emit('displaytext', generateMessage('--Welcome--'))
        socket.broadcast.to(user.room).emit('displaytext', generateMessage('--ADMIN--', `${user.username} has joined, everybody say \'Hi!\'`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    // io.emit :: io.to.emit
    // socket.broadcast.emit :: socket.braodcast.to.emit
    // these two statements on the right will work the same as the once of left, however it will be limited to the room name mentioned
    //                                                                                                                  in the argument

    socket.on('sendtext', (text, callback)=>{             //socket.on waits for its execution, hence it triggers for every user
        const user = getUser(socket.id)

        const filter = new Filter()
        if (filter.isProfane(text))
            return callback('Profanity is not allowed')
        io.to(user.room).emit('displaytext', generateMessage(user.username, text))                      //callback is the acknowledgement part, discussed in chat.js file
        //callback('checking callback return statement')
        callback()
    })

    socket.on('sendLocation', (latitude, longitude, callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('displayloc', generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`))
        callback('--Location shared--')
    })

    socket.on('disconnect', ()=>{                   // 'disconnect' is predefined, and is connected to every user other than the one disconnected
        const user = removeUser(socket.id)          // as mentioned earlier socket.id is predefined by the socket when a new user joins
        if(user){
            io.to(user.room).emit('displaytext', generateMessage('--ADMIN--', `${user.username} has disconnected :(`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})



server.listen(port, ()=>{
    console.log('Server is up')
})