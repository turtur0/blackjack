import mongoose, { Schema, model, models } from "mongoose";

const GameSchema = new Schema({
  date: { type: Date, default: Date.now },
  bet: Number,
  playerScore: Number,
  dealerScore: Number,
  result: String, // "win" | "loss"
});

const UserSchema = new Schema({
  username: { type: String, unique: true },
  password: String, // hashed
  chips: { type: Number, default: 500 },
  stats: [GameSchema],
});

export default models.User || model("User", UserSchema);
