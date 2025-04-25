import { observable, action } from 'mobx';

class ParentHomeViewModel {
    @observable children = [];
    @observable selectedChild = null;

    constructor(childService) {
        this.childService = childService;
        this.loadChildren();
    }

    @action
    async loadChildren() {
        this.children = await this.childService.getChildren();
    }

    @action
    selectChild(child) {
        this.selectedChild = child;
    }

    @action
    clearSelection() {
        this.selectedChild = null;
    }
}

export default ParentHomeViewModel;