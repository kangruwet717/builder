"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const templates = [
    { name: "Marketplace", prompt: "Buat aplikasi SaaS Marketplace B2B. Fitur meliputi: manajemen produk multi-vendor, sistem keranjang, checkout payment Mayar, Admin Dashboard untuk approve vendor, dan landing page katalog produk." },
    { name: "Booking System", prompt: "Buat aplikasi Booking System untuk penyewaan studio foto. Fitur: user bisa pilih tanggal/jam (kalender), bayar DP via Mayar, dan admin dashboard untuk atur jadwal kosong & lihat revenue." },
    { name: "POS", prompt: "Buat aplikasi Point of Sales (POS) untuk ritel boba. Fitur: halaman kasir keranjang, manajemen stok inventaris, cetak struk, dan admin dashboard laporan harian." },
    { name: "LMS", prompt: "Buat aplikasi Learning Management System (LMS) kursus online. Fitur: user bisa beli kelas bayar pakai Mayar, nonton video course, ada kuis, dan admin dashboard buat upload materi guru." },
    { name: "CRM", prompt: "Buat aplikasi CRM untuk tim sales lapangan. Fitur: manajemen database pelanggan, tracking status prospek (Leads), pengingat follow-up, dan dashboard analytic admin." },
    { name: "SaaS Tools", prompt: "Buat aplikasi SaaS tools AI Copywriter. Fitur: user daftar dan berlangganan paket per bulan via Mayar, dashboard untuk generate artikel blog, history tersimpan, dan admin halaman untuk atur kuota user." }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg("Mohon masukkan deskripsi aplikasi yang ingin dibuat");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        let errMsg = "Gagal membuat aplikasi. Coba beberapa saat lagi.";
        try {
          const err = await response.json();
          if (err.error) errMsg = err.error;
        } catch (e) {
          if (response.status === 504 || response.status === 500) {
            errMsg = `Waktu generasi habis (Timeout atau Error ${response.status}). Vercel membatasi durasi.`;
          }
        }
        throw new Error(errMsg);
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Extract filename from disposition header if available
      const disposition = response.headers.get('Content-Disposition');
      let filename = "ai-generated-app.zip";
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />

      <div className="max-w-3xl w-full space-y-8 z-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            AI App Builder ⚡
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Ubah prompt menjadi Fullstack Next.js App (Tailwind, MySQL, + Mayar Integration) dalam satu klik.
          </p>
        </div>

        <Card className="shadow-2xl border-0 ring-1 ring-slate-900/5 bg-white/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Jelaskan Ide Aplikasimu
            </CardTitle>
            <CardDescription>
              Tulis fitur dan kebutuhan. AI akan membuat kode UI, skema Database MySQL, dan backend API otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 pb-2">
              <span className="text-sm font-medium text-slate-500 w-full mb-1">Coba Template Otomatis:</span>
              {templates.map((tpl) => (
                <Button
                  key={tpl.name}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(tpl.prompt)}
                  className="bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 border-blue-200"
                  type="button"
                >
                  {tpl.name}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Atau tulis manual di sini: Buat aplikasi SaaS POSkasir..."
              className="min-h-[200px] resize-none text-base p-4"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                {errorMsg}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t bg-slate-50/50 p-6 rounded-b-xl">
            <div className="text-sm text-slate-500">
              Output: Full source code (.zip)
            </div>
            <Button
              size="lg"
              className="w-full sm:w-auto font-medium shadow-md shadow-blue-500/20"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  AI Sedang Membuat Aplikasi (1-3 min)...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Source Code
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
