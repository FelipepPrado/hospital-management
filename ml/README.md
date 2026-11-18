# ML

Pasta de **exploração dos dados, treino e avaliação** do modelo. Ela não é executada em produção: o que vai para o backend é apenas o modelo exportado.

## Responsabilidades

- Explorar o dataset e definir a **variável alvo** da predição.
- Fazer a limpeza e o pré-processamento dos dados.
- Treinar, comparar e avaliar os modelos candidatos.
- Exportar o modelo final (e o pipeline de pré-processamento) para `backend/model/`.

## Dataset

[Hospital Management Data (Kaggle)](https://www.kaggle.com/datasets/deeplumiere/hospital-management-data), com cerca de 20 MB de dados tabulares.

Baixe os arquivos manualmente (ou pela CLI do Kaggle) e coloque-os em `ml/data/`. Essa pasta **não é versionada** no Git.

> Antes de usar, confirme a licença do dataset na página do Kaggle.

## Estrutura prevista

```
ml/
├── notebooks/
│   ├── 01_exploracao.ipynb    # análise exploratória e escolha do alvo
│   └── 02_treino.ipynb        # treino, avaliação e exportação do modelo
├── data/                      # dataset (fora do Git)
└── README.md
```

## Fluxo de trabalho

1. Baixar o dataset para `ml/data/`.
2. Explorar os dados e decidir qual coluna será prevista e quais serão as features.
3. Treinar um modelo baseline e avaliar com métricas adequadas ao problema.
4. Exportar o modelo para `backend/model/` (`joblib` ou `ONNX`).
5. Informar ao frontend e ao backend quais campos o formulário precisa ter.

## Ambiente

```bash
cd ml
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install jupyter pandas scikit-learn
jupyter notebook
```

_As dependências definitivas serão listadas em um `requirements.txt` quando o treino for implementado._

## Observações

- A versão das bibliotecas usadas no treino (principalmente scikit-learn) deve ser a **mesma** do backend, senão o modelo pode não carregar ou se comportar de forma diferente.
- Datasets desse tipo podem ser sintéticos e ter pouco sinal real. Registre no notebook as métricas obtidas e as limitações encontradas, pois isso conta para a avaliação do trabalho.
- Não versione dados de pacientes nem arquivos grandes no Git.
