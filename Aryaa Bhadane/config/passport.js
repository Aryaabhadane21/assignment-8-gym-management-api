const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

/**
 * Configure Passport Local Strategy
 * Authenticates user using username & password
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    async (username, password, done) => {
      try {
        // Find user by username (or fallback to email if desired)
        const user = await User.findOne({ username: username.trim() });
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        // Compare hashed password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

/**
 * Serialize User to store session ID in cookie
 */
passport.serializeUser((user, done) => {
  done(null, user._id);
});

/**
 * Deserialize User from session ID stored in cookie
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
