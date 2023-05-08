var express = require("express");
const MongoClient = require('mongodb').MongoClient;
const WebSocket = require('ws');
const path = require('path');

const uri = 'mongodb://130.192.137.1/TemperatureDB';

const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
    ws.send('something');
});

var app = express();
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
app.use(
    express.urlencoded({
        extended: true
    })
)
app.use(express.json());
app.post("/temperature", (req, res, next) => {
    var temperature = req.body.temperature;
    var timestamp = req.body.timestamp;
    var sensor = req.body.sensor;
    const client = new MongoClient(uri, { useUnifiedTopology: true });

    async function run() {
        try {

            await client.connect();

            const database = client.db("TemperatureDB");
            const temperatureColl = database.collection("temperature");
            // create a document to be inserted
            const doc = {
                value: temperature,
                timestamp: timestamp,
                sensorId: sensor,
                roomId: 'room1'
            };
            const result = await temperatureColl.insertOne(doc);
            console.log(
                `Document inserted with the _id: ${result.insertedId}`,
            );

        } finally {
            await client.close();
        }

    }

    run().catch(console.dir);
    async function pushToClient(){
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(temperature);
            }
        });
    }
    pushToClient().catch(console.dir);
    res.sendStatus(200);
});


app.get('/dashboard', async (req, res) => {
    /*
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    async function run() {
        try {
            await client.connect();
            const database = client.db("TemperatureDB");
            const tem = database.collection("temperature");
            // Query for a temperature with a timestamp that is greater than 0
            const query = { timestamp: {$gt: 0}};
            const options = {
                // sort matched documents in descending order by timestamp
                sort: { timestamp: -1 },
            };
            const singleTemperature = await tem.findOne(query, options);
            // since this method returns the matched document, not a cursor, print it directly
            console.log(singleTemperature);
            try {
                return singleTemperature.value;
            }
            catch (e)
            {
                return -1;
            }
        } finally {
            await client.close();
        }
    }
    var finalTemp = await run().catch(console.dir);
    console.log(finalTemp);
    res.send('Hello World! The last temperature is: '+finalTemp);
     */
    res.sendFile(path.join(__dirname + '/index.html'));
})