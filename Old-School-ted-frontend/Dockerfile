# ETAPA 1: Construcción (Node.js)
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Construimos para producción (usará environment.prod.ts)
RUN npm run build -- --configuration production

# ETAPA 2: Servidor Web (Nginx)
FROM nginx:alpine

# Borramos la configuración por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamos los archivos compilados de Angular
# IMPORTANTE: Verifica que esta ruta coincida con tu 'outputPath' en angular.json
# Si tu carpeta dist no tiene la subcarpeta 'browser', borra '/browser' de la línea de abajo.
COPY --from=build /app/dist/old-schooltedd-frondend/browser /usr/share/nginx/html

# Copiamos nuestra configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]