import { Schema, model } from 'mongoose';

const usuariosSchema = new Schema({
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    birthdate: { type: Date },
    speciality_id: { type: Schema.Types.ObjectId, ref: 'Speciality' },
    carnet: { type: String },
    phone: { type: String },
    isVerified: { type: Boolean, default: false },
    loginAttempts: { type: Number, default: 0 },
    timeOut: { type: Date }
}, {
    timestamps: true,
    strict: false
});

export default model('Estudiante', usuariosSchema);