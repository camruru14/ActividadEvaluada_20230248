const logoutController = {};

logoutController.logout = async (req, res) => {
  try {
    res.clearCookie("authCookie");

    return res.status(200).json({ message: "Sesión cerrada" });
  } catch (error) {}
};

export default logoutController;