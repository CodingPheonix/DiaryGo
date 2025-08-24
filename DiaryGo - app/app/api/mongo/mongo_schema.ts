import mongoose from "mongoose";

const target = new mongoose.Schema({
    name: {type: String, required: true},
    progress: {type: Number, default: 0}
})

const task = new mongoose.Schema({
    name: {type: String, required: true},
    progress: {type: Number, default: 0}
})

const diary_schema = new mongoose.Schema({
    userId : {type: String, required: true},
    target: target,
    task_list: [task],
    target_achieved: {type: Boolean, default: false}
})

const auth_schema = new mongoose.Schema({
    username: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true}
})

const achievement_schema = new mongoose.Schema({
    userId: {type: String, required: true},
    task: {type: String, required: true},
    date: {type: Date, default: Date.now()}
})

export const diary = mongoose.models["diary"] || mongoose.model("diary", diary_schema)
export const auth = mongoose.models["auth"] || mongoose.model("auth", auth_schema)
export const achievement = mongoose.models["achievement"] || mongoose.model("achievement", achievement_schema)