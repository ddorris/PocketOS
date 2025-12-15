import Engine from './Core/Engine.js';
import CanvasSystem from './Systems/CanvasSystem.js';
import AppLoadingSystem from './Systems/AppLoadingSystem.js';
import SpriteSheetSystem from './Systems/SpriteSheetSystem.js';
import AppDock from './Views/AppDock.js';

const engine = new Engine();
// Order matters: load apps first, then sprite sheets that depend on app manifests, then view systems
engine.register(new CanvasSystem());
engine.register(new AppLoadingSystem());
engine.register(new SpriteSheetSystem());
engine.register(new AppDock());