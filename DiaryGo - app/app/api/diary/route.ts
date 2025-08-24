import { NextRequest, NextResponse } from "next/server";
import { diary } from "../mongo/mongo_schema";
import { connect_to_mongo } from "../mongo/connect_to_mongo";

await connect_to_mongo()

export async function POST(request: NextRequest) {
    try {
        const { userId, target, task_list } = await request.json();

        if (!userId || !target || !task_list) {
            return NextResponse.json({ message: "User id or Target or Task List is Missing!" })
        }

        const modified_task_list = task_list.map((task: string) => ({
            name: task,
            progress: 0
        }));

        const new_diary = new diary({
            userId: userId,
            target: { name: target, progress: 0 },
            task_list: modified_task_list,
            target_achieved: false
        })
        await new_diary.save()
        return NextResponse.json({ status: 200, message: "New Diary created successfully!", data: new_diary })
    } catch (error) {
        return NextResponse.json({ status: 500, message: "Internal Server Error", error: error })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { diary_id, task_list } = await request.json()

        if (!diary_id || !task_list) {
            return NextResponse.json({ message: "Diary id or Task List is Missing!" })
        }

        const target_diary = await diary.findByIdAndUpdate(diary_id, { task_list: task_list }, { new: true })
        if (!target_diary) {
            return NextResponse.json({ message: "Target Diary not found!" }, { status: 404 })
        }

        return NextResponse.json({ message: "Diary Updated!", data: target_diary }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error!" }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { diary_id, target_achieved } = await request.json()

        if (!diary_id || !target_achieved) {
            return NextResponse.json({ message: "Diary id or Task List is Missing!" })
        }

        const target_diary = await diary.findByIdAndUpdate(diary_id, { target_achieved: target_achieved }, { new: true })
        if (!target_diary) {
            return NextResponse.json({ message: "Target Diary not found!" }, { status: 404 })
        }

        return NextResponse.json({ message: "Diary Updated!", data: target_diary }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error!" }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ message: "User id is Missing!" })
        }

        const target_diary = await diary.find({ userId: userId })
        if (!target_diary) {
            return NextResponse.json({ message: "Target User has no Diary!" }, { status: 404 })
        }
        return NextResponse.json({ message: "Target diary fetched", data: target_diary }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error!" }, { status: 500 })
    }
}