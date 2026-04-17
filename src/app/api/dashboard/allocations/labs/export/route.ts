import { inArray } from "drizzle-orm";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import { participants, teams as teamsSchema } from "~/db/schema";
import { getSelectedTeamsForLabAllocation } from "~/db/services/allocation-services";
import { errorResponse } from "~/lib/response/error";

export const POST = adminProtected(async () => {
  try {
    const data = await getSelectedTeamsForLabAllocation();

    const teamIds = data.map((t) => t.teamId).filter(Boolean);
    const memberRows =
      teamIds.length > 0
        ? await db
            .select({
              id: participants.id,
              teamId: participants.teamId,
              name: participants.name,
              alias: participants.alias,
            })
            .from(participants)
            .where(inArray(participants.teamId, teamIds))
        : [];

    const teamLeaderRows =
      teamIds.length > 0
        ? await db
            .select({
              id: teamsSchema.id,
              leaderId: teamsSchema.leaderId,
            })
            .from(teamsSchema)
            .where(inArray(teamsSchema.id, teamIds))
        : [];

    const leadersMap = new Map(teamLeaderRows.map((t) => [t.id, t.leaderId]));
    const membersMap = new Map<string, typeof memberRows>();
    for (const m of memberRows) {
      if (!m.teamId) continue;
      if (!membersMap.has(m.teamId)) membersMap.set(m.teamId, []);
      membersMap.get(m.teamId)?.push(m);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Labs Allocation Export");

    worksheet.columns = [
      { header: "Team No", key: "teamNo", width: 12 },
      { header: "Team Name", key: "teamName", width: 25 },
      { header: "Track", key: "track", width: 20 },
      { header: "College", key: "college", width: 30 },
      { header: "Member Count", key: "memberCount", width: 15 },
      { header: "Assigned Lab", key: "assignedLab", width: 25 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 24;

    for (const team of data) {
      worksheet.addRow({
        teamNo: team.teamNo || "",
        teamName: team.teamName || "",
        track: team.trackName || "",
        college: team.collegeName || "",
        memberCount: team.memberCount || 0,
        assignedLab: team.assignedLabName || "Unassigned",
      });
    }

    worksheet.eachRow({ includeEmpty: true }, (row, rowNum) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        if (rowNum > 1) {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        }
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });
    });

    const labsGroups = new Map<
      string,
      { originalName: string; teams: typeof data }
    >();
    for (const team of data) {
      const labName = team.assignedLabName || "Unassigned";
      // Sanitize sheet name for Excel (max 31 chars, no invalid chars)
      const sheetName = labName.replace(/[\\/?*[\]:]/g, "-").substring(0, 31);

      if (!labsGroups.has(sheetName)) {
        labsGroups.set(sheetName, { originalName: labName, teams: [] });
      }
      labsGroups.get(sheetName)?.teams.push(team);
    }

    // Sort sheets: Assigned labs first (alphabetically), then Unassigned
    const sortedSheetNames = Array.from(labsGroups.keys()).sort((a, b) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      return a.localeCompare(b);
    });

    for (const sheetName of sortedSheetNames) {
      const group = labsGroups.get(sheetName)!;
      const labSheet = workbook.addWorksheet(sheetName);

      // Add a prominent header row for the Lab Name
      labSheet.mergeCells("A1:F1");
      const titleCell = labSheet.getCell("A1");
      titleCell.value = `Lab: ${group.originalName}`;
      titleCell.font = { bold: true, size: 16, color: { argb: "FF2563EB" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      labSheet.getRow(1).height = 40;

      // Create standard columns for this sheet
      labSheet.columns = [
        { key: "teamNo", width: 12 },
        { key: "teamName", width: 30 },
        { key: "track", width: 20 },
        { key: "college", width: 35 },
        { key: "memberCount", width: 15 },
        { key: "memberName", width: 30 },
      ];

      // Insert actual Header Row
      const labHeaderRow = labSheet.getRow(2);
      labHeaderRow.values = [
        "Team No",
        "Team Name",
        "Track",
        "College",
        "Member Count",
        "Member Name",
      ];
      labHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      labHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF374151" },
      };
      labHeaderRow.alignment = { vertical: "middle", horizontal: "center" };
      labHeaderRow.height = 20;

      const teamMergeRanges: { startRow: number; endRow: number }[] = [];
      const teamLevelColIndices = [1, 2, 3, 4, 5]; // columns to merge (all except memberName)

      let currentRow = 3;

      for (const team of group.teams) {
        const teamMembers = membersMap.get(team.teamId) || [];
        const leaderId = leadersMap.get(team.teamId);

        let membersArray = teamMembers;
        if (membersArray.length === 0) {
          membersArray = [
            {
              id: "none",
              name: "No Members",
              teamId: team.teamId,
              alias: null,
            },
          ];
        }

        membersArray.sort((a, b) => {
          if (a.id === leaderId) return -1;
          if (b.id === leaderId) return 1;
          return 0;
        });

        const teamStartRow = currentRow;

        for (const member of membersArray) {
          const isLeader = member.id === leaderId;
          const displayName = member.name || "Unknown";
          const finalName = isLeader ? `${displayName} (Leader)` : displayName;

          labSheet.addRow({
            teamNo: team.teamNo || "",
            teamName: team.teamName || "",
            track: team.trackName || "",
            college: team.collegeName || "",
            memberCount: team.memberCount || 0,
            memberName: finalName,
          });
          currentRow++;
        }

        const teamEndRow = currentRow - 1;
        if (teamEndRow > teamStartRow) {
          teamMergeRanges.push({ startRow: teamStartRow, endRow: teamEndRow });
        }
      }

      for (const range of teamMergeRanges) {
        for (const colIdx of teamLevelColIndices) {
          labSheet.mergeCells(range.startRow, colIdx, range.endRow, colIdx);
        }
      }

      // Apply borders and alignment
      for (let rowNum = 2; rowNum < currentRow; rowNum++) {
        const row = labSheet.getRow(rowNum);
        row.eachCell({ includeEmpty: true }, (cell) => {
          if (rowNum > 2) {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          }
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
        });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="hackfest_labs_allocation.xlsx"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
