import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload size for base64 images from image_picker
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoints
  app.post("/api/insights", async (req, res) => {
    try {
      const { query, data } = req.body;
      const prompt = `
أنت مساعد محاسبي ذكي في تطبيق "فواتير سليم".
قم بتحليل البيانات المالية التالية وأجب على سؤال المستخدم بإيجاز وباحترافية باللغة العربية.
البيانات:
${JSON.stringify(data)}

سؤال المستخدم:
${query}
`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });
      res.json({ result: response.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error?.message || "حدث خطأ أثناء تحليل البيانات." });
    }
  });

  // Smart receipt & shipping label OCR endpoint with Gemini (image_picker + google_generative_ai)
  app.post("/api/scan-invoice-image", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "الصورة مطلوبة للتحليل." });
      }

      // Clean base64 prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

      const prompt = `
أنت خبير ذكاء اصطناعي متخصص في فحص وقراءة فواتير العسل، بوليصات الشحن، ومستندات الطلبيات (OCR).
قم بتحليل الصورة المرفقة واستخرج البيانات التالية بدقة على شكل كائن JSON صالح فقط بدون أي نصوص تمهيدية:
{
  "clientName": "اسم العميل أو المستلم إن وجد",
  "clientPhone": "رقم الهاتف إن وجد مع الرمز الدولي",
  "clientAddress": "العنوان أو المدينة إن وجدت",
  "shippingCompany": "اسم شركة الشحن (مثلاً Yurtiçi Kargo, Aras Kargo, DHL, إلخ)",
  "trackingNo": "رقم التتبع أو الباركود إن وجد",
  "currency": "TRY أو USD أو EUR",
  "items": [
    {
      "name": "اسم المنتج أو صنف العسل",
      "price": 100,
      "qty": 1
    }
  ],
  "shippingFee": 0,
  "weightText": "الوزن إن وجد (مثال: 3.5 KG)",
  "summary": "ملخص سريع لمحتوى المستند المقروء"
}
إذا تعذر استخراج أي حقل، اتركه فارغاً أو قيمة افتراضية مناسبة. تأكد من أن الرد JSON فقط.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: cleanBase64
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(responseText);
      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error("OCR Scan Error:", error);
      res.status(500).json({ error: error?.message || "حدث خطأ أثناء فحص الصورة بواسطة الذكاء الاصطناعي." });
    }
  });

  // Dedicated Shipping Label Scanner (ShippingLabelScanner) matching exact JSON fields:
  // carrier, sender_name, receiver_name, receiver_address, receiver_city, tracking_number, weight_desi
  app.post("/api/scan-shipping-label", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "الصورة مطلوبة لفحص البوليصة." });
      }

      // Clean base64 prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

      const prompt = `
أنت نظام ذكي متخصص في تحليل ملصقات وبوالص الشحن التركية والعالمية بدقة فائقة (Kargo Etiketi / Shipping Label).
حلل الصورة واستخرج كافة البيانات بدقة تامة بصيغة JSON فقط:
{
  "carrier": "اسم شركة الشحن مثل Yurtiçi Kargo, Aras Kargo, PTT Kargo, MNG, Sürat...",
  "sender_name": "اسم المرسل (GÖNDEREN / SEVK EDEN)",
  "sender_details": "أي تفاصيل تخص المرسل مثل الفرع أو الهاتف أو المدينة",
  "receiver_name": "اسم المستلم (ALICI / TESLİM ALAN)",
  "receiver_address": "العنوان الكامل للتسليم بالتفصيل",
  "receiver_city": "المدينة أو المحافظة والمنطقة (İl / İlçe)",
  "tracking_number": "رقم التتبع أو الباركود الطويل أو كود الشحنة (Takip No / Barkod / Seri No)",
  "short_code": "الرمز المختصر للمنطقة أو كود التوزيع مثل IST-01 أو ما شابه",
  "weight_desi": "الوزن والديسي مثل 25 KG أو 3.5 DS",
  "date": "تاريخ ووقت الشحنة إن وجد"
}
أجب بكائن JSON صالح فقط بدون أي نصوص تمهيدية.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: cleanBase64
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(responseText);
      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error("Shipping Label Scan Error:", error);
      res.status(500).json({ error: error?.message || "حدث خطأ أثناء فحص بوليصة الشحن بواسطة الذكاء الاصطناعي." });
    }
  });

  // QR Code sync scanner endpoint
  app.post("/api/scan-qr-code", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "الصورة مطلوبة." });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

      const prompt = `
اقرأ رمز الاستجابة السريعة (QR Code) أو الباركود في هذه الصورة.
إذا كان يحتوي على JSON به store_id أو workspace_full_sync، استخرج القيم التالية بدقة:
{
  "store_id": "رمز المتجر مثل SLM-XXXXX",
  "sync_key": "مفتاح المزامنة إن وجد",
  "raw": "النص الخام المقروء كاملاً"
}
إذا كان يحتوي على نص عادي مثل SLM-XXXX، ضعه في store_id و raw.
أجب بصيغة JSON فقط.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: cleanBase64
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(responseText);
      res.json(parsedData);
    } catch (error: any) {
      console.error("QR Scan Error:", error);
      res.status(500).json({ error: error?.message || "تعذر قراءة الباركود من الصورة." });
    }
  });

  // Logo & Label Analyzer endpoint (matching Flutter LogoScannerScreen)
  app.post("/api/analyze-logo", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "الصورة مطلوبة لفحص الشعار." });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

      const prompt = `حلل هذه الصورة واستخرج بيانات الشعار بدقة.
أعد الناتج ككائن JSON بالصيغة التالية تماماً:
{
  "brand_name": "اسم العلامة التجارية / الشعار الظاهر",
  "product_name": "اسم المنتج الرئيسي (مثلاً: عسل سدر، عسل حبة البركة)",
  "details": "تفاصيل ومواصفات المنتج أو النصوص المكتوبة على الملصق",
  "weight_or_volume": "الوزن أو الحجم إذا كان مذكوراً مثل 1 كغ، 850غ أو فارغ",
  "formatted_text": "ملخص كامل ومنسق بنقاط واضحة باللغة العربية"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: cleanBase64
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        config: {
          temperature: 0.2, // قيمة منخفضة لزيادة الدقة وتقليل التخمين
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brand_name: {
                type: Type.STRING,
                description: "اسم العلامة التجارية أو اسم الشعار الظاهر",
              },
              product_name: {
                type: Type.STRING,
                description: "اسم المنتج أو التصنيف المحدد",
              },
              details: {
                type: Type.STRING,
                description: "أي تفاصيل، مواصفات، أو بيانات إضافية مكتوبة على الملصق",
              },
              weight_or_volume: {
                type: Type.STRING,
                description: "الوزن أو الحجم إن وُجد (مثل 1kg أو 500g)",
                nullable: true,
              },
              price: {
                type: Type.NUMBER,
                description: "السعر إن وجد على الملصق أو العبوة",
                nullable: true,
              },
              currency: {
                type: Type.STRING,
                description: "رمز أو اسم العملة (مثل SAR, USD, TRY, د.ع) إن وجد",
                nullable: true,
              },
              formatted_text: {
                type: Type.STRING,
                description: "ملخص نصي مرتب ومنظم بنقاط واضحة باللغة العربية",
              },
            },
            required: ["brand_name", "product_name", "details"],
          },
        }
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch (e) {
        parsedData = { details: responseText };
      }

      const logoData = {
        brand_name: parsedData.brand_name || '',
        product_name: parsedData.product_name || '',
        details: parsedData.details || '',
        weight_or_volume: parsedData.weight_or_volume || null,
        price: parsedData.price !== undefined ? Number(parsedData.price) : null,
        currency: parsedData.currency || null,
        formatted_text: parsedData.formatted_text || parsedData.details || responseText
      };

      res.json({ 
        success: true, 
        text: logoData.formatted_text,
        data: logoData 
      });
    } catch (error: any) {
      console.error("Logo Scan Error:", error);
      res.status(500).json({ error: error?.message || "حدث خطأ أثناء فحص الشعار بواسطة الذكاء الاصطناعي." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
