/** Interfaz reservada. Esta fase no importa GLTFLoader ni descarga assets.
 * Una implementación futura devolverá { object: THREE.Object3D, dispose() }.
 * dispose será responsable de sus geometrías, materiales y texturas propios.
 */
export class AssetLoader {
  /** @param {{uri: string, node?: string, signal?: AbortSignal}} request
   * @returns {Promise<{object: import('three').Object3D, dispose: Function}>}
   */
  async load(_request) {
    throw new Error('GLB_NOT_IMPLEMENTED: cargador reservado para una fase posterior');
  }
}
