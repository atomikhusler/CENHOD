<script lang="ts">
  import './app.css';
  import { onMount } from 'svelte';
  import { db } from './lib/db';
  import { SmartEngine } from './lib/smartEngine';
  import { currentWorkspaceId, currentRoute, workspaces, currentRecords } from './lib/store';
  import { ExportEngine } from './lib/exportEngine';
  import { CryptoEngine } from './lib/cryptoEngine';
  import Dashboard from './Dashboard.svelte';
  import Form from './Form.svelte';

  let isDrawerOpen = false;
  let activeSheet: 'none' | 'addArea' | 'smsReminder' | 'areaOptions' = 'none';
  let fileInput: HTMLInputElement;
  
  // Theme Engine (Checks Cache first)
  let isDark = localStorage.getItem('theme') !== 'light';

  // Workspace Forms
  let newAreaName = ''; let newAreaCode = '';
  let editAreaId = ''; let editAreaName = ''; let editAreaCode = '';

  // SMS Broadcast
  let selectedSmsRecords: string[] = [];
  $: selectedCount = selectedSmsRecords.length;

  // Toast Engine
  let toastMsg = '';
  function showToast(msg: string) {
      toastMsg = msg;
      setTimeout(() => toastMsg = '', 3000);
  }

  onMount(async () => {
      applyTheme();
      await loadWorkspaces();
      if ($workspaces.length === 0) activeSheet = 'addArea';
      else if (!$currentWorkspaceId) await switchWorkspace($workspaces[0].id);
  });
  
  // ⚡ BULLETPROOF THEME ENGINE
  function toggleTheme() {
      isDark = !isDark;
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      const html = document.documentElement;
      const body = document.body;
      
      if (isDark) {
          html.classList.add('dark');
          body.classList.add('dark');
      } else {
          html.classList.remove('dark');
          body.classList.remove('dark');
      }
  }
  
  function applyTheme() {
      if (isDark) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
      }
  }

  async function loadWorkspaces() { workspaces.set(await db.workspaces.orderBy('timestamp').reverse().toArray()); }

  async function switchWorkspace(id: string) {
      currentWorkspaceId.set(id);
      await SmartEngine.refreshStore(id);
      isDrawerOpen = false; currentRoute.set('dashboard');
  }

  async function handleAddArea() {
      if (!newAreaName.trim()) return alert("Area Name required");
      const newId = crypto.randomUUID();
      await db.workspaces.add({ id: newId, areaName: newAreaName.trim(), areaCode: newAreaCode.trim() || 'N/A', timestamp: Date.now() });
      newAreaName = ''; newAreaCode = ''; activeSheet = 'none';
      await loadWorkspaces(); await switchWorkspace(newId);
  }

  let pressTimer: ReturnType<typeof setTimeout>;
  function startAreaPress(id: string, name: string, code: string) {
      pressTimer = setTimeout(() => {
          isDrawerOpen = false;
          editAreaId = id; editAreaName = name; editAreaCode = code === 'N/A' ? '' : code;
          activeSheet = 'areaOptions';
      }, 600);
  }
  function cancelAreaPress() { clearTimeout(pressTimer); }

  async function updateArea() {
      if (!editAreaName.trim()) return;
      await db.workspaces.update(editAreaId, { areaName: editAreaName.trim(), areaCode: editAreaCode.trim() || 'N/A' });
      activeSheet = 'none';
      showToast("Area Updated Successfully");
      await loadWorkspaces();
  }

  async function deleteArea() {
      if (confirm(`PERMANENTLY DELETE area "${editAreaName}" and ALL its records?`)) {
          await db.records.where('workspaceId').equals(editAreaId).delete();
          await db.workspaces.delete(editAreaId);
          activeSheet = 'none';
          showToast("Area Deleted");
          await loadWorkspaces();
          if ($workspaces.length > 0) switchWorkspace($workspaces[0].id);
          else { currentWorkspaceId.set(null); activeSheet = 'addArea'; }
      }
  }

  function handleExport() { 
      isDrawerOpen = false; 
      showToast("Generating Excel Report...");
      setTimeout(() => { ExportEngine.generateAreaExcel(activeWs?.areaCode || '001', $currentRecords); }, 500);
  }

  async function handleBackup() {
      isDrawerOpen = false;
      if ($currentRecords.length === 0) return alert("No records to backup.");
      const pass = prompt("Create a password for this backup file:");
      if (!pass) return;
      const blob = await CryptoEngine.encryptData({ workspace: activeWs, records: $currentRecords }, pass);
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Backup_${activeWs?.areaCode}_${Date.now()}.cenhod`; a.click();
  }

  async function handleRestore(event: Event) {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      isDrawerOpen = false;
      const pass = prompt("Enter the password for this .cenhod file:");
      if (!pass) return;
      try {
          const data = await CryptoEngine.decryptData(file, pass);
          if (!data.workspace || !data.records) throw new Error();
          const exists = await db.workspaces.get(data.workspace.id);
          if (!exists) await db.workspaces.add(data.workspace);
          await db.records.bulkPut(data.records);
          showToast("Database Restored Successfully!");
          await loadWorkspaces(); await switchWorkspace(data.workspace.id);
      } catch (e) { alert("Decryption failed. Incorrect password or corrupted file."); }
      fileInput.value = '';
  }

  async function handleHardReset() {
      if (prompt("CRITICAL: This deletes ALL app data forever. Type 'RESET' to confirm.") === 'RESET') {
          await db.delete();
          localStorage.clear();
          window.location.reload();
      }
  }

  function toggleSmsSelection(recordId: string) {
      if (selectedSmsRecords.includes(recordId)) selectedSmsRecords = selectedSmsRecords.filter(id => id !== recordId);
      else {
          if (selectedSmsRecords.length >= 15) return alert("Maximum 15 recipients allowed per broadcast.");
          selectedSmsRecords = [...selectedSmsRecords, recordId];
      }
  }

  // ⚡ PWA SECURITY BYPASS FOR NATIVE SMS DIALER
  function sendSmsBroadcast() {
      const numbers = $currentRecords.filter(r => selectedSmsRecords.includes(r.id) && r.mobile).map(r => r.mobile).join(',');
      if (!numbers) return alert("No valid mobile numbers selected.");
      
      // Brave blocks hidden DOM clicks. window.open with _top forces OS handover.
      window.open(`sms:${numbers}`, '_top') || (window.location.href = `sms:${numbers}`);
      
      activeSheet = 'none';
      selectedSmsRecords = [];
  }

  // --- EASTER EGGS ---
  let appTaps = 0; let appTapTimer: ReturnType<typeof setTimeout>;
  function tapAppEgg() {
      appTaps++; clearTimeout(appTapTimer);
      appTapTimer = setTimeout(() => appTaps = 0, 1000);
      if (appTaps >= 5) {
          appTaps = 0; isDrawerOpen = false;
          const logData = `CenHoD Elite Log\nTotal Workspaces: ${$workspaces.length}\nCurrent Records: ${$currentRecords.length}\nSystem: Stable`;
          const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([logData], {type: 'text/plain'})); a.download = `Diagnostic_Log_${Date.now()}.txt`; a.click();
          showToast("Diagnostic Log Downloaded");
      }
  }

  let devTaps = 0; let devTapTimer: ReturnType<typeof setTimeout>;
  let showEasterEgg = false;
  function tapDevEgg() {
      devTaps++; clearTimeout(devTapTimer);
      devTapTimer = setTimeout(() => devTaps = 0, 1000);
      if (devTaps >= 3) {
          devTaps = 0; isDrawerOpen = false; showEasterEgg = true;
          setTimeout(() => showEasterEgg = false, 5000);
      }
  }

  $: activeWs = $workspaces.find(w => w.id === $currentWorkspaceId);
</script>

{#if toastMsg}
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[999] bg-emeraldPro text-white dark:text-black font-extrabold px-6 py-3 rounded-full shadow-[0_10px_20px_rgba(16,185,129,0.3)] animate-toast">
        {toastMsg}
    </div>
{/if}

{#if showEasterEgg}
    <div class="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center animate-fade-in px-6 text-center overflow-hidden">
        <div class="absolute inset-0 particle-bg"></div>
        <div class="relative z-10">
            <h1 class="text-3xl font-black text-white tracking-widest mb-6">Made with <span class="inline-block animate-heartbeat-slow drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]">❤️</span></h1>
            <h2 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emeraldPro via-teal-300 to-emeraldPro bg-[length:200%_auto] animate-shimmer">
                Sahil Kumar Rout
            </h2>
            <p class="text-white/40 text-[10px] tracking-[0.4em] uppercase mt-4 font-bold">Elite Architect</p>
        </div>
    </div>
{/if}

<div class="h-[100dvh] bg-slate-50 dark:bg-black text-slate-900 dark:text-white overflow-hidden flex flex-col relative select-none transition-colors duration-300">

    <header class="h-16 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 z-40 bg-white/80 dark:bg-black/60 backdrop-blur-2xl shrink-0 shadow-sm relative transition-colors duration-300">
        <div class="flex items-center gap-3">
            <button on:click={() => isDrawerOpen = true} class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 active:scale-90 transition-transform text-slate-800 dark:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="14" y2="18"></line></svg>
            </button>
            <div>
                <h1 class="font-extrabold text-lg leading-tight text-emeraldPro tracking-tight">{$currentRoute === 'form' ? 'Data Entry' : (activeWs?.areaName || 'CenHoD Pro')}</h1>
                <p class="text-[9px] font-black text-slate-400 dark:text-white/40 tracking-[0.2em] uppercase">{$currentRoute === 'form' ? 'Secure Node' : `Code: ${activeWs?.areaCode || '---'}`}</p>
            </div>
        </div>
        <div class="flex items-center gap-2">
        <button on:click={toggleTheme} class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 active:scale-90 transition-transform text-slate-800 dark:text-white shadow-sm">
        {#if isDark} <span class="text-sm">☀️</span> {:else} <span class="text-sm">🌙</span> {/if}
        </button>
            {#if $currentRoute === 'form'}
                <button on:click={() => currentRoute.set('dashboard')} class="text-[10px] font-bold uppercase tracking-widest text-rubyError bg-rubyError/10 border border-rubyError/20 px-3 py-2.5 rounded-lg active:scale-95 transition-transform">Abort</button>
            {/if}
        </div>
    </header>

    {#if isDrawerOpen}
        <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" on:click={() => isDrawerOpen = false}></div>
        <div class="fixed top-0 left-0 h-full w-72 bg-white dark:bg-[#050505] z-[150] shadow-2xl flex flex-col border-r border-slate-200 dark:border-white/10">
            
            <div class="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/50 mt-8 relative overflow-hidden">
                <h2 on:click={tapAppEgg} class="text-2xl font-black text-slate-900 dark:text-white leading-tight relative z-10 cursor-pointer">CenHoD<span class="text-emeraldPro"> Elite</span></h2>
                <p on:click={tapDevEgg} class="text-[9px] font-black text-slate-400 dark:text-white/30 tracking-widest uppercase mt-2 relative z-10 cursor-pointer w-max">By Sahil Kumar Rout</p>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4 space-y-2">
                <p class="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest ml-2 mb-3">Workspaces (Hold to Edit)</p>
                {#each $workspaces as ws}
                    <button 
                        on:click={() => switchWorkspace(ws.id)}
                        on:touchstart={() => startAreaPress(ws.id, ws.areaName, ws.areaCode)} on:touchend={cancelAreaPress} on:mousedown={() => startAreaPress(ws.id, ws.areaName, ws.areaCode)} on:mouseup={cancelAreaPress} on:mouseleave={cancelAreaPress}
                        class="w-full text-left px-4 py-3 text-sm rounded-xl transition-all duration-200 {ws.id === $currentWorkspaceId ? 'bg-emeraldPro/10 text-emeraldPro font-bold border border-emeraldPro/30' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 font-medium'}">
                        <span class="block truncate">{ws.areaName}</span>
                    </button>
                {/each}
                <button on:click={() => {isDrawerOpen = false; activeSheet = 'addArea';}} class="w-full mt-4 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/60 border border-slate-300 dark:border-white/10 py-3 rounded-xl font-bold border-dashed active:scale-95 text-xs uppercase tracking-widest">+ Add New Area</button>
            </div>
            
            <div class="p-4 border-t border-slate-200 dark:border-white/10 space-y-3 bg-slate-50 dark:bg-black/50">
                <button on:click={() => {isDrawerOpen = false; activeSheet = 'smsReminder'; selectedSmsRecords = [];}} class="w-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 py-3 rounded-xl text-xs font-bold active:scale-95 transition-transform flex justify-center items-center gap-2">💬 Reminder Message</button>
                <button on:click={handleExport} class="w-full bg-[#107C41]/10 text-[#107C41] border border-[#107C41]/30 py-3 rounded-xl text-xs font-bold active:scale-95 transition-transform flex justify-center items-center gap-2">📊 Export Area Excel</button>
                <div class="grid grid-cols-2 gap-2">
                    <button on:click={handleBackup} class="w-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95">🔒 Backup</button>
                    <button on:click={() => fileInput.click()} class="w-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95">📥 Restore</button>
                </div>
                <button on:click={handleHardReset} class="w-full mt-2 bg-rubyError/10 text-rubyError border border-rubyError/30 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform">⚠️ Hard Reset Data</button>
            </div>
        </div>
    {/if}
    <input type="file" accept=".cenhod" bind:this={fileInput} on:change={handleRestore} class="hidden" />

    {#if activeSheet !== 'none'}
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]" on:click={() => activeSheet = 'none'}></div>
        <div class="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0F0F0F] border-t border-slate-200 dark:border-white/10 rounded-t-3xl p-6 z-[250] shadow-2xl animate-slide-up">
            <div class="w-12 h-1 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mb-6"></div>
            
            {#if activeSheet === 'addArea'}
                <h3 class="text-xl font-black mb-1">Initialize Workspace</h3>
                <div class="space-y-4 pb-safe mt-4">
                    <input type="text" bind:value={newAreaName} placeholder="Area Name" class="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-white/20 rounded-xl p-4 outline-none font-bold text-slate-800 dark:text-white" />
                    <input type="text" bind:value={newAreaCode} placeholder="Area Code (Optional)" class="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-white/20 rounded-xl p-4 outline-none font-bold text-slate-800 dark:text-white" />
                    <button on:click={handleAddArea} class="w-full bg-emeraldPro text-white dark:text-black font-extrabold py-4 rounded-xl active:scale-95 transition-transform">Deploy Workspace</button>
                </div>
            {/if}

            {#if activeSheet === 'areaOptions'}
                <h3 class="text-xl font-black mb-1">Edit Workspace</h3>
                <div class="space-y-4 pb-safe mt-4">
                    <input type="text" bind:value={editAreaName} placeholder="Area Name" class="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-white/20 rounded-xl p-4 outline-none font-bold text-slate-800 dark:text-white" />
                    <input type="text" bind:value={editAreaCode} placeholder="Area Code (Optional)" class="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-white/20 rounded-xl p-4 outline-none font-bold text-slate-800 dark:text-white" />
                    <button on:click={updateArea} class="w-full bg-emeraldPro text-white dark:text-black font-extrabold py-4 rounded-xl active:scale-95 transition-transform">Update Area</button>
                    <button on:click={deleteArea} class="w-full bg-rubyError/10 border border-rubyError/30 text-rubyError font-extrabold py-4 rounded-xl active:scale-95 transition-transform">Delete Area Forever</button>
                </div>
            {/if}

            {#if activeSheet === 'smsReminder'}
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="text-xl font-black mb-1">Select Recipients</h3>
                        <p class="text-[10px] text-emeraldPro font-bold tracking-widest uppercase">Max 15 | Selected: {selectedCount}</p>
                    </div>
                    <button on:click={sendSmsBroadcast} class="bg-emeraldPro text-white dark:text-black font-bold px-5 py-2 rounded-lg shadow-md active:scale-95 transition-transform">Done</button>
                </div>
                <div class="max-h-[50vh] overflow-y-auto space-y-2 pb-safe pr-2">
                    {#each $currentRecords as rec}
                        {@const hasMobile = !!rec.mobile}
                        <button on:click={() => hasMobile && toggleSmsSelection(rec.id)} class="w-full text-left p-3 rounded-xl border transition-colors flex justify-between items-center {hasMobile ? (selectedSmsRecords.includes(rec.id) ? 'bg-emeraldPro/10 border-emeraldPro text-emeraldPro' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80') : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-400 dark:text-white/30 opacity-50'}">
                            <div>
                                <p class="text-[11px] font-bold uppercase tracking-wider mb-1">L.{rec.lineNo} | B.{rec.buildingNo} | C.{rec.cHouseNo}</p>
                                <p class="font-bold text-sm truncate">{rec.headName || 'No Name'}</p>
                            </div>
                            <div class="text-xs font-bold font-mono">{rec.mobile || 'No Number'}</div>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    <main class="flex-1 relative overflow-y-auto hide-scrollbar">
        {#if $currentRoute === 'dashboard'} <Dashboard />
        {:else if $currentRoute === 'form'} <div class="p-4 animate-fade-in"><Form /></div>
        {/if}
    </main>
</div>

<style>
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-toast { animation: toastDrop 3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes toastDrop { 0% { transform: translate(-50%, -20px); opacity: 0; } 10% { transform: translate(-50%, 0); opacity: 1; } 90% { transform: translate(-50%, 0); opacity: 1; } 100% { transform: translate(-50%, -20px); opacity: 0; } }
    
/* ⚡ PREMIUM EASTER EGG CSS */
    .animate-heartbeat-slow { animation: breathingHeart 4s infinite ease-in-out; display: inline-block; }
    @keyframes breathingHeart { 
        0% { transform: scale(1); } 
        15% { transform: scale(1.15); } 
        30% { transform: scale(1); } 
        45% { transform: scale(1.15); } 
        100% { transform: scale(1); } 
    }
    .animate-shimmer { animation: shimmer 3s linear infinite; }
    @keyframes shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
    .particle-bg {
        background-image: radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(244, 63, 94, 0.1) 0%, transparent 40%);
        animation: pulseBg 4s infinite alternate;
    }
    @keyframes pulseBg { 0% { opacity: 0.5; transform: scale(1); } 100% { opacity: 1; transform: scale(1.1); } }

    .hide-scrollbar::-webkit-scrollbar { display: none; }
</style>