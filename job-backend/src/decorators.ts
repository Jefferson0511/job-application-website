// Simple decorator implementation to avoid TypeScript errors
export function Get(path?: string): MethodDecorator {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      return descriptor;
    };
  }
  
  export function Controller(path?: string): ClassDecorator {
    return (target: any) => {
      return target;
    };
  }