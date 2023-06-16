import express from 'express';
import cors from 'cors';
import http from 'http';
import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import bodyParser from 'body-parser';
import { MemoryDatastore } from 'datastore-core'
import { MemoryBlockstore } from 'blockstore-core'
import { createLibp2p } from 'libp2p'
import { identifyService } from 'libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { bootstrap } from '@libp2p/bootstrap'

const app = express();
const server = http.Server(app);
const HOSTNAME = '0.0.0.0';
const PORT = 80;
// start ipfs node
const datastore = new MemoryDatastore()

const helia = await createHelia({
    blockstore: new MemoryBlockstore(),
    datastore: new MemoryDatastore()
})

const fs = unixfs(helia);
const encoder = new TextEncoder();
const decoder = new TextDecoder();


const libp2p = await createLibp2p({
  datastore,
  transports: [
    webSockets()
  ],
  connectionEncryption: [
    noise()
  ],
  streamMuxers: [
    yamux()
  ],
  peerDiscovery: [
    bootstrap({
      list: [
        "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
        "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
        "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
        "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt"
      ]
    })
  ],
  services: {
    identify: identifyService()
  }
})

app.use(cors());
app.use(bodyParser.json({ limit: '25mb' }));
server.listen(PORT, HOSTNAME, () => {
    console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});

app.post('/files', async (req, res) => {
    console.log(req.body)
    try {
        const cid = await fs.addBytes(encoder.encode(JSON.stringify(req.body)));
        res.status(201);
        res.json({ cid: cid.toString() });
        res.end();
    } catch (error) {
        res.status(500);
        res.end();
    }

});

app.get('/files/:cid', async (req, res) => {
    // console.log(data);
    let text = "";
    try {
        for await (const chunk of fs.cat(req.params.cid)) {
            text += decoder.decode(chunk, {
                stream: true
            })
        }
        text += decoder.decode();
        res.status(200);
        res.json(JSON.parse(text));
        res.end();
    } catch (error) {
        res.status(404);
        res.end();
    }

})