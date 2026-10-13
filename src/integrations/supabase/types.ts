export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_confidence_log: {
        Row: {
          calibrated_confidence: number | null
          clinician_override: boolean
          clinician_override_reason: string | null
          created_at: string
          created_by: string | null
          encounter_id: string | null
          function_name: string
          id: string
          model_version_id: string | null
          patient_id: string | null
          prompt_template_id: string | null
          raw_confidence: number | null
          updated_at: string
        }
        Insert: {
          calibrated_confidence?: number | null
          clinician_override?: boolean
          clinician_override_reason?: string | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          function_name: string
          id?: string
          model_version_id?: string | null
          patient_id?: string | null
          prompt_template_id?: string | null
          raw_confidence?: number | null
          updated_at?: string
        }
        Update: {
          calibrated_confidence?: number | null
          clinician_override?: boolean
          clinician_override_reason?: string | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          function_name?: string
          id?: string
          model_version_id?: string | null
          patient_id?: string | null
          prompt_template_id?: string | null
          raw_confidence?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_confidence_log_model_version_id_fkey"
            columns: ["model_version_id"]
            isOneToOne: false
            referencedRelation: "model_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_confidence_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_confidence_log_prompt_template_id_fkey"
            columns: ["prompt_template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_drift_metrics: {
        Row: {
          avg_confidence: number | null
          created_at: string
          error_rate: number | null
          flag_reason: string | null
          flagged: boolean
          function_name: string
          id: string
          override_rate: number | null
          period_end: string
          period_start: string
          total_invocations: number
        }
        Insert: {
          avg_confidence?: number | null
          created_at?: string
          error_rate?: number | null
          flag_reason?: string | null
          flagged?: boolean
          function_name: string
          id?: string
          override_rate?: number | null
          period_end: string
          period_start: string
          total_invocations?: number
        }
        Update: {
          avg_confidence?: number | null
          created_at?: string
          error_rate?: number | null
          flag_reason?: string | null
          flagged?: boolean
          function_name?: string
          id?: string
          override_rate?: number | null
          period_end?: string
          period_start?: string
          total_invocations?: number
        }
        Relationships: []
      }
      ai_incidents: {
        Row: {
          capa_notes: string | null
          closed_at: string | null
          created_at: string
          description: string
          id: string
          incident_type: string
          linked_ai_output_id: string | null
          linked_patient_id: string | null
          reported_by: string | null
          reporter_role: string | null
          reviewer_id: string | null
          severity: string
          source_function: string | null
          status: string
          updated_at: string
        }
        Insert: {
          capa_notes?: string | null
          closed_at?: string | null
          created_at?: string
          description: string
          id?: string
          incident_type: string
          linked_ai_output_id?: string | null
          linked_patient_id?: string | null
          reported_by?: string | null
          reporter_role?: string | null
          reviewer_id?: string | null
          severity?: string
          source_function?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          capa_notes?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          incident_type?: string
          linked_ai_output_id?: string | null
          linked_patient_id?: string | null
          reported_by?: string | null
          reporter_role?: string | null
          reviewer_id?: string | null
          severity?: string
          source_function?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_inference_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          created_at: string
          dosage_blocked: boolean
          function_name: string
          id: string
          injection_detected: boolean
          injection_patterns: Json
          input_chars: number
          input_rejected: boolean
          latency_ms: number | null
          model_id: string | null
          model_version: string | null
          patient_id: string | null
          prompt_template_id: string | null
          retried: boolean
          schema_valid: boolean | null
          validation_errors: Json | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          dosage_blocked?: boolean
          function_name: string
          id?: string
          injection_detected?: boolean
          injection_patterns?: Json
          input_chars?: number
          input_rejected?: boolean
          latency_ms?: number | null
          model_id?: string | null
          model_version?: string | null
          patient_id?: string | null
          prompt_template_id?: string | null
          retried?: boolean
          schema_valid?: boolean | null
          validation_errors?: Json | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          dosage_blocked?: boolean
          function_name?: string
          id?: string
          injection_detected?: boolean
          injection_patterns?: Json
          input_chars?: number
          input_rejected?: boolean
          latency_ms?: number | null
          model_id?: string | null
          model_version?: string | null
          patient_id?: string | null
          prompt_template_id?: string | null
          retried?: boolean
          schema_valid?: boolean | null
          validation_errors?: Json | null
        }
        Relationships: []
      }
      ai_model_cards: {
        Row: {
          bias_assessment: Json
          capabilities: Json
          created_at: string
          ethical_considerations: string | null
          id: string
          intended_use: string
          last_updated: string
          limitations: Json
          model_name: string
          model_version: string
          out_of_scope_uses: Json
          performance_metrics: Json
          provider: string
          reviewed_by: string | null
          training_data_summary: string | null
        }
        Insert: {
          bias_assessment?: Json
          capabilities?: Json
          created_at?: string
          ethical_considerations?: string | null
          id?: string
          intended_use: string
          last_updated?: string
          limitations?: Json
          model_name: string
          model_version: string
          out_of_scope_uses?: Json
          performance_metrics?: Json
          provider: string
          reviewed_by?: string | null
          training_data_summary?: string | null
        }
        Update: {
          bias_assessment?: Json
          capabilities?: Json
          created_at?: string
          ethical_considerations?: string | null
          id?: string
          intended_use?: string
          last_updated?: string
          limitations?: Json
          model_name?: string
          model_version?: string
          out_of_scope_uses?: Json
          performance_metrics?: Json
          provider?: string
          reviewed_by?: string | null
          training_data_summary?: string | null
        }
        Relationships: []
      }
      ai_safety_preambles: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string
          effective_until: string | null
          id: string
          is_current: boolean
          preamble_hash: string
          preamble_text: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_current?: boolean
          preamble_hash: string
          preamble_text: string
          updated_at?: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_current?: boolean
          preamble_hash?: string
          preamble_text?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_type: string
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          scheduled_at: string
          status: string
          treatment_plan_reference: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_type: string
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id: string
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          scheduled_at: string
          status?: string
          treatment_plan_reference?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_type?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          scheduled_at?: string
          status?: string
          treatment_plan_reference?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          ai_generated: boolean
          assessment_date: string
          created_at: string
          cultural_idioms_found: string[] | null
          id: string
          language_detected: string | null
          metadata: Json | null
          model_id: string | null
          model_version: string | null
          narrative: string
          patient_id: string | null
          processed_result: Json
          prompt_template_id: string | null
          prompt_template_version: string | null
          provenance: Json | null
          risk_level: string | null
          synthetic: boolean
          user_id: string
        }
        Insert: {
          ai_generated?: boolean
          assessment_date?: string
          created_at?: string
          cultural_idioms_found?: string[] | null
          id?: string
          language_detected?: string | null
          metadata?: Json | null
          model_id?: string | null
          model_version?: string | null
          narrative: string
          patient_id?: string | null
          processed_result: Json
          prompt_template_id?: string | null
          prompt_template_version?: string | null
          provenance?: Json | null
          risk_level?: string | null
          synthetic?: boolean
          user_id: string
        }
        Update: {
          ai_generated?: boolean
          assessment_date?: string
          created_at?: string
          cultural_idioms_found?: string[] | null
          id?: string
          language_detected?: string | null
          metadata?: Json | null
          model_id?: string | null
          model_version?: string | null
          narrative?: string
          patient_id?: string | null
          processed_result?: Json
          prompt_template_id?: string | null
          prompt_template_version?: string | null
          provenance?: Json | null
          risk_level?: string | null
          synthetic?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_recordings: {
        Row: {
          checksum: string | null
          chw_session_id: string | null
          consent_id: string | null
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          encounter_ref: string | null
          id: string
          language_code: string | null
          mime_type: string
          patient_id: string
          retention_until: string
          size_bytes: number
          storage_path: string
          synthetic: boolean
          updated_at: string
          uploaded_by: string
          uploader_role: string
        }
        Insert: {
          checksum?: string | null
          chw_session_id?: string | null
          consent_id?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          encounter_ref?: string | null
          id?: string
          language_code?: string | null
          mime_type?: string
          patient_id: string
          retention_until?: string
          size_bytes?: number
          storage_path: string
          synthetic?: boolean
          updated_at?: string
          uploaded_by: string
          uploader_role?: string
        }
        Update: {
          checksum?: string | null
          chw_session_id?: string | null
          consent_id?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          encounter_ref?: string | null
          id?: string
          language_code?: string | null
          mime_type?: string
          patient_id?: string
          retention_until?: string
          size_bytes?: number
          storage_path?: string
          synthetic?: boolean
          updated_at?: string
          uploaded_by?: string
          uploader_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_recordings_chw_session_id_fkey"
            columns: ["chw_session_id"]
            isOneToOne: false
            referencedRelation: "chw_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_recordings_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_recordings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string
          actor_role: string
          description: string | null
          encounter_id: string | null
          id: string
          metadata: Json | null
          outcome: string
          patient_id: string | null
          recorded_at: string
          resource_id: string | null
          resource_type: string
          source: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_role: string
          description?: string | null
          encounter_id?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string
          patient_id?: string | null
          recorded_at?: string
          resource_id?: string | null
          resource_type: string
          source?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_role?: string
          description?: string | null
          encounter_id?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string
          patient_id?: string | null
          recorded_at?: string
          resource_id?: string | null
          resource_type?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      chw_session_transcript_chunks: {
        Row: {
          chunk_index: number
          chw_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string
          id: string
          language_code: string | null
          session_id: string
          started_at: string
          text: string
        }
        Insert: {
          chunk_index: number
          chw_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at: string
          id?: string
          language_code?: string | null
          session_id: string
          started_at: string
          text: string
        }
        Update: {
          chunk_index?: number
          chw_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string
          id?: string
          language_code?: string | null
          session_id?: string
          started_at?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chw_session_transcript_chunks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chw_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chw_sessions: {
        Row: {
          chw_id: string
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          narrative_text: string | null
          notes: string | null
          patient_id: string
          phq9_item9_flag: boolean | null
          phq9_score: number | null
          phq9_severity: string | null
          session_number: number
          started_at: string
          status: string
          synthetic: boolean
          transcript_language: string | null
          updated_at: string
        }
        Insert: {
          chw_id: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          narrative_text?: string | null
          notes?: string | null
          patient_id: string
          phq9_item9_flag?: boolean | null
          phq9_score?: number | null
          phq9_severity?: string | null
          session_number?: number
          started_at?: string
          status?: string
          synthetic?: boolean
          transcript_language?: string | null
          updated_at?: string
        }
        Update: {
          chw_id?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          narrative_text?: string | null
          notes?: string | null
          patient_id?: string
          phq9_item9_flag?: boolean | null
          phq9_score?: number | null
          phq9_severity?: string | null
          session_number?: number
          started_at?: string
          status?: string
          synthetic?: boolean
          transcript_language?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chw_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          consent_type: string
          consent_version: string
          consented_at: string
          created_at: string
          fhir_scope: string
          id: string
          language_code: string
          method: string
          notes: string | null
          patient_id: string
          recorded_by: string
          status: string
          updated_at: string
          withdrawal_reason: string | null
          withdrawn_at: string | null
        }
        Insert: {
          consent_type: string
          consent_version?: string
          consented_at?: string
          created_at?: string
          fhir_scope?: string
          id?: string
          language_code?: string
          method?: string
          notes?: string | null
          patient_id: string
          recorded_by: string
          status?: string
          updated_at?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          consent_type?: string
          consent_version?: string
          consented_at?: string
          created_at?: string
          fhir_scope?: string
          id?: string
          language_code?: string
          method?: string
          notes?: string | null
          patient_id?: string
          recorded_by?: string
          status?: string
          updated_at?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      crisis_interventions: {
        Row: {
          checklist_completed: Json | null
          created_at: string | null
          crisis_started_at: string | null
          crisis_type: string
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          interventions_applied: Json | null
          outcome: string | null
          patient_id: string
          referral_destination: string | null
          referral_made: boolean | null
          referral_notes: string | null
          referral_type: string | null
          resolved_at: string | null
          severity_level: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checklist_completed?: Json | null
          created_at?: string | null
          crisis_started_at?: string | null
          crisis_type: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          interventions_applied?: Json | null
          outcome?: string | null
          patient_id: string
          referral_destination?: string | null
          referral_made?: boolean | null
          referral_notes?: string | null
          referral_type?: string | null
          resolved_at?: string | null
          severity_level: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checklist_completed?: Json | null
          created_at?: string | null
          crisis_started_at?: string | null
          crisis_type?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          interventions_applied?: Json | null
          outcome?: string | null
          patient_id?: string
          referral_destination?: string | null
          referral_made?: boolean | null
          referral_notes?: string | null
          referral_type?: string | null
          resolved_at?: string | null
          severity_level?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crisis_interventions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_formulations: {
        Row: {
          ai_generated: boolean
          ai_suggestions: Json | null
          approved_at: string | null
          approved_by: string | null
          assessment_id: string | null
          created_at: string | null
          created_by: string | null
          cultural_formulation: string | null
          diagnosis_confidence: string | null
          diagnostic_framework: string
          diagnostic_reasoning: string | null
          differential_diagnoses: Json | null
          formulated_at: string | null
          id: string
          model_id: string | null
          model_version: string | null
          patient_id: string
          primary_diagnosis_code: string
          primary_diagnosis_name: string
          prompt_template_id: string | null
          prompt_template_version: string | null
          provenance: Json | null
          status: string | null
          supporting_evidence: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean
          ai_suggestions?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          assessment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          cultural_formulation?: string | null
          diagnosis_confidence?: string | null
          diagnostic_framework: string
          diagnostic_reasoning?: string | null
          differential_diagnoses?: Json | null
          formulated_at?: string | null
          id?: string
          model_id?: string | null
          model_version?: string | null
          patient_id: string
          primary_diagnosis_code: string
          primary_diagnosis_name: string
          prompt_template_id?: string | null
          prompt_template_version?: string | null
          provenance?: Json | null
          status?: string | null
          supporting_evidence?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean
          ai_suggestions?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          assessment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          cultural_formulation?: string | null
          diagnosis_confidence?: string | null
          diagnostic_framework?: string
          diagnostic_reasoning?: string | null
          differential_diagnoses?: Json | null
          formulated_at?: string | null
          id?: string
          model_id?: string | null
          model_version?: string | null
          patient_id?: string
          primary_diagnosis_code?: string
          primary_diagnosis_name?: string
          prompt_template_id?: string | null
          prompt_template_version?: string | null
          provenance?: Json | null
          status?: string | null
          supporting_evidence?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_formulations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_formulations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_results: {
        Row: {
          created_at: string
          eval_suite_version: string
          function_name: string
          id: string
          model_version_id: string
          passed: boolean
          prompt_template_id: string | null
          run_by: string | null
          score: Json
          test_date: string
        }
        Insert: {
          created_at?: string
          eval_suite_version?: string
          function_name: string
          id?: string
          model_version_id: string
          passed: boolean
          prompt_template_id?: string | null
          run_by?: string | null
          score?: Json
          test_date?: string
        }
        Update: {
          created_at?: string
          eval_suite_version?: string
          function_name?: string
          id?: string
          model_version_id?: string
          passed?: boolean
          prompt_template_id?: string | null
          run_by?: string | null
          score?: Json
          test_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_results_model_version_id_fkey"
            columns: ["model_version_id"]
            isOneToOne: false
            referencedRelation: "model_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_results_prompt_template_id_fkey"
            columns: ["prompt_template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          accepts_referrals: boolean
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          emergency_capable: boolean
          facility_name: string
          facility_type: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          operating_hours: Json
          province: string | null
          region: string
          services_offered: string[]
          specialisations: string[]
          subscription_tier: string
          updated_at: string
          website: string | null
        }
        Insert: {
          accepts_referrals?: boolean
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          emergency_capable?: boolean
          facility_name: string
          facility_type?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          operating_hours?: Json
          province?: string | null
          region: string
          services_offered?: string[]
          specialisations?: string[]
          subscription_tier?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          accepts_referrals?: boolean
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          emergency_capable?: boolean
          facility_name?: string
          facility_type?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          operating_hours?: Json
          province?: string | null
          region?: string
          services_offered?: string[]
          specialisations?: string[]
          subscription_tier?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      facility_referrals: {
        Row: {
          accepted_at: string | null
          assigned_to: string | null
          created_at: string
          escalated: boolean
          escalation_reason: string | null
          facility_id: string
          id: string
          matched_at: string
          notes: string | null
          session_id: string
          sla_deadline: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_to?: string | null
          created_at?: string
          escalated?: boolean
          escalation_reason?: string | null
          facility_id: string
          id?: string
          matched_at?: string
          notes?: string | null
          session_id: string
          sla_deadline?: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_to?: string | null
          created_at?: string
          escalated?: boolean
          escalation_reason?: string | null
          facility_id?: string
          id?: string
          matched_at?: string
          notes?: string | null
          session_id?: string
          sla_deadline?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_referrals_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_referrals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "self_assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      fhir_resources: {
        Row: {
          created_at: string
          created_by: string
          id: string
          patient_id: string | null
          resource: Json
          resource_id: string
          resource_type: string
          source_id: string | null
          source_table: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          patient_id?: string | null
          resource: Json
          resource_id: string
          resource_type: string
          source_id?: string | null
          source_table?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          patient_id?: string | null
          resource?: Json
          resource_id?: string
          resource_type?: string
          source_id?: string | null
          source_table?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fhir_resources_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      golden_cases: {
        Row: {
          active: boolean
          adversarial: boolean
          case_name: string
          clinician_reviewed: boolean
          created_at: string
          expected_output_schema: Json
          function_name: string
          id: string
          input_text: string
          reviewer_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          adversarial?: boolean
          case_name: string
          clinician_reviewed?: boolean
          created_at?: string
          expected_output_schema?: Json
          function_name: string
          id?: string
          input_text: string
          reviewer_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          adversarial?: boolean
          case_name?: string
          clinician_reviewed?: boolean
          created_at?: string
          expected_output_schema?: Json
          function_name?: string
          id?: string
          input_text?: string
          reviewer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      idiom_submissions: {
        Row: {
          clinical_context: string | null
          clinician_interpretation: string
          created_at: string
          id: string
          idiom: string
          language_code: string
          patient_utterance: string
          status: string
          submitted_by: string
        }
        Insert: {
          clinical_context?: string | null
          clinician_interpretation: string
          created_at?: string
          id?: string
          idiom: string
          language_code: string
          patient_utterance: string
          status?: string
          submitted_by: string
        }
        Update: {
          clinical_context?: string | null
          clinician_interpretation?: string
          created_at?: string
          id?: string
          idiom?: string
          language_code?: string
          patient_utterance?: string
          status?: string
          submitted_by?: string
        }
        Relationships: []
      }
      model_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          model_id: string
          model_version_label: string
          notes: string | null
          pinned_at: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          model_id: string
          model_version_label: string
          notes?: string | null
          pinned_at?: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          model_id?: string
          model_version_label?: string
          notes?: string | null
          pinned_at?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_intake_consents: {
        Row: {
          consent_text_version: string
          consent_type: string
          granted: boolean
          granted_at: string
          id: string
          ip_hash: string | null
          language_code: string
          session_id: string
        }
        Insert: {
          consent_text_version?: string
          consent_type: string
          granted?: boolean
          granted_at?: string
          id?: string
          ip_hash?: string | null
          language_code?: string
          session_id: string
        }
        Update: {
          consent_text_version?: string
          consent_type?: string
          granted?: boolean
          granted_at?: string
          id?: string
          ip_hash?: string | null
          language_code?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_intake_consents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "patient_intake_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_intake_responses: {
        Row: {
          completed_at: string
          id: string
          interpretation: string | null
          item_flags: Json | null
          responses: Json
          session_id: string
          severity_level: string | null
          tool_type: string
          total_score: number
        }
        Insert: {
          completed_at?: string
          id?: string
          interpretation?: string | null
          item_flags?: Json | null
          responses: Json
          session_id: string
          severity_level?: string | null
          tool_type: string
          total_score: number
        }
        Update: {
          completed_at?: string
          id?: string
          interpretation?: string | null
          item_flags?: Json | null
          responses?: Json
          session_id?: string
          severity_level?: string | null
          tool_type?: string
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "patient_intake_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "patient_intake_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_intake_sessions: {
        Row: {
          ai_generated: boolean
          ai_intake_summary: Json | null
          clinic_code: string | null
          clinician_id: string
          completed_at: string | null
          created_at: string
          demographics: Json | null
          expires_at: string
          id: string
          language_code: string
          model_id: string | null
          model_version: string | null
          narrative_text: string | null
          patient_id: string | null
          prompt_template_id: string | null
          prompt_template_version: string | null
          provenance: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_flags: Json | null
          started_at: string | null
          status: string
          tier: string
          token: string
        }
        Insert: {
          ai_generated?: boolean
          ai_intake_summary?: Json | null
          clinic_code?: string | null
          clinician_id: string
          completed_at?: string | null
          created_at?: string
          demographics?: Json | null
          expires_at?: string
          id?: string
          language_code?: string
          model_id?: string | null
          model_version?: string | null
          narrative_text?: string | null
          patient_id?: string | null
          prompt_template_id?: string | null
          prompt_template_version?: string | null
          provenance?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_flags?: Json | null
          started_at?: string | null
          status?: string
          tier?: string
          token: string
        }
        Update: {
          ai_generated?: boolean
          ai_intake_summary?: Json | null
          clinic_code?: string | null
          clinician_id?: string
          completed_at?: string | null
          created_at?: string
          demographics?: Json | null
          expires_at?: string
          id?: string
          language_code?: string
          model_id?: string | null
          model_version?: string | null
          narrative_text?: string | null
          patient_id?: string | null
          prompt_template_id?: string | null
          prompt_template_version?: string | null
          provenance?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_flags?: Json | null
          started_at?: string | null
          status?: string
          tier?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_intake_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          contact_notes: string | null
          created_at: string
          cultural_background: string | null
          date_of_birth: string | null
          gender: string | null
          id: string
          language_preference: string | null
          metadata: Json | null
          patient_identifier: string
          synthetic: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_notes?: string | null
          created_at?: string
          cultural_background?: string | null
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          language_preference?: string | null
          metadata?: Json | null
          patient_identifier: string
          synthetic?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_notes?: string | null
          created_at?: string
          cultural_background?: string | null
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          language_preference?: string | null
          metadata?: Json | null
          patient_identifier?: string
          synthetic?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pilot_config: {
        Row: {
          allow_real_data: boolean
          created_at: string
          id: string
          pilot_end_date: string | null
          pilot_mode: boolean
          pilot_version: string
          updated_at: string
        }
        Insert: {
          allow_real_data?: boolean
          created_at?: string
          id?: string
          pilot_end_date?: string | null
          pilot_mode?: boolean
          pilot_version?: string
          updated_at?: string
        }
        Update: {
          allow_real_data?: boolean
          created_at?: string
          id?: string
          pilot_end_date?: string | null
          pilot_mode?: boolean
          pilot_version?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          created_at: string
          created_by: string | null
          function_name: string
          id: string
          notes: string | null
          safety_preamble_hash: string | null
          safety_preamble_id: string | null
          status: string
          system_prompt: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          function_name: string
          id?: string
          notes?: string | null
          safety_preamble_hash?: string | null
          safety_preamble_id?: string | null
          status?: string
          system_prompt: string
          updated_at?: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          function_name?: string
          id?: string
          notes?: string | null
          safety_preamble_hash?: string | null
          safety_preamble_id?: string | null
          status?: string
          system_prompt?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_templates_safety_preamble_id_fkey"
            columns: ["safety_preamble_id"]
            isOneToOne: false
            referencedRelation: "ai_safety_preambles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_counters: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          subject_hash: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          subject_hash: string
          window_start: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          subject_hash?: string
          window_start?: string
        }
        Relationships: []
      }
      rate_limit_policies: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          max_requests: number
          updated_at: string
          window_seconds: number
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          max_requests?: number
          updated_at?: string
          window_seconds?: number
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          max_requests?: number
          updated_at?: string
          window_seconds?: number
        }
        Relationships: []
      }
      referral_targets: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          target_type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          target_type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          chw_session_id: string | null
          context: string
          created_at: string
          crisis_intervention_id: string | null
          destination: string | null
          id: string
          notes: string | null
          pathway_id: string | null
          patient_id: string
          reason: string | null
          recorded_by: string
          referral_type: string
          specialist_type: string | null
          status: string
          target_id: string | null
          updated_at: string
          urgency: string
        }
        Insert: {
          chw_session_id?: string | null
          context?: string
          created_at?: string
          crisis_intervention_id?: string | null
          destination?: string | null
          id?: string
          notes?: string | null
          pathway_id?: string | null
          patient_id: string
          reason?: string | null
          recorded_by: string
          referral_type: string
          specialist_type?: string | null
          status?: string
          target_id?: string | null
          updated_at?: string
          urgency?: string
        }
        Update: {
          chw_session_id?: string | null
          context?: string
          created_at?: string
          crisis_intervention_id?: string | null
          destination?: string | null
          id?: string
          notes?: string | null
          pathway_id?: string | null
          patient_id?: string
          reason?: string | null
          recorded_by?: string
          referral_type?: string
          specialist_type?: string | null
          status?: string
          target_id?: string | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_chw_session_id_fkey"
            columns: ["chw_session_id"]
            isOneToOne: false
            referencedRelation: "chw_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "referral_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      rules_engine_versions: {
        Row: {
          created_at: string
          created_by: string | null
          effective_date: string
          id: string
          mhgap_version: string
          pathway_logic_hash: string
          scoring_logic_hash: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_date?: string
          id?: string
          mhgap_version?: string
          pathway_logic_hash: string
          scoring_logic_hash: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_date?: string
          id?: string
          mhgap_version?: string
          pathway_logic_hash?: string
          scoring_logic_hash?: string
          version?: string
        }
        Relationships: []
      }
      screening_assessments: {
        Row: {
          administered_at: string
          created_at: string
          created_by: string | null
          id: string
          interpretation: string | null
          notes: string | null
          patient_id: string
          responses: Json
          rules_version_id: string | null
          severity_level: string | null
          synthetic: boolean
          tool_type: string
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          administered_at?: string
          created_at?: string
          created_by?: string | null
          id?: string
          interpretation?: string | null
          notes?: string | null
          patient_id: string
          responses: Json
          rules_version_id?: string | null
          severity_level?: string | null
          synthetic?: boolean
          tool_type: string
          total_score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          administered_at?: string
          created_at?: string
          created_by?: string | null
          id?: string
          interpretation?: string | null
          notes?: string | null
          patient_id?: string
          responses?: Json
          rules_version_id?: string | null
          severity_level?: string | null
          synthetic?: boolean
          tool_type?: string
          total_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screening_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screening_assessments_rules_version_id_fkey"
            columns: ["rules_version_id"]
            isOneToOne: false
            referencedRelation: "rules_engine_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      self_assessment_consents: {
        Row: {
          consent_text_version: string
          consent_type: string
          granted: boolean
          granted_at: string
          id: string
          ip_hash: string | null
          language_code: string
          session_id: string
        }
        Insert: {
          consent_text_version?: string
          consent_type: string
          granted?: boolean
          granted_at?: string
          id?: string
          ip_hash?: string | null
          language_code?: string
          session_id: string
        }
        Update: {
          consent_text_version?: string
          consent_type?: string
          granted?: boolean
          granted_at?: string
          id?: string
          ip_hash?: string | null
          language_code?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "self_assessment_consents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "self_assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      self_assessment_responses: {
        Row: {
          completed_at: string
          id: string
          interpretation: string | null
          item_flags: Json
          responses: Json
          session_id: string
          severity_level: string | null
          tool_type: string
          total_score: number
        }
        Insert: {
          completed_at?: string
          id?: string
          interpretation?: string | null
          item_flags?: Json
          responses: Json
          session_id: string
          severity_level?: string | null
          tool_type: string
          total_score: number
        }
        Update: {
          completed_at?: string
          id?: string
          interpretation?: string | null
          item_flags?: Json
          responses?: Json
          session_id?: string
          severity_level?: string | null
          tool_type?: string
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "self_assessment_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "self_assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      self_assessment_sessions: {
        Row: {
          ai_diagnostic_suggestions: Json | null
          ai_generated: boolean
          completed_at: string | null
          created_at: string
          demographics: Json
          document_urls: string[]
          expires_at: string
          id: string
          language_code: string
          latitude: number | null
          location_region: string | null
          longitude: number | null
          model_id: string | null
          model_version: string | null
          narrative_text: string | null
          prompt_template_id: string | null
          prompt_template_version: string | null
          provenance: Json | null
          risk_level: string | null
          session_token: string
          status: string
          triage_result: Json | null
        }
        Insert: {
          ai_diagnostic_suggestions?: Json | null
          ai_generated?: boolean
          completed_at?: string | null
          created_at?: string
          demographics?: Json
          document_urls?: string[]
          expires_at?: string
          id?: string
          language_code?: string
          latitude?: number | null
          location_region?: string | null
          longitude?: number | null
          model_id?: string | null
          model_version?: string | null
          narrative_text?: string | null
          prompt_template_id?: string | null
          prompt_template_version?: string | null
          provenance?: Json | null
          risk_level?: string | null
          session_token?: string
          status?: string
          triage_result?: Json | null
        }
        Update: {
          ai_diagnostic_suggestions?: Json | null
          ai_generated?: boolean
          completed_at?: string | null
          created_at?: string
          demographics?: Json
          document_urls?: string[]
          expires_at?: string
          id?: string
          language_code?: string
          latitude?: number | null
          location_region?: string | null
          longitude?: number | null
          model_id?: string | null
          model_version?: string | null
          narrative_text?: string | null
          prompt_template_id?: string | null
          prompt_template_version?: string | null
          provenance?: Json | null
          risk_level?: string | null
          session_token?: string
          status?: string
          triage_result?: Json | null
        }
        Relationships: []
      }
      treatment_notes: {
        Row: {
          ai_generated: boolean
          content: string
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          model_id: string | null
          model_version: string | null
          note_type: string
          patient_id: string
          prompt_template_id: string | null
          prompt_template_version: string | null
          provenance: Json | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          model_id?: string | null
          model_version?: string | null
          note_type: string
          patient_id: string
          prompt_template_id?: string | null
          prompt_template_version?: string | null
          provenance?: Json | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          model_id?: string | null
          model_version?: string | null
          note_type?: string
          patient_id?: string
          prompt_template_id?: string | null
          prompt_template_version?: string | null
          provenance?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_clinician_directory: {
        Args: never
        Returns: {
          email: string
          full_name: string
          id: string
          role: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "psychiatrist"
        | "viewer"
        | "chw"
        | "safety_monitor"
        | "principal_investigator"
        | "mh_nurse"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "psychiatrist",
        "viewer",
        "chw",
        "safety_monitor",
        "principal_investigator",
        "mh_nurse",
      ],
    },
  },
} as const
