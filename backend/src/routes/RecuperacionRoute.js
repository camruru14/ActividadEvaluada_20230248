import express from "express"
import Recuperacioncontracontroller from "../controller/RecuperacionContra.js"
import loginCustomerController from "../controller/Login.js";

const router = express.Router();

router.post("/login", loginCustomerController.login);
router.post("/logout", loginCustomerController.LogOut);

router.post("/recuperacion/enviar-codigo", Recuperacioncontracontroller.enviarCodigo);
router.post("/recuperacion/validar-codigo", Recuperacioncontracontroller.validarCodigo);
router.post("/recuperacion/recuperarcontra", Recuperacioncontracontroller.resetPassword);

export default router;