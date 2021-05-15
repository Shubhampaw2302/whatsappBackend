// Importing
import Messages from './dbMessages.js';
import express from "express";
import mongoose from "mongoose";
import Pusher from 'pusher';
import cors from 'cors';                      // Visit https://www.keycdn.com/support/cors for more info.

// app config

const app = express();

const pusher = new Pusher({
    appId: "1202183",
    key: "6f7a2599d007bdb6be7b",
    secret: "50902350a626aa2a9048",
    cluster: "ap2",
    useTLS: true
  });

// middleware
app.use(express.json());
app.use(cors());                  // Cors (Cross-Origin Resource Sharing) is used for safe & efficient communication between two different domains.

// DB config

const connection_url = 'mongodb+srv://admin:Ni5xSbTYt3Sj4DP@cluster0.igh6z.mongodb.net/whatsappdb?retryWrites=true&w=majority';


mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})//.then(() => console.log('DB connected')).catch(err => console.log(err));

const db = mongoose.connection;
db.once("open", () => {
    console.log("DB connected")

    const msgCollection = db.collection("messagecontents");      // The messagecontent refers to the mongoose.model being exported from dbMessages.js
    const changeStream = msgCollection.watch();                  // Watch for the changes happening in the msgcollection
    // console.log(msgCollection);

    changeStream.on('change', (change) => {                      // The change is in json format.
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;         // The change is stored in the messageDetails
            pusher.trigger('messages', 'inserted', 
            {
                name: messageDetails.user,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        } else {
            console.log('Error triggering pusher')
        }
    });
});




// ??????

// API routes

// app.get('/', (res, req) => res.status(200).send('Hello World'))
app.get('/', (req, res) => res.send('Hello World'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.send(err)
        } else {
            res.send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body                          // The message

    Messages.create(dbMessage, (err, data) => {         // The dbMessage will be stored in Messages 
        if (err) {
            res.send(err)
        } else {
            res.send(data)
        }
    })
})

// Listen

app.listen(9000, function() {
    console.log("Server has started at port 9000")
})









// MongoDB project password => Ni5xSbTYt3Sj4DP




// What is Pusher?
// Pusher acts as a mediator in between the front End and BackEnd. When we send a message, that message is stored in the database, and 
// immediately the backend informs pusher, that a message has arrived. What pusher does is it updates the front end with that message.
// Like we get to see our sent messages with greenish background in whatsapp. In similar way, when a message is received, the backend
// tells pusher about it and pusher immediately updates the front end look with the received msg in white background.
//                                   FrontEnd <=> Pusher <=> BackEnd