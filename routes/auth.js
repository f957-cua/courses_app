const { Router } = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const keys = require('../keys');
const regEmail = require('../emails/registration');
const resetEmail = require('../emails/reset');
const {registerValidators} = require('../utils/validators')


const router = Router();

// connecting post handler sendgrid
const transporter = nodemailer.createTransport(sendgrid({
  auth: {api_key: keys.SENDGRID_API_KEY}
}))

router.get('/login', async (req, res) => {
  res.render('auth/login', {
    title: 'Авторизация',
    isLogin: true,
    loginError: req.flash('loginError'),
    registerError: req.flash('registerError')
  })
});

router.get('/logout', async (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login#login')
  })
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // checking user
    const candidate = await User.findOne({ email });

    // checking password
    if (candidate) {
      const areSame = await bcrypt.compare(password, candidate.password);
      
      if (areSame) {
        req.session.user = candidate;
        req.session.isAuthenticated = true;
        req.session.save((err) => {
          if (err) {
            throw err;
          }
          res.redirect("/");
        });
      } else {
        // error reporting
        req.flash('loginError', 'Такого пользователя не существует');

        // redirecting
        res.redirect('/auth/login#login')
      }
      
    } else {
      // error reporting
      req.flash(
        "loginError",
        "Неверный пароль"
      );

      // redirecting
      res.redirect("/auth/login#login");
    }
  } catch (e) {
    console.log(e)
  }
});

router.post(
  "/register",
  registerValidators,
  async (req, res) => {
    try {
      const {
        email,
        password,
        name,
      } = req.body;

      // validation
      const errors =
        validationResult(req);
      if (!errors.isEmpty()) {
        req.flash(
          "registerError",
          errors.array()[0].msg
        );
        console.log(errors.array());
        return res
          .status(422)
          .redirect(
            "/auth/login#register"
          );
      }

      // hash password
      const hashPassword =
        await bcrypt.hash(
          password,
          10
        );

      // register user
      const user = new User({
        email,
        name,
        password: hashPassword,
        cart: { items: [] },
      });
      await user.save();

      // send info email to user post
      await transporter.sendMail(
        regEmail(email)
      );
      res.redirect(
        "/auth/login#login"
      );
      
    } catch (e) {
      console.log(e);
    }
  }
);

router.get(
  "/reset", (req, res) => {
    res.render('auth/reset', {
      title: 'Забыли пароль?',
      error: req.flash('error')
    });
  }
);

router.get("/password/:token", async (req, res) => {

  // checking token availability
  if (!req.params.token) {
    return res.redirect('/auth/login');
  }

  // checking token life
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExp: { $gt: Date.now() }
    });

    if (!user) {
      return res.redirect('/auth/password')
    } else {
      // post to html user-data from db
      res.render("auth/password", {
        title: "Восстановить доступ",
        error: req.flash("error"),
        userId: user._id.toString(),
        token: req.params.token
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post('/reset', (req, res) => {
  try {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        // checking if token was already generating
        req.flash('error', 'Что-то пошло не так, повторите попытку позже');
        return res.redirect('/auth/reset');
      }

      // generating the new one token
      const token = buffer.toString('hex');

      // checking if user was already exist in db
      const candidate = await User.findOne({email: req.body.email})

      if (candidate) {
        // concat reset token to user data
        candidate.resetToken = token;

        // set the token life 1 hours
        candidate.resetTokenExp = Date.now() + 60 * 60 * 1000;

        // save user with new data in db
        await candidate.save();

        // send new mail to user
        transporter.sendMail(
          resetEmail(candidate.email, token)
        );

        res.redirect('/auth/login');
      } else {
        // handled error message
        req.flash('error', 'Такого email нет в базе');
        res.redirect('/auth/reset');
      }
    })
  } catch (error) {
    console.log(error)
  }
})

router.post('/password', async (req, res) => {
  try {
    // find user for reset password
    const user = await User.findOne({
      _id: req.body.userId,
      resetToken: req.body.token,
      resetTokenExp: {$gt: Date.now()}
    })

    if (user) {
      // creating the new password
      user.password = await bcrypt.hash(req.body.password, 10);

      // delete user fields
      user.resetToken = undefined;
      user.resetTokenExp = undefined;

      // save user with new password
      await user.save();
      res.redirect('/auth/login');
    } else {
      // cath login error
      req.flash('loginError', 'Время жизни токена истекло');
      return res.redirect('/auth/login');
    }
  } catch (error) {
    console.log(error);
  }
})

module.exports = router;