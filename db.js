const { MongoClient } = require('mongodb')

let dbConnection
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/SWDV691'

module.exports = {
    connectToDb: (cb) => {
        MongoClient.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
        .then((client) => {
            dbConnection = client.db()
            return cb()
        })
        .catch(err =>{
            console.log(err)
            return cb(err)
        })
    },
    getDb: () => dbConnection
}