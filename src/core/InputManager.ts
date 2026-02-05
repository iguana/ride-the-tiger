export class InputManager {
  private keys: Map<string, boolean> = new Map();
  private static instance: InputManager;

  private constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
    });

    // Reset all keys when window loses focus
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  public isKeyDown(code: string): boolean {
    return this.keys.get(code) ?? false;
  }

  public get forward(): boolean {
    return this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp');
  }

  public get backward(): boolean {
    return this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown');
  }

  public get left(): boolean {
    return this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft');
  }

  public get right(): boolean {
    return this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight');
  }

  public get sprint(): boolean {
    return this.isKeyDown('ShiftLeft') || this.isKeyDown('ShiftRight');
  }

  public get jump(): boolean {
    return this.isKeyDown('Space');
  }

  public get anyMovement(): boolean {
    return this.forward || this.backward || this.left || this.right;
  }
}
