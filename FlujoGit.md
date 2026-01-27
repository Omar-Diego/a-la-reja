# Guía de Flujo de Trabajo con Git y GitHub por Fases

Este documento describe paso a paso el flujo de trabajo usando ramas para:
- Avance del proyecto
- Entrega final del proyecto
- Ejercicios de práctica

Incluye:
- Creación del repositorio
- Creación de archivos de prueba
- Creación y uso de ramas
- Navegación entre ramas
- Fusión de ramas en `main`

---

## 1. Preparación inicial

### 1.1. Crear carpeta del proyecto y entrar en ella

```bash
mkdir proyecto-fullstack
cd proyecto-fullstack
```
### 1.2. Crear archivos base de ejemplo
```bash
# Archivo README general
echo "# Proyecto Fullstack - Flujo por Fases" > README.md

# Archivos para cada fase
echo "Contenido inicial del avance del reto (fase de avance)." > avance_reto.txt
echo "Contenido inicial de la entrega final del reto (fase final)." > reto_final.txt

# Archivos para ejercicios de práctica
echo "Notas y ejercicios de práctica 1." > ejercicios_practica_1.txt
echo "Notas y ejercicios de práctica 2." > ejercicios_practica_2.txt
```
Puedes editar estos archivos después con tu editor preferido (Si es Neovim, tu nivel de nerd aumenta +1000).

## 2. Inicializar repositorio Git y primer commit
### 2.1. Inicializar repositorio local
```bash
git init
```
### 2.2. Ver estado inicial
```bash
git status
```
### 2.3. Agregar archivos al seguimiento
```bash
git add .
```
### 2.4. Crear primer commit
```bash
git commit -m "Commit inicial: estructura base del proyecto y archivos de ejemplo"

```

## 3. Conectar con GitHub (rama base main)
Primero crea un repositorio vacío en GitHub (sin README, sin .gitignore, sin licencia).


### 3.1. Añadir remoto
```bash
git remote add origin <URL_DEL_REPOSITORIO_GITHUB>
```
Ejemplo:

```bash
git remote add origin https://github.com/usuario/proyecto-fullstack.git
```
### 3.2. Asegurar que la rama se llame main
```bash
git branch -M main
```
### 3.3. Subir rama main por primera vez
```bash
git push -u origin main
```

## 4. Crear ramas por fase
### 4.1. Rama de avance del proyecto
```bash
git checkout -b avance-proyecto
```
Aquí trabajarás en el avance del proyecto.

Ejemplo de edición de archivo y commit:

```bash
echo "Nueva versión del avance del reto." >> avance_reto.txt
git status
git add avance_reto.txt
git commit -m "Actualización del avance del reto"
git push -u origin avance-proyecto
```
### 4.2. Rama de entrega final del proyecto
Cuando quieras empezar a trabajar en la fase final:

```bash
# Asegúrate de partir desde main
git checkout main

# Crear rama para la entrega final
git checkout -b entrega-final
```
Ejemplo de edición de archivo y commit:

```bash
echo "Contenido actualizado para la entrega final del reto." >> reto_final.txt
git status
git add reto_final.txt
git commit -m "Primera versión de la entrega final"
git push -u origin entrega-final
```
### 4.3. Ramas para ejercicios de práctica
Puedes crear una o varias ramas para practicar.

Rama ejercicios-practica-1
```bash
git checkout main
git checkout -b ejercicios-practica-1
```
Ejemplo de edición y commit:

```bash
echo "Ejercicio extra realizado en la rama ejercicios-practica-1." >> ejercicios_practica_1.txt
git status
git add ejercicios_practica_1.txt
git commit -m "Agregar ejercicios extra en ejercicios-practica-1"
git push -u origin ejercicios-practica-1
```
Rama ejercicios-practica-2 (opcional)
```bash
git checkout main
git checkout -b ejercicios-practica-2
```
Ejemplo de edición y commit:

```bash
echo "Más ejercicios de práctica en la rama ejercicios-practica-2." >> ejercicios_practica_2.txt
git status
git add ejercicios_practica_2.txt
git commit -m "Agregar ejercicios extra en ejercicios-practica-2"
git push -u origin ejercicios-practica-2
```

## 5. Flujo de trabajo básico en cualquier rama
Cada vez que trabajes en cualquier rama (avance-proyecto, entrega-final, ejercicios-practica-*), el ciclo típico es:

```bash
# Ver qué ha cambiado
git status

# Agregar archivos modificados
git add .

# Crear commit con mensaje descriptivo
git commit -m "Mensaje de avance"

# Enviar cambios a GitHub en la rama actual
git push origin <nombre-de-la-rama>
```
Ejemplo en avance-proyecto:

```bash
git status
git add .
git commit -m "Refinar avance del proyecto"
git push origin avance-proyecto
```
## 6. Navegar entre ramas
### 6.1. Listar ramas locales
```bash
git branch
```
### 6.2. Cambiar de rama
```bash
git checkout main
git checkout avance-proyecto
git checkout entrega-final
git checkout ejercicios-practica-1
git checkout ejercicios-practica-2
```
Antes de cambiar de rama, asegúrate de no tener cambios sin commit (o usa git stash si es necesario).

## 7. Fusión de ramas en main al final
Cuando estés satisfecho con el trabajo en tus ramas y quieras integrarlo en main, sigue estos pasos.

### 7.1. Fusionar rama avance-proyecto en main
```bash
# Cambiar a main
git checkout main

# Actualizar main desde remoto (opcional pero recomendable)
git pull origin main

# Fusionar cambios de avance-proyecto
git merge avance-proyecto
```
Si no hay conflictos, se creará un commit de merge. Luego sube los cambios:

```bash
git push origin main
```
### 7.2. Fusionar rama entrega-final en main
```bash
# Estar en main
git checkout main
git pull origin main

# Fusionar cambios de entrega-final
git merge entrega-final
git push origin main
```
### 7.3. (Opcional) Fusionar ramas de ejercicios de práctica
Si quieres conservar tus ejercicios dentro de main:

```bash
git checkout main
git pull origin main

git merge ejercicios-practica-1
git merge ejercicios-practica-2

git push origin main
```
## 8. Limpieza de ramas locales (opcional)
Una vez que las ramas ya se fusionaron correctamente en main, puedes borrarlas localmente:

```bash
git branch -d avance-proyecto
git branch -d entrega-final
git branch -d ejercicios-practica-1
git branch -d ejercicios-practica-2
```
Si también quieres borrarlas en el remoto (GitHub):

```bash
git push origin --delete avance-proyecto
git push origin --delete entrega-final
git push origin --delete ejercicios-practica-1
git push origin --delete ejercicios-practica-2
```
## 9. Resumen rápido de comandos clave
```bash
# Crear repo local
git init

# Conectar remoto
git remote add origin <URL>
git branch -M main
git push -u origin main

# Crear ramas
git checkout -b avance-proyecto
git checkout -b entrega-final
git checkout -b ejercicios-practica-1
git checkout -b ejercicios-practica-2

# Flujo básico
git status
git add .
git commit -m "Mensaje de avance"
git push origin <rama>

# Navegación
git branch
git checkout <rama>

# Fusión desde main
git checkout main
git pull origin main
git merge avance-proyecto
git merge entrega-final
git merge ejercicios-practica-1
git merge ejercicios-practica-2
git push origin main

# Borrar ramas locales
git branch -d avance-proyecto
git branch -d entrega-final
git branch -d ejercicios-practica-1
git branch -d ejercicios-practica-2
```