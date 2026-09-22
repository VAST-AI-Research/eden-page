/* 单场景查看器：GLB 模型 + 全景环境贴图，可旋转可缩放。
 * 移植自原项目页的 static-stage2-viewer.js，改了两处：
 *   1. 界面文案不再硬编码英文，走 app.js 注入的 ui()（见下面的 setStrings）。
 *   2. import 路径指向本仓库 vendor/ 下 vendored 的 three.js r180。
 * 这是个 ES module，由 app.js 在读者点「载入 3D 场景」时才 import()，
 * 所以 2.2MB 的 three.js 不会进首屏。 */
import * as THREE from '../../vendor/three/three.module.js';
import { GLTFLoader } from '../../vendor/three/GLTFLoader.js';
import { OrbitControls } from '../../vendor/three/OrbitControls.js';

/* 界面文案由 app.js 用 setStrings() 注进来。查看器自己不引 app.js
 * （那是个 IIFE、没有导出），所以用这种单向注入而不是 import。
 * 回落成英文，保证单独引用这个模块时也不会渲染出 undefined。 */
let S = {
  loading: 'Loading scene and panorama…',
  loaded: 'Loaded · drag to orbit · scroll to zoom',
  canvasLabel: 'Interactive 3D scene. Drag to orbit and scroll to zoom.',
};
export function setStrings(next) { S = { ...S, ...next }; }

// Keep these values identical to stage2ViewerDefaults in frontend/js/demo.js.
const defaults = {
  panoramaRotationYDegrees: 90,
  cameraFovDegrees: 45,
  cameraOffsetRadius: { x: 0, y: 0.2, z: 1.0 },
  nearRadiusScale: 1 / 1000,
  farRadiusScale: 30,
};
const rotationStorageKey = 'mira-scene-environment-rotation-v1';

function readRotation(caseId) {
  try {
    const stored = JSON.parse(localStorage.getItem(rotationStorageKey) || '{}');
    const value = Number(stored[caseId]);
    return Number.isFinite(value) ? Math.max(-180, Math.min(180, value)) : defaults.panoramaRotationYDegrees;
  } catch (_) {
    return defaults.panoramaRotationYDegrees;
  }
}

function writeRotation(caseId, value) {
  try {
    const stored = JSON.parse(localStorage.getItem(rotationStorageKey) || '{}');
    stored[caseId] = value;
    localStorage.setItem(rotationStorageKey, JSON.stringify(stored));
  } catch (_) {}
}

export class StaticStage2Viewer {
  constructor(host, status, caseId, rotationInput, rotationOutput) {
    this.host = host;
    this.status = status;
    this.caseId = caseId;
    this.rotationInput = rotationInput;
    this.rotationOutput = rotationOutput;
    this.rotation = readRotation(caseId);
    this.rotationInput.value = String(Math.round(this.rotation));
    this.rotationOutput.value = `${Math.round(this.rotation)}°`;
    this.rotationInput.oninput = () => {
      this.rotation = Number(this.rotationInput.value);
      this.rotationOutput.value = `${Math.round(this.rotation)}°`;
      writeRotation(this.caseId, this.rotation);
      this.applyEnvironmentRotation();
    };
  }

  applyEnvironmentRotation() {
    if (this.scene?.backgroundRotation) this.scene.backgroundRotation.y = THREE.MathUtils.degToRad(this.rotation);
  }

  resetView() {
    if (!this.camera || !this.controls || !this.center || !this.radius) return;
    this.controls.target.copy(this.center);
    this.camera.position.copy(this.center).add(new THREE.Vector3(
      this.radius * defaults.cameraOffsetRadius.x,
      this.radius * defaults.cameraOffsetRadius.y,
      this.radius * defaults.cameraOffsetRadius.z,
    ));
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  async load(modelUrl, environmentUrl, method = 'depth') {
    this.status.textContent = S.loading;
    const [gltf, environmentTexture] = await Promise.all([
      new GLTFLoader().loadAsync(modelUrl),
      new THREE.TextureLoader().loadAsync(environmentUrl),
    ]);
    if (this.disposed) {
      environmentTexture.dispose();
      return;
    }
    this.model = gltf.scene;
    this.sourceMaterials = [];
    this.model.traverse((object) => {
      if (!object.isMesh || !object.material) return;
      const originals = Array.isArray(object.material) ? object.material : [object.material];
      const basics = originals.map((material) => {
        this.sourceMaterials.push(material);
        const basic = new THREE.MeshBasicMaterial({
          color: material.color ? material.color.clone() : new THREE.Color(0xffffff),
          map: material.map || null,
          alphaMap: material.alphaMap || null,
          transparent: Boolean(material.transparent),
          opacity: material.opacity === undefined ? 1 : material.opacity,
          alphaTest: material.alphaTest || 0,
          side: material.side === undefined ? THREE.FrontSide : material.side,
          vertexColors: Boolean(material.vertexColors),
        });
        basic.name = material.name || 'texture-only';
        return basic;
      });
      object.material = Array.isArray(object.material) ? basics : basics[0];
    });
    const width = Math.max(1, this.host.clientWidth || 400);
    const height = Math.max(1, this.host.clientHeight || 320);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.localClippingEnabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.setAttribute('aria-label', S.canvasLabel);
    this.host.replaceChildren(this.renderer.domElement);
    this.scene = new THREE.Scene();
    environmentTexture.mapping = THREE.EquirectangularReflectionMapping;
    environmentTexture.colorSpace = THREE.SRGBColorSpace;
    this.environmentTexture = environmentTexture;
    this.scene.background = environmentTexture;
    this.applyEnvironmentRotation();
    this.scene.add(this.model);
    const box = new THREE.Box3().setFromObject(this.model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z, 0.5);
    this.center = center;
    this.radius = radius;
    this.bounds = box;
    this.clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    this.camera = new THREE.PerspectiveCamera(defaults.cameraFovDegrees, width / height,
      radius * defaults.nearRadiusScale, radius * defaults.farRadiusScale);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(center);
    this.camera.position.copy(center).add(new THREE.Vector3(
      radius * defaults.cameraOffsetRadius.x,
      radius * defaults.cameraOffsetRadius.y,
      radius * defaults.cameraOffsetRadius.z,
    ));
    this.camera.updateProjectionMatrix();
    this.controls.update();
    this.setSection(100);
    this.setWireframe(false);
    this.observer = new ResizeObserver(() => {
      if (this.disposed) return;
      const nextWidth = Math.max(1, this.host.clientWidth);
      const nextHeight = Math.max(1, this.host.clientHeight);
      this.camera.aspect = nextWidth / nextHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(nextWidth, nextHeight, false);
    });
    this.observer.observe(this.host);
    const loop = () => {
      if (this.disposed) return;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.frame = requestAnimationFrame(loop);
    };
    loop();
    this.status.textContent = S.loaded;
  }

  setSection(percent) {
    if (!this.model || !this.bounds) return;
    const value = Math.max(0, Math.min(100, Number(percent) || 0));
    this.clip.constant = THREE.MathUtils.lerp(this.bounds.min.y, this.bounds.max.y, value / 100);
    this.model.traverse((object) => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.clippingPlanes = value >= 100 ? [] : [this.clip];
        material.needsUpdate = true;
      });
    });
  }

  setWireframe(enabled) {
    if (!this.model) return;
    this.model.traverse((object) => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => { material.wireframe = Boolean(enabled); });
    });
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    this.controls?.dispose();
    this.environmentTexture?.dispose();
    this.model?.traverse((object) => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material?.dispose());
    });
    this.sourceMaterials?.forEach((material) => material.dispose());
    this.renderer?.dispose();
    this.rotationInput.oninput = null;
  }
}
