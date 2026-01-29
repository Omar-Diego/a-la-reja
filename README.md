# Aplicación de Reservación de Canchas de Pádel

API REST para la gestión de reservas de canchas de pádel. Permite a los usuarios registrarse, iniciar sesión, consultar disponibilidad de canchas y realizar reservaciones.

## 📋 Descripción

Esta API proporciona endpoints para:
- Autenticación de usuarios (registro e inicio de sesión)
- Gestión de canchas disponibles
- Creación, consulta, modificación y cancelación de reservaciones
- Validación de horarios para evitar conflictos

## ✨ Características Principales

- **Autenticación Segura**: Sistema de login con tokens JWT
- **Gestión de Usuarios**: Registro y autenticación de usuarios con encriptación de contraseñas
- **Catálogo de Canchas**: Consulta de canchas disponibles con precios por hora
- **Sistema de Reservas**: Creación de reservaciones con validación de disponibilidad
- **Validación de Horarios**: Evita conflictos de horarios en las reservaciones
- **Gestión Completa de Reservas**: Los usuarios pueden crear, ver, editar y cancelar sus reservaciones

## 🛠️ Tecnologías Usadas

| Tecnología | Propósito |
|------------|-----------|
| [Node.js](https://nodejs.org/) | Entorno de ejecución JavaScript |
| [Express](https://expressjs.com/) | Framework web para API REST |
| [MySQL](https://www.mysql.com/) | Base de datos relacional |
| [MySQL2](https://www.npmjs.com/package/mysql2) | Driver de MySQL para Node.js |
| [JWT](https://jwt.io/) | Autenticación basada en tokens |
| [bcryptjs](https://www.npmjs.com/package/bcryptjs) | Encriptación de contraseñas |
| [dotenv](https://www.npmjs.com/package/dotenv) | Variables de entorno |
| [cors](https://www.npmjs.com/package/cors) | Manejo de CORS |

## 📁 Estructura del Proyecto

```
proyecto/
├── .env                 # Variables de entorno
├── .gitignore           # Archivos ignorados por Git
├── index.js             # Punto de entrada de la aplicación
├── package.json         # Dependencias y scripts del proyecto
├── config/
│   └── db.js            # Configuración de conexión a MySQL
├── middlewares/
│   └── auth.js          # Middleware de autenticación JWT
└── routes/
    ├── usuarios.js      # Rutas de usuarios y login
    ├── canchas.js       # Rutas de gestión de canchas
    └── reservaciones.js # Rutas de gestión de reservaciones
```

## 📂 Descripción de Carpetas y Archivos

### Archivos del Raíz

| Archivo | Descripción |
|---------|-------------|
| `.env` | Archivo de configuración con variables de entorno (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, JWT_SECRET) |
| `.gitignore` | Define qué archivos/directorios ignorar en Git |
| `index.js` | Archivo principal que configura Express y carga las rutas |
| `package.json` | Metadatos del proyecto y lista de dependencias |

### Directorio `config/`

| Archivo | Descripción |
|---------|-------------|
| `db.js` | Configuración de la conexión a MySQL usando mysql2 |

### Directorio `middlewares/`

| Archivo | Descripción |
|---------|-------------|
| `auth.js` | Middleware que verifica tokens JWT en las solicitudes protegidas |

### Directorio `routes/`

| Archivo | Descripción |
|---------|-------------|
| `usuarios.js` | Endpoints para registro de usuarios y login |
| `canchas.js` | Endpoints para consultar canchas disponibles |
| `reservaciones.js` | Endpoints CRUD para gestión de reservaciones |

## 📦 Prerrequisitos

- **Node.js** (versión 14 o superior)
- **MySQL** (versión 8.0 o superior)
- **npm** (incluido con Node.js)

### Base de Datos

La aplicación requiere una base de datos MySQL llamada `padel_db` con las siguientes tablas:

```sql
CREATE TABLE USUARIOS (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE CANCHAS (
    idCancha INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    precio_por_hora DECIMAL(10,2) NOT NULL
);

CREATE TABLE RESERVACIONES (
    idReservacion INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    USUARIOS_idUsuario INT,
    CANCHAS_idCancha INT,
    FOREIGN KEY (USUARIOS_idUsuario) REFERENCES USUARIOS(idUsuario),
    FOREIGN KEY (CANCHAS_idCancha) REFERENCES CANCHAS(idCancha)
);
```

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd dfs-borrador-avance-proyecto-final
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=padel_db
DB_PORT=3306

# Clave Secreta para JWT
JWT_SECRET=clave_super_secreta
```

### 4. Crear la Base de Datos

Ejecutar el script SQL para crear las tablas necesarias en MySQL.

### 5. Iniciar el Servidor

```bash
node index.js
```

El servidor se iniciará en el puerto **3000**.

## 📡 Endpoints

### 🔐 Autenticación

| Método | Endpoint | Descripción | Requiere Token |
|--------|----------|-------------|----------------|
| POST | `/api/login` | Iniciar sesión | No |
| POST | `/api/usuarios` | Registrar nuevo usuario | No |

#### POST `/api/login`

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "contraseña123"
}
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/api/usuarios`

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "password": "contraseña123"
}
```

**Respuesta:**
```json
{
  "message": "Usuario creado",
  "id": 1
}
```

---

### 🏟️ Canchas

| Método | Endpoint | Descripción | Requiere Token |
|--------|----------|-------------|----------------|
| GET | `/api/canchas` | Listar todas las canchas | No |

#### GET `/api/canchas`

**Respuesta:**
```json
[
  {
    "nombre": "Cancha 1",
    "ubicacion": "Calle Principal 123",
    "precio_por_hora": 50.00
  },
  {
    "nombre": "Cancha 2",
    "ubicacion": "Avenida Central 456",
    "precio_por_hora": 60.00
  }
]
```

---

### 📅 Reservaciones

| Método | Endpoint | Descripción | Requiere Token |
|--------|----------|-------------|----------------|
| POST | `/api/reservaciones` | Crear nueva reservación | Sí |
| GET | `/api/reservaciones` | Listar todas las reservaciones | No |
| GET | `/api/reservaciones?fecha=YYYY-MM-DD&canchaId=1` | Ver disponibilidad | No |
| GET | `/api/reservaciones/usuario` | Mis reservaciones | Sí |
| PUT | `/api/reservaciones/:idReservacion` | Editar reservación | Sí |
| DELETE | `/api/reservaciones/:idReservacion` | Cancelar reservación | Sí |

#### POST `/api/reservaciones`

**Body:**
```json
{
  "fecha": "2026-02-15",
  "hora_inicio": "10:00:00",
  "hora_fin": "11:00:00",
  "idCancha": 1
}
```

**Encabezados:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "message": "Reservación creada",
  "idReservacion": 1
}
```

#### GET `/api/reservaciones?fecha=2026-02-15&canchaId=1`

Consulta la disponibilidad de una cancha en una fecha específica.

**Respuesta:**
```json
[
  {
    "idReservacion": 1,
    "hora_inicio": "10:00:00",
    "hora_fin": "11:00:00"
  }
]
```

#### PUT `/api/reservaciones/:idReservacion`

**Body:**
```json
{
  "fecha": "2026-02-16",
  "hora_inicio": "14:00:00",
  "hora_fin": "15:00:00",
  "idCancha": 2
}
```

**Encabezados:**
```
Authorization: Bearer <token>
```

#### DELETE `/api/reservaciones/:idReservacion`

**Encabezados:**
```
Authorization: Bearer <token>
```

## 🔒 Autenticación

Para endpoints protegidos, incluir el token JWT en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📄 Licencia

ISC

## 👤 Autor

[Tu Nombre]
=======
# A_la_reja



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

* [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
* [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.com/fullstack8392403/a_la_reja.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

* [Set up project integrations](https://gitlab.com/fullstack8392403/a_la_reja/-/settings/integrations)

## Collaborate with your team

* [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
* [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
* [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
* [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
* [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

* [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/)
* [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
* [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
* [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
* [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
>>>>>>> 153e8e83e4b9c8b026b8e64e2bedf2fac92a229a
