<script lang="ts">
    import { onMount } from 'svelte';
    export let value: number = 1;
    export let max: number = 20;
    
    let wheelRef: HTMLDivElement;
    let isExpanded = false;
    let numbers = Array.from({ length: max }, (_, i) => i + 1);
    
    function toggleExpand() {
        isExpanded = !isExpanded;
        if (isExpanded && wheelRef) {
            setTimeout(() => wheelRef.scrollTop = (value - 1) * 40, 10);
        }
    }

    function handleScroll() {
        if (!wheelRef || !isExpanded) return;
        // ⚡ Math.round fixes the off-by-one error
        const activeIndex = Math.round(wheelRef.scrollTop / 40);
        if (activeIndex >= 0 && activeIndex < max) {
            value = numbers[activeIndex];
        }
    }

    // Collapse wheel when user taps outside of it
    function handleOutsideClick(e: MouseEvent) {
        if (isExpanded && wheelRef && !wheelRef.contains(e.target as Node)) {
            isExpanded = false;
        }
    }
</script>

<svelte:window on:click={handleOutsideClick} />

<div on:click|stopPropagation={toggleExpand} class="relative bg-slate-100 dark:bg-[#050505] border border-slate-300 dark:border-white/10 rounded-xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer {isExpanded ? 'h-[160px] shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emeraldPro' : 'h-[46px]'}">
    
    {#if !isExpanded}
        <div class="absolute inset-0 flex items-center justify-center text-slate-800 dark:text-white font-bold text-lg">
            {value} <span class="ml-2 text-xs opacity-50">▼</span>
        </div>
    {:else}
        <div class="absolute top-[60px] left-0 right-0 h-[40px] border-y border-emeraldPro/30 bg-emeraldPro/10 pointer-events-none z-10"></div>
        <div bind:this={wheelRef} on:scroll={handleScroll} class="h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative z-0" style="mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);">
            <div class="h-[60px] snap-center"></div>
            {#each numbers as num}
                <div class="h-[40px] flex items-center justify-center snap-center transition-all duration-200 {value === num ? 'text-emeraldPro text-2xl font-black' : 'text-slate-400 dark:text-white/30 text-sm font-bold'}">
                    {num}
                </div>
            {/each}
            <div class="h-[60px] snap-center"></div>
        </div>
    {/if}
</div>

<style>
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>