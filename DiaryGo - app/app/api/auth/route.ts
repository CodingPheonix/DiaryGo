import { auth } from "../mongo/mongo_schema";
import { NextRequest, NextResponse } from "next/server";
import { connect_to_mongo } from "../mongo/connect_to_mongo";

await connect_to_mongo()

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url)
        const userId = url.searchParams.get('userId')

        const target_user = await auth.findOne({ _id: userId })
        if (target_user) {
            return NextResponse.json({ status: 200, message: "target user fetched", data: target_user })
        } else {
            return NextResponse.json({ message: "target user not found" })
        }
    } catch (error) {
        return NextResponse.json({ status: 500, message: "Internal Server Error" })
    }
}
