// import { RegulationCustomNamespace } from '@/xkplan_model/regulation';

// import { RegulationConfig } from '../../config/config';
// import type { NumberRange, NumberRangeDO } from '../NumberRangeInput';

// export default class BlockBuildingUtil {
//   /**
//    * 获取默认限制范围
//    *
//    * @static
//    * @param {number} index
//    * @param {RegulationCustomNamespace.BlockingBuildingLimitTypes} limitType
//    * @return {*}  {NumberRange}
//    * @memberof BlockBuildingUtil
//    */
//   public static getNumberRangeConfigByLimitType(
//     index: number,
//     limitType: RegulationCustomNamespace.BlockingBuildingLimitTypes,
//   ): NumberRange {
//     let defaultConfig: NumberRange;
//     const recordTypeKey = RegulationConfig.BLOCK_BUILDING_KEYS[index];
//     switch (limitType) {
//       default:
//       case RegulationCustomNamespace.BlockingBuildingLimitTypes.floors: {
//         defaultConfig =
//           RegulationConfig.DEFAULT_BLOCKBUILDING_LIMIT_TYPE_FLOORS_CONFIG[recordTypeKey];
//         break;
//       }
//       case RegulationCustomNamespace.BlockingBuildingLimitTypes.height: {
//         defaultConfig =
//           RegulationConfig.DEFAULT_BLOCKBUILDING_LIMIT_TYPE_HEIGHTS_CONFIG[recordTypeKey];
//         break;
//       }
//     }
//     return defaultConfig;
//   }

//   /**
//    *  使用上一行的动态值修正本行的下限范围
//    *
//    * @static
//    * @param {number} index
//    * @param {(number | string)} prevRowMaxValue
//    * @return {*}  {NumberRangeDO}
//    * @memberof BlockBuildingUtil
//    */
//   public static getCorrectMinRange(
//     index: number,
//     prevRowMaxValue?: number | string,
//   ): NumberRangeDO {
//     const recordTypeKey = RegulationConfig.BLOCK_BUILDING_KEYS[index];
//     const defaultConfig =
//       RegulationConfig.DEFAULT_BLOCKBUILDING_LIMIT_TYPE_FLOORS_CONFIG[recordTypeKey];
//     if (prevRowMaxValue === undefined) {
//       return defaultConfig.min;
//     }

//     // 计算一个新的动态下限
//     let numberPrevRowMaxValueAsLimit: number | undefined = defaultConfig.min.limit;

//     if (prevRowMaxValue !== '') {
//       if (typeof prevRowMaxValue === 'string') {
//         const numberValue = parseFloat(prevRowMaxValue);
//         if (typeof numberValue === 'number') {
//           numberPrevRowMaxValueAsLimit = numberValue;
//         }
//       } else if (typeof prevRowMaxValue === 'number') {
//         numberPrevRowMaxValueAsLimit = prevRowMaxValue;
//       }
//     }
//     // 新的动态下限值不能超过上一行的上限值
//     if (
//       numberPrevRowMaxValueAsLimit !== undefined &&
//       numberPrevRowMaxValueAsLimit !== defaultConfig.min.limit
//     ) {
//       const prevRecordTypeKey = RegulationConfig.BLOCK_BUILDING_KEYS[index - 1];
//       if (prevRecordTypeKey) {
//         const prevDefaultConfig =
//           RegulationConfig.DEFAULT_BLOCKBUILDING_LIMIT_TYPE_FLOORS_CONFIG[prevRecordTypeKey];
//         if (
//           prevDefaultConfig.max.limit &&
//           numberPrevRowMaxValueAsLimit > prevDefaultConfig.max.limit
//         ) {
//           numberPrevRowMaxValueAsLimit = defaultConfig.min.limit;
//         }
//       }
//     }
//     let correctedPrevRowMaxValue = prevRowMaxValue;
//     if (numberPrevRowMaxValueAsLimit !== undefined && prevRowMaxValue !== '') {
//       if (typeof prevRowMaxValue === 'string') {
//         const numberValue = parseFloat(prevRowMaxValue);
//         if (typeof numberValue === 'number') {
//           if (numberValue > numberPrevRowMaxValueAsLimit) {
//             correctedPrevRowMaxValue = numberPrevRowMaxValueAsLimit;
//           }
//         }
//       } else if (typeof prevRowMaxValue === 'number') {
//         if (prevRowMaxValue > numberPrevRowMaxValueAsLimit) {
//           correctedPrevRowMaxValue = numberPrevRowMaxValueAsLimit;
//         }
//       }
//     }
//     return {
//       ...defaultConfig.min,
//       value: correctedPrevRowMaxValue !== '' ? correctedPrevRowMaxValue : defaultConfig.min.value,
//       limit: numberPrevRowMaxValueAsLimit,
//     };
//   }
// }
