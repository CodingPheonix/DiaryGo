import { NextResponse, NextRequest } from "next/server";
import { achievement } from "../mongo/mongo_schema";
import { connect_to_mongo } from "../mongo/connect_to_mongo";

await connect_to_mongo()

export async function POST(request: NextRequest) {
    try {
        const { task, userId, date, time } = await request.json();
        console.log("task: ", task)
        console.log("userId: ", userId)
        console.log("date: ", date)
        console.log("time: ", time)

        if (!task || !userId || !date || !time) {
            return NextResponse.json({ message: "Task or userId or date or time not found!" }, { status: 404 })
        }

        const new_task = new achievement({
            task: task,
            userId: userId,
            date: date,
            time: time
        })
        await new_task.save();
        return NextResponse.json({ message: "Task saved!", data: new_task }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error", error: error }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const date = url.searchParams.get('date');

        if (!userId || !date) {
            return NextResponse.json({ message: "User ID and Date are required!" }, { status: 400 });
        }

        const target_achievements = await achievement.find({ userId: userId, date: date });
        if (!target_achievements) {
            return NextResponse.json({ message: "No achievements found!" });
        }

        return NextResponse.json({ message: "Achievements found!", data: target_achievements }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error", error: error }, { status: 500 });
    }
}