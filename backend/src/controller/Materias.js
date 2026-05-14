const subjectController = {};

import subjectModel from "../models/materias.js";

subjectController.getSubjects = async (_req, res) => {
  try {
    const subjects = await subjectModel.find();
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching subjects", error });
  }
};

subjectController.insertSubject = async (req, res) => {
  try {
    const { subjectName, teacher_id, isAvailable } = req.body;
    const newSubject = new subjectModel({
      subjectName,
      teacher_id,
      isAvailable,
    });
    await newSubject.save();
    res.json({ message: "Subject saved", subject: newSubject });
  } catch (error) {
    res.status(500).json({ message: "Error saving subject", error });
  }
};

subjectController.updateSubject = async (req, res) => {
  try {
    const { subjectName, teacher_id, isAvailable } = req.body;
    const updated = await subjectModel.findByIdAndUpdate(
      req.params.id,
      { subjectName, teacher_id, isAvailable },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Subject not found" });
    res.json({ message: "Subject updated", subject: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating subject", error });
  }
};

subjectController.deleteSubject = async (req, res) => {
  try {
    const deleted = await subjectModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Subject not found" });
    res.json({ message: "Subject deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting subject", error });
  }
};

export default subjectController;
