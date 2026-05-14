import nodemailer from "nodemailer"; 
import crypto from "crypto"; 
import jsonwebtoken from "jsonwebtoken"; 
import bcryptjs from "bcryptjs"; 

import usuariosModel from "../models/Estudiantesmodel.js";

import { config } from "../../config.js";

const RegistrarEstudiantesController = {};

RegistrarEstudiantesController.register = async (req, res) => {
  const {
    name,
    lastName,
    email,
    password,
    birthdate,
    isVerified,
    loginAttempts,
    timeOut,
  } = req.body;

  try {
    const existCustomer = await customerModel.findOne({ email });
    if (existCustomer) {
      return res.status(400).json({ message: "El estudiante ya existe" });
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const codigodeVerificacion = crypto.randomBytes(3).toString("hex");

    const tokenCode = jsonwebtoken.sign(
      {
        name,
        lastName,
        email,
        password,
        birthdate,
        speciality_id,
        carnet,
        phone,
        isVerified,
        loginAttempts,
        timeOut,
      },
      config.JWT.secret,
      { expiresIn: "15m" },
    );

    res.cookie("verificationToken", tokenCode, { maxAge: 15 * 60 * 1000 });


    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.email.user_email,
        pass: config.email.user_password,
      },
    });

    const mailOptions = {
      from: config.email.user_email,
      to: email,
      subject: "Verificación de cuenta",
      text:
        "Para verificar tu cuenta, utiliza este código" +
        verificationCode +
        "expira en 15 minutos",
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("error " + error);
        return res.status(500).json({ message: "error" });
      }
      res
        .status(200)
        .json({ message: "El estudiante ya esta registrado intenta con otro correo" });
    });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "internal server error" });
  }
};

registerCustomerController.verifyCode = async (req, res) => {
  try {
    const { verificationCodeRequest } = req.body;

    const token = req.cookies.verificationToken;

    const decoded = jsonwebtoken.verify(token, config.JWT.secret);
    const {
      email,
      verificationCode: storedCode,
      name,
      lastName,
      birthdate,
      speciality_id,
      carnet,
      phone,
      isVerified,
      loginAttempts,
      timeOut,
    } = decoded;

    
    if (verificationCodeRequest !== storedCode) {
      return res.status(400).json({ message: "Invalid code" });
    }

    const newCustomer = new customerModel({
      name,
      lastName,
      birthdate,
      email,
      password: passwordHash,
      isVerified: true,
      loginAttempts,
      timeOut,
    });

    await newCustomer.save();

   
    const customer = await customerModel.findOne({ email });
    customer.isVerified = true;
    await customer.save();
    
    res.clearCookie("verificationToken");

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default registerCustomerController;
