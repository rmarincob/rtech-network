# Usa la imagen oficial de Nginx
FROM nginx:latest

# Copia la configuración de Nginx al contenedor
COPY nginx.conf /etc/nginx/nginx.conf

# Expone el puerto 5000
EXPOSE 5000

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
