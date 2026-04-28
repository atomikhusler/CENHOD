// src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import type { Workspace, RecordEntry } from './types';

// The Draft Blueprint
export interface DraftEntry {
    id: string; // Always 'current_draft'
    workspaceId: string;
    formData: string; // Stringified JSON of the form inputs
    timestamp: number;
}

export class CenHodDatabase extends Dexie {
    workspaces!: Table<Workspace, string>;
    records!: Table<RecordEntry, string>;
    drafts!: Table<DraftEntry, string>; // The new Ghost Draft table

    constructor() {
        super('CenHoD_Elite_DB');
        
        this.version(1).stores({
            workspaces: 'id, areaCode, timestamp',
            records: 'id, workspaceId, lineNo, buildingNo, cHouseNo, [workspaceId+cHouseNo]'
        });

        // V2 UPGRADE: Adding the drafts table seamlessly
        this.version(2).stores({
            drafts: 'id, workspaceId'
        });
    }
}

export const db = new CenHodDatabase();