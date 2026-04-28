// src/lib/smartEngine.ts
import { db } from './db';
import { currentRecords } from './store';
import type { RecordEntry } from './types';

export const SmartEngine = {
    /**
     * 1. The Conflict Scanner
     * Checks for overlapping Line Numbers or Household Numbers before saving.
     */
    async scanForConflicts(newRecord: RecordEntry): Promise<string[]> {
        const warnings: string[] = [];
        const records = await db.records.where('workspaceId').equals(newRecord.workspaceId).toArray();

        // Rule A: Duplicate Line Number
        const dupLine = records.find(r => r.lineNo === newRecord.lineNo && r.id !== newRecord.id);
        if (dupLine) warnings.push(`Line No. ${newRecord.lineNo} already exists.`);

        // Rule B: Duplicate Household Number inside the same C.House
        if (newRecord.type <= 2 && newRecord.householdNo) {
            const dupHH = records.find(r => 
                r.cHouseNo === newRecord.cHouseNo && 
                r.householdNo === newRecord.householdNo && 
                r.type <= 2 && 
                r.id !== newRecord.id
            );
            if (dupHH) warnings.push(`Household No. ${newRecord.householdNo} is already used in C.House ${newRecord.cHouseNo}.`);
        }
        return warnings;
    },

    /**
     * 2. The Building Cascade Engine
     * Safely updates the building number for ALL records attached to a specific building.
     */
    async cascadeBuildingUpdate(workspaceId: string, oldBuildingNo: string, newBuildingNo: string) {
        // A 'rw' transaction ensures that if one update fails, ALL of them revert.
        await db.transaction('rw', db.records, async () => {
            const linkedRecords = await db.records
                .where('workspaceId').equals(workspaceId)
                .and(r => r.buildingNo === oldBuildingNo)
                .toArray();

            for (const r of linkedRecords) {
                await db.records.update(r.id, { buildingNo: newBuildingNo });
            }
        });
        await this.refreshStore(workspaceId);
    },

/**
     * 3. Context-Aware Deletion
     * Wipes a record and optionally shifts subsequent records down.
     */
    async deleteRecord(workspaceId: string, recordId: string, deletedLineNo: number, shiftSequence: boolean) {
        await db.transaction('rw', db.records, async () => {
            await db.records.delete(recordId);

            if (shiftSequence) {
                const subsequentRecords = await db.records
                    .where('workspaceId').equals(workspaceId)
                    .and(r => r.lineNo > deletedLineNo)
                    .toArray();

                for (const r of subsequentRecords) {
                    await db.records.update(r.id, { lineNo: r.lineNo - 1 });
                }
            }
        });
        await this.refreshStore(workspaceId);
    },
    
    /**
     * Syncs the offline database back to our lightning-fast Svelte Store
     */
    async refreshStore(workspaceId: string) {
        const records = await db.records.where('workspaceId').equals(workspaceId).sortBy('lineNo');
        currentRecords.set(records);
    }
};