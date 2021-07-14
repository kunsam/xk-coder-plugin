// import { formatDisplayNumber, roundWithDecimal } from '@/frontend_utils/number';
// import { TypeUtil } from '@/frontend_utils/type';

// export default class CalculateUtils {
//   static getColor = (gap: any) => {
//     if (Number(gap) > 0) {
//       return { color: '#FF4040' };
//     }
//     if (Number(gap) < 0) {
//       return { color: '#52C41A' };
//     }
//     return undefined;
//   };

//   static getText = (gap: any) => {
//     if (Number(gap) > 0) {
//       return `+${formatDisplayNumber(Number(gap))}`;
//     }
//     if (Number(gap) < 0) {
//       return `-${formatDisplayNumber(Math.abs(Number(gap)))}`;
//     }
//     return gap;
//   };

//   static getResult = (value: any, targetValue: any, digitsAfterDecimalPoint: number = 2) => {
//     if (!TypeUtil.isNumber(targetValue) || !TypeUtil.isNumber(value)) {
//       return '--';
//     }
//     return roundWithDecimal(value - targetValue, digitsAfterDecimalPoint);
//   };
// }
