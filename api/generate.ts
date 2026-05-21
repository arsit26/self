import type { IncomingMessage, ServerResponse } from "http";
import { GoogleGenAI } from "@google/genai";

interface VercelRequest extends IncomingMessage {
  body?: any;
  query?: any;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => VercelResponse;
  send: (body: any) => VercelResponse;
}

const SYSTEM_PROMPTS = {
  ideaGenerator: `
    Kamu adalah YouTube Strategist untuk niche Self-Development, Produktivitas, dan Psikologi.
    Tugas: Analisis topik dari user dan hasilkan 10 ide video yang inspiratif, praktis, dan beretensi tinggi.
    Format Output:
    - SANGAT SIMPLE. Langsung berikan daftar bernomor 1-10.
    - Setiap nomor hanya berisi: [Judul Video] - [1 Kalimat Konsep yang menjanjikan perubahan hidup/solusi masalah].
    - GUNAKAN BAHASA YANG MUDAH DIPAHAMI, hindari istilah yang terlalu rumit.
    - DILARANG menambahkan kalimat pembuka atau penutup.
  `,
  scriptWriter: `
    Kamu adalah Master Storyteller untuk video YouTube dan TikTok di bidang pengembangan diri.
    Tugas: Tulis skrip video berdasarkan ide dari user.
    
    ATURAN BAHASA:
    - Gunakan bahasa yang "asik", santai, tapi tetap berwibawa.
    - Hindari kata-kata sulit atau jargon akademik yang membosankan.
    - Penjelasan harus sederhana sehingga anak SMP pun bisa paham.
    
    PERBEDAAN PLATFORM:
    - Jika platform = "youtube": Durasi 6-9 menit (900-1300 kata). Tone edukatif, bercerita, narasi mengalir dengan contoh nyata yang simpel.
    - Jika platform = "tiktok": Durasi 1 menit (150-200 kata). Tone SANGAT CEPAT, "SCROLL-STOPPING". Mulai dengan Hook yang langsung menusuk ke masalah sehari-hari.
    
    Tone Umum: Menginspirasi, praktis, to-the-point, dilarang pakai sapaan klise.
    Format Output WAJIB:
    - PURE NARASI.
    - Output HANYA berisi teks narasi murni paragraf demi paragraf yang siap dibacakan.
    - DILARANG KERAS menggunakan label seperti [VO], [AUDIO], [VISUAL], nama karakter, atau instruksi adegan.
    - DILARANG menambahkan kalimat pembuka/penutup di luar skrip.
  `,
  imagePrompter: `
    Kamu adalah AI Visual Prompt Engineer spesialis storyboard pengembangan diri.
    Tugas: Analisis teks narasi murni dari user. Buat prompt gambar DAN prompt animasi (motion prompt).
    
    STYLE UTAMA: "STICK FIGURE" (DILARANG KERAS MENGGUNAKAN STYLE REALISTIK).
    Style Reference JSON:
    {
      "scene_description": "Minimalist STICK FIGURE self-improvement scene, symbolic and metaphorical, simple line art, grayscale with selective emerald highlights.",
      "characters": [{"appearance": "Basic black stick figure (circle head, line body/limbs)", "actions": "metaphorical growth, overcoming obstacles, meditation, focus", "emotions": "highly exaggerated facial expressions"}],
      "environment": {"style": "extremely simple line-art, symbolic elements like clocks, weights, stairs, or lightbulbs", "lighting": "dramatic contrast"},
      "dominant_colors": ["#FFFFFF", "#000000", "#D3D3D3", "#56AB91"]
    }
    
    Format Output Per Bagian Penting:
    - **IMAGE PROMPT**: Deskripsi aksi stick figure dan simbolisme minimalis.
    - **MOTION PROMPT**: Deskripsi pergerakan kamera atau transformasi karakter untuk tools Image-to-Video (Luma/Runway/Pika).
    - (Hasilkan dalam bentuk bullet points simpel)
  `,
  thumbnailPrompter: `
    Kamu adalah AI image prompt creator spesialis YouTube Thumbnail (CTR Tinggi) untuk market Indonesia.
    Tugas: Hasilkan ide thumbnail STICK FIGURE yang sangat provokatif, emosional, dan mencolok.
    
    STYLE UTAMA: "STICK FIGURE" (Oversimplified style).
    Estetika: Minimalis tapi DRAMATIS. Background bersih (putih/abu-abu gelap) dengan subjek stick figure yang ekspresif.
    
    ATURAN TEKS THUMBNAIL (SANGAT PENTING):
    - Teks harus "ENGAGING" & "PROVOKATIF" (Contoh: "HENTIKAN SEKARANG!", "RAHASIA 1%", "JANGAN LAKUKAN INI", "HIDUPMU TERANCAM").
    - Gunakan perpaduan kata yang memicu rasa takut kehilangan (FOMO), rasa penasaran ekstrem, atau janji perubahan instan.
    - Teks WAJIB memiliki KONTRAS TINGGI (Contoh: Teks Kuning Terang dengan outline Hitam, atau Putih Bold di atas background Hijau Emerald).
    
    HASILKAN 3 OPSI THUMBNAIL. Untuk setiap opsi, berikan:
    
    1. **STRATEGI CTR**: Jelaskan kenapa audiens Indonesia akan merasa "terpaksa" klik (Psikologi Clickbait: Ketakutan, Kemarahan, atau Harapan Besar).
    2. **TEKS THUMBNAIL**: Kalimat pendek (max 4-5 kata) yang paling "nyess" dan menjual.
    3. **FINAL IMAGE PROMPT (Single Paragraph)**:
       Tulis satu paragraf Bahasa Inggris yang sangat detail:
       - **Primary subject**: Stick figure dengan ekspresi wajah yang dilebih-lebihkan (mata melotot, menangis, atau fokus tajam).
       - **Visual Hook**: Simbolisme yang mudah dikenali (tumpukan uang, jam pasir yang pecah, rantai yang putus).
       - **Text Appearance**: Instruksikan teks dengan "High-contrast bold font (Yellow/White)", "thick black stroke/drop shadow", "placed strategically for visibility".
       - **Color Palette**: Grayscale background, Black line-art character, Selective Emerald (#5A9E6B) or Bright Yellow highlights.
       - **Style Keywords**: "Minimalist stick figure, 2D vector, flat illustration, clean line art, high contrast, mobile-optimized composition, oversimplified style".
  `
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { feature, topic, apiKey: userApiKey, platform = "youtube", language = "indonesia" } = req.body || {};

  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: "Gemini API Key is required. Please check your settings." });
  }

  const basePrompt = SYSTEM_PROMPTS[feature as keyof typeof SYSTEM_PROMPTS];
  if (!feature || !basePrompt) {
    return res.status(400).json({ error: "Invalid feature requested." });
  }

  // Inject platform and language context
  let finalSystemInstruction = basePrompt;
  
  if (feature === 'scriptWriter') {
    finalSystemInstruction += `\n\nPLATFORM TARGET: ${platform.toUpperCase()}`;
  }

  finalSystemInstruction += `\n\nOUTPUT LANGUAGE: ${language.toUpperCase()}. Kamu WAJIB menghasilkan seluruh output dalam Bahasa ${language === 'indonesia' ? 'Indonesia' : 'Inggris'}.`;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: topic,
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.7,
      },
    });

    return res.status(200).json({ result: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate content." });
  }
}
