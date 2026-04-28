// src/lib/cryptoEngine.ts
export const CryptoEngine = {
    // 1. PBKDF2 Key Derivation (100,000 iterations for brute-force protection)
    async deriveKey(password: string, salt: Uint8Array) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
        );
        return crypto.subtle.deriveKey(
            { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
            keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
        );
    },

    // 2. Encrypt to .cenhod Blob
    async encryptData(data: any, password: string): Promise<Blob> {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await this.deriveKey(password, salt);
        
        const enc = new TextEncoder();
        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data))
        );
        
        // Bundle Salt + IV + Ciphertext into one binary file
        const bundle = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        bundle.set(salt, 0);
        bundle.set(iv, salt.length);
        bundle.set(new Uint8Array(encrypted), salt.length + iv.length);
        
        return new Blob([bundle], { type: "application/octet-stream" });
    },

    // 3. Decrypt from .cenhod Blob
    async decryptData(blob: Blob, password: string): Promise<any> {
        const bundle = new Uint8Array(await blob.arrayBuffer());
        const salt = bundle.slice(0, 16);
        const iv = bundle.slice(16, 28);
        const data = bundle.slice(28);
        
        const key = await this.deriveKey(password, salt);
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
        
        const dec = new TextDecoder();
        return JSON.parse(dec.decode(decrypted));
    }
};