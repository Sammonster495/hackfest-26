"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { scanAttendance, fetchTeamDetails } from "./request";
import { Loader2 } from "lucide-react";

type QRScannerProps = {
    onScanSuccess: () => void;
};

interface Member {
    id: string;
    name: string;
    email: string;
    attended?: boolean;
}

interface TeamData {
    id: string;
    name: string;
    members: Member[];
}

export function QRScanner({ onScanSuccess }: QRScannerProps) {
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [isScanning, setIsScanning] = useState(true);
    const [isLoadingTeam, setIsLoadingTeam] = useState(false);
    const [isMarking, setIsMarking] = useState(false);

    const [scannedTeam, setScannedTeam] = useState<TeamData | null>(null);
    const [presentMembers, setPresentMembers] = useState<Record<string, boolean>>({});

    const [scanStatus, setScanStatus] = useState<{
        teamName: string;
        alreadyMarked: boolean;
    } | null>(null);

    const processScannedCode = async (teamId: string) => {
        setResult(teamId);
        setIsScanning(false);
        setScanStatus(null);
        setError(null);
        setIsLoadingTeam(true);

        const team = await fetchTeamDetails(teamId);

        if (!team) {
            setError("Invalid QR Code or Team not found.");
            setIsLoadingTeam(false);
            return;
        }

        setScannedTeam(team);

        // Default all members to present if not scanned before
        const initialPresence: Record<string, boolean> = {};
        if (team.members && Array.isArray(team.members)) {
            team.members.forEach((m: any) => {
                initialPresence[m.id] = team.attended ? !!m.attended : true;
            });
        }
        setPresentMembers(initialPresence);
        setIsLoadingTeam(false);
    };

    const toggleMember = (memberId: string) => {
        setPresentMembers(prev => ({
            ...prev,
            [memberId]: !prev[memberId]
        }));
    };

    const handleMarkAttendance = async () => {
        if (!result) return;

        setIsMarking(true);
        const presentParticipantIds = Object.entries(presentMembers)
            .filter(([_, isPresent]) => isPresent)
            .map(([id]) => id);

        const data = await scanAttendance({
            teamId: result,
            presentParticipantIds
        });

        setIsMarking(false);

        if (data) {
            setScanStatus(data);
            onScanSuccess();
        } else {
            setError("Failed to mark attendance.");
        }

        // Reset view but show status until they click Start Camera
        setScannedTeam(null);
        setResult(null);
    };

    const clearScanResults = () => {
        setResult(null);
        setError(null);
        setScanStatus(null);
        setScannedTeam(null);
    };

    return (
        <div className="relative flex flex-col items-center w-full max-w-md mx-auto">
            {isScanning ? (
                <>
                    <div className="w-full aspect-square relative overflow-hidden rounded-lg border border-border bg-black">
                        <Scanner
                            onScan={(detectedCodes: string | any[]) => {
                                if (detectedCodes && detectedCodes.length > 0) {
                                    const val = detectedCodes[0].rawValue;
                                    void processScannedCode(val);
                                }
                            }}
                            onError={(error: unknown) => {
                                setError(error instanceof Error ? error.message : "Unknown error");
                            }}
                            paused={!isScanning}
                            constraints={{ facingMode: "environment" }}
                            components={{ onOff: false, torch: false, zoom: false, finder: false }}
                            styles={{
                                container: { width: "100%", height: "100%" },
                                video: { width: "100%", height: "100%", objectFit: "cover" },
                            }}
                        />
                    </div>
                    <div className="mt-2 text-center text-sm text-muted-foreground">
                        <span className="text-amber-500">Note:</span> If you are not seeing
                        the detection, try moving the camera closer to the QR code.
                    </div>
                </>
            ) : (
                <div className="w-full min-h-[300px] flex flex-col items-center justify-center p-4 border rounded-lg bg-card">
                    {isLoadingTeam && (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Fetching team details...</p>
                        </div>
                    )}

                    {scannedTeam && !isLoadingTeam && (
                        <div className="w-full space-y-4">
                            <div className="text-center">
                                <h3 className="text-xl font-bold">{scannedTeam.name}</h3>
                                <p className="text-sm text-muted-foreground">Verify team members present</p>
                            </div>

                            <div className="space-y-3 mt-4 border rounded-md p-3 max-h-[40vh] overflow-y-auto">
                                {scannedTeam.members?.map((member) => (
                                    <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                                        <Checkbox
                                            id={`member-${member.id}`}
                                            checked={!!presentMembers[member.id]}
                                            onCheckedChange={() => toggleMember(member.id)}
                                        />
                                        <label
                                            htmlFor={`member-${member.id}`}
                                            className="flex-1 text-sm font-medium leading-none cursor-pointer"
                                        >
                                            {member.name}
                                            <span className="block text-xs font-normal text-muted-foreground mt-1">
                                                {member.email}
                                            </span>
                                        </label>
                                    </div>
                                ))}
                                {(!scannedTeam.members || scannedTeam.members.length === 0) && (
                                    <p className="text-sm text-center text-muted-foreground py-2">No members found</p>
                                )}
                            </div>

                            <Button
                                className="w-full mt-4"
                                size="lg"
                                onClick={handleMarkAttendance}
                                disabled={isMarking}
                            >
                                {isMarking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isMarking ? "Confirming..." : "Confirm Attendance"}
                            </Button>
                        </div>
                    )}

                    {scanStatus && !scannedTeam && !isLoadingTeam && (
                        <div className="text-center py-6">
                            <Badge className="px-4 py-1 text-sm" variant={scanStatus.alreadyMarked ? "warning" : "success"}>
                                {scanStatus.alreadyMarked
                                    ? `${scanStatus.teamName} already marked`
                                    : `${scanStatus.teamName} attendance marked!`}
                            </Badge>
                        </div>
                    )}

                    {error && !scannedTeam && !isLoadingTeam && (
                        <div className="text-center py-6">
                            <Badge variant="destructive" className="px-4 py-1 text-sm">Error: {error}</Badge>
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-2 mt-4">
                {!isScanning && (
                    <Button
                        variant="outline"
                        onClick={() => {
                            clearScanResults();
                            setIsScanning(true);
                        }}
                    >
                        {scanStatus || error ? "Scan Next QR" : "Cancel & Scan Again"}
                    </Button>
                )}
            </div>
        </div>
    );
}