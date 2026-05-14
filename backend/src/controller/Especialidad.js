import EspecialidadModel from "../models/Especialidad.js";

const especialidadController = {};

especialidadController.getEspecialidades = async (req, res) => {
    try {
        const especialidades = await EspecialidadModel.find();
        res.json(especialidades);
    } catch (error) {
        res.status(500).json({ error: "Internal Eror" });
    }
};

especialidadController.addEspecialidad = async (req, res) => {
    try {
        const { specialtyName, isAvailable } = req.body;
        const nuevaEspecialidad = new EspecialidadModel({ specialtyName, isAvailable });
        await nuevaEspecialidad.save();
        res.status(201).json({ message: "Especialidad creada", especialidad: nuevaEspecialidad });
    } catch (error) {
        res.status(500).json({ error: "Internal Error" });
    }
};

especialidadController.updateEspecialidad = async (req, res) => {
    try {
        const { specialtyName, isAvailable } = req.body;
        const especialidadActualizada = await EspecialidadModel.findByIdAndUpdate(
            req.params.id,
            { specialtyName, isAvailable },
            { new: true }
        );
        if (!especialidadActualizada) return res.status(404).json({ message: "Especialidad no encontrada" });
        res.json({ message: "Especialidad actualizada", especialidad: especialidadActualizada });
    } catch (error) {
        res.status(500).json({ error: "Internal Error" });
    }
};

especialidadController.deleteEspecialidad = async (req, res) => {
    try {
        const especialidadEliminada = await EspecialidadModel.findByIdAndDelete(req.params.id);
        if (!especialidadEliminada) return res.status(404).json({ message: "Especialidad no encontrada" });
        res.json({ message: "Especialidad eliminada" });
    } catch (error) {
        res.status(500).json({ error: "Internal Error" });
    }
};

export default especialidadController;