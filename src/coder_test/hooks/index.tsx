// interface Props {
//   editor: XKEditor | null;
//   dispatchActionSetActivatedOperationTool?: (payload: OperationToolValueEnum) => void;
//   getOutlinesByIds?: (outlineFileIds: string[]) => Promise<OutlineDO[]>;
// }

// const useEditDt = ({ editor, dispatchActionSetActivatedOperationTool, getOutlinesByIds }: Props) => {
//   const [showDtModal, setShowDtModal] = useState(false);
//   const [selectedObjects, setSelectedObjects] = useState<Object3D[]>([]);
//   const dtFileId = useMemo<string | null>(() => {
//     if (selectedObjects.length !== 1) {
//       return null;
//     }
//     const [{ userData }] = selectedObjects;
//     if (!userData.building) {
//       return null;
//     }
//     const { outline } = BuildingUtil.getSpaceLayer(userData.building);
//     if (!outline) {
//       return null;
//     }
//     return outline.fileId;
//   }, [selectedObjects]);
//   const handleClickEditDt = useCallback(
//     (objects?: XKThreeBuildingComplex[]) => {
//       const targetObjects = objects || selectedObjects;

//       if (targetObjects.length !== 1) {
//         return;
//       }
//       const [{ userData }] = targetObjects;
//       if (!userData.building) {
//         return;
//       }
//       const { outline } = BuildingUtil.getSpaceLayer(userData.building);
//       if (!outline) {
//         return;
//       }
//       setShowDtModal(true);
//     },
//     [selectedObjects],
//   );

//   return {
//     state: {
//       showDtModal,
//     },
//     handler: {
//       handleClickEditDt,
//     },
//   };
//   return { showDtModal, dtFileId, handleClickEditDt };
// }

// export default useEditDt;
