# ETAPA 1: Construcción (Node.js)
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Construimos la aplicación para PRODUCCIÓN
RUN npm run build -- --configuration production

# ETAPA 2: Servidor Web (Nginx)
FROM nginx:alpine

# Borramos la configuración por defecto
RUN rm -rf /usr/share/nginx/html/*

# CORRECCIÓN CRÍTICA: Usar el nombre EXACTO del proyecto como está en angular.json
# Nombre en angular.json: "OldSchooltedd-frondend"
COPY --from=build /app/dist/OldSchooltedd-frondend/browser /usr/share/nginx/html

# Copiamos configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]