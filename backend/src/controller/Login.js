import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";

import customerModel from "../models/customers.js";
import { config } from "../../config.js";

const loginCustomerController = {};

loginCustomerController.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userFound = await customerModel.findOne({ email });

    if (!userFound) {
      return res.status(404).json({ message: "usuario no encontrado" });
    }

    if (userFound.timeOut && userFound.timeOut > Date.now()) {
      return res.status(403).json({ message: "usuario bloqueada" });
    }

    const isMatch = await bcrypt.compare(password, userFound.password);

    if (!isMatch) {
      
      userFound.loginAttemps = (userFound.loginAttemps || 0) + 1;

      if (userFound.loginAttemps >= 5) {
        userFound.timeOut = Date.now() + 15 * 60 * 1000;
        userFound.loginAttemps = 0;

        await userFound.save();

        return res.status(403).json({ message: "usuario bloqueada" });
      }

      await userFound.save();
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    userFound.loginAttemps = 0;
    userFound.timeOut = null;
    await userFound.save();

    const token = jsonwebtoken.sign(
      { id: userFound._id, userType: "customer" },
      config.JWT.secret,
      { expiresIn: "30d" },
    );

    res.cookie("authCookie", token);

    return res.status(200).json({ message: "Login exitoso" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ mesage: "Internal server error" });
  }
};

export default loginCustomerController;