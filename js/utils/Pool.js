export class Pool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];

        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    get(x, y, ...args) {
        let item;
        if (this.pool.length > 0) {
            item = this.pool.pop();
        } else {
            item = this.createFn();
        }

        this.resetFn(item, x, y, ...args);
        this.active.push(item);
        return item;
    }

    release(item) {
        const index = this.active.indexOf(item);
        if (index > -1) {
            this.active.splice(index, 1);
            this.pool.push(item);
        }
    }

    update(deltaTime, ...args) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const item = this.active[i];
            if (item.markedForDeletion) {
                this.release(item);
            } else {
                item.update(deltaTime, ...args);
            }
        }
    }

    draw(ctx) {
        this.active.forEach(item => item.draw(ctx));
    }

    clear() {
        this.pool.push(...this.active);
        this.active = [];
    }
}
