# 1. Base de Python (Ligera)
FROM python:3.10-slim

# 2. Carpeta de trabajo
WORKDIR /app

# 3. Instalación de librerías
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copiar TODO el código
COPY . .

# 5. Permisos para el script de arranque
RUN chmod +x start.sh

# 6. Exponer puerto (Por defecto en Fly.io)
EXPOSE 9000

# 7. Ejecutar el mando a distancia
CMD ["./start.sh"]
