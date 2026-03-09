// Removed unused imports
import JSZip from 'jszip';

/**
 * Creates a Zip file buffers from generated project data
 */
export async function createProjectZip(projectName: string, fileDataList: { path: string, content: string }[]) {
    const zip = new JSZip();

    // Root folder
    const rootFolder = zip.folder(projectName);
    if (!rootFolder) throw new Error("Gagal membuat folder zip");

    // Create base Next.js boilerplate structures
    const defaultPackageJson = {
        "name": projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        "version": "0.1.0",
        "private": true,
        "scripts": {
            "dev": "next dev",
            "build": "next build",
            "start": "next start",
            "lint": "next lint"
        },
        "dependencies": {
            "next": "^14.2.0",
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "tailwindcss": "^3.4.1",
            "lucide-react": "^0.378.0",
            "mysql2": "^3.9.7",
            "clsx": "^2.1.1",
            "tailwind-merge": "^2.3.0"
        },
        "devDependencies": {
            "typescript": "^5",
            "@types/node": "^20",
            "@types/react": "^18",
            "@types/react-dom": "^18",
            "postcss": "^8",
            "eslint": "^8",
            "eslint-config-next": "14.2.3"
        }
    };

    rootFolder.file('package.json', JSON.stringify(defaultPackageJson, null, 2));
    rootFolder.file('next.config.mjs', `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\n\nexport default nextConfig;`);
    rootFolder.file('tsconfig.json', `{\n  "compilerOptions": {\n    "lib": ["dom", "dom.iterable", "esnext"],\n    "allowJs": true,\n    "skipLibCheck": true,\n    "strict": true,\n    "noEmit": true,\n    "esModuleInterop": true,\n    "module": "esnext",\n    "moduleResolution": "bundler",\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "jsx": "preserve",\n    "incremental": true,\n    "plugins": [\n      {\n        "name": "next"\n      }\n    ],\n    "paths": {\n      "@/*": ["./src/*"]\n    }\n  },\n  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],\n  "exclude": ["node_modules"]\n}\n`);

    // Tailwind Config
    rootFolder.file('tailwind.config.ts', `import type { Config } from "tailwindcss"\n\nconst config = {\n  darkMode: ["class"],\n  content: [\n    './pages/**/*.{ts,tsx}',\n    './components/**/*.{ts,tsx}',\n    './app/**/*.{ts,tsx}',\n    './src/**/*.{ts,tsx}',\n\t],\n  theme: {\n    extend: {}\n  },\n  plugins: [require("tailwindcss-animate")],\n} satisfies Config\n\nexport default config`);
    rootFolder.file('postcss.config.js', `module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n`);

    // Global CSS (Tailwind imports)
    const appFolder = rootFolder.folder('src/app');
    if (appFolder) {
        appFolder.file('globals.css', `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`);
    }

    // Inject generated AI Files
    for (const item of fileDataList) {
        // Create subfolders if necessary based on path
        // item.path e.g "src/app/page.tsx" atau "src/components/ui/button.tsx"
        const filePath = item.path.replace(/\\/g, '/');
        rootFolder.file(filePath, item.content);
    }

    return await zip.generateAsync({ type: 'nodebuffer' });
}
