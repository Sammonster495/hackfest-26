import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import { getSelectedTeamsForAllocation } from "~/db/services/allocation-services";
import { errorResponse } from "~/lib/response/error";

export const POST = adminProtected(async () => {
  try {
    const data = await getSelectedTeamsForAllocation();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Dorms Allocation Export");

    worksheet.columns = [
      { header: "Team No", key: "teamNo", width: 12 },
      { header: "Team Name", key: "teamName", width: 25 },
      { header: "College", key: "college", width: 30 },
      { header: "Member Count", key: "memberCount", width: 15 },
      { header: "Gender Group", key: "gender", width: 18 },
      { header: "Assigned Dorm", key: "assignedDorm", width: 25 },
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

    const teamMergeRanges: { startRow: number; endRow: number }[] = [];
    const teamLevelColIndices = [1, 2, 3, 4]; // Columns to merge for Mixed teams

    let currentRow = 2;

    for (const team of data) {
      const teamStartRow = currentRow;

      if (team.teamGender === "Mixed") {
        // Output Male row
        worksheet.addRow({
          teamNo: team.teamNo || "",
          teamName: team.teamName || "",
          college: team.collegeName || "",
          memberCount: team.memberCount || 0,
          gender: "Male Members",
          assignedDorm:
            team.maleDormName ||
            (team.genderCounts.Male > 0 ? "Unassigned" : "N/A"),
        });
        currentRow++;

        // Output Female row
        worksheet.addRow({
          teamNo: team.teamNo || "",
          teamName: team.teamName || "",
          college: team.collegeName || "",
          memberCount: team.memberCount || 0,
          gender: "Female Members",
          assignedDorm:
            team.femaleDormName ||
            (team.genderCounts.Female > 0 ? "Unassigned" : "N/A"),
        });
        currentRow++;

        teamMergeRanges.push({
          startRow: teamStartRow,
          endRow: currentRow - 1,
        });
      } else {
        // Single row for non-mixed
        let genderGroup = team.teamGender;
        const assignedDorm = team.assignedDormName || "Unassigned";

        if (team.teamGender === "Unknown") {
          genderGroup = "Unknown";
        } else if (team.teamGender === "Male") {
          genderGroup = "Male";
        } else if (team.teamGender === "Female") {
          genderGroup = "Female";
        }

        worksheet.addRow({
          teamNo: team.teamNo || "",
          teamName: team.teamName || "",
          college: team.collegeName || "",
          memberCount: team.memberCount || 0,
          gender: genderGroup,
          assignedDorm: assignedDorm,
        });
        currentRow++;
      }
    }

    // Apply merges for row spanning
    for (const range of teamMergeRanges) {
      for (const colIdx of teamLevelColIndices) {
        worksheet.mergeCells(range.startRow, colIdx, range.endRow, colIdx);
      }
    }

    // Apply formatting to cells
    for (let rowNum = 2; rowNum < currentRow; rowNum++) {
      const row = worksheet.getRow(rowNum);
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="hackfest_dorms_allocation.xlsx"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
