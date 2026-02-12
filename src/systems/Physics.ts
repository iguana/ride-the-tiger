import * as THREE from 'three';

export class SimplePhysics {
  private colliders: THREE.Box3[] = [];
  private playerRadius: number = 0.5;

  // Pre-allocated scratch objects to avoid per-frame allocation
  private readonly _newPos = new THREE.Vector3();
  private readonly _testCenter = new THREE.Vector3();
  private readonly _playerSize = new THREE.Vector3();
  private readonly _playerBox = new THREE.Box3();
  private readonly _testBoxX = new THREE.Box3();
  private readonly _testBoxZ = new THREE.Box3();
  private readonly _correctedVelocity = new THREE.Vector3();

  public setColliders(colliders: THREE.Box3[]): void {
    this.colliders = colliders;
  }

  public addCollider(collider: THREE.Box3): void {
    this.colliders.push(collider);
  }

  public checkCollision(position: THREE.Vector3, velocity: THREE.Vector3): THREE.Vector3 {
    this._newPos.copy(position).add(velocity);
    this._playerSize.set(this.playerRadius * 2, 1.5, this.playerRadius * 2);
    this._playerBox.setFromCenterAndSize(this._newPos, this._playerSize);

    this._correctedVelocity.copy(velocity);

    for (const collider of this.colliders) {
      if (this._playerBox.intersectsBox(collider)) {
        // Simple collision response - slide along walls
        this._testCenter.set(position.x + velocity.x, position.y, position.z);
        this._testBoxX.setFromCenterAndSize(this._testCenter, this._playerSize);

        this._testCenter.set(position.x, position.y, position.z + velocity.z);
        this._testBoxZ.setFromCenterAndSize(this._testCenter, this._playerSize);

        if (this._testBoxX.intersectsBox(collider)) {
          this._correctedVelocity.x = 0;
        }

        if (this._testBoxZ.intersectsBox(collider)) {
          this._correctedVelocity.z = 0;
        }
      }
    }

    return this._correctedVelocity;
  }

  public isColliding(position: THREE.Vector3): boolean {
    this._playerSize.set(this.playerRadius * 2, 1.5, this.playerRadius * 2);
    this._playerBox.setFromCenterAndSize(position, this._playerSize);

    for (const collider of this.colliders) {
      if (this._playerBox.intersectsBox(collider)) {
        return true;
      }
    }

    return false;
  }

  public setPlayerRadius(radius: number): void {
    this.playerRadius = radius;
  }
}
