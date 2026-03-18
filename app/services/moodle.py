import aiohttp
import urllib.parse
from typing import Dict, Any, List, Optional
import os

# Subdominios de Moodle de la FCA UNAM
FACULTIES = {
    "administracion": "https://administracion.fca.unam.mx",
    "contaduria": "https://contaduria.fca.unam.mx",
    "informatica": "https://informatica.fca.unam.mx",
    "negociosinternacionales": "https://negociosinternacionales.fca.unam.mx",
    "empresariales": "https://empresariales.fca.unam.mx"
}

class MoodleClient:
    def __init__(self, faculty: str, username: str, password: str = None, token: str = None):
        if faculty not in FACULTIES:
            raise ValueError(f"Facultad inválida. Debe ser una de: {', '.join(FACULTIES.keys())}")
        
        self.base_url = FACULTIES[faculty]
        self.username = username
        self.password = password
        self.token = token
        
    async def get_token(self) -> str:
        """
        Obtiene el token de acceso usando el servicio moodle_mobile_app.
        """
        if self.token:
            return self.token
            
        if not self.password:
            raise ValueError("Se necesita la contraseña para obtener un token nuevo.")
            
        url = f"{self.base_url}/login/token.php"
        params = {
            "username": self.username,
            "password": self.password,
            "service": "moodle_mobile_app"
        }
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            async with session.post(url, data=params) as response:
                if response.status != 200:
                    raise Exception(f"Error al conectar con Moodle: {response.status}")
                
                data = await response.json()
                if "error" in data:
                    raise Exception(f"Error de Moodle: {data.get('error')}")
                    
                self.token = data.get("token")
                return self.token

    async def _call_ws(self, wsfunction: str, params: Dict[str, Any] = None) -> Any:
        """
        Llama a una función del Moodle Web Service de forma asíncrona.
        """
        if not self.token:
            await self.get_token()
            
        url = f"{self.base_url}/webservice/rest/server.php"
        data = {
            "wstoken": self.token,
            "wsfunction": wsfunction,
            "moodlewsrestformat": "json"
        }
        
        if params:
            data.update(params)
            
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            # Enviamos como form-urlencoded para máxima compatibilidad
            async with session.post(url, data=data) as response:
                result = await response.json()
                if isinstance(result, dict) and "exception" in result:
                    # Si el token expiró, reautenticarse una vez y reintentar
                    if result.get("errorcode") == "invalidtoken" and self.password:
                        self.token = None
                        await self.get_token()
                        data["wstoken"] = self.token
                        async with session.post(url, data=data) as retry_resp:
                            result = await retry_resp.json()
                            if isinstance(result, dict) and "exception" in result:
                                raise Exception(f"Moodle WS API (retry): {result.get('message')}")
                            return result
                    raise Exception(f"Moodle WS API Exception: {result.get('message')}")
                return result

    async def get_site_info(self) -> Dict[str, Any]:
        """
        Obtiene la información del sitio y el ID del usuario (userid).
        Es importante para saber el ID interno del usuario en Moodle.
        """
        return await self._call_ws("core_webservice_get_site_info")

    async def get_user_courses(self, userid: int) -> List[Dict[str, Any]]:
        """
        Obtiene los cursos en los que está enrolado el usuario.
        """
        return await self._call_ws("core_enrol_get_users_courses", {"userid": userid})

    async def get_course_contents(self, courseid: int) -> List[Dict[str, Any]]:
        """
        Devuelve todo el contenido del curso (temas, archivos, foros, tareas, etc.)
        Es útil para ver los recursos nuevos subidos (URLs, PDFs, etc.).
        """
        return await self._call_ws("core_course_get_contents", {"courseid": courseid})

    async def get_assignments(self) -> Dict[str, Any]:
        """
        Obtiene todas las tareas (assignments) del usuario, con fechas de entrega (duedate).
        """
        return await self._call_ws("mod_assign_get_assignments")

    async def get_conversations(self, userid: int) -> Dict[str, Any]:
        """
        Obtiene los mensajes y chats (grupales o privados) del usuario.
        """
        return await self._call_ws("core_message_get_conversations", {"userid": userid})

    async def get_notifications(self, userid: int) -> Dict[str, Any]:
        """
        Obtiene las notificaciones de Moodle (eventos del calendario, encuestas, etc).
        """
        return await self._call_ws("message_popup_get_popup_notifications", {"useridto": userid})

