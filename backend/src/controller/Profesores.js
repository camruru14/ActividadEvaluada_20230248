import nodemailer from "nodemailer";
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";

import ProfesoresModel from "../models/ProfesoresModel.js";
import { config } from "../../config.js";

const profesoresController = {};

const jwtSecret = config?.JWT?.Secret || config?.JWT?.secret || "default_jwt_secret";
const emailUser = config?.email?.user_email;
const emailPass = config?.email?.user_password;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: emailUser,
        pass: emailPass,
    },
});

function sendMail(mailOptions) {
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) return reject(err);
            resolve(info);
        });
    });
}

profesoresController.register = async (req, res) => {
    try {
        const {
            name,
            lastName,
            email,
            password,
            phone,
            hireDate,
        } = req.body;

        if (!name || !lastName || !email || !password) {
            return res.status(400).json({ message: "Faltan datos obligatorios" });
        }

        const existe = await ProfesoresModel.findOne({ email });
        if (existe) {
            return res.status(400).json({ message: "El profesor ya existe" });
        }

        const passwordHash = await bcryptjs.hash(password, 10);
        const verificationCode = crypto.randomBytes(3).toString("hex"); 

        const tokenPayload = {
            name,
            lastName,
            email,
            passwordHash,
            phone: phone || null,
            hireDate: hireDate || null,
            isActive: true,
            isVerified: false,
            loginAttempts: 0,
            timeOut: null,
            verificationCode,
        };

        const token = jsonwebtoken.sign(tokenPayload, jwtSecret, { expiresIn: "15m" });

        res.cookie("profVerificationToken", token, { httpOnly: true, maxAge: 15 * 60 * 1000 });

        const mailOptions = {
            from: emailUser,
            to: email,
            subject: "Código de verificación - Registro Profesor",
            text: `Tu código de verificación es: ${verificationCode}. Expira en 15 minutos.`,
        };

        await sendMail(mailOptions);

        return res.status(200).json({ message: "Código de verificación enviado al correo" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error interno" });
    }
};

profesoresController.verifyCode = async (req, res) => {
    try {
        const { verificationCode } = req.body;
        const token = req.cookies?.profVerificationToken;
        if (!token) {
            return res.status(400).json({ message: "Token de verificación no encontrado" });
        }

        const decoded = jsonwebtoken.verify(token, jwtSecret);

        if (decoded.verificationCode !== verificationCode) {
            return res.status(400).json({ message: "Código inválido" });
        }

        const newProfesor = new ProfesoresModel({
            name: decoded.name,
            lastName: decoded.lastName,
            email: decoded.email,
            password: decoded.passwordHash,
            phone: decoded.phone,
            hireDate: decoded.hireDate,
            isActive: decoded.isActive,
            isVerified: true,
            loginAttempts: decoded.loginAttempts,
            timeOut: decoded.timeOut,
        });

        await newProfesor.save();

        res.clearCookie("profVerificationToken");
        return res.status(201).json({ message: "Profesor registrado y verificado" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error interno" });
    }
};

profesoresController.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Faltan credenciales" });

        const profesor = await ProfesoresModel.findOne({ email });
        if (!profesor) return res.status(400).json({ message: "Credenciales inválidas" });

        if (!profesor.isVerified) return res.status(403).json({ message: "Cuenta no verificada" });
        if (!profesor.isActive) return res.status(403).json({ message: "Cuenta inactiva" });

        const match = await bcryptjs.compare(password, profesor.password);
        if (!match) {
            profesor.loginAttempts = (profesor.loginAttempts || 0) + 1;
            await profesor.save();
            return res.status(400).json({ message: "Credenciales inválidas" });
        }

        profesor.loginAttempts = 0;
        await profesor.save();

        const payload = { id: profesor._id, email: profesor.email, name: profesor.name };
        const accessToken = jsonwebtoken.sign(payload, jwtSecret, { expiresIn: "7d" });

        return res.status(200).json({ message: "Login exitoso", token: accessToken });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error interno" });
    }
};

profesoresController.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Falta email" });

        const profesor = await ProfesoresModel.findOne({ email });
        if (!profesor) return res.status(400).json({ message: "Usuario no encontrado" });

        const resetCode = crypto.randomBytes(3).toString("hex");
        const token = jsonwebtoken.sign({ email, resetCode }, jwtSecret, { expiresIn: "15m" });

        res.cookie("profResetToken", token, { httpOnly: true, maxAge: 15 * 60 * 1000 });

        const mailOptions = {
            from: emailUser,
            to: email,
            subject: "Código de recuperación de contraseña",
            text: `Tu código para reestablecer la contraseña es: ${resetCode}. Expira en 15 minutos.`,
        };

        await sendMail(mailOptions);

        return res.status(200).json({ message: "Código de recuperación enviado" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error interno" });
    }
};

profesoresController.resetPassword = async (req, res) => {
    try {
        const { resetCode, newPassword } = req.body;
        const token = req.cookies?.profResetToken;
        if (!token) return res.status(400).json({ message: "Token de recuperación no encontrado" });

        const decoded = jsonwebtoken.verify(token, jwtSecret);
        if (decoded.resetCode !== resetCode) return res.status(400).json({ message: "Código inválido" });

        const profesor = await ProfesoresModel.findOne({ email: decoded.email });
        if (!profesor) return res.status(400).json({ message: "Usuario no encontrado" });

        profesor.password = await bcryptjs.hash(newPassword, 10);
        profesor.loginAttempts = 0;
        await profesor.save();

        res.clearCookie("profResetToken");
        return res.status(200).json({ message: "Contraseña cambiada" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal error" });
    }
};

profesoresController.getProfesores = async (req, res) => {
    try {
        const list = await ProfesoresModel.find().select("-password");
        return res.status(200).json(list);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Eror" });
    }
};

profesoresController.getProfesorById = async (req, res) => {
    try {
        const { id } = req.params;
        const profesor = await ProfesoresModel.findById(id).select("-password");
        if (!profesor) return res.status(404).json({ message: "No encontrado" });
        return res.status(200).json(profesor);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error interno" });
    }
};

profesoresController.updateProfesor = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        if (updates.password) {
            updates.password = await bcryptjs.hash(updates.password, 10);
        }
        const updated = await ProfesoresModel.findByIdAndUpdate(id, updates, { new: true }).select("-password");
        if (!updated) return res.status(404).json({ message: "No encontrado" });
        return res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error interno" });
    }
};

profesoresController.deleteProfesor = async (req, res) => {
    try {
        const { id } = req.params;
        const removed = await ProfesoresModel.findByIdAndDelete(id);
        if (!removed) return res.status(404).json({ message: "No encontrado" });
        return res.status(200).json({ message: "Profesor eliminado" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error interno" });
    }
};

export default profesoresController;
