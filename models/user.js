const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcrypt");
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema(
  {
    id_user: {
      type: String,
      required: true,
    },
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,

      required: true,
    },
    role: {
      type: String,
      enum: [1, 2],
      default: "2",
    },
    avatarUrl:{
       type: String,
  default: '',
    },
    address: {
      type: Array,
      default: [],
    },
    refreshToken: {
      type: String,
    },
    passwordChangeAt: {
      type: String,
    },
    passwordResetOTP: {
      type: String,
    },
    passwordResetExpires: {
      type: String,
    },
    is_online:{
      type: String,
      default:'0'
    }
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = bcrypt.genSaltSync(10);
  this.password = await bcrypt.hashSync(this.password, salt);
});
userSchema.methods = {
  isCorrectPassword: async function (password) {
    return await bcrypt.compareSync(password, this.password);
  },
};
//Export the model
module.exports = mongoose.model("User", userSchema);
