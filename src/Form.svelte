<script lang="ts">
    import { onMount } from 'svelte';
    import { db } from './lib/db';
    import { SmartEngine } from './lib/smartEngine';
    import { lastRecordTemplate, currentWorkspaceId, currentRoute, currentRecords, editingRecordId } from './lib/store';
    import type { RecordEntry } from './lib/types';
    import AlarmWheel from './AlarmWheel.svelte';

    let id = '';
    let lineNo = '001';
    let buildingNo = '';
    let cHouseNo = '0001';
    let type = 1; 
    let householdNo = '001';
    let headName = '';
    let members: number = 1; 
    let remarks = '';
    let mobile = ''; 

    $: isResidential = type <= 2;
    $: mobileColorClass = mobile.length === 10 ? 'border-emeraldPro bg-emeraldPro/10 text-emeraldPro shadow-[0_0_15px_rgba(16,185,129,0.1)]' : (mobile.length > 0 ? 'border-rubyError bg-rubyError/10 text-rubyError shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 'border-slate-300 dark:border-white/10 bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-white');

    const pad3 = (num: number | string) => String(num).padStart(3, '0');
    const pad4 = (num: number | string) => String(num).padStart(4, '0');

    onMount(async () => {
        if ($editingRecordId) {
            const rec = $currentRecords.find(r => r.id === $editingRecordId);
            if (rec) {
                id = rec.id; lineNo = pad3(rec.lineNo); buildingNo = rec.buildingNo;
                cHouseNo = pad4(rec.cHouseNo); type = rec.type; remarks = rec.remarks || '';
                householdNo = rec.householdNo ? pad3(rec.householdNo) : '';
                headName = rec.headName || ''; members = rec.members || 1; mobile = rec.mobile || '';
            }
        } else if ($currentWorkspaceId) {
            applyGhostFill();
        }
    });

    function applyGhostFill() {
        const last = $lastRecordTemplate;
        if (last) {
            lineNo = pad3(last.lineNo + 1);
            cHouseNo = pad4(last.cHouseNo + 1);
        } else {
            lineNo = '001'; cHouseNo = '0001';
        }

        // ⚡ HOUSEHOLD BUG FIX: Search backward for the absolute last Residential record
        const lastRes = [...$currentRecords].sort((a,b) => b.lineNo - a.lineNo).find(r => r.type <= 2 && r.householdNo);
        householdNo = lastRes ? pad3(lastRes.householdNo + 1) : pad3(1);
    }

    function repBld() { if ($lastRecordTemplate) buildingNo = $lastRecordTemplate.buildingNo; }
    function repCH() { if ($lastRecordTemplate) cHouseNo = pad4($lastRecordTemplate.cHouseNo); }

    function enforceDigits(e: Event) {
        const input = e.target as HTMLInputElement;
        input.value = input.value.replace(/\D/g, '');
    }

    async function commitEntry() {
        if (!$currentWorkspaceId) return alert("Error: No Active Area.");
        if (mobile.length > 0 && mobile.length !== 10) return alert("Mobile number must be exactly 10 digits or left blank.");

        const parsedLine = parseInt(lineNo, 10);
        const parsedCH = parseInt(cHouseNo, 10);
        const parsedHH = parseInt(householdNo, 10);

        if (isNaN(parsedLine) || isNaN(parsedCH)) return alert("Line and C.House numbers must be valid.");

        const newRecord: RecordEntry = {
            id: id || crypto.randomUUID(),
            workspaceId: $currentWorkspaceId,
            lineNo: parsedLine, buildingNo, cHouseNo: parsedCH, type,
            householdNo: isResidential && !isNaN(parsedHH) ? parsedHH : null,
            headName: isResidential ? headName : null,
            members: isResidential ? members : null,
            remarks: !isResidential ? remarks : null,
            mobile: mobile || null,
            isIgnored: false,
            timestamp: Date.now()
        };

        const conflicts = await SmartEngine.scanForConflicts(newRecord);
        if (conflicts.length > 0) {
            if (!confirm(`⚠️ CONFLICT DETECTED:\n\n${conflicts.join('\n')}\n\nForce save anyway?`)) return; 
            newRecord.isIgnored = true;
        }

        await db.records.put(newRecord); 
        await SmartEngine.refreshStore($currentWorkspaceId);
        editingRecordId.set(null);
        currentRoute.set('dashboard');
    }

    function handleAbort() { editingRecordId.set(null); currentRoute.set('dashboard'); }
</script>

<form on:submit|preventDefault={commitEntry} class="space-y-6 mt-2 pb-32 max-w-md mx-auto">
    
    {#if $lastRecordTemplate}
        <div class="bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 p-2 rounded-lg flex gap-3 text-[10px] uppercase font-bold text-slate-500 dark:text-white/40 tracking-widest justify-center">
            <span>Last: L.{pad3($lastRecordTemplate.lineNo)}</span>
            <span>B.{$lastRecordTemplate.buildingNo}</span>
            <span>C.{pad4($lastRecordTemplate.cHouseNo)}</span>
        </div>
    {/if}

    <div class="grid grid-cols-2 gap-4">
        <div class="relative">
            <label class="block text-[10px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest mb-1">1. Line No.</label>
            <input type="text" inputmode="numeric" bind:value={lineNo} on:input={enforceDigits} on:blur={() => lineNo = pad3(lineNo || '1')} required class="w-full bg-white dark:bg-[#0A0A0A] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-xl p-3.5 focus:border-emeraldPro outline-none font-bold text-lg shadow-sm" />
        </div>
        
        <div class="relative">
            <div class="flex justify-between items-center mb-1">
                <label class="text-[10px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest">2. Building</label>
                {#if !id && $lastRecordTemplate}
                    <button type="button" on:click={repBld} class="text-[9px] bg-emeraldPro/10 text-emeraldPro px-2 py-1 rounded border border-emeraldPro/20 font-bold active:scale-95 uppercase tracking-widest">📋 Rep: {$lastRecordTemplate.buildingNo}</button>
                {/if}
            </div>
            <input type="text" bind:value={buildingNo} required class="w-full bg-white dark:bg-[#0A0A0A] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-xl p-3.5 focus:border-emeraldPro outline-none font-bold text-lg shadow-sm" />
        </div>
    </div>

    <div class="relative">
        <div class="flex justify-between items-center mb-1">
            <label class="text-[10px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest">3. C. House No.</label>
            {#if !id && $lastRecordTemplate}
                <button type="button" on:click={repCH} class="text-[9px] bg-emeraldPro/10 text-emeraldPro px-2 py-1 rounded border border-emeraldPro/20 font-bold active:scale-95 uppercase tracking-widest">📋 Rep: {pad4($lastRecordTemplate.cHouseNo)}</button>
            {/if}
        </div>
        <input type="text" inputmode="numeric" bind:value={cHouseNo} on:input={enforceDigits} on:blur={() => cHouseNo = pad4(cHouseNo || '1')} required class="w-full bg-white dark:bg-[#0A0A0A] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-xl p-3.5 focus:border-emeraldPro outline-none font-bold text-lg shadow-sm" />
    </div>

    <div>
        <label class="block text-[10px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest mb-1">4. Type</label>
        <select bind:value={type} required class="w-full bg-white dark:bg-[#0A0A0A] border border-slate-300 dark:border-white/10 text-emeraldPro font-bold rounded-xl p-3.5 focus:border-emeraldPro outline-none appearance-none text-lg shadow-sm">
            <option value={1}>1. Residential</option><option value={2}>2. Res + Other</option>
            <option value={3}>3. Shop / Office</option><option value={4}>4. School / College</option>
            <option value={5}>5. Hotel / Lodge</option><option value={6}>6. Hospital / Clinic</option>
            <option value={7}>7. Factory / Workshop</option><option value={8}>8. Place of Worship</option>
            <option value={9}>9. Other Non-Residential</option><option value={10}>10. Vacant</option>
        </select>
    </div>

    {#if isResidential}
        <div class="space-y-5 p-5 border border-emeraldPro/30 bg-emeraldPro/10 dark:bg-emeraldPro/5 rounded-2xl relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-32 h-32 bg-emeraldPro/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div class="relative z-10">
                <label class="block text-[10px] font-bold text-emeraldPro uppercase tracking-widest mb-1">5. Household No.</label>
                <input type="text" inputmode="numeric" bind:value={householdNo} on:input={enforceDigits} on:blur={() => householdNo = pad3(householdNo || '1')} required class="w-full bg-white dark:bg-[#050505] border border-emeraldPro/20 text-slate-900 dark:text-white rounded-xl p-3.5 focus:border-emeraldPro outline-none font-bold text-lg shadow-sm" />
            </div>
            
            <div class="relative z-10">
                <label class="block text-[10px] font-bold text-emeraldPro uppercase tracking-widest mb-1">6. Head of Household</label>
                <input type="text" bind:value={headName} required class="w-full bg-white dark:bg-[#050505] border border-emeraldPro/20 text-slate-900 dark:text-white rounded-xl p-3.5 focus:border-emeraldPro outline-none font-bold text-lg shadow-sm" />
            </div>
            
            <div class="flex gap-4 relative z-10">
                <div class="w-20 shrink-0">
                    <label class="block text-[10px] font-bold text-emeraldPro uppercase tracking-widest mb-2">Members</label>
                    <AlarmWheel bind:value={members} max={40} />
                </div>
                <div class="flex flex-col flex-1">
                    <label class="block text-[10px] font-bold text-emeraldPro uppercase tracking-widest mb-2">Mobile (Opt)</label>
                    <input type="text" inputmode="numeric" maxlength="10" bind:value={mobile} on:input={enforceDigits} placeholder="10 Digits" class="w-full rounded-xl p-3.5 font-bold outline-none transition-all duration-300 text-lg shadow-sm flex-1 {mobileColorClass}" />
                </div>
            </div>
        </div>
    {:else}
        <div>
            <label class="block text-[10px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest mb-1">Remarks (Institution Name)</label>
            <input type="text" bind:value={remarks} class="w-full bg-white dark:bg-[#0A0A0A] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-xl p-3.5 focus:border-emeraldPro outline-none font-bold text-lg shadow-sm" />
        </div>
    {/if}

    <div class="pt-4 grid grid-cols-3 gap-3">
        <button type="button" on:click={handleAbort} class="col-span-1 bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white/50 font-bold py-4 rounded-xl active:scale-95 transition-transform border border-slate-300 dark:border-white/10">Cancel</button>
        <button type="submit" class="col-span-2 bg-emeraldPro text-white dark:text-black font-black py-4 rounded-xl active:scale-95 transition-transform shadow-[0_5px_20px_rgba(16,185,129,0.3)]">{id ? 'Update Entry' : 'Commit Entry'}</button>
    </div>
</form>