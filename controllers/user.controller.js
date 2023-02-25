const { signupService } = require("../services/user.service");

exports.singup = async (req, res) => {
  try {
    const user = await signupService(req.body);

    user.password = undefined;

    res.status(200).json({
      status: true,
      message: "Signup is Successfull.",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: "Signup is not Successfull.",
      error: error.message,
    });
  }
};
