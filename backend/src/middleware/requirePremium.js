const Subscription = require('../models/subscription');

const requirePremium = async (req, res, next) => {
  try {
    const isPrem = await Subscription.isPremium(req.user.id);
    if (!isPrem) {
      return res.status(403).json({
        success: false,
        message: 'This feature requires a Premium subscription.',
        code: 'PREMIUM_REQUIRED',
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requirePremium;
