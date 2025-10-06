import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { player, dealer } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert Blackjack assistant. 
The player hand is worth ${player}, and the dealer is showing ${dealer}.
Suggest whether the player should Hit or Stand.
Reply concisely with either "Hit" or "Stand".`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return NextResponse.json({ suggestion: text });
    } catch (err) {
        console.error('Gemini API error:', err);
        return NextResponse.json(
            { error: "Failed to get AI suggestion" },
            { status: 500 }
        );
    }
}