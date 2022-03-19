const express = require('express')
const cors = require('cors');
const sessionRoutes = require('./routes/sessionRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const requireAuth = require('./middlewares/requireAuth');

const app = express();
const bodyParser = require('body-parser');
app.use(cors());
app.use(bodyParser.json());
app.use(authRoutes);
app.use(sessionRoutes);
app.use(userRoutes);
app.use(categoryRoutes);




app.listen(3000, () => {
    console.log("Listening on port 3000");
})