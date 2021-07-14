// export function testFunction1(a: number, b: string[], c?: boolean) {}

interface Args {
  a: number;
  b: {
    b1: Map<string, number>;
    b2: any[];
  };
  c?: string;
}

// export function testFunction1_1(a: { a1: { b: string; d?: number } }) {}
// export function testFunction1_3(a?: { a1: { b: string; d?: number } }) {}

// export function testFunction1_2(a: string = 'do_string', b: number = 1) {}

// export function testFunction2(a: Args) {}
// export function testFunction2_1(a?: Args) {}

// export async function testFunction2_async(a: () => Promise<any>) {}

// export const testFunction3 = (a: Args) => {};
// export const testFunction4 = (b?: number) => {};
// export const testFunction5 = (a: LineSegmentsGeometry, b: Line2) => {};

// export const memoize = (fn: (...args: any[]) => any) => {
//   const cache = {};
//   return (...args: any[]) => {
//     const argStr = JSON.stringify(args);
//     cache[argStr] = cache[argStr] || fn(...args);
//     return cache[argStr];
//   };
// };

// export const loadVisualizeJS = memoize((url: string) => {});

// export function worldToScreen(point: [number, number, number], moduleInst: any, viewer: any) {
//   const tvPoint = moduleInst.Point3d.createFromArray(point);
//   const mtx = viewer.activeView.worldToDeviceMatrix;

//   tvPoint.transformBy(mtx);

//   const x = tvPoint.x / window.devicePixelRatio;
//   const y = tvPoint.y / window.devicePixelRatio;

//   tvPoint.delete();
//   return [x, y] as [number, number];
// }
