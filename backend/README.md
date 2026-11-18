# Backend

API em **FastAPI** responsável por receber os dados do formulário, executar o modelo de machine learning e devolver a predição ao frontend.

## Responsabilidades

- Expor o endpoint `POST /predict`.
- Validar a entrada com Pydantic (tipos, limites e valores permitidos).
- Carregar o modelo **uma única vez**, na inicialização, e reutilizá-lo nas requisições.
- Configurar o CORS para aceitar requisições do frontend.

## Estrutura prevista

```
backend/
├── app/
│   ├── main.py       # criação do app FastAPI, CORS e carregamento do modelo
│   ├── schemas.py    # modelos Pydantic de entrada e saída
│   └── ml.py         # função predict(): pré-processa a entrada e usa o modelo
├── model/            # modelo exportado (.joblib ou .onnx) vindo da pasta ml/
├── requirements.txt
└── README.md
```

## Endpoints previstos

| Método | Rota       | Descrição                                      |
|--------|------------|------------------------------------------------|
| GET    | `/health`  | Verifica se a API está no ar                   |
| POST   | `/predict` | Recebe os campos do formulário e retorna a predição |

_O formato exato do corpo e da resposta será definido junto com a variável alvo do modelo._

## Como rodar localmente

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

A documentação interativa fica disponível em `http://localhost:8000/docs`.

## Observações

- O modelo em `model/` é gerado na pasta `ml/`. Se ele for pesado, não deve ser versionado no Git.
- O pré-processamento aplicado na inferência precisa ser **idêntico** ao usado no treino. O ideal é salvar o pipeline completo junto com o modelo.
- Variáveis de ambiente (por exemplo, as origens permitidas no CORS) ficam em um arquivo `.env`, que não deve ser commitado.
