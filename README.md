# OpenCode BLS (VS Code Extension)

Extensión para Visual Studio Code optimizada para interactuar con **OpenCode v2.x**, diseñada para reemplazar la extensión original `sst-dev.opencode` (cuyo comando `--port` quedó deprecado e incompatible con la versión 2).

---

## 🚀 ¿Por qué esta extensión?

La extensión original de SST (`sst-dev.opencode`) fue desarrollada para OpenCode v1 e intentaba iniciar la CLI ejecutando:
```bash
opencode --port <puerto_aleatorio>
```
En **OpenCode v2.x**:
- El parámetro `--port` en la raíz ya no existe y provoca un fallo de inicio (`unknown flag: --port`).
- OpenCode v2 utiliza una arquitectura con servicio en segundo plano (`opencode service`) y sesión TUI directa.
- El ejecutable con frecuencia se instala en `~/.opencode/bin/opencode` y no siempre está en el `$PATH` de las sesiones gráficas del editor.

**OpenCode BLS** resuelve estos problemas:
1. **Compatible al 100% con OpenCode v2.x**: Lanza la CLI de forma nativa sin flags inválidos.
2. **Detección inteligente del binario**: Busca automáticamente en tu `$PATH`, en `~/.opencode/bin/opencode`, `~/.local/bin/opencode` o mediante configuración personalizada.
3. **Mantiene los atajos y flujos de trabajo habituales** (`Ctrl+Esc`, inserción de `@archivo#L...`, etc.).
4. **Integración con la Web UI v2**: Permite abrir la consola web de OpenCode v2 directamente desde VS Code.
5. **Ubicación configurable de la terminal**: Permite abrirla al lado del editor (`beside`) o en el panel inferior (`panel`).

---

## ⌨️ Atajos de Teclado y Comandos

| Comando                                | Windows / Linux        | macOS                  | Descripción                                                                                        |
|:---------------------------------------|:-----------------------|:-----------------------|:---------------------------------------------------------------------------------------------------|
| **`opencode.openTerminal`**            | `Ctrl + Esc`           | `Cmd + Esc`            | Abre o enfoca la terminal activa de OpenCode                                                       |
| **`opencode.openNewTerminal`**         | `Ctrl + Shift + Esc`   | `Cmd + Shift + Esc`    | Abre una nueva pestaña de terminal de OpenCode                                                     |
| **`opencode.addFilepathToTerminal`**   | `Ctrl + Alt + K`       | `Cmd + Alt + K`        | Inserta la referencia del archivo actual y líneas seleccionadas (`@archivo#L10-20`) en la terminal |
| **`opencode.sendSelectionToTerminal`** | `Ctrl + Alt + L`       | `Cmd + Alt + L`        | Envía el texto seleccionado directamente a la terminal de OpenCode                                 |
| **`opencode.openWebUI`**               | *(Paleta de comandos)* | *(Paleta de comandos)* | Abre la interfaz web (Dashboard) de OpenCode v2                                                    |
| **`opencode.startService`**            | *(Paleta de comandos)* | *(Paleta de comandos)* | Inicia el servicio en segundo plano de OpenCode v2                                                 |

Además:
- **Botón en la barra de título del editor**: Icono directo para abrir OpenCode al lado de tu código.
- **Barra de estado (Status Bar)**: Muestra el estado y versión detectada de OpenCode en la barra inferior.

---

## ⚙️ Configuración (`settings.json`)

Puedes personalizar la extensión desde los ajustes de VS Code:

```json
{
  // Ruta personalizada al binario de opencode (opcional, si no está en PATH ni en ~/.opencode/bin)
  "opencode.executablePath": "",

  // Dónde se abre la terminal: "beside" (panel lateral dividido) o "panel" (abajo)
  "opencode.terminalLocation": "beside",

  // Argumentos adicionales que quieras pasar a la CLI (ejemplo: ["--auto"])
  "opencode.extraArgs": [],

  // URL del servicio web si utilizas un servidor remoto o puerto fijo
  "opencode.webUrl": ""
}
```

---

## 🛠️ Desarrollo y Pruebas

### 1. Probar en desarrollo (F5)
1. Abre este repositorio en VS Code.
2. Presiona **`F5`** (o ejecuta la tarea `Ejecutar Extensión (F5)`).
3. Se abrirá una nueva ventana del editor ("Extension Development Host") con la extensión cargada y funcionando.

### 2. Compilar el paquete `.vsix`
Para generar el archivo instalable:
```bash
npm run build:vsix
```
Esto creará el archivo `opencode-bls-1.0.0.vsix` en la raíz del proyecto.

### 3. Instalar la extensión en tu entorno (Antigravity IDE / VS Code)

**Si usas Antigravity IDE:**
```bash
antigravity-ide --install-extension opencode-bls-1.0.0.vsix
```

**Si usas VS Code estándar:**
```bash
code --install-extension opencode-bls-1.0.0.vsix
```

O desde la interfaz gráfica:
- Ve a la pestaña **Extensiones** (`Ctrl+Shift+X`).
- Haz clic en el menú de tres puntos `...` arriba a la derecha.
- Selecciona **"Install from VSIX..."** y elige el archivo `opencode-bls-1.0.0.vsix`.
- Recarga la ventana con `Ctrl+Shift+P` -> `Developer: Reload Window`.

---

## 📁 Estructura del Proyecto

```
opencode-bls/
├── src/
│   ├── extension.ts     # Punto de entrada, registro de comandos y barra de estado
│   ├── terminal.ts      # Gestión de terminales, paso de referencias @archivo#L...
│   ├── binary.ts        # Detección y validación del ejecutable opencode v2
│   └── service.ts       # Comunicación con el daemon y Dashboard Web de OpenCode v2
├── images/              # Iconos para temas claros/oscuros y botón de navegación
├── .vscode/
│   ├── launch.json      # Configuración de depuración con F5
│   └── tasks.json       # Tarea de compilación en segundo plano (esbuild)
├── esbuild.js           # Script de empaquetado ultrarrápido
├── package.json         # Manifiesto de la extensión VS Code
└── tsconfig.json        # Configuración de TypeScript
```
