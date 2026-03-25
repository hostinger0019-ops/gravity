import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// Delete/Disconnect an Instagram connection
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: "Connection ID required" }, { status: 400 });
    }

    try {
        await gpu.instagram.disconnect(id);
        return NextResponse.json({ message: "Instagram disconnected successfully" });
    } catch (error) {
        console.error("Error deleting Instagram connection:", error);
        return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }
}
