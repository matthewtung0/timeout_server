const express = require('express')
const cors = require('cors')
const sessionRoutes = require('./routes/sessionRoutes')
const interactionRoutes = require('./routes/interactionRoutes')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const categoryRoutes = require('./routes/categoryRoutes')
const counterRoutes = require('./routes/counterRoutes')
const todoRoutes = require('./routes/todoRoutes')
const friendRoutes = require('./routes/friendRoutes')

const app = express()
const bodyParser = require('body-parser')
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("This is to pass health checks")
})

app.use(authRoutes);
app.use(sessionRoutes);
app.use(interactionRoutes);
app.use(userRoutes);
app.use(friendRoutes);
app.use(categoryRoutes);
app.use(counterRoutes);
app.use(todoRoutes);

//app.use(express.static('./assets/avatar'))
//app.use('/static', express.static(path.join(__dirname,'assets/avatar' )))

const port = process.env.port || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})