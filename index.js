const express = require('express')
const cors = require('cors');
const sessionRoutes = require('./routes/sessionRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const requireAuth = require('./middlewares/requireAuth');

const app = express();
const bodyParser = require('body-parser');
app.use(cors());
app.use(bodyParser.json());
app.use(sessionRoutes);
app.use(authRoutes);
app.use(userRoutes);




app.listen(3000, () => {
    console.log("Listening on port 3000");
})