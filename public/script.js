const ws = new WebSocket('ws://127.0.0.1:8080'); // Match server's port

ws.onopen = () => {
    if (window.location.hash)
    {
        codeid.value = window.location.hash.slice(1)
        codeidchange()
    }
};

// ANY MESSAGE FROM SOCKET
ws.onmessage = (event) => {
    const message = JSON.parse(event.data)
    switch (message.type) {

        case 'codechange':
            console.log(message.changedcode)
            code.value = message.changedcode
            document.getElementById("clientCount").innerText = message.nclients
            break;

        case 'issue':event
            break
        default:
            break;
    }
};

// ON ISSUE OR ANY OTHER THINGS
function codeidchange(){
    ws.send(JSON.stringify({
        type: "codeidchange",
        codeid: codeid.value,
        previous: previous_codeid
    }))
    previous_codeid = codeid.value
    window.location.hash = '#' + codeid.value
}

let previous_codeid = undefined

function codechange(){
    ws.send(JSON.stringify({
        type: "codechange",
        codeid: codeid.value,
        code: code.value,
    }))
}

function copytoclipboard()
{
    navigator.clipboard.writeText(window.location)
    copy_link.innerText = "copied"
    setTimeout(() => {
        copy_link.innerText = "copy link"
    }, 2000);
}