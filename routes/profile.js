const { Router } = require('express');

// confidence routing middleware
const auth = require('../middleware/auth');

const User = require('../models/user');

const router = Router();

router.get('/', auth, async (req, res) => {
  res.render('profile', {
    title: 'Профиль',
    isProfile: true,
    user: req.user.toObject()
  })
})

router.post('/', auth, async (req, res) => {
  try {
    // find user for update
    const user = await User.findById(
      req.user._id
    ).lean();

    const toChange = {
      name: req.body.name,
    };

    if (req.file) {
      toChange.avatarUrl = req.file.path;
    }

    // creating new course object

    await User.findByIdAndUpdate(
      req.user._id,
      toChange
    ).lean();

    //Object.assign(user, toChange);

    // await user.save();

    res.redirect("/profile");
  } catch (e) {
    console.log(e)
  }
})

module.exports = router;