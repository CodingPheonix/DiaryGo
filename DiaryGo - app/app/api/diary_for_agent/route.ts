import { NextRequest, NextResponse } from "next/server";
import { diary } from "../mongo/mongo_schema";
import { connect_to_mongo } from "../mongo/connect_to_mongo";

await connect_to_mongo()

export async function PUT(request: NextRequest) {
    try {
        const { diary_id, target, task_list } = await request.json()

        if (!diary_id || !target || !task_list) {
            return NextResponse.json({ message: "Diary id or Target or Task List is Missing!" })
        }

        const target_diary = await diary.findByIdAndUpdate(diary_id, {target: target, task_list: task_list }, { new: true })
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

        const all_diaries = await diary.find({ userId: userId })
        if (!all_diaries) {
            return NextResponse.json({ message: "Target User has no Diary!" }, { status: 404 })
        }

        const target_diaries = all_diaries.filter(
            (one_diary) => one_diary.target_achieved === false
        );

        const modified_diaries = target_diaries.map((one_diary) => ({
            ...one_diary.toObject(),
            diary_id: one_diary._id
        }));

        return NextResponse.json(modified_diaries, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error!" }, { status: 500 })
    }
}