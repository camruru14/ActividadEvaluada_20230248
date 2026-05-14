import { Schema, model } from 'mongoose';

const ProfesoresSchema = new Schema({
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    birthdate: { type: Date },
    hire_date: { type: Date },
    IsActive: { type: Boolean },
    phone: { type: String },
    isVerified: { type: Boolean, default: false },
    loginAttempts: { type: Number, default: 0 },
    timeOut: { type: Date }
}, {
    timestamps: true,
    strict: false
});

export default model('Estudiante', usuariosSchema);