import uvicorn
import os

if __name__ == "__main__":
    # Configuración del puerto y host, por defecto corre en 0.0.0.0:8000
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    print("=================================================================")
    print(f"🚀 Iniciando servidor del Bot Moodle FCA...")
    print(f"🌐 Panel de Administración accesible en: http://localhost:{port}")
    print("=================================================================")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
