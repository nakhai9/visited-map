const mongoose = require('mongoose');

const URI = `mongodb+srv://${process.env.MONGO_DB_PROJECT}:${process.env.MONGO_DB_PASSWORD}@cluster0.vejwbrw.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`
async function connectDB() {
    try {
        await mongoose.connect(URI);
        console.log("MDB connected")
    } catch (error) {
        console.log(error)
        process.exit(1);
    }
}

module.exports = connectDB;