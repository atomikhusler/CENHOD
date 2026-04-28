<script lang="ts">
    import { activeStats, currentRecords, currentRoute } from './lib/store';
    import Card from './Card.svelte';
    function openForm() { currentRoute.set('form'); }
</script>

<div class="p-3 pb-32 h-full flex flex-col relative animate-fade-in bg-slate-50 dark:bg-black transition-colors duration-300">
    <section class="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-sm shrink-0 mb-3 relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-emeraldPro/10 rounded-full blur-3xl"></div>
        <p class="text-[10px] font-bold text-slate-400 dark:text-white/50 uppercase tracking-widest mb-3 relative z-10">Area Overview</p>
        
        <div class="flex flex-wrap gap-y-4 gap-x-2 justify-between text-center text-sm font-bold relative z-10">
            <div class="w-[30%]"><p class="text-[9px] text-slate-400 dark:text-white/40 tracking-widest mb-1">B.N.</p><p class="text-slate-800 dark:text-white text-lg">{$activeStats.totalBuildings}</p></div>
            <div class="w-[30%]"><p class="text-[9px] text-emeraldPro tracking-widest mb-1">C.H.</p><p class="text-emeraldPro text-xl font-black drop-shadow-sm">{$activeStats.totalCHouses}</p></div>
            <div class="w-[30%]"><p class="text-[9px] text-slate-400 dark:text-white/40 tracking-widest mb-1">H.H.</p><p class="text-slate-800 dark:text-white text-lg">{$activeStats.totalHouseholds}</p></div>
            
            <div class="w-[45%]"><p class="text-[9px] text-slate-400 dark:text-white/40 tracking-widest mb-1">T.Res.</p><p class="text-slate-600 dark:text-white/80 text-base">{$activeStats.resBuildings}</p></div>
            <div class="w-[45%]"><p class="text-[9px] text-slate-400 dark:text-white/40 tracking-widest mb-1">T.N-Res.</p><p class="text-slate-600 dark:text-white/80 text-base">{$activeStats.nonResBuildings}</p></div>
        </div>
    </section>

    <div class="flex-1 space-y-2.5 pb-10">
        {#if $currentRecords.length === 0}
            <div class="flex flex-col items-center justify-center h-40 opacity-50 mt-8">
                <span class="text-4xl mb-2 grayscale">📂</span>
                <p class="text-xs font-bold text-slate-600 dark:text-white">No Records Found</p>
            </div>
        {/if}
        {#each [...$currentRecords].reverse() as record (record.id)}
            <Card {record} />
        {/each}
    </div>

    <button on:click={openForm} class="fixed bottom-8 right-6 bg-emeraldPro text-white dark:text-black w-14 h-14 rounded-full shadow-[0_5px_15px_rgba(16,185,129,0.4)] flex items-center justify-center active:scale-90 transition-transform z-50 border border-emeraldPro/50">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </button>
</div>