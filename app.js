const express = require('express')
const { connectToDb, getDb } = require('./db')
const { ObjectId } = require('mongodb')
const session = require('express-session')
const path = require('path');

//init and create the app
const app = express()

//Embedded JavaScript templating
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

app.get('/ProfileScreen', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (req.session.authorized) {
        res.render('profile');
    } else {
        res.sendFile('public/login.html', { root: __dirname });
    }
})

app.get('/EventScreen', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (req.session.authorized) {
        res.render('events');
    } else {
        res.sendFile('public/login.html', { root: __dirname });
    }
})

app.get('/CommunityScreen', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (req.session.authorized) {
        res.render('community');
    } else {
        res.sendFile('public/login.html', { root: __dirname });
    }
})

app.get('/CalendarScreen', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (req.session.authorized) {
        res.render('calendar');
    } else {
        res.sendFile('public/login.html', { root: __dirname });
    }
})

app.get('/CourseScreen', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (req.session.authorized) {
        res.render('course');
    } else {
        res.sendFile('public/login.html', { root: __dirname });
    }
})

app.get('/singUpScreen', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (req.session.authorized) {
        res.sendFile('public/home.html', { root: __dirname });
    } else {
        res.sendFile('public/singup.html', { root: __dirname });
    }
})

//get all student events
app.get('/EventStudent', (req, res) => {
    let events = []
    const username = req.session.user.username

    db.collection('Event')
        .find({"event.attendees": username})
        .forEach(event => events.push(event))
        .then(() => {
            res.json({
                username: username,
                events: events
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({ error: 'Could not fetch the events' })
        })
})

//get all events
app.get('/Event', (req, res) => {
    let events = []
    const username = req.session.user.username

    db.collection('Event')
        .find()
        .forEach(event => events.push(event))
        .then(() => {
            res.json({
                username: username,
                events: events
            })
        })
        .catch(err => {
            console.log(err)
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

//get all course 
app.get('/AllCourses', (req, res) => {
    let courses = []
    const username = req.session.user.username
    const major = req.session.user.major

    db.collection('Course')
        .find({ 
            "major.title": major,
            "major.courses.enrolledStudents": username 
        })
        .forEach(course => courses.push(course.major.courses))
        .then(() => {
            res.json({
                courses: courses,
                username: username
            })
        })
        .catch((err) => {
            console.log(err)
            res.status(500).json({ error: 'Could not fetch the courses' })
        })
})

//get comunnity forum comments
app.get('/Community', (req, res) => {
    const course = req.query.course

    db.collection('community')
    .aggregate([

        // Match documents that have any comment for the specified course
        { $match: { "community.comments.course": course } },

        // Project the document with a filtered comments array
        { $project: {
            community: {
                major: "$community.major",
                title: "$community.title",
                comments: {
                    $filter: {
                        input: "$community.comments",
                        as: "comment",
                        cond: { $eq: ["$$comment.course", course] }
                    }
                }
            }
        }}
    ])
    .toArray()
    .then(results => {    
        if (results.length > 0) {
            res.json({ comments: results[0].community.comments });
        } else {
            res.json({ comments: [] });
        }
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving comments' });
    });

})

//get user course details
app.get('/Course', (req, res) => {
    const major = req.session.user.major
    const username = req.session.user.username

    db.collection('Course')
        .findOne({ "major.title": major })
        .then(object => {
            res.json({
                courses: object.major.courses,
                username: username
            })
        })
        .catch((err) => {
            console.log(major)
            res.status(500).json({ error: 'Could not fetch the courses' })
        })
})

//remove from event
app.get('/EventRemoval', (req, res) => {
    const username = req.session.user.username
    const eventTitle = req.query.title

    // Update the course in the database
    db.collection('Event')
        .updateOne(
            {
                "event.title": eventTitle
            },
            { $pull: { "event.attendees": username } }
        ).then(result => {
            if (result.modifiedCount === 0) {
                res.status(404).json({ error: 'Student not found in the event' });
            } else {
                console.log("Student removed")
                res.json({ message: 'Student removed from the event successfully' });
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(500).json({ error: 'Could not update the event' });
        });
})

//remove from course
app.get('/CourseRemoval', (req, res) => {
    const major = req.session.user.major
    const username = req.session.user.username
    const courseTitle = req.query.course

    // Update the course in the database
    db.collection('Course')
        .updateOne(
            {
                "major.title": major,
                "major.courses": { $elemMatch: { title: courseTitle, enrolledStudents: username } }
            },
            { $pull: { "major.courses.$.enrolledStudents": username } }
        ).then(result => {
            if (result.modifiedCount === 0) {
                res.status(404).json({ error: 'User not found in the course' });
            } else {
                console.log("user removed")
                res.json({ message: 'User removed from the course successfully' });
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(500).json({ error: 'Could not update the course' });
        });
})

//get bio
app.get('/getBio', (req, res) => {
    const username = req.session.user.username

    db.collection('User')
        .findOne({ "user.username": username})
        .then(user => {
            res.json({bio: user.user.bio})
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({ error: 'Could not get bio' })
        })
})

//update bio
app.get('/updateBio', (req, res) => {
    const username = req.session.user.username
    const bio = req.query.bio

    // Update the course in the database
    db.collection('User')
        .updateOne(
            {
                "user.username": username
            },
            { $set: { "user.bio": bio } }
        ).then(result => {
            if (result.modifiedCount === 0) {
                res.status(404).json({ error: 'Bio NOT updated' });
            } else {
                console.log("bio updated succesfully")
                res.json({ message: 'bio updated succesfully' });
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(500).json({ error: 'Could not update bio' });
        });
})

//add student to an event
app.get('/EventAddition', (req, res) => {
    const username = req.session.user.username
    const eventTitle = req.query.title

    // Update the course in the database
    db.collection('Event')
        .updateOne(
            {
                "event.title": eventTitle
            },
            { $addToSet: { "event.attendees": username } }
        ).then(result => {
            if (result.modifiedCount === 0) {
                res.status(404).json({ error: 'Student not added to the event' });
            } else {
                console.log("student added")
                res.json({ message: 'Student added to the event successfully' });
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(500).json({ error: 'Could not update the course' });
        });
})

//add student to a course
app.get('/CourseAddition', (req, res) => {
    const major = req.session.user.major
    const username = req.session.user.username
    const courseTitle = req.query.course

    // Update the course in the database
    db.collection('Course')
        .updateOne(
            {
                "major.title": major,
                "major.courses.title": courseTitle
            },
            { $addToSet: { "major.courses.$.enrolledStudents": username } }
        ).then(result => {
            if (result.modifiedCount === 0) {
                res.status(404).json({ error: 'User not added to the course' });
            } else {
                console.log("user added")
                res.json({ message: 'User added to the course successfully' });
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(500).json({ error: 'Could not update the course' });
        });
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

    db.collection('User')
        .findOne({ "user.username": username, "user.password": password })
        .then(response => {
            if (response) {
                req.session.user = response.user;
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

//post a comment
app.post('/AddComment', (req, res) =>{
    
    let newComment = req.body
    let major = req.session.user.major

    db.collection('community')
        .updateOne(
            {"community.major": major},
            {$push: {"community.comments": newComment}}
        )
        .then(result =>{
            res.status(200).json(result);
        })
        .catch(err =>{
            console.log(err)
            res.status(500).json({error: 'Error adding comment '+err})
        });
});


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