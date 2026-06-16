import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MIME types Claude can process natively as documents
const SUPPORTED_PDF_TYPE = 'application/pdf';

// Claude does not support binary Word formats natively.
// DOC/DOCX should be converted to PDF or TXT before upload.
// TXT files are handled directly in the frontend (InputZone.tsx) without calling this function.
const UNSUPPORTED_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { document, fileName, mimeType } = await req.json();

    if (!document) {
      throw new Error('No document data provided');
    }

    console.log('Processing document:', fileName, 'type:', mimeType);

    if (UNSUPPORTED_TYPES.includes(mimeType)) {
      return new Response(
        JSON.stringify({
          error: `Word documents (.doc/.docx) cannot be processed directly. Please save as PDF or copy the text and paste it into the narrative field.`
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isPDF = mimeType === SUPPORTED_PDF_TYPE;
    const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType);

    if (!isPDF && !isImage) {
      return new Response(
        JSON.stringify({ error: `Unsupported file type: ${mimeType}. Please upload a PDF, image, or plain text file.` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gemini via Lovable AI Gateway accepts PDFs and images as base64 data URLs in image_url
    const dataUrl = `data:${mimeType};base64,${document}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a document text extraction assistant for a psychiatric clinical system. Extract ALL text content from the provided document faithfully and completely. Preserve structure (headings, paragraphs, lists, tables). Do not summarise or interpret — extract the raw text exactly as written. If the document contains clinical notes, patient narratives, or assessment data, preserve every detail.',
          },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl } },
              { type: 'text', text: `Extract all text content from this document (${fileName}). Return only the extracted text, preserving structure and formatting. Do not add commentary.` },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to your Lovable workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data?.choices?.[0]?.message?.content || '';

    console.log('Document processed successfully, extracted', extractedText.length, 'characters');

    return new Response(
      JSON.stringify({ text: extractedText, fileName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
