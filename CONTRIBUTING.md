# Contributing to Expo Game Support

¡Gracias por tu interés en contribuir a expo-game-support! Este documento te guiará a través del proceso de contribución.

## 🚀 Cómo Empezar

### Prerrequisitos
- Node.js 16 o superior
- npm o yarn
- Git

### Configuración del Entorno de Desarrollo

1. Fork el repositorio
2. Clona tu fork:
```bash
git clone https://github.com/tu-usuario/expo-game-support.git
cd expo-game-support
```

3. Instala las dependencias:
```bash
npm install
```

4. Ejecuta los tests para asegurar que todo funciona:
```bash
npm test
```

5. Inicia el modo de desarrollo:
```bash
npm run dev
```

## 📝 Proceso de Contribución

### 1. Reportar Bugs
- Usa el template de issue para bugs
- Incluye pasos para reproducir el problema
- Proporciona información del entorno (OS, versión de Node, etc.)
- Incluye código de ejemplo si es posible

### 2. Solicitar Features
- Usa el template de issue para features
- Explica el caso de uso y el beneficio
- Proporciona ejemplos de la API propuesta

### 3. Pull Requests

#### Antes de Enviar
- Asegúrate de que los tests pasen: `npm test`
- Ejecuta el linter: `npm run lint`
- Compila el proyecto: `npm run build`
- Actualiza la documentación si es necesario

#### Convenciones de Commit
Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar detección de colisión circular
fix: corregir memory leak en TouchInputManager
docs: actualizar README con nuevos ejemplos
test: agregar tests para PhysicsEngine
refactor: optimizar algoritmo de colisión
```

#### Estructura del PR
- Título descriptivo
- Descripción clara de los cambios
- Referencias a issues relacionados
- Screenshots/GIFs si aplica

## 🏗️ Arquitectura del Proyecto

```
src/
├── core/           # Componentes principales
│   ├── GameEngine.ts
│   ├── GameLoop.ts
│   └── GameObject.ts
├── physics/        # Sistema de físicas
│   ├── PhysicsEngine.ts
│   └── CollisionDetector.ts
├── input/          # Gestión de input
│   └── TouchInputManager.ts
├── math/           # Utilidades matemáticas
│   └── Vector2D.ts
├── types/          # Definiciones de tipos
│   └── index.ts
└── index.ts        # Punto de entrada
```

## 🧪 Testing

### Ejecutar Tests
```bash
npm test                 # Todos los tests
npm test -- --watch     # Modo watch
npm test -- --coverage  # Con coverage
```

### Escribir Tests
- Usa Jest para unit tests
- Coloca tests en `src/__tests__/`
- Nombra archivos como `*.test.ts`
- Mantén coverage > 80%

### Ejemplo de Test
```typescript
import { Vector2D } from '../math/Vector2D';

describe('Vector2D', () => {
  it('should add vectors correctly', () => {
    const v1 = new Vector2D(1, 2);
    const v2 = new Vector2D(3, 4);
    const result = v1.add(v2);
    
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });
});
```

## 📚 Documentación

### Actualizar Documentación
- README.md para cambios en la API
- Comentarios JSDoc en el código
- Ejemplos en `/examples`
- CHANGELOG.md para releases

### Estilo de Documentación
```typescript
/**
 * Aplica una fuerza al objeto del juego
 * @param force - Vector de fuerza a aplicar
 * @example
 * ```typescript
 * gameObject.applyForce(new Vector2D(100, 0));
 * ```
 */
applyForce(force: Vector2D): void {
  // implementación
}
```

## 🎨 Estilo de Código

### TypeScript
- Usa tipos estrictos
- Evita `any`
- Documenta interfaces públicas
- Usa nombres descriptivos

### Formateo
- 2 espacios para indentación
- Punto y coma obligatorio
- Comillas simples para strings
- Trailing commas en objetos/arrays

### ESLint
```bash
npm run lint        # Verificar
npm run lint:fix    # Corregir automáticamente
```

## 🚀 Performance

### Consideraciones
- Evita allocaciones innecesarias en el game loop
- Usa object pooling para objetos frecuentes
- Optimiza algoritmos de colisión
- Minimiza garbage collection

### Profiling
```typescript
// Usar console.time para medir performance
console.time('collision-detection');
// código a medir
console.timeEnd('collision-detection');
```

## 📋 Checklist para PRs

- [ ] Tests pasan
- [ ] Linter pasa
- [ ] Documentación actualizada
- [ ] Changelog actualizado (si aplica)
- [ ] Performance considerada
- [ ] Backward compatibility mantenida
- [ ] Ejemplos actualizados (si aplica)

## 🤝 Código de Conducta

- Sé respetuoso y constructivo
- Ayuda a otros contribuidores
- Reporta comportamiento inapropiado
- Mantén discusiones técnicas enfocadas

## ❓ ¿Necesitas Ayuda?

- Abre un issue con la etiqueta "question"
- Revisa issues existentes
- Consulta la documentación
- Contacta a los maintainers

## 🏷️ Releases

### Versionado
Seguimos [Semantic Versioning](https://semver.org/):
- MAJOR: cambios incompatibles
- MINOR: nuevas funcionalidades compatibles
- PATCH: bug fixes compatibles

### Proceso de Release
1. Actualizar CHANGELOG.md
2. Bump version en package.json
3. Crear tag de git
4. Publicar a npm

¡Gracias por contribuir a expo-game-support! 🎮
