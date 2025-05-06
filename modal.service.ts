import {
    Injectable,
    ApplicationRef,
    ComponentFactoryResolver,
    EmbeddedViewRef,
    Injector,
    Type,
    ComponentRef,
    inject
} from '@angular/core';
import { IModal, ModalServiceOptions } from './../interfaces/modal-component.interface';
  
@Injectable({ providedIn: 'root' })
export class ModalService {
  private reuseMap = new Map<Type<IModal>, ComponentRef<IModal>>();

  private readonly resolver = inject(ComponentFactoryResolver);
  private readonly injector = inject(Injector);
  private readonly appRef = inject(ApplicationRef);
  
  public open<S>(component: Type<IModal>, opts: ModalServiceOptions = {}, openArgs: S): ComponentRef<IModal> {
    const { reuse = false } = opts;
    let compRef: ComponentRef<IModal>;

    if (reuse && this.reuseMap.has(component)) {
      compRef = this.reuseMap.get(component)! as ComponentRef<IModal>;
    } else {
      const factory = this.resolver.resolveComponentFactory(component);
      compRef = factory.create(this.injector);
      this.appRef.attachView(compRef.hostView);
      const domElem = (compRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
      document.body.appendChild(domElem);
      if (reuse) this.reuseMap.set(component, compRef);
    }

    compRef.changeDetectorRef.detectChanges();
    compRef.instance.openModal(openArgs);

    const origClose = compRef.instance.closeModal.bind(compRef.instance);
    compRef.instance.closeModal = (...closeArgs: any[]) => {
      origClose(...closeArgs);
      this.close(compRef, component, reuse);
    };

    return compRef;
  }
  
  private close(compRef: ComponentRef<IModal>, componentType: Type<IModal>, reuse: boolean) {
    this.appRef.detachView(compRef.hostView);
    if (!reuse) {
      compRef.destroy();
    } else {
      this.reuseMap.delete(componentType);
    }
  }
}
