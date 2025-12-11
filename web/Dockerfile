# Usar Node 20 Alpine (leve)
FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --silent

# Copiar código
COPY . .

# Build (produção) ou dev mode
# Para dev com hot reload, comentar a linha de build
# RUN npm run build

# Expor porta
EXPOSE 3000

# Modo desenvolvimento (hot reload)
CMD ["npm", "run", "dev"]

# Modo produção (descomentar e comentar o CMD acima)
# CMD ["npm", "start"]
