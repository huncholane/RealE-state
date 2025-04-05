const MeetingHistory = require("../../model/schema/meeting");
const mongoose = require("mongoose");

const add = async (req, res) => {
  try {
    req.body.createdDate = new Date();
    const user = new MeetingHistory(req.body);
    await user.save();
    res.status(200).json(user);
  } catch (err) {
    console.error("Failed to create Lead:", err);
    res.status(400).json({ error: "Failed to create Lead" });
  }
};

const index = async (req, res) => {
  const query = req.query;
  query.deleted = false;

  // let result = await Lead.find(query)

  let allData = await MeetingHistory.find(query)
    .populate({
      path: "createBy",
      match: { deleted: false }, // Populate only if createBy.deleted is false
    })
    .exec();

  const result = allData.filter((item) => item.createBy !== null);
  res.send(result);
};

const view = async (req, res) => {
  console.log("getting view");
  try {
    let response = await MeetingHistory.findOne({ _id: req.params.id });
    if (!response) return res.status(404).json({ message: "no Data Found." });
    let result = await MeetingHistory.aggregate([
      { $match: { _id: response._id } },
      {
        $lookup: {
          from: "User",
          localField: "createBy",
          foreignField: "_id",
          as: "users",
        },
      },
      { $unwind: { path: "$users", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          createByName: "$users.username",
        },
      },
      { $project: { contact: 0, users: 0, Lead: 0, createdByName: 0 } },
    ]);
    console.log(result[0]);
    res.status(200).json(result[0]);
  } catch (err) {
    console.log("Error:", err);
    res.status(400).json({ Error: err });
  }
};

const deleteData = async (req, res) => {
  try {
    const result = await MeetingHistory.findByIdAndUpdate(req.params.id, {
      deleted: true,
    });
    res.status(200).json({ message: "done", result });
  } catch (err) {
    res.status(404).json({ message: "error", err });
  }
};

const deleteMany = async (req, res) => {
  try {
    const result = await MeetingHistory.updateMany(
      { _id: { $in: req.body } },
      { $set: { deleted: true } }
    );

    if (result?.matchedCount > 0 && result?.modifiedCount > 0) {
      return res
        .status(200)
        .json({ message: "Meeting History Removed successfully", result });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Failed to remove tasks" });
    }
  } catch (err) {
    return res.status(404).json({ success: false, message: "error", err });
  }
};

const edit = async (req, res) => {
  try {
    let result = await MeetingHistory.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true }
    );

    res.status(200).json(result);
  } catch (err) {
    console.error("Failed to create task:", err);
    res.status(400).json({ error: "Failed to create task : ", err });
  }
};

module.exports = { add, index, view, deleteData, deleteMany, edit };
