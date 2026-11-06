const sendToken = (user, statusCode, res, message) => {
  const token = user.generateJWT();

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res.status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        channelName: user.channelName,
        channelDescription: user.channelDescription,
        channelBanner: user.channelBanner,
        isVerified: user.isVerified,
        subscribersCount: user.subscribersCount,
        createdAt: user.createdAt
      }
    });
};

module.exports = sendToken;
