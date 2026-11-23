import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import TabsNavigation from './components/TabsNavigation';
import DemographicsSection from './components/DemographicsSection';
import EncounterSection from './components/EncounterSection';
import ClinicalSection from './components/ClinicalSection';
import MedicationsSection from './components/MedicationsSection';
import ResultCard from './components/ResultCard';
import ModelInfoModal from './components/ModelInfoModal';
import { checkBackendHealth, requestPrediction } from './services/api';
import { getFieldTab, validateForm } from './constants/validation';
import { INITIAL_FORM_DATA, CLINICAL_PRESETS } from './constants/fields';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [slowColdStart, setSlowColdStart] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [result, setResult] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [fieldToFocus, setFieldToFocus] = useState(null);
  const prediction = useRef(null);
  const healthCheck = useRef(null);

  useEffect(() => {
    if (fieldToFocus) document.getElementById(fieldToFocus.id)?.focus();
  }, [fieldToFocus]);

  // Checagem de conectividade do backend
  const checkHealth = async () => {
    healthCheck.current?.abort();
    const controller = new AbortController();
    healthCheck.current = controller;
    setBackendStatus('checking');
    const status = await checkBackendHealth(controller.signal);
    if (healthCheck.current === controller) setBackendStatus(status);
  };

  useEffect(() => {
    checkHealth();
    return () => {
      healthCheck.current?.abort();
      prediction.current?.abort();
      healthCheck.current = null;
      prediction.current = null;
    };
  }, []);

  const invalidatePrediction = () => {
    prediction.current?.abort();
    prediction.current = null;
    setResult(null);
    setLoading(false);
    setSlowColdStart(false);
    setApiError(null);
  };

  const showFieldErrors = (nextErrors) => {
    setErrors(nextErrors);
    const field = Object.keys(nextErrors).find((key) => getFieldTab(key));
    if (field) {
      setActiveTab(getFieldTab(field));
      setFieldToFocus({ id: field });
    }
  };

  const handleChange = (field, value) => {
    invalidatePrediction();
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Limpa erro do campo alterado
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Carrega casos pré-configurados
  const handleLoadPreset = (preset) => {
    invalidatePrediction();
    setFormData(preset.data);
    setErrors({});
    setActiveTab(1);
  };

  const handleReset = () => {
    invalidatePrediction();
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setActiveTab(1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (prediction.current) return;
    invalidatePrediction();

    const nextErrors = validateForm(formData);
    showFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setApiError('Revise os campos indicados para calcular o risco.');
      return;
    }

    const controller = new AbortController();
    prediction.current = controller;
    setLoading(true);

    // Constrói payload de acordo com os tipos esperados pelo Pydantic
    const payload = {
      age: Number(formData.age),
      gender: formData.gender,
      charlson_comorbidity_index:
        formData.charlson_comorbidity_index !== null &&
        formData.charlson_comorbidity_index !== ''
          ? Number(formData.charlson_comorbidity_index)
          : null,
      bmi: Number(formData.bmi),
      smoker_status: formData.smoker_status,
      socioeconomic_tier: formData.socioeconomic_tier,
      residential_zone: formData.residential_zone,
      marital_status: formData.marital_status,

      encounter_type: formData.encounter_type,
      admission_urgency: formData.admission_urgency,
      department: formData.department,
      length_of_stay_days: Number(formData.length_of_stay_days),
      revisit_count: Number(formData.revisit_count),
      days_since_last_discharge: formData.is_first_admission
        ? null
        : Number(formData.days_since_last_discharge),

      systolic_bp: Number(formData.systolic_bp),
      diastolic_bp: Number(formData.diastolic_bp),
      heart_rate: Number(formData.heart_rate),
      respiratory_rate: Number(formData.respiratory_rate),
      temperature: Number(formData.temperature),
      spo2: Number(formData.spo2),
      glucose: Number(formData.glucose),
      creatinine: Number(formData.creatinine),
      hemoglobin: Number(formData.hemoglobin),
      wbc_count: Number(formData.wbc_count),
      disease_category: formData.disease_category,
      disease_severity: formData.disease_severity,

      num_medications: validStep(4),
      num_therapeutic_classes: Number(formData.num_therapeutic_classes),
      has_high_risk_med: Number(formData.has_high_risk_med),
      has_anticoagulant: Number(formData.has_anticoagulant),
      has_insulin: Number(formData.has_insulin),
      has_diuretic: Number(formData.has_diuretic),
      has_beta_blocker: Number(formData.has_beta_blocker),
      has_ace_arb: Number(formData.has_ace_arb),
    };

    const res = await requestPrediction(payload, controller.signal, () => {
      if (prediction.current === controller) setSlowColdStart(true);
    });
    if (prediction.current !== controller) return;
    prediction.current = null;
    setLoading(false);
    setSlowColdStart(false);

    if (res.success) {
      if (backendStatus !== 'ok') checkHealth();
      setResult({ data: res.data, input: payload });
    } else {
      if (res.status === 503) checkHealth();
      if (res.status === 422 && Array.isArray(res.details)) {
        const fieldErrors = {};
        for (const detail of res.details) {
          const field = detail.loc?.[1];
          if (getFieldTab(field)) fieldErrors[field] = 'Revise o valor deste campo.';
        }
        showFieldErrors(fieldErrors);
      }
      setApiError(res.message);
    }
  };

  useEffect(() => {
    if (result) document.getElementById('resultado-clinico')?.focus();
  }, [result]);

  const invalidFields = Object.keys(validateForm(formData));
  const validStep = (step) => !invalidFields.some((field) => getFieldTab(field) === step);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      <Navbar
        backendStatus={backendStatus}
        onRefreshHealth={checkHealth}
        onOpenModelInfo={() => setIsModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de Apresentação e Presets Rápidos */}
        <div className="print:hidden bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="badge-chip bg-teal-500/30 text-teal-200 border border-teal-400/30 mb-2">
                Trabalho Final — Probabilidade e Estatística
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Preditor de Risco de Readmissão Hospitalar (30 Dias)
              </h1>
              <p className="text-sm text-teal-100/80 mt-2 leading-relaxed">
                Aplicação integrada ao modelo <strong>GaussianNB</strong> com pipeline de pré-processamento.
                Avalie o risco de retorno precoce de pacientes na alta e visualize recomendações clínicas.
              </p>
            </div>

            {/* Presets Rápidos */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-200 block mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Carregar casos de demonstração
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                {CLINICAL_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleLoadPreset(p)}
                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all text-left flex items-center justify-between gap-3 shadow-xs"
                  >
                    <span>{p.title.split('(')[0]}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        p.badgeColor === 'rose'
                          ? 'bg-rose-500/80 text-white'
                          : p.badgeColor === 'emerald'
                          ? 'bg-emerald-500/80 text-white'
                          : 'bg-amber-500/80 text-white'
                      }`}
                    >
                      {p.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {backendStatus !== 'ok' && backendStatus !== 'checking' && (
          <div role="status" className="print:hidden mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {backendStatus === 'degraded'
              ? 'A API respondeu, mas o modelo não está carregado. Confira os logs do backend.'
              : import.meta.env.DEV
              ? 'Sem resposta da API. Confira se o backend está rodando na porta 8000 ou revise VITE_API_URL.'
              : 'Sem resposta da API. Confira a URL configurada e a disponibilidade do backend.'}
          </div>
        )}

        {/* Aviso de demora */}
        {slowColdStart && (
          <div role="status" className="print:hidden bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs mb-6 flex items-start gap-3 animate-in fade-in">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Aguardando resposta da API
              </h4>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Se o servidor estiver iniciando, a primeira resposta pode demorar.
              </p>
            </div>
          </div>
        )}

        {/* Alerta de Erro da API */}
        {apiError && (
          <div role="alert" className="print:hidden bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-xs mb-6 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Não foi possível calcular o risco
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        {/* Formulário Principal em Abas */}
        <div className="print:hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            <TabsNavigation
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              tabCompletion={{
                demographics: validStep(1),
                encounter: validStep(2),
                clinical: validStep(3),
                medications: validStep(4),
              }}
            />

            <form onSubmit={handleSubmit} noValidate>
              {activeTab === 1 && (
                <DemographicsSection formData={formData} onChange={handleChange} errors={errors} />
              )}
              {activeTab === 2 && (
                <EncounterSection formData={formData} onChange={handleChange} errors={errors} />
              )}
              {activeTab === 3 && (
                <ClinicalSection formData={formData} onChange={handleChange} errors={errors} />
              )}
              {activeTab === 4 && (
                <MedicationsSection formData={formData} onChange={handleChange} errors={errors} />
              )}

              {/* Barra de Navegação entre Etapas */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-8 mt-8 border-t border-slate-200">
                <div>
                  {activeTab > 1 ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab((prev) => prev - 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Etapa Anterior
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restaurar caso inicial
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {activeTab < 4 ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab((prev) => prev + 1)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Próxima Etapa
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-xs font-bold shadow-md shadow-teal-500/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processando Predição...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Calcular Risco de Readmissão
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Card de Resultado da Predição */}
        {result && (
          <div className="mb-12">
            <ResultCard result={result.data} formData={result.input} onReset={handleReset} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="print:hidden bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>
          HospPredict — Trabalho Final de Probabilidade e Estatística • IFCE (Engenharia da Computação)
        </p>
        <p className="mt-1 text-slate-400">
          Orientador: Prof. Valberto Feitosa • Modelo: Naive Bayes (GaussianNB + ColumnTransformer)
        </p>
      </footer>

      {/* Modal de Informações Acadêmicas do Modelo */}
      <ModelInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
