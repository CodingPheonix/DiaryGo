import mongoose from "mongoose";

export async function connect_to_mongo() {
    const mongoURL = process.env.MONGO_URL

    await mongoose.connect(`${mongoURL}`)
        .then(() => console.log('MongoDB connected'))
        .catch((err) => console.error('MongoDB connection error:', err));
}