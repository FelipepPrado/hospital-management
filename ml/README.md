# ML — Predição de Readmissão Hospitalar 30 Dias

Pasta de **exploração dos dados, treino e avaliação** do modelo. Ela não é executada em produção: o que vai para o backend é apenas o modelo exportado (`modelo_nb.joblib`).

---

## Responsabilidades

- Explorar o dataset e definir a **variável alvo** da predição (`readmission_30d`).
- Fazer a limpeza, feature engineering e pré-processamento dos dados.
- Treinar, comparar e avaliar os modelos candidatos (Naive Bayes — obrigatório pelo trabalho).
- Exportar o modelo final (pipeline completo: pré-processamento + Naive Bayes) para `backend/model/`.
- Documentar o contrato de API em `ml/CONTRATO.md`.

---

## Dataset

**Hospital Management Data (Kaggle)** — https://www.kaggle.com/datasets/deeplumiere/hospital-management-data

- 4 tabelas principais: `patients.csv` (5.000), `visits_encounters.csv` (13.214), `clinical_details.csv` (13.214), `pharmacy_prescriptions.csv` (26.715)
- Target: `readmission_30d` (binária: 0 = não readmite, 1 = readmite em ≤30 dias) — desbalanceamento 67/33%
- **Dataset sintético** — padrões podem não generalizar para EHR reais

> Antes de usar, confirme a licença do dataset na página do Kaggle.
> Baixe os arquivos e coloque-os em `ml/data/`. Essa pasta **não é versionada** no Git.

---

## Estrutura

```
ml/
├── notebooks/
│   ├── 01_exploracao.ipynb    # EDA, joins, feature engineering, decisões
│   └── 02_treino.ipynb        # Pipeline, treino, avaliação, exportação
├── data/                      # CSVs do dataset (fora do Git)
├── requirements.txt           # Dependências fixas (pip freeze)
├── CONTRATO.md                # Contrato de API (campos, tipos, saída)
└── README.md
```

---

## Decisões do Modelo

| Item | Decisão |
|------|---------|
| **Variável alvo** | `readmission_30d` (binária) |
| **Classes** | 0 = Baixo Risco (não readmite), 1 = Alto Risco (readmite) |
| **Features finais** | 38 (7 numéricas + 31 categóricas após OneHot) |
| **Ordem das features** | Fixada em `ml/CONTRATO.md` (igual ao treino) |
| **Pré-processamento** | `ColumnTransformer`: `SimpleImputer(median)` + `StandardScaler` (num) / `SimpleImputer(most_frequent)` + `OneHotEncoder(handle_unknown='ignore')` (cat) |
| **Modelo final** | `GaussianNB` (Naive Bayes) — requisito do trabalho |
| **Split** | 80/20 estratificado, `random_state=42` |
| **Métricas principais** | Accuracy, Precision/Recall/F1 (macro), AUC-ROC, AUC-PR, Matriz de Confusão |
| **Baseline comparativo** | Logistic Regression (apenas referência) |

---

## Métricas no Teste (20% = 2.643 amostras)

| Métrica | Valor |
|---------|-------|
| **Accuracy** | 0.5970 |
| **Precision (macro)** | 0.5969 |
| **Recall (macro)** | 0.6095 |
| **F1-score (macro)** | 0.5850 |
| **AUC-ROC** | 0.6473 |
| **AUC-PR** | 0.4413 |

**Matriz de Confusão:**
```
                 Predito 0    Predito 1
Real 0 (Não)      1014          756
Real 1 (Sim)       309          564
```

> **Nota**: O baseline Logistic Regression obteve Accuracy=0.73, F1-macro=0.71, AUC=0.80 — superior ao NB, como esperado para features correlacionadas. O Naive Bayes foi mantido por ser requisito do trabalho.

---

## Como Rodar

```bash
cd ml
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

### Executar Notebooks (em ordem)

```bash
# 1. Análise exploratória e feature engineering
jupyter nbconvert --to notebook --execute notebooks/01_exploracao.ipynb --output notebooks/01_exploracao.ipynb

# 2. Treino, avaliação e exportação do modelo
jupyter nbconvert --to notebook --execute notebooks/02_treino.ipynb --output notebooks/02_treino_executed.ipynb
```

> O modelo será salvo em `backend/model/modelo_nb.joblib`.

### Testar Carregamento Standalone

```bash
python notebooks/teste_carregamento.py
```

Saída esperada:
```
[OK] Modelo carregado com sucesso
Classe predita: 1 (Alto Risco)
Probabilidade classe 0: 0.0000
Probabilidade classe 1: 1.0000
Score de risco (%): 100.0%
[OK] Todos os testes passaram!
```

---

## Versões Críticas (Registrar na Entrega)

```bash
python --version                    # Ex: 3.11.x
python -c "import sklearn; print(sklearn.__version__)"  # Ex: 1.5.x
```

> **Regra**: Backend **deve usar a mesma versão do scikit-learn** do treino. Se divergir, re-treinar.

---

## Limitações Conhecidas (Para Apresentação e Documentação)

1. **Dataset sintético** — Padrões podem não generalizar para EHR reais
2. **Features de alta (vazamento potencial)** — Vitals/labs/meds coletados **no momento da alta**; em produção usar valores *pré-alta* (24h antes) ou prever *antes* da decisão de alta
3. **`days_since_last_discharge` = 38% NaN** → Flag `first_admission_flag` captura; imputação com -1
4. **Independência NB** — Features correlacionadas (PA, meds cardíacas, labs) violam假设 do Naive Bayes
5. **Desbalanceamento 67/33** → Macro-F1 usado; considerar *threshold tuning* se custo FN >> FP
6. **Split aleatório** — Em produção usar *time-series split* (treino: meses antigos, teste: mês recente)
7. **Generalização geográfica** — Dataset sem localização; práticas de alta variam por país/sistema
8. **Baseline LR superior** — Regressão Logística costuma bater NB em features correlacionadas; NB escolhido por requisito do trabalho

---

## Entregáveis (Checklist)

- [x] `ml/notebooks/01_exploracao.ipynb` — EDA completa, joins, feature engineering, justificativas
- [x] `ml/notebooks/02_treino.ipynb` — Pipeline, treino, avaliação, exportação, limitações
- [x] `backend/model/modelo_nb.joblib` — Pipeline completo (preprocess + GaussianNB)
- [x] `ml/notebooks/teste_carregamento.py` — Funciona standalone
- [x] `ml/CONTRATO.md` — 38 campos documentados com tipos, ranges, saída JSON
- [x] `ml/README.md` — Decisões, versões, como rodar, limitações
- [x] `ml/requirements.txt` — `pip freeze` fixo
- [x] `.gitignore` — Inclui `.venv/`, `ml/data/`, `*.joblib`, `__pycache__/`

---

## Contrato com Backend/Frontend

Ver `ml/CONTRATO.md` para:
- 38 campos de entrada na ordem exata do treino
- Tipos, ranges e valores aceitos por campo
- Formato de saída JSON (classe, probabilidades, score %, recomendação)
- Exemplo de requisição cURL
- Notas de implementação para o backend

---

## Contato

- **ML Owner**: Patric (Probabilidade e Estatística — IFCE)
- **Dataset**: https://www.kaggle.com/datasets/deeplumiere/hospital-management-data
- **Modelo**: Naive Bayes (GaussianNB) + ColumnTransformer
- **Random State**: 42 (reprodutibilidade)