import { Schema, model } from 'mongoose';

const EspecialidadesSchema = new Schema({
    specialtyName: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, default: true }
}, {
    timestamps: true,
    strict: false
});

export default model('Especialidades', EspecialidadesSchema);
