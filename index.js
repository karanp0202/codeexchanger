const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

const codes = {
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

                    if (codes[message.previous].clients.length == 0)
                        delete codes[message.previous]
                }

                if (message.codeid == '')
                    break

                if (codes[message.codeid])
                {
                    self.send(JSON.stringify({
                        type: 'codechange',
                        changedcode: codes[message.codeid].code
                    }))
                    codes[message.codeid].clients.push(self)
                }
                else
                {
                    codes[message.codeid] = {
                        clients: [self],
                        code: ''
                    }
                    self.send(JSON.stringify({
                        type: 'codechange',
                        changedcode: codes[message.codeid].code
                    }))
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
                            changedcode: codes[message.codeid].code
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
        delete codes[self.codeid]
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
