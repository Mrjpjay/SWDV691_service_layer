const express = require('express')
const { connectToDb, getDb } = require('./db')
const { ObjectId } = require('mongodb')

//init and create the app
const app = express()

// Middleware for parsing JSON data
app.use(express.json())

// Middleware for serving static files from the 'public' directory
app.use(express.static('public'));

//Middleware for parsin JSON and URL-encoded
app.use(express.urlencoded({ extended: true }));

//db connection
let db

connectToDb((err) => {

    const port = process.env.PORT || 3000

    if (!err) {

        db = getDb()

        app.listen(port, () => {
            console.log('app listening on enviroment port')
        })
    }
})

/*routes*/

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});


//get all users
app.get('/User', (req, res) => {
    let users = []

    db.collection('User')
        .find()
        .forEach(user => users.push(user))
        .then(() => {
            res.status(200).json(users)
        })
        .catch(() => {
            res.status(500).json({ error: 'Could not fetch the users' })
        })
})

//get all events
app.get('/Event', (req, res) => {
    let events = []

    db.collection('Event')
        .find()
        .forEach(event => events.push(event))
        .then(() => {
            res.status(200).json(events)
        })
        .catch(() => {
            res.status(500).json({ error: 'Could not fetch the events' })
        })
})

app.delete('/Event/:id', (req, res) => {
    db.collection('Event')
        .deleteOne({ _id: new ObjectId(req.params.id) })
        .then(result => {
            res.status(200).json(result)
        })
        .catch(err => {
            res.status(500).json({ error: 'Could not delete the event' })
        })
})

//put or update
app.patch('/Event/:id', (req, res) => {
    const updates = req.body

    db.collection('Event')
        .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates })
        .then(result => {
            res.status(200).json(result)
        })
        .catch(err => {
            res.status(500).json({ error: 'Could not update the event' })
        })
})

//get all courses
app.get('/Course', (req, res) => {
    let courses = []

    db.collection('Course')
        .find()
        .forEach(course => courses.push(course))
        .then(() => {
            res.status(200).json(courses)
        })
        .catch(() => {
            res.status(500).json({ error: 'Could not fetch the courses' })
        })
})

//get user by id
app.get('/User/:id', (req, res) => {
    db.collection('User')
        .findOne({ _id: new ObjectId(req.params.id) })
        .then(doc => {
            res.status(200).json(doc)
        })
        .catch(err => {
            res.status(500).json({ error: 'Could not fetch the user' })
        })
})

//get community by id
app.get('/community/:id', (req, res) => {
    db.collection('community')
        .findOne({ _id: new ObjectId(req.params.id) })
        .then(doc => {
            res.status(200).json(doc)
        })
        .catch(err => {
            res.status(500).json({ error: 'Could not fetch the community' })
        })
})

//create user
app.post('/User', (req, res) => {
    const user = req.body
    const pass = user.password
    const confirm = user.confirmpass

    if (pass !== confirm) {
        // Redirect to an error page 
        return res.redirect('/error-page.html');
    }

    // Prepare user object for insertion
    const userToInsert = {
        user: {
            username: user.firstname,
            email: user.email,
            password: user.password,
            profilePicture: '',
            major: '',
            enrolledCourses: [],
            communityInteractions: [],
            calendarEvents: []
        }
    };

    db.collection('User')
        .insertOne(userToInsert)
        .then(result => {
            res.redirect('/home.html')
        })
        .catch(err => {
            res.status(500).json({ err: 'Could not create a new user' })
            console.log(err)
        })
})