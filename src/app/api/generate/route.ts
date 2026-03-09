import { NextResponse } from 'next/server';
import { extractRequirements, generateSourceCode } from '@/services/ai';
import { createProjectZip } from '@/lib/generator';

export const maxDuration = 300; // Allow Vercel/NextJS to run up to 5 minutes

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log("1. Extracting requirements from prompt...");
    const requirements = await extractRequirements(prompt);
    console.log("Requirements Extracted:", requirements.appName);

    // List of files we need to let AI generate
    const generatedFiles: { path: string, content: string }[] = [];

    // 1. Generate Global Configs & DB Schema
    console.log("2. Generating Core Setup & Database Schema...");
    const dbCode = await generateSourceCode(
      `src/db/schema.ts`,
      "Database Schema (MySQL)",
      requirements
    );
    if (dbCode) generatedFiles.push({ path: `src/db/schema.ts`, content: dbCode });

    // 2. Generate Pages
    for (const page of requirements.pages || []) {
      console.log(`Generating Page: ${page.name} (${page.path})`);

      let filePath = `src/app${page.path}/page.tsx`;
      if (page.path === "/") filePath = "src/app/page.tsx";

      const code = await generateSourceCode(
        filePath,
        `React Server/Client Component Next.js untuk halaman ${page.name}`,
        { ...requirements, contextPage: page }
      );

      if (code) generatedFiles.push({ path: filePath, content: code });
    }

    // 3. Generate API Endpoints
    for (const api of requirements.apiEndpoints || []) {
      console.log(`Generating API: ${api.path} `);

      let pathRoute = api.path;
      if (pathRoute.startsWith('/api/')) {
        pathRoute = pathRoute.replace('/api/', '');
      }

      const filePath = `src/app/api/${pathRoute}/route.ts`;

      const code = await generateSourceCode(
        filePath,
        `Next.js API Route (${api.method}) - ${api.description}`,
        { ...requirements, contextApi: api }
      );

      if (code) generatedFiles.push({ path: filePath, content: code });
    }

    // 4. Generate Mayar API Service (Template Helper)
    console.log("3. Generating Mayar Integration Helper...");
    const mayarHelperCode = await generateSourceCode(
      "src/lib/mayar.ts",
      "Utility function untuk integrasi Mayar payment gateway secara native HTTP API",
      requirements
    );
    if (mayarHelperCode) generatedFiles.push({ path: "src/lib/mayar.ts", content: mayarHelperCode });


    // Create Zip
    console.log("4. Assembling ZIP file...");
    const zipBuffer = await createProjectZip(requirements.appName, generatedFiles);

    // Convert Node Buffer to standard Web Blob/ArrayBuffer for Next.js 14+ Response
    const webStream = new Blob([new Uint8Array(zipBuffer)], { type: 'application/zip' });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${requirements.appName}.zip"`,
      },
    });

  } catch (error: unknown) {
    console.error("API Generate Error:", error);
    const msg = error instanceof Error ? error.message : "Error processing request";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
