import { NextRequest, NextResponse } from "next/server";
import { calendar } from "../mongo/mongo_schema";
import { connect_to_mongo } from "../mongo/connect_to_mongo";

await connect_to_mongo();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        const calendars = await calendar.find({ userId });

        if (!calendars || calendars.length === 0) {
            return NextResponse.json({ message: "No calendars found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Calendars fetched successfully", data: calendars }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, date, event } = await req.json();

        if (!userId || !date || !event) {
            return NextResponse.json({ message: "All fields are required" }, { status: 400 });
        }

        const newCalendar = new calendar({ userId: userId, date: date, event: event });
        await newCalendar.save();
        return NextResponse.json({ message: "Calendar created successfully", data: newCalendar }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to add event to calendar" }, { status: 500 });
    }
}