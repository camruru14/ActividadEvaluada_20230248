import jsonwebtoken from "jsonwebtoken"; 
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemaile"; 
import HTMLRecoveryEmail from "../utils/sendMailRecovery.js";

import { config } from "../../config.js";

import customerModel from "../models/customers.js";

const recoveryPasswordController = {};

recoveryPasswordController.requestCode = async (req, res) => {
  try {
    const { email } = req.body;

    const userFound = await customerModel.findOne({ email });

    if (!userFound) {
      return res.json({ message: "User not found" });
    }

    const code = crypto.randomBytes(3).toString("hex");

    const token = jsonwebtoken.sign(
      { email, code, userType: "customer", verified: false },
      config.JWT.secret,
      //#3- ¿Cúano expira?
      { expiresIn: "15m" },
    );

    res.cookie("recoveryCookie", token, { maxAge: 15 * 60 * 1000 });

    //Enviar correo electrónico
    //#1' ¿Quién lo envía?
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.email.user_email,
        pass: config.email.user_password,
      },
    });

    //#2- ¿Quien lo recibe y como?
    const mailOptions = {
      from: config.email.user_email,
      to: email,
      subject: "Correo de recuperación",
      body: "Use this code to recover ur account",
      html: HTMLRecoveryEmail(code),
    };

    //#3-Enviar el correo
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("error" + error);
        return res.status(500).json({ message: "error sending mail" });
      }

      return res.statu(200).json({ message: "email sent" });
    });

    return res.status(200).json({ message: "si" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//VERIFICAR EL CÓDIGO
recoveryPasswordController.verifyCode = async (req, res) => {
  try {
    //#1-Solicitar los datos
    const { codeRequest } = req.body;

    //Obtenemos la información que está dentro del token
    //Accedo al token que está en la cookie recoveryCookie
    const token = req.cookies.recoveryCookie;
    const decoded = jsonwebtoken.verify(token, config.JWT.secret);

    //Comparar lo que el usuario escribió con lo que está en el token
    if (codeRequest !== decoded.code) {
      return res.status(400).json({ message: "Invalid code" });
    }

    //Si lo escribe bien, vamos a colocar en el token
    //que ya está vearificado
    const newToken = jsonwebtoken.sign(
      //#1-Que vamos a guardar
      { email: decoded.email, userType: "customer", verified: true },
      //#2-secret key
      config.JWT.secret,
      { expiresIn: "15m" },
    );

    res.cookie("recoveryCookie", newToken, { maxAge: 15 * 60 * 1000 });

    return res.status(200).json({ message: "Code verified successfully" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

recoveryPasswordController.newPassword = async (req, res) => {
  try {
    const { newPassword, confirmNewPassword } = req.body;

    //Comparar contraseñas
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Passwords doesnt match" });
    }

    //Vamos a comprobar al token si ya está verificado
    const token = req.cookies.recoveryCookie;
    const decoded = jsonwebtoken.verify(token, config.JWT.secret);

    if (!decoded.verified) {
      return res.status(400).json({ message: "Code not verified" });
    }

    //Encriptamos la contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await customerModel.findOneAndUpdate(
      { email: decoded.email },
      { password: passwordHash },
      { new: true },
    );

    res.clearCookie("recoveryCookie");

    return res.status(200).json({ message: "Password updated" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default recoveryPasswordController;