# Empleados CRUD (Node + Express + MySQL)

Proyecto de ejemplo con CRUD para la tabla `empleados` usando MySQL2.

## Requisitos
- Node.js 18+
- MySQL en localhost (puerto 3306) con base `empleados` y tabla `empleados` (ver `sql/schema.sql`).

## Instalación
```bash
npm install
cp .env.example .env   # edita credenciales si es necesario
npm run dev            # arranca en modo desarrollo con nodemon
# o
npm start
```

## Endpoints
- GET    /empleados
- GET    /empleados/:id
- POST   /empleados
- PUT    /empleados/:id
- DELETE /empleados/:id

### Ejemplos (curl)
```bash
curl http://localhost:3001/empleados
curl http://localhost:3001/empleados/1

curl -X POST http://localhost:3001/empleados   -H "Content-Type: application/json"   -d '{"name":"Ana","lastname":"López","email":"ana@example.com"}'

curl -X PUT http://localhost:3001/empleados/1   -H "Content-Type: application/json"   -d '{"name":"Ana María","lastname":"López","email":"ana@example.com"}'

curl -X DELETE http://localhost:3001/empleados/1
```

## Notas
- La conexión usa variables de entorno (`.env`).
- El servidor valida la conexión al iniciar.


## Importar empleados desde CSV
Endpoint: `POST /empleados/import`  
Tipo: `multipart/form-data` con el campo **file** (archivo `.csv`).

Ejemplo con curl:
```bash
curl -X POST http://localhost:3001/empleados/import   -F "file=@sample.csv"
```
Archivo CSV esperado (cabeceras): `name,lastname,email`
Se aceptan variaciones comunes: `Nombre/Apellido/Email/correo`.
