import Engine from './Core/Engine.js';
import CanvasSystem from './Systems/CanvasSystem.js';
import FontLoadingSystem from './Systems/FontLoadingSystem.js';
import AppLoadingSystem from './Systems/AppLoadingSystem.js';
import SpriteSheetSystem from './Systems/SpriteSheetSystem.js';
import AppDock from './Views/AppDock.js';

const engine = new Engine();
// Order matters: fonts first (preload phase), then apps, then sprite sheets, then view systems
engine.register(new CanvasSystem());
engine.register(new FontLoadingSystem());
engine.register(new AppLoadingSystem());
engine.register(new SpriteSheetSystem());
engine.register(new AppDock());