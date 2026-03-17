import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { patient_id, vital_id, vitals, patient, vital_history } = await req.json();

    if (!patient_id || !vitals) {
      return new Response(JSON.stringify({ error: "Missing patient_id or vitals" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build clinical prompt
    const systemPrompt = `You are a clinical decision support AI specialized in Sickle Cell Disease (SCD) and Vaso-Occlusive Crisis (VOC) prediction.

Your role is to analyze patient vital signs and clinical data to predict the risk of an impending vaso-occlusive crisis.

Key risk factors for VOC include:
- Elevated HbS levels (>40%)
- Low SpO2 (<95%)
- Elevated heart rate (>100 bpm)
- Fever (temperature >38°C)
- Dehydration
- Elevated pain score
- Low hemoglobin (<7 g/dL)
- Elevated WBC count (>15 × 10³/μL)
- Elevated reticulocyte count

Consider the patient's genotype, vital sign trends over time, and the combination of multiple risk factors.
Always provide evidence-based reasoning for your assessment.

IMPORTANT: You must respond by calling the assess_voc_risk function with your analysis. Do not respond with plain text.`;

    const userPrompt = `Analyze this sickle cell disease patient for VOC risk:

Patient: ${patient?.first_name} ${patient?.last_name}
Genotype: ${patient?.genotype || 'HbSS'}
Gender: ${patient?.gender}
DOB: ${patient?.date_of_birth}

Current Vitals:
- Heart Rate: ${vitals.heart_rate ?? 'N/A'} bpm
- SpO2: ${vitals.spo2 ?? 'N/A'}%
- Temperature: ${vitals.temperature ?? 'N/A'}°C
- Blood Pressure: ${vitals.systolic_bp ?? 'N/A'}/${vitals.diastolic_bp ?? 'N/A'} mmHg
- HbS Level: ${vitals.hbs_level ?? 'N/A'}%
- Reticulocyte Count: ${vitals.reticulocyte_count ?? 'N/A'}%
- WBC Count: ${vitals.wbc_count ?? 'N/A'} ×10³/μL
- Hemoglobin: ${vitals.hemoglobin ?? 'N/A'} g/dL
- Pain Score: ${vitals.pain_score ?? 'N/A'}/10
- Hydration Status: ${vitals.hydration_status ?? 'N/A'}

Recent Vital History (last ${vital_history?.length || 0} readings):
${(vital_history || []).map((v: any, i: number) => `  Reading ${i + 1} (${v.recorded_at}): HR=${v.heart_rate}, SpO2=${v.spo2}, Temp=${v.temperature}, Pain=${v.pain_score}`).join('\n')}

Assess the VOC risk using the assess_voc_risk function.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "assess_voc_risk",
              description: "Provide a structured VOC risk assessment for a sickle cell disease patient",
              parameters: {
                type: "object",
                properties: {
                  risk_score: {
                    type: "number",
                    description: "VOC risk score from 0 to 100",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence level of the assessment from 0 to 100",
                  },
                  risk_level: {
                    type: "string",
                    enum: ["low", "moderate", "high", "critical"],
                    description: "Overall risk level classification",
                  },
                  contributing_factors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        vital: { type: "string", description: "Name of the vital sign or factor" },
                        direction: { type: "string", enum: ["up", "down", "normal"] },
                        impact_percent: { type: "number", description: "How much this factor contributes to the risk score (0-100)" },
                        detail: { type: "string", description: "Brief explanation of why this factor is concerning" },
                      },
                      required: ["vital", "direction", "impact_percent", "detail"],
                      additionalProperties: false,
                    },
                    description: "List of contributing factors with their impact",
                  },
                  recommended_protocol: {
                    type: "string",
                    description: "Recommended clinical protocol: hydration, analgesia, transfusion, or observation",
                  },
                  clinical_reasoning: {
                    type: "string",
                    description: "Detailed clinical reasoning for the risk assessment in 2-4 sentences",
                  },
                },
                required: ["risk_score", "confidence", "risk_level", "contributing_factors", "recommended_protocol", "clinical_reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "assess_voc_risk" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return a structured assessment");
    }

    const assessment = JSON.parse(toolCall.function.arguments);

    // Store assessment in database
    const { error: insertError } = await supabase.from("assessments").insert({
      patient_id,
      vital_id: vital_id || null,
      risk_score: assessment.risk_score,
      confidence: assessment.confidence,
      risk_level: assessment.risk_level,
      contributing_factors: assessment.contributing_factors,
      recommended_protocol: assessment.recommended_protocol,
      clinical_reasoning: assessment.clinical_reasoning,
      assessed_by: null, // Service role insert
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save assessment");
    }

    return new Response(JSON.stringify(assessment), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("assess-risk error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
