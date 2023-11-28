const express = require('express')
const { connectToDb, getDb } = require('./db')
const { ObjectId } = require('mongodb')
const session = require('express-session')

//init and create the app
const app = express()

// Middleware for parsing JSON data
app.use(express.json())
app.use(session({
    secret: 'thisismysessionsecretkey',
    saveUninitialized: false,
    resave: false
}));

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
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (req.session.authorized) { 
        res.sendFile('public/home.html', { root: __dirname });
    } else {
        res.sendFile('public/login.html', { root: __dirname });
    }
});

app.get('/Profile', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (req.session.authorized) {
        res.sendFile('public/profile.html', { root: __dirname });
    } else {
        res.sendFile('public/login.html', { root: __dirname });
    }
})

app.get('/EventScreen', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (req.session.authorized) {
        res.sendFile('public/events.html', { root: __dirname });
    } else {
        res.sendFile('public/login.html', { root: __dirname });
    }
})

app.get('/CommunityScreen', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    if (req.session.authorized) {
        res.sendFile('public/community.html', { root: __dirname });
    } else {
        res.sendFile('public/login.html', { root: __dirname });
    }
})

app.get('/CalendarScreen', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    if (req.session.authorized) {
        res.sendFile('public/calendar.html', { root: __dirname });
    } else {
        res.sendFile('public/login.html', { root: __dirname });
    }
})

app.get('/CourseScreen', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    if (req.session.authorized) {
        res.sendFile('public/course.html', { root: __dirname });
    } else {
        res.sendFile('public/login.html', { root: __dirname });
    }
})

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

//logout
app.post('/Logout', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
        
    req.session.destroy(err => {
        if (!err) {
            res.sendFile('public/login.html', { root: __dirname });
        } else {
            res.status(500).json({ error: 'something went wrong' })
        }
    })
})

//get user by id
app.post('/Login', (req, res) => {
    const user = req.body
    const username = user.username
    const password = user.password

    const insert = {
        user: {
            username: username,
            email: "",
            password: password,
            profilePicture: "",
            major: "",
            enrolledCourses: [],
            communityInteractions: [],
            calendarEvents: []
        }
    }

    db.collection('User')
        .findOne({ "user.username": insert.user.username, "user.password": insert.user.password })
        .then(response => {
            if (response) {
                req.session.user = insert.user;
                req.session.authorized = true;
                res.redirect('/home.html');
            } else {
                res.status(404).json({ error: 'Username or password is incorrect' });
            }
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
app.post('/Register', (req, res) => {
    const user = req.body
    const firstName = user.firstname
    const lastName = user.lastname
    const email = user.email
    const pass = user.password
    const confirm = user.confirmpass
    const majors = user.majors

    if (pass !== confirm) {
        // Redirect to an error page 
        return res.redirect('/error-page.html');
    }

    const insert = {
        user: {
            username: firstName,
            email: email,
            password: pass,
            profilePicture: "",
            major: majors,
            enrolledCourses: [],
            communityInteractions: [],
            calendarEvents: []
        }
    }

    db.collection('User')
        .insertOne(insert)
        .then(result => {
            req.session.user = insert.user;
            req.session.authorized = true;
            res.redirect('/home.html')
        })
        .catch(err => {
            res.status(500).json({ err: 'Could not create a new user' })
            console.log(err)
        })
})