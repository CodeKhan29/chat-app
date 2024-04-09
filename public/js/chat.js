const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const messageTemplateURL = document.querySelector('#message-template-url').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room}=Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    //New message element
    const $newMessage=$messages.lastElementChild
    
    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight
    
    //Height of messages container
    const containerHeight = $messages.scrollHeight
    
    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight-newMessageHeight <=scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (msg)=> {
    console.log(msg)
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (locmsg) => {
    const html= Mustache.render(messageTemplateURL, {
       username: locmsg.username,
        locmsg: locmsg.url,
       createdAt: moment(locmsg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
        e.preventDefault()

        $messageFormButton.setAttribute('disabled', 'disabled')
        //disable

        const message = e.target.elements.message.value

        socket.emit('sendMessage', message, (error) => {
         //enable
            $messageFormButton.removeAttribute('disabled')
            $messageFormInput.value=''
            $messageFormInput.focus()

            if(error){
                return console.log(error)
            } 
               
            console.log('Message delivered.')
        })
    })

$sendLocationButton.addEventListener('click', () => {
    $sendLocationButton.setAttribute('disabled','disabled')

    if(!navigator.geolocation) {
        return alert('Geolocation not supported!')
    }

    navigator.geolocation.getCurrentPosition((position)=> {
        socket.emit('sendLocation', {latitude: position.coords.latitude, longitude: position.coords.longitude}, () => {
            console.log('Location shared')
            $sendLocationButton.removeAttribute('disabled')
        } )
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        location.href ='/'
    }
})