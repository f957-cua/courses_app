const Router = require('express');
const router = Router();
const Course = require('../models/course');
const auth = require('../middleware/auth');
const { courseValidators } = require('../utils/validators');
const {
  validationResult,
} = require('express-validator');

function isOwner(course, req) {
  return course.userId.toString() === req.user._id.toString();
}

router.get('/', async (req, res) => {

  try {
    // show all courses to user with properties
    const courses = await Course.find()
      .populate('userId', 'email name')
      .select('price title img').lean();
  
    res.render('courses', {
      title: 'Курсы',
      isCourses: true,
      userId: req.user ? req.user._id.toString() : null,
      courses
    });
  } catch (e) {
    console.log(e)
  }
});

router.get('/:id/edit', auth, async (req, res) => {
  try {
    // checking query parameter
    if (!req.query.allow) {
      return res.redirect('/');
    }
  
    const course = await Course.findById(req.params.id).lean();

    // save editing from other users
    if (!isOwner(course, req)) {
      return res.redirect('/courses')
    }
  
    res.render('course-edit', {
      title: `Редактировать ${course.title}`,
      course
    })
  } catch (e) {
    console.log(e)
  }

})

router.post('/edit', auth, courseValidators, async (req, res) => {
  // result validation and error search
  const errors = validationResult(req);

  const { id } = req.body;

  if (!errors.isEmpty()) {
    return res
      .status(422)
      .redirect(`courses/${id}/edit?allow=true`)
  }

  try {
    const { _id } = req.body;
    delete req.body._id;

    const course =
      await Course.findById(_id).lean();

    // checking is owner
    if (!isOwner(course, req)) {
      return res.redirect("/courses");
    }

    // creating new course object

    await Course.findByIdAndUpdate(
      _id,
      req.body
    );

    res.redirect("/courses");
  } catch (e) {
    console.log(e);
  }
})

router.post('/remove', auth, async (req, res) => {
  try {
    await Course.deleteOne({ _id: req.body._id, userId: req.user._id });
    
    res.redirect('/courses');
  } catch (e) {
    console.log(e)
  }
})

router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).lean();
    res.render('course', {
      layout: 'empty',
      title: `Курс ${course.title}`,
      course
    });

  } catch (e) {
    console.log(e)
  }
})

module.exports = router;