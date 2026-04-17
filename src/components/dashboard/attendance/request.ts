import { apiFetch } from "~/lib/fetcher";

export type ScanResult = {
  teamName: string;
  alreadyMarked: boolean;
};

export interface ScanAttendancePayload {
  teamId: string;
  presentParticipantIds?: string[];
}

export async function scanAttendance(
  payload: ScanAttendancePayload,
): Promise<ScanResult | null> {
  try {
    const data = await apiFetch<ScanResult>("/api/dashboard/attendance/scan", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data;
  } catch (_error) {
    return null;
  }
}

export async function fetchTeamDetails(teamId: string) {
  try {
    const res = await fetch(`/api/dashboard/teams/${teamId}`);
    if (!res.ok) throw new Error("Team not found");
    return await res.json();
  } catch (_error) {
    return null;
  }
}

export type TeamRow = {
  id: string;
  name: string;
  paymentStatus: string | null;
  teamStage: string;
  attended: boolean;
  memberCount: number;
  presentCount: number;
  collegeName: string | null;
};

export async function fetchTeamsForAttendance({
  search,
  attended,
  paymentStatus,
  limit,
}: {
  search?: string;
  attended?: string;
  paymentStatus?: string;
  limit?: number;
}): Promise<{
  teams: TeamRow[];
  stats?: { totalCount: number; presentCount: number; absentCount: number };
}> {
  try {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (attended && attended !== "all") params.set("attended", attended);
    if (paymentStatus && paymentStatus !== "all")
      params.set("paymentStatus", paymentStatus);
    if (limit) params.set("limit", limit.toString());

    return await apiFetch<{
      teams: TeamRow[];
      stats?: { totalCount: number; presentCount: number; absentCount: number };
    }>(`/api/dashboard/attendance/teams?${params.toString()}`);
  } catch (error) {
    console.error("Error fetching teams for attendance:", error);
    return { teams: [] };
  }
}

export async function toggleTeamAttendance(
  teamId: string,
  attended: boolean,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/dashboard/teams/${teamId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ attended }),
    });
    return res.ok;
  } catch (_error) {
    return false;
  }
}
