<script lang="ts">
    import type { RecordEntry } from './lib/types';
    import { SmartEngine } from './lib/smartEngine';
    import { currentRoute, editingRecordId } from './lib/store';
    export let record: RecordEntry;

    let isExpanded = false;
    const pad3 = (num: number) => String(num).padStart(3, '0');
    const pad4 = (num: number) => String(num).padStart(4, '0');
    
    $: isNonRes = record.type >= 3;
    $: title = isNonRes ? (record.remarks || 'Non-Residential') : (record.headName || 'Unnamed Household');

    async function handleDelete() {
        if (confirm(`Are you sure you want to permanently delete Line No. ${record.lineNo}?`)) {
            const shiftSequence = confirm(`Do you want to SHIFT all subsequent Line Numbers down to close the gap?\n\n[OK] = Shift Numbers\n[Cancel] = Leave a Gap`);
            await SmartEngine.deleteRecord(record.workspaceId, record.id, record.lineNo, shiftSequence);
        }
    }

    function handleEdit() {
        editingRecordId.set(record.id);
        currentRoute.set('form');
    }

    // ⚡ PWA SECURITY BYPASS FOR NATIVE DIALER
    function handleCall(e: Event) {
        e.stopPropagation();
        window.open(`tel:${record.mobile}`, '_top') || (window.location.href = `tel:${record.mobile}`);
    }
</script>

<div class="bg-white dark:bg-[#0F0F0F] border border-slate-200 dark:border-white/10 rounded-xl flex flex-col relative overflow-hidden transition-all duration-300 shadow-sm {record.isIgnored ? 'border-rubyError shadow-[0_0_15px_rgba(244,63,94,0.2)]' : ''}">
    
    <div class="p-3 flex items-center justify-between w-full cursor-pointer active:bg-slate-50 dark:active:bg-white/5" on:click={() => isExpanded = !isExpanded}>
        <div class="flex-1 pr-3">
            <div class="flex flex-wrap gap-2 mb-1 text-[10px] font-bold">
                <span class="text-slate-400 dark:text-white/50 tracking-wider">L.N. <span class="text-slate-800 dark:text-white">{pad3(record.lineNo)}</span></span>
                <span class="text-slate-400 dark:text-white/50 tracking-wider border-l border-slate-200 dark:border-white/20 pl-2">B.N. <span class="text-slate-800 dark:text-white">{record.buildingNo}</span></span>
                <span class="text-slate-400 dark:text-white/50 tracking-wider border-l border-slate-200 dark:border-white/20 pl-2">C.H.N. <span class="text-slate-800 dark:text-white">{pad4(record.cHouseNo)}</span></span>
                <span class="text-slate-400 dark:text-white/50 tracking-wider border-l border-slate-200 dark:border-white/20 pl-2">H.N. <span class="text-slate-800 dark:text-white">{record.householdNo ? pad3(record.householdNo) : '-'}</span></span>
            </div>
            <p class="text-sm font-extrabold truncate {isNonRes ? 'text-slate-400 dark:text-white/50 italic' : 'text-emeraldPro drop-shadow-sm'}">
                [{record.type}] {title}
            </p>
        </div>
        <div class="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-white/50 text-xs border border-slate-200 dark:border-white/10">
            {isExpanded ? '▲' : '▼'}
        </div>
    </div>

    {#if isExpanded}
        <div class="px-3 pb-3 border-t border-slate-100 dark:border-white/10 pt-3 bg-slate-50 dark:bg-black/40">
            <div class="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-500 dark:text-white/70 mb-3">
                <p>Members: <span class="text-slate-800 dark:text-white font-bold">{record.members || 1}</span></p>
                <p>Type: <span class="text-slate-800 dark:text-white font-bold">{record.type}</span></p>
                {#if record.mobile}
                    <p class="col-span-2">Mobile: <span class="text-slate-800 dark:text-white font-bold">{record.mobile}</span></p>
                {/if}
            </div>
            
            <div class="flex gap-2 border-t border-slate-200 dark:border-white/5 pt-3">
                <button on:click|stopPropagation={handleEdit} class="flex-1 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform flex items-center justify-center gap-1 border border-slate-300 dark:border-white/20">
                    ✏️ Edit
                </button>
                {#if record.mobile}
                    <button on:click={handleCall} class="flex-1 bg-emeraldPro/20 dark:bg-emeraldPro/10 text-emeraldPro py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform flex items-center justify-center gap-1 border border-emeraldPro/30">
                        📞 Call
                    </button>
                {/if}
                <button on:click|stopPropagation={handleDelete} class="flex-1 bg-rubyError/10 text-rubyError py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform flex items-center justify-center gap-1 border border-rubyError/30">
                    🗑️ Delete
                </button>
            </div>
        </div>
    {/if}
</div>