# Frontend

Aplicação em **React** com o formulário que o usuário preenche e a exibição do resultado da predição retornada pelo backend.

## Responsabilidades

- Renderizar o formulário com os campos usados pelo modelo.
- Validar os dados no cliente antes de enviar.
- Chamar o backend (`POST /predict`) e mostrar o resultado, o carregamento e os erros.
- Lidar com a demora da primeira requisição quando o backend estiver "dormindo" (plano gratuito), exibindo um estado de carregamento claro.

## Estrutura prevista

```
frontend/
├── src/
│   ├── components/   # formulário, campos e card de resultado
│   ├── services/     # chamadas à API
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
└── README.md
```

## Configuração

A URL da API é definida por variável de ambiente. Crie um arquivo `.env` na pasta `frontend/`:

```
VITE_API_URL=http://localhost:8000
```

_O nome da variável assume que o projeto será criado com Vite. Ajuste caso use outra ferramenta._

## Como rodar localmente

```bash
cd frontend
npm install
npm run dev
```

## Deploy

O frontend será publicado no **Vercel**, com o *Root Directory* apontando para `frontend/` e a variável `VITE_API_URL` apontando para a URL do backend em produção.

## Observações

- Os campos do formulário dependem da variável alvo e das features escolhidas na pasta `ml/`. Eles serão definidos depois da exploração do dataset.
