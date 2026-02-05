import * as THREE from 'three';

export class SimplePhysics {
  private colliders: THREE.Box3[] = [];
  private playerRadius: number = 0.5;

  public setColliders(colliders: THREE.Box3[]): void {
    this.colliders = colliders;
  }

  public addCollider(collider: THREE.Box3): void {
    this.colliders.push(collider);
  }

  public checkCollision(position: THREE.Vector3, velocity: THREE.Vector3): THREE.Vector3 {
    const newPosition = position.clone().add(velocity);
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      newPosition,
      new THREE.Vector3(this.playerRadius * 2, 1.5, this.playerRadius * 2)
    );

    let correctedVelocity = velocity.clone();

    for (const collider of this.colliders) {
      if (playerBox.intersectsBox(collider)) {
        // Simple collision response - slide along walls
        const testBoxX = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(position.x + velocity.x, position.y, position.z),
          new THREE.Vector3(this.playerRadius * 2, 1.5, this.playerRadius * 2)
        );

        const testBoxZ = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(position.x, position.y, position.z + velocity.z),
          new THREE.Vector3(this.playerRadius * 2, 1.5, this.playerRadius * 2)
        );

        if (testBoxX.intersectsBox(collider)) {
          correctedVelocity.x = 0;
        }

        if (testBoxZ.intersectsBox(collider)) {
          correctedVelocity.z = 0;
        }
      }
    }

    return correctedVelocity;
  }

  public isColliding(position: THREE.Vector3): boolean {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      position,
      new THREE.Vector3(this.playerRadius * 2, 1.5, this.playerRadius * 2)
    );

    for (const collider of this.colliders) {
      if (playerBox.intersectsBox(collider)) {
        return true;
      }
    }

    return false;
  }

  public setPlayerRadius(radius: number): void {
    this.playerRadius = radius;
  }
}
