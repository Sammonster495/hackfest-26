import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/auth/dashboard-config";
import { getExportEventTeamsData } from "~/db/services/event-stats-services";
import { isAdmin } from "~/lib/auth/permissions";
import { errorResponse } from "~/lib/response/error";

export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.dashboardUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, filter = "all", fields = [] } = await request.json();
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    const allData = await getExportEventTeamsData(
      session.dashboardUser.id,
      eventId,
      isAdmin(session.dashboardUser),
    );

    if (!allData) {
      return NextResponse.json(
        { error: "Failed to fetch data or access denied" },
        { status: 403 },
      );
    }

    const data = allData.filter((t) => {
      if (filter === "confirmed") return t.isComplete;
      if (filter === "unconfirmed") return !t.isComplete;
      return true;
    });

    const FIELD_MAP: Record<string, string> = {
      teamName: "Team Name",
      isComplete: "Is Complete",
      paymentStatus: "Payment Status",
      attended: "Attended",
      leaderName: "Leader Name",
      leaderEmail: "Leader Email",
      leaderPhone: "Leader Phone",
      leaderCollege: "Leader College",
      memberNames: "Member Names",
      memberEmails: "Member Emails",
      memberPhones: "Member Phones",
      colleges: "Colleges",
    };

    // Filter columns based on requested fields
    const selectedFields =
      fields.length > 0
        ? fields.filter((f: string) => FIELD_MAP[f])
        : Object.keys(FIELD_MAP);

    const cols = selectedFields.map((f: string) => FIELD_MAP[f]);

    const generateCsvRow = (row: string[]) =>
      row
        .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
        .join(",");

    let csvContent = `\uFEFF${generateCsvRow(cols)}\n`;

    data.forEach((t: any) => {
      const rowData = selectedFields.map((f: string) => {
        const val = t[f];
        if (f === "isComplete") return val ? "Yes" : "No";
        if (f === "attended") return val ? "Yes" : "No";
        return val || "";
      });
      csvContent += `${generateCsvRow(rowData)}\n`;
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="event_teams_export_${filter}.csv"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
};
