/**
 * FOR THE KIDS Platform - ABI Artifact Generator
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Generates clean ABI JSON files from compiled contracts.
 * Outputs to dao/contracts/abi/ for frontend and integration use.
 *
 * "Until no kid is in need"
 */

import * as fs from "fs";
import * as path from "path";

// Configuration
const ARTIFACTS_DIR = path.join(__dirname, "..", "artifacts", "contracts");
const OUTPUT_DIR = path.join(__dirname, "..", "dao", "contracts", "abi");

// Contracts to extract ABIs from
const CONTRACTS = [
  {
    name: "CharityRouter100",
    path: "CharityRouter100.sol/CharityRouter100.json",
    outputName: "CharityRouter100.json",
  },
  {
    name: "DatingRevenueRouter",
    path: "DatingRevenueRouter.sol/DatingRevenueRouter.json",
    outputName: "DatingRevenueRouter.json",
  },
];

interface ArtifactOutput {
  contractName: string;
  abi: unknown[];
  bytecodeHash?: string;
  compiler?: {
    version: string;
  };
  generatedAt: string;
  platform: string;
  version: string;
}

interface CompilerOutput {
  _format: string;
  contractName: string;
  sourceName: string;
  abi: unknown[];
  bytecode: string;
  deployedBytecode: string;
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

function hashBytecode(bytecode: string): string {
  // Simple hash for bytecode identification
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(bytecode).digest("hex").slice(0, 16);
}

function extractABI(contractConfig: typeof CONTRACTS[0]): ArtifactOutput | null {
  const artifactPath = path.join(ARTIFACTS_DIR, contractConfig.path);

  if (!fs.existsSync(artifactPath)) {
    console.warn(`Warning: Artifact not found for ${contractConfig.name}`);
    console.warn(`  Expected path: ${artifactPath}`);
    console.warn(`  Run 'npx hardhat compile' first`);
    return null;
  }

  try {
    const artifact: CompilerOutput = JSON.parse(
      fs.readFileSync(artifactPath, "utf8")
    );

    const output: ArtifactOutput = {
      contractName: artifact.contractName,
      abi: artifact.abi,
      bytecodeHash: hashBytecode(artifact.bytecode),
      generatedAt: new Date().toISOString(),
      platform: "FOR THE KIDS",
      version: "Gospel V1.4.1 SURVIVAL MODE",
    };

    return output;
  } catch (error) {
    console.error(`Error processing ${contractConfig.name}:`, error);
    return null;
  }
}

function generateTypeScriptBindings(
  contracts: { name: string; abi: unknown[] }[]
): string {
  let output = `/**
 * FOR THE KIDS Platform - Contract Type Definitions
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Auto-generated - do not edit manually
 * Generated: ${new Date().toISOString()}
 *
 * "Until no kid is in need"
 */

`;

  for (const contract of contracts) {
    output += `export const ${contract.name}ABI = ${JSON.stringify(contract.abi, null, 2)} as const;\n\n`;
  }

  output += `export const ContractABIs = {\n`;
  for (const contract of contracts) {
    output += `  ${contract.name}: ${contract.name}ABI,\n`;
  }
  output += `} as const;\n`;

  return output;
}

function generateIndexFile(contractNames: string[]): string {
  let output = `/**
 * FOR THE KIDS Platform - ABI Index
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Auto-generated - do not edit manually
 *
 * "Until no kid is in need"
 */

`;

  for (const name of contractNames) {
    output += `export { default as ${name}ABI } from './${name}.json';\n`;
  }

  output += `\nexport const ContractNames = [\n`;
  for (const name of contractNames) {
    output += `  '${name}',\n`;
  }
  output += `] as const;\n`;

  return output;
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("FOR THE KIDS Platform - ABI Artifact Generator");
  console.log("Gospel V1.4.1 SURVIVAL MODE");
  console.log("=".repeat(60));
  console.log("");

  // Ensure output directory exists
  ensureDirectoryExists(OUTPUT_DIR);

  // Check if artifacts directory exists
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    console.error(`Artifacts directory not found: ${ARTIFACTS_DIR}`);
    console.error("Run 'npx hardhat compile' first to generate artifacts.");
    process.exit(1);
  }

  const successfulContracts: { name: string; abi: unknown[] }[] = [];
  const contractNames: string[] = [];
  let successCount = 0;
  let failCount = 0;

  console.log("Processing contracts...");
  console.log("-".repeat(40));

  for (const contract of CONTRACTS) {
    console.log(`\n[${contract.name}]`);

    const artifact = extractABI(contract);

    if (artifact) {
      const outputPath = path.join(OUTPUT_DIR, contract.outputName);
      fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2));
      console.log(`  -> Generated: ${contract.outputName}`);
      console.log(`  -> ABI entries: ${artifact.abi.length}`);
      console.log(`  -> Bytecode hash: ${artifact.bytecodeHash}`);
      successCount++;
      successfulContracts.push({ name: contract.name, abi: artifact.abi });
      contractNames.push(contract.name);
    } else {
      console.log(`  -> SKIPPED (artifact not found)`);
      failCount++;
    }
  }

  // Generate index file
  if (contractNames.length > 0) {
    const indexContent = generateIndexFile(contractNames);
    const indexPath = path.join(OUTPUT_DIR, "index.ts");
    fs.writeFileSync(indexPath, indexContent);
    console.log(`\nGenerated index file: index.ts`);

    // Generate TypeScript bindings
    const tsBindings = generateTypeScriptBindings(successfulContracts);
    const tsPath = path.join(OUTPUT_DIR, "abis.ts");
    fs.writeFileSync(tsPath, tsBindings);
    console.log(`Generated TypeScript bindings: abis.ts`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Generation Summary");
  console.log("=".repeat(60));
  console.log(`Successful: ${successCount}`);
  console.log(`Failed:     ${failCount}`);
  console.log(`Output:     ${OUTPUT_DIR}`);
  console.log("");

  if (successCount > 0) {
    console.log("Generated files:");
    const files = fs.readdirSync(OUTPUT_DIR);
    for (const file of files) {
      const stats = fs.statSync(path.join(OUTPUT_DIR, file));
      console.log(`  - ${file} (${stats.size} bytes)`);
    }
  }

  console.log("");
  console.log('"Until no kid is in need"');
  console.log("=".repeat(60));

  if (failCount > 0 && successCount === 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Artifact generation failed:", error);
  process.exit(1);
});
