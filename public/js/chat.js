const socket = io()

// if you check the html file, you will see that it has some cdn scripts imported. This is a method to import libraries since chromeV8
// does not support 'require()'. So this is a method to make libraries accessible to the js file without using require.

const $messageForm = document.querySelector('#chatwindow')
const $messageFormInput = document.querySelector('#usertext')
const $messageFormButton = document.querySelector('#submit')
const $locationShareButton = document.querySelector('#locshare')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('.chat__sidebar')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix:true})        // location.search contains the http query
console.log(username, room)
/* this was just for learning purpose, feel free to uncomment it if you don't understand

socket.on('countUpdated', (count)=>{                     // this name of task should match on the server-side
    console.log('The count has been updated: ', count)
})

document.querySelector('#increment').addEventListener('click', ()=>{
    console.log('Clicked')
    socket.emit('increment')
})

*/

socket.on('message', (obj)=>{
    console.log(obj)
})

socket.on('welcome', ()=>{
    console.log('Welcome to the server')
})


$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')
    const text = $messageFormInput.value
    socket.emit('sendtext', text, (haserror)=>{           // the third argument is the acknowledgement, showing that the 'receiver' has received
        $messageFormButton.removeAttribute('disabled')    // the request. (receiver can be both client or server)
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(haserror){                                     
            return console.error(haserror)
        }

        console.log('--This message was delivered--')
    })
})

const autoscroll = ()=>{
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('displaytext', (message)=>{
    const html = Mustache.render(messageTemplate, {
        message: message.text,                          // check the id that is linked to messageTemplate, mustache renders the script inside
        createdAt: moment(message.createdAt).format('hh:mm a'),  // but for temporary period, it is stored inside the 'html' variable
        username: message.username
    })                                                  
    $messages.insertAdjacentHTML('beforeend',html)      // here we render the html block inside the div with id ='messages'
    autoscroll()
})

socket.on('displayloc', (message)=>{
    const html = Mustache.render(locationTemplate, {    // the double curly braces {{}} allows us to put a variable inside to dynamically
        url: message.url,                               // insert text inside it
        createdAt: moment(message.createdAt).format('hh:mm a'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room, users
    })
    $sidebar.innerHTML = html
})

$locationShareButton.addEventListener('click', (e)=>{
    e.preventDefault()
    
    $locationShareButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation)
        return alert('Geolocation not supported by this browser')
    navigator.geolocation.getCurrentPosition((position)=>{
    const {latitude, longitude} = position.coords
    socket.emit('sendLocation', latitude, longitude, (text)=>{
        $locationShareButton.removeAttribute('disabled')
        $messageFormInput.focus()
        console.log(text)
    })
    })
    
})

socket.emit('join', {username, room}, (error)=>{
    if (error) {
        alert(error)
        location.href = '/'  // this forces user to go back once they close the alert box
    }
})
