import Irys from "@irys/sdk";
import fs from "fs";
import path from "path";

export class DeliberationLogger {
  private irys: Irys | null = null;
  private enabled: boolean = false;

  constructor(keypairPath?: string) {
    if (!keypairPath) {
      console.warn("⚠️ No keypair path provided for logger. Arweave logging disabled.");
      return;
    }

    try {
      const fullPath = path.resolve(process.cwd(), keypairPath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Keypair file not found at ${fullPath}. Arweave logging disabled.`);
        return;
      }

      const keypairData = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      
      // Irys expects the Base58 private key string for Solana.
      // Using import for bs58 to handle ESM/CJS interop correctly
      const bs58 = require('bs58');
      const encoder = bs58.default || bs58;
      const secretKeyBase58 = encoder.encode(Uint8Array.from(keypairData));

      // Initialize Irys for Devnet
      this.irys = new Irys({
        url: "https://devnet.irys.xyz", 
        token: "solana",
        key: secretKeyBase58, 
        config: { providerUrl: "https://api.devnet.solana.com" },
      });
      
      this.enabled = true;
      console.log("✅ Arweave logger initialized (Irys Devnet)");
    } catch (e) {
      console.error("❌ Failed to initialize Arweave logger:", e);
    }
  }

  async logDeliberation(step: string, data: any): Promise<string> {
    // Also push to dashboard if available
    if ((global as any).dashboard) {
        (global as any).dashboard.pushLog({ step, data });
    }

    if (!this.enabled || !this.irys) return "";

    const payload = JSON.stringify({
      step,
      timestamp: new Date().toISOString(),
      agentId: "pinch-v1",
      data,
    });

    const tags = [
      { name: "Content-Type", value: "application/json" },
      { name: "App-Name", value: "Level5-Corp" },
      { name: "Agent-ID", value: "pinch" },
      { name: "Step", value: step },
      { name: "Unix-Time", value: Date.now().toString() }
    ];

    try {
      // Calculate price just to show we can (optional)
      // const price = await this.irys.getPrice(payload.length);
      
      const receipt = await this.irys.upload(payload, { tags });
      const url = `https://arweave.net/${receipt.id}`;
      console.log(`📝 Logged to Arweave: ${url}`);
      return url;
    } catch (e) {
      console.error("❌ Failed to log to Arweave:", e);
      return "";
    }
  }
}
