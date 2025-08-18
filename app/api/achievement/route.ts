import { NextResponse, NextRequest } from "next/server";
import { achievement } from "../mongo/mongo_schema";
import { connect_to_mongo } from "../mongo/connect_to_mongo";

await connect_to_mongo()

export async function POST(request: NextRequest) {
    try {
        const { task, userId } = await request.json();

        if (!task) {
            return NextResponse.json({ message: "Task not found!" })
        }

        const new_task = new achievement({
            task: task,
            userId: userId
        })
        await new_task.save();
        return NextResponse.json({ status: 200, message: "Task saved!", data: new_task })
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error", error: error })
    }
}

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const date = url.searchParams.get('date');

        if (!userId || !date) {
            return NextResponse.json({ message: "User ID and Date are required!" });
        }

        const target_achievements = await achievement.find({ userId: userId, date: date });
        if (!target_achievements) {
            return NextResponse.json({ message: "No achievements found!" });
        }

        return NextResponse.json({ status: 200, message: "Achievements found!", data: target_achievements });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error", error: error })
    }
}