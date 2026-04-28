// src/lib/types.ts

// The Workspace (Area) Definition
export interface Workspace {
    id: string;          // e.g., crypto.randomUUID()
    areaName: string;
    areaCode: string;
    timestamp: number;
}

// The Flat Record Definition (Highly optimized for AI and filtering)
export interface RecordEntry {
    id: string;
    workspaceId: string; // Links back to the Area
    lineNo: number;      // The physical sequence number
    buildingNo: string;  // Can contain letters (e.g., "12A")
    cHouseNo: number;    // Census House Number
    type: number;        // 1-10 classification
    householdNo: number | null; // Null for Non-Residential
    headName: string | null;    // Null for Non-Residential
    members: number | null;     // Null for Non-Residential
    remarks: string | null;     // Used for Institution Names
    mobile: string | null;      // Optional 10-digit
    isIgnored: boolean;         // For the Conflict Engine (acknowledged errors)
    timestamp: number;
}

// Stats are calculated dynamically, not stored in the DB, to prevent desync bugs.
export interface ComputedStats {
    totalPop: number;
    totalHouseholds: number;
    totalCHouses: number;
    totalBuildings: number;
    resBuildings: number;
    nonResBuildings: number;
}