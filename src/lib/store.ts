// src/lib/store.ts
export const editingRecordId = writable<string | null>(null);
export const currentRoute = writable<'dashboard' | 'form' | 'gallery'>('dashboard');
import { writable, derived } from 'svelte/store';
import { db } from './db';
import type { Workspace, RecordEntry, ComputedStats } from './types';

// --- CORE STATE ---
export const workspaces = writable<Workspace[]>([]);
export const currentWorkspaceId = writable<string | null>(null);
export const currentRecords = writable<RecordEntry[]>([]);

// --- COMPUTED STATE (The "Prevention is Better than Cure" Engine) ---

// 1. Instantly calculate stats based on currentRecords. Zero chance of desync.
export const activeStats = derived(currentRecords, ($records): ComputedStats => {
    const bldSet = new Set<string>();
    const resBldSet = new Set<string>();
    const nonResBldSet = new Set<string>();
    const chSet = new Set<number>();
    
    let pop = 0;
    let hh = 0;

    $records.forEach(r => {
        bldSet.add(r.buildingNo);
        chSet.add(r.cHouseNo);
        
        if (r.type <= 2) {
            resBldSet.add(r.buildingNo);
            hh++;
            pop += (r.members || 0);
        } else if (r.type >= 3 && r.type <= 10) {
            nonResBldSet.add(r.buildingNo);
        }
    });

    return {
        totalPop: pop,
        totalHouseholds: hh,
        totalCHouses: chSet.size,
        totalBuildings: bldSet.size,
        resBuildings: resBldSet.size,
        nonResBuildings: nonResBldSet.size
    };
});

// 2. The Smart Predictor: Automatically finds the last entered record to ghost-fill the next form.
export const lastRecordTemplate = derived(currentRecords, ($records) => {
    if ($records.length === 0) return null;
    // Sort by lineNo to ensure we get the absolute latest physical entry
    const sorted = [...$records].sort((a, b) => b.lineNo - a.lineNo);
    return sorted[0]; 
});