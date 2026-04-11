import ExcelJS from "exceljs";
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Teams Export");

    const columns: Partial<ExcelJS.Column>[] = [
      { header: "Team Name", key: "teamName", width: 25 },
      { header: "Member Name", key: "memberName", width: 22 },
      { header: "Alias", key: "alias", width: 22 },
      { header: "isAliasAvailable", key: "isAliasAvailable", width: 18 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "College", key: "college", width: 30 },
      { header: "State", key: "state", width: 18 },
      { header: "Track", key: "track", width: 18 },
      { header: "Stage", key: "stage", width: 16 },
      { header: "Progress", key: "progress", width: 16 },
      { header: "PPT URL", key: "pptUrl", width: 35 },
      { header: "Payment Status", key: "paymentStatus", width: 16 },
    ];
    worksheet.columns = columns;

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 24;

    const teamMergeRanges: { startRow: number; endRow: number }[] = [];

    const teamLevelColIndices = [1, 7, 8, 9, 10, 11, 12, 13];

    let currentRow = 2;

    data.sort((a, b) => {
      const trackA = (a.trackName || "").toLowerCase();
      const trackB = (b.trackName || "").toLowerCase();
      if (trackA !== trackB) return trackA.localeCompare(trackB);
      const nameA = (a.teamName || "").toLowerCase();
      const nameB = (b.teamName || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    for (const team of data) {
      const members =
        team.members.length > 0
          ? team.members
          : [{ name: null, alias: null, email: null, phone: null }];

      const teamStartRow = currentRow;

      for (const member of members) {
        const memberName = member.name || "";
        const memberAlias = member.alias;
        const isAliasAvailable = memberAlias !== null && memberAlias !== "";
        const aliasValue = isAliasAvailable ? memberAlias : memberName;

        worksheet.addRow({
          teamName: team.teamName || "",
          memberName: memberName,
          alias: aliasValue,
          isAliasAvailable: isAliasAvailable ? "TRUE" : "FALSE",
          email: member.email || "",
          phone: member.phone || "",
          college: team.collegeName || "",
          state: team.stateName || "",
          track: team.trackName || "",
          stage: team.teamStage || "",
          progress: team.teamProgress || "",
          pptUrl: team.pptUrl || "",
          paymentStatus: team.paymentStatus || "",
        });
        currentRow++;
      }

      const teamEndRow = currentRow - 1;

      if (teamEndRow > teamStartRow) {
        teamMergeRanges.push({
          startRow: teamStartRow,
          endRow: teamEndRow,
        });
      }
    }

    for (const range of teamMergeRanges) {
      for (const colIdx of teamLevelColIndices) {
        worksheet.mergeCells(range.startRow, colIdx, range.endRow, colIdx);
        const cell = worksheet.getCell(range.startRow, colIdx);
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    }

    for (let rowNum = 2; rowNum < currentRow; rowNum++) {
      const row = worksheet.getRow(rowNum);
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });
    }

    for (let rowNum = 2; rowNum < currentRow; rowNum++) {
      const cell = worksheet.getCell(rowNum, 4);
      if (cell.value === "TRUE") {
        cell.font = { color: { argb: "FF16A34A" }, bold: true };
      } else {
        cell.font = { color: { argb: "FFDC2626" }, bold: true };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="hackfest_teams_export.xlsx"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
