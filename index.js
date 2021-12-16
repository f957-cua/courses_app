const express = require('express');
const path = require('path');
const csurf = require('csurf');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const exphbs = require('express-handlebars');
const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session);

const homeRoutes = require('./routes/home');
const addRoutes = require('./routes/add');
const coursesRoutes = require('./routes/courses');
const cardRoutes = require('./routes/card');
const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const varMiddleware = require('./middleware/variables');
const userMiddleware = require('./middleware/user');
const errorHandler = require('./middleware/error');
const fileMiddleware = require('./middleware/file');

const keys = require('./keys');

const app = express();

const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs',
  helpers: require('./utils/hbs-helpers')
});

// create session store
const store = new MongoStore({
  collection: 'sessions',
  uri: keys.MONGODB_URI,
});

//create engine 'hbs'
app.engine('hbs', hbs.engine);

//setup folder for hbs files
app.set(
  'views',
  path.join(__dirname, 'views')
);

//set engine as 'hbs' in server
app.set('view engine', 'hbs');

//set using public files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

//set buffer value encoding by form submit
app.use(express.urlencoded({ extended: true }));

//set session settings
app.use(session({
  secret: keys.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store
}));

//set file storage
app.use(fileMiddleware.single('avatar'));

//safety during http-headers
app.use(helmet());

//compress all response files
app.use(compression());

//set csurf safety package
app.use(csurf());

//set error reporter
app.use(flash());

// connecting local variables middleware
app.use(varMiddleware);
// attaching user with db-methods
app.use(userMiddleware);

//settled up routing
app.use('/', homeRoutes);
app.use('/add', addRoutes);
app.use('/courses', coursesRoutes);
app.use('/card', cardRoutes);
app.use('/orders', ordersRoutes);
app.use('/auth', authRoutes);
app.use("/profile", profileRoutes);

//settled up 404 error
app.use(errorHandler);


const PORT = process.env.PORT || 3000;

async function start() {
  try {
    mongoose.connect(keys.MONGODB_URI, {
      useNewUrlParser: true,
    });

    app.listen(PORT, () => {
      console.log(
        `server is running on port ${PORT}`
      );
    });
  } catch (e) {
    console.log(e)
  }
}

start()
