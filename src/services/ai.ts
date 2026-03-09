import { GoogleGenAI } from '@google/genai';

// Initialize the Gen AI client using API key from environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Using the recommended default model
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Extracts requirements based on user prompt.
 */
export async function extractRequirements(prompt: string) {
    const systemPrompt = `Kamu adalah AI System Architect profesional. 
Tugasmu merancang struktur requirements aplikasi fullstack (Next.js App Router, Tailwind, Shadcn, MySQL) berdasarkan ide user.
Tech Stack Wajib: Next.js API Routes, Prisma/MySQL, NextAuth (JWT), dan integrasi Mayar.

Pastikan rancangan ini mendetail dan WAJIB menyertakan:
- Halaman UI (WAJIB ADA minimal 1 Landing Page dan 1 Admin Dashboard)
- Skema Database (Tabel & Kolom, tabel User itu wajib ada)
- Endpoint API (WAJIB ADA Auth API CRUD)
Format output HARUS raw JSON (tanpa blok markdown), dengan struktur:
{
  "appName": "nama-aplikasi-kebab-case",
  "description": "...",
  "pages": [{ "name": "...", "path": "...", "features": [...] }],
  "dbSchema": [{ "table": "...", "columns": [{ "name": "...", "type": "..." }] }],
  "apiEndpoints": [{ "method": "...", "path": "...", "description": "..." }]
}
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [
                { role: 'system', parts: [{ text: systemPrompt }] },
                { role: 'user', parts: [{ text: prompt }] },
            ],
            config: {
                responseMimeType: 'application/json',
            }
        });

        const text = response.text;
        if (!text) throw new Error("Kosong dari AI");

        return JSON.parse(text);
    } catch (error) {
        console.error("Gagal extract requirements:", error);
        throw error;
    }
}

/**
 * Generate code for a specific file based on requirements.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateSourceCode(filePath: string, fileType: string, requirements: any) {
    const systemPrompt = `Kamu adalah Senior Fullstack Next.js Developer.
Kamu sedang membuat file untuk aplikasi: ${requirements.appName}.
Deskripsi: ${requirements.description}.
Tech Stack: Next.js App Router murni (React Server & Client Components), TailwindCSS, Shadcn, API Routes Next.js, MySQL (via mysql2/promise).
File yang harus dibuat: ${filePath} (${fileType}).

Aturan Keras:
1. OUTPUT HANYA SOURCE CODE MURNI. JANGAN ADA TEKS EXPLANATION atau BLOCK MARKDOWN (\`\`\`).
2. Jangan menggunakan placeholder bertuliskan "TODO" atau "Implement here", tulis kodenya sebaik mungkin beneran jalan.
3. Gunakan export default untuk halaman Next.js (page.tsx) atau komponen.
4. Jika ini API route (route.ts), gunakan \`export async function GET(req: Request)\` dan sejenisnya.
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [
                { role: 'system', parts: [{ text: systemPrompt }] },
                { role: 'user', parts: [{ text: `Tuliskan full source code untuk file: ${filePath}. Berikan respon HANYA TEKS KODENYA SAJA, langsung mulai coding.` }] },
            ]
        });

        const text = response.text;
        if (!text) return "";

        // Clean up markdown markers if AI still stubborn
        let cleanCode = text;
        if (cleanCode.startsWith('```')) {
            cleanCode = cleanCode.split('\n').slice(1).join('\n');
        }
        if (cleanCode.endsWith('```')) {
            cleanCode = cleanCode.split('\n').slice(0, -1).join('\n');
        }

        return cleanCode.trim();
    } catch (error) {
        console.error(`Gagal generate code untuk ${filePath}:`, error);
        return `// Failed to generate code for ${filePath}`;
    }
}
