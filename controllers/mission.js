const dataMission = require("../models/mission");
const asyncHandler = require("express-async-handler");

const createMission = asyncHandler(async (req, res) => {
    try {
        // Ensure request body is provided
        if (!req.body) {
            return res.status(400).json({
                success: false,
                error: "Missing input: Request body is required",
            });
        }

        // Destructure data from request body
        const { link, nameMission, fullName, address } = req.body;

        // Check if required fields are provided
        if (!link || !nameMission || !fullName || !address) {
            return res.status(400).json({
                success: false,
                error: "Missing input: Required fields are 'name', 'fullName', and 'address'",
            });
        }

        // Create a new mission instance without id_mission (auto-generated)
        const newDataMission = new dataMission({
            nameMission,
            link,
            fullName,
            address,
            task: '1',
        });

        // Save the new mission to the database
        await newDataMission.save();

        // Return a success response
        res.status(201).json({
            data: newDataMission,
            success: true,
        });

    } catch (error) {
        // Handle errors
        return res.status(500).json({
            success: false,
            error: "Something went wrong",
        });
    }
});
const updateMission = asyncHandler(async (req, res) => {
    try {
        const { sid } = req.params;
        // Perform the update operation
        const updatedMission = await dataMission.findOneAndUpdate(
            { _id: sid },
            req.body, // Ensure req.body contains valid fields to update
            {
                new: true, // This option ensures the updated document is returned
            }
        );

        // If no document is found, return an error message
        if (!updatedMission) {
            return res.status(404).json({
                test: sid,
                success: false,
                message: "Mission not found",
            });
        }

        // Return success response with updated data
        return res.status(200).json({
            success: true,
            updateMission: updatedMission,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
});
const deleteMission = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) throw new Error("missing input id");

        const response = await dataMission.findByIdAndDelete(id);

        return res.status(200).json({
            success: response ? true : false,
            deleteMission: response
                ? `Mission with : ${response.task} deleted !!`
                : "No mission deleted",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
});

const getMission = asyncHandler(async (req, res) => {
    try {
        const response = await dataMission.find();
        return res.status(200).json({
            success: response ? true : false,
            mission: response,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
})
module.exports = {
    createMission,
    updateMission,
    deleteMission,
    getMission,
};