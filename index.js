const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

const codes = { }

function clearCode(codeid) {

    if (codes[codeid].clients.length == 0)
    {
        if (codes[codeid].code == '')
        {
            delete codes[codeid]
        }
        else
        {
            console.log(codeid + ': code not empty! settings timeout');
            codes[codeid].timeout = setTimeout(() => {
                if (codes[codeid].clients.length == 0)
                {
                    console.log(codeid + ': timeout hit code empty deleting...');
                    delete codes[codeid]
                }
            }, 1000 * 60 * 60 * 24)
        }
    }
    else
    {
        codes[codeid].clients.forEach(client => {
            client.send(JSON.stringify({
                type: 'codechange',
                changedcode: codes[codeid].code,
                nclients: codes[codeid].clients.length
            }))
        })
    }
}

server.on('connection', (self) => {

    self.on('message', data => {
        const message = JSON.parse(data.toString())

        switch (message.type) {
            case 'codeidchange':
                // IF THERE WAS PREVIOUS SESSION OF SELF
                if (message.previous)
                {
                    const index = codes[message.previous].clients.indexOf(self);
                    if (index > -1) {
                        codes[message.previous].clients.splice(index, 1);
                    }

                    clearCode(message.previous)
                }

                if (message.codeid == '')
                    break

                if (codes[message.codeid])
                {
                    if (codes[message.codeid].clients.length == 0)
                    {
                        console.log(message.codeid + ': client connected clearing timeout')
                        clearTimeout(codes[message.codeid].timeout)
                    }
                    codes[message.codeid].clients.push(self)
                    codes[message.codeid].clients.forEach(client => {
                        client.send(JSON.stringify({
                            type: 'codechange',
                            changedcode: codes[message.codeid].code,
                            nclients: codes[message.codeid].clients.length
                        }))
                    })
                }
                else
                {
                    codes[message.codeid] = {
                        clients: [self],
                        code: ''
                    }
                    codes[message.codeid].clients.forEach(client => {
                        client.send(JSON.stringify({
                            type: 'codechange',
                            changedcode: codes[message.codeid].code,
                            nclients: codes[message.codeid].clients.length
                        }))
                    })
                }
                
                self.codeid = message.codeid;
                break
            case 'codechange':
                if (message.codeid == '')
                    break

                codes[message.codeid].code = message.code
                codes[message.codeid].clients.forEach(client => {
                    if (client != self)
                    {
                        client.send(JSON.stringify({
                            type: 'codechange',
                            changedcode: codes[message.codeid].code,
                            nclients: codes[message.codeid].clients.length
                        }))
                    }
                })
                break
            case 'text':
                server.clients.forEach(other => {
                    if (
                        other.readyState === WebSocket.OPEN &&
                        other != self
                    ) {
                        other.send(JSON.stringify({
                            type: 'textchange',
                            text: message.text
                        }))
                    }
                })
                break;

            default:
                break;
        }
    })

    self.on('close',() => {
        if (codes[self.codeid])
        {
            const index = codes[self.codeid].clients.indexOf(self);
            if (index > -1) {
                codes[self.codeid].clients.splice(index, 1);
            }
            clearCode(self.codeid)
        }
    })

    // Broadcast the current client count to all connected clients
    server.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(
                {
                    type: 'connection',
                    size: server.clients.size
                }
            ));
        }
    });
});
