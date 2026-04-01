import { NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import { exportTeamsData } from "~/db/services/idea-services";
import { errorResponse } from "~/lib/response/error";

const exportSchema = z.object({
  teamIds: z.array(z.string().min(1)).min(1),
  exportType: z.enum(["leader_emails", "all_emails", "csv"]),
  columns: z.array(z.string()).optional(),
});

export const POST = adminProtected(async (request, _ctx, _user) => {
  try {
    const body = await request.json();
    const parsed = exportSchema.parse(body);
    const data = await exportTeamsData(parsed.teamIds);

    if (parsed.exportType === "leader_emails") {
      const emails = data.map((t) => t.leaderEmail).filter(Boolean);
      const text = Array.from(new Set(emails)).join("\n");
      return new NextResponse(text, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="leader_emails.txt"`,
        },
      });
    }

    if (parsed.exportType === "all_emails") {
      const emails = new Set<string>();
      data.forEach((t) => {
        if (t.allEmails) {
          t.allEmails.split(", ").forEach((e) => {
            if (e.trim()) emails.add(e.trim());
          });
        }
      });
      const text = Array.from(emails).join("\n");
      return new NextResponse(text, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="all_emails.txt"`,
        },
      });
    }

    const defaultCols = [
      "Team Name",
      "Leader Name",
      "Leader Email",
      "All Emails",
      "College",
      "State",
      "Track",
      "Stage",
      "Progress",
      "PPT URL",
      "Leader Phone",
      "Phone",
    ];
    const cols =
      parsed.columns && parsed.columns.length > 0
        ? parsed.columns
        : defaultCols;

    const generateCsvRow = (row: string[]) =>
      row
        .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
        .join(",");

    let csvContent = `${generateCsvRow(cols)}\n`;

    data.forEach((t) => {
      const rowData = [];
      for (const col of cols) {
        if (col === "Team Name") rowData.push(t.teamName || "");
        else if (col === "Leader Name") rowData.push(t.leaderName || "");
        else if (col === "Leader Email") rowData.push(t.leaderEmail || "");
        else if (col === "All Emails") rowData.push(t.allEmails || "");
        else if (col === "College") rowData.push(t.collegeName || "");
        else if (col === "State") rowData.push(t.stateName || "");
        else if (col === "Track") rowData.push(t.trackName || "");
        else if (col === "Stage") rowData.push(t.teamStage || "");
        else if (col === "Progress") rowData.push(t.teamProgress || "");
        else if (col === "PPT URL") rowData.push(t.pptUrl || "");
        else if (col === "Leader Phone") rowData.push(t.leaderPhone || "");
        else if (col === "Phone") rowData.push(t.allPhones || "");
        else rowData.push("");
      }
      csvContent += `${generateCsvRow(rowData)}\n`;
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="hackfest_teams_export.csv"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
