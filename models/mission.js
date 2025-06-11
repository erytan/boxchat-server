const mongoose = require("mongoose");
const mongooseSequence = require("mongoose-sequence")(mongoose);  // Correctly require and initialize the plugin

var userSchema = new mongoose.Schema(
    {
        link: {
            type: String,
            required: true,  // id_mission will be auto-incremented
        },
        nameMission: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        task: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    },
);

// Apply the plugin to automatically increment id_mission

// Export the model
module.exports = mongoose.model("Mission", userSchema);
