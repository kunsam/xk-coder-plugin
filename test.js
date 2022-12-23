var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
define("figma.typing", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.Figma = void 0;
    var Figma;
    (function (Figma) {
        var NodeTypes;
        (function (NodeTypes) {
            NodeTypes["GROUP"] = "GROUP";
            NodeTypes["FRAME"] = "FRAME";
            NodeTypes["CANVAS"] = "CANVAS";
            NodeTypes["DOCUMENT"] = "DOCUMENT";
            NodeTypes["VECTOR"] = "VECTOR";
            NodeTypes["STAR"] = "STAR";
            NodeTypes["LINE"] = "LINE";
            NodeTypes["ELLIPSE"] = "ELLIPSE";
            NodeTypes["REGULAR_POLYGON"] = "REGULAR_POLYGON";
            NodeTypes["RECTANGLE"] = "RECTANGLE";
            NodeTypes["TEXT"] = "TEXT";
            NodeTypes["SLICE"] = "SLICE";
            NodeTypes["COMPONENT"] = "COMPONENT";
            NodeTypes["STICKY"] = "STICKY";
            NodeTypes["INSTANCE"] = "INSTANCE";
            NodeTypes["SHAPE_WITH_TEXT"] = "SHAPE_WITH_TEXT";
            NodeTypes["CONNECTOR"] = "CONNECTOR";
        })(NodeTypes = Figma.NodeTypes || (Figma.NodeTypes = {}));
        var CounterAxisAlignItems;
        (function (CounterAxisAlignItems) {
            CounterAxisAlignItems["MIN"] = "MIN";
            CounterAxisAlignItems["CENTER"] = "CENTER";
            CounterAxisAlignItems["MAX"] = "MAX";
            CounterAxisAlignItems["BASELINE"] = "BASELINE";
        })(CounterAxisAlignItems = Figma.CounterAxisAlignItems || (Figma.CounterAxisAlignItems = {}));
        var PrimaryAxisAlignItems;
        (function (PrimaryAxisAlignItems) {
            PrimaryAxisAlignItems["MIN"] = "MIN";
            PrimaryAxisAlignItems["CENTER"] = "CENTER";
            PrimaryAxisAlignItems["MAX"] = "MAX";
            PrimaryAxisAlignItems["SPACE_BETWEEN"] = "SPACE_BETWEEN";
        })(PrimaryAxisAlignItems = Figma.PrimaryAxisAlignItems || (Figma.PrimaryAxisAlignItems = {}));
        var LayoutMode;
        (function (LayoutMode) {
            LayoutMode["NONE"] = "NONE";
            LayoutMode["HORIZONTAL"] = "HORIZONTAL";
            LayoutMode["VERTICAL"] = "VERTICAL";
        })(LayoutMode = Figma.LayoutMode || (Figma.LayoutMode = {}));
    })(Figma = exports.Figma || (exports.Figma = {}));
});
define("figma.componentInfer", ["require", "exports", "figma.typing"], function (require, exports, figma_typing_1) {
    "use strict";
    exports.__esModule = true;
    exports.inferNodeComponent = void 0;
    // TODO: 还需要补充
    var NodeNameInferMap = {
        isForm: ["form"],
        isInputCombine: ["input"],
        isButton: ["button"]
    };
    function traverseNode(callback, node, parent) {
        var _a;
        if (callback(node, parent)) {
            return true;
        }
        (_a = node.children) === null || _a === void 0 ? void 0 : _a.find(function (child) {
            return traverseNode(callback, child, node);
        });
        return false;
    }
    function hasIconChild(node, maxDepth) {
        var hasIcon = false;
        var currentDepth = 0;
        traverseNode(function (cn) {
            if (maxDepth !== undefined) {
                if (currentDepth > maxDepth) {
                    return true;
                }
            }
            if (cn.type === figma_typing_1.Figma.NodeTypes.VECTOR) {
                hasIcon = true;
                return true;
            }
            currentDepth++;
            return false;
        }, node);
        return hasIcon;
    }
    /**
     * 组件类型推断器
     */
    function inferNodeComponent(node) {
        if (node.type !== figma_typing_1.Figma.NodeTypes.INSTANCE)
            return;
        var isInferSuccess = false; // 控制互斥
        var isForm = false;
        var isInputCombine = false;
        var isInputCombineHasIconChild = false;
        if (!node.inferedData) {
            node.inferedData = {};
        }
        if (NodeNameInferMap.isForm.find(function (key) { return node.name.includes(key); })) {
            isForm = true;
            isInferSuccess = true;
        }
        if (!isInferSuccess &&
            NodeNameInferMap.isInputCombine.find(function (key) { return node.name.includes(key); })) {
            isInputCombine = true;
        }
        if (!isInferSuccess && !isInputCombine && node.children.length === 2) {
            if (node.children[1].type === figma_typing_1.Figma.NodeTypes.TEXT) {
                if (hasIconChild(node.children[0], 2)) {
                    isInputCombine = true;
                    isInputCombineHasIconChild = true;
                }
            }
        }
        var isButton = false;
        if (!isInferSuccess &&
            NodeNameInferMap.isButton.find(function (key) { return node.name.includes(key); })) {
            isButton = true;
        }
        node.inferedData = __assign(__assign({}, node.inferedData), { isForm: isForm, isInputCombine: isInputCombine, isButton: isButton, isInputCombineHasIconChild: isInputCombineHasIconChild });
        // return {}
    }
    exports.inferNodeComponent = inferNodeComponent;
});
define("figma.coder", ["require", "exports", "figma.componentInfer", "figma.typing"], function (require, exports, figma_componentInfer_1, figma_typing_2) {
    "use strict";
    exports.__esModule = true;
    exports.FigmaProjectCodeProvider = void 0;
    function getTab(depth) {
        return new Array(depth).fill("\t").join("");
    }
    function getNodeClassName(node) {
        return "" + node.id.replace(":", "_");
    }
    function BoxEqual(bound1, bound2) {
        var x = bound1.x, y = bound1.y, width = bound1.width, height = bound1.height;
        var nq = function (a, b) { return Math.abs(a - b) <= 1; };
        return (nq(x, bound2.x) &&
            nq(y, bound2.y) &&
            nq(width, bound2.width) &&
            nq(height, bound2.height));
    }
    function InstanceCSSProvider(node, parent, args) {
        var _a;
        var cssLineCodes = [];
        var cssClassName = "";
        var cssCode = "";
        if (((_a = node.children) === null || _a === void 0 ? void 0 : _a.length) === 0) {
            return {
                cssClassName: "",
                cssCode: ""
            };
        }
        if (args.depth === 0) {
            cssClassName = "Container";
        }
        else {
            cssClassName = "Container" + getNodeClassName(node);
        }
        cssLineCodes.push("width: " + node.absoluteBoundingBox.width + "px;");
        cssLineCodes.push("height: " + node.absoluteBoundingBox.height + "px;");
        if (args.isAbsolteLayout) {
            cssLineCodes.push("position: absolute;");
            if (parent) {
                var left = node.absoluteBoundingBox.x - parent.absoluteBoundingBox.x;
                var right = parent.absoluteBoundingBox.x +
                    parent.absoluteBoundingBox.width -
                    node.absoluteBoundingBox.x -
                    node.absoluteBoundingBox.width;
                if (left < right) {
                    cssLineCodes.push("left: " + left + "px;");
                }
                else {
                    cssLineCodes.push("right: " + right + "px;");
                }
                var top_1 = node.absoluteBoundingBox.y - parent.absoluteBoundingBox.y;
                var bottom = parent.absoluteBoundingBox.y +
                    parent.absoluteBoundingBox.height -
                    node.absoluteBoundingBox.y -
                    node.absoluteBoundingBox.height;
                if (top_1 < bottom) {
                    cssLineCodes.push("top: " + top_1 + "px;");
                }
                else {
                    cssLineCodes.push("bottom: " + bottom + "px;");
                }
            }
            else {
                cssLineCodes.push("left: 0px;");
                cssLineCodes.push("top: 0px;");
            }
        }
        cssCode += cssClassName + "{" + cssLineCodes
            .map(function (code) { return "\t" + code; })
            .join("\n") + "}";
        return {
            cssClassName: cssClassName,
            cssCode: cssCode
        };
    }
    function InstanceNodeHtmlProvider(node, parent, depth, className) {
        var _a;
        var htmlCodePrev = "";
        var htmlCodeBack = "";
        var tag = "div";
        var styleCode = "";
        var classNameCode = "";
        if (className) {
            classNameCode += "className={styles." + className + "}";
        }
        switch (node.type) {
            default: {
                break;
            }
            case figma_typing_2.Figma.NodeTypes.VECTOR: {
                tag = "Icon";
                styleCode = "style={{ fontSize: " + Math.ceil(node.absoluteBoundingBox.width) + "px }}";
                break;
            }
            case figma_typing_2.Figma.NodeTypes.INSTANCE: {
                if ((_a = node.inferedData) === null || _a === void 0 ? void 0 : _a.isButton) {
                    htmlCodePrev = "<Button " + classNameCode + " />";
                    return {
                        htmlCodePrev: htmlCodePrev,
                        htmlCodeBack: htmlCodeBack
                    };
                }
                break;
            }
        }
        htmlCodePrev += getTab(depth) + "<" + tag + " " + classNameCode + " " + styleCode + ">";
        htmlCodeBack += getTab(depth) + "</" + tag + ">";
        return {
            htmlCodePrev: htmlCodePrev,
            htmlCodeBack: htmlCodeBack
        };
    }
    function CommonCSSProvider(node, parent, args) {
        var _a, _b;
        var cssLineCodes = [];
        var cssClassName = "";
        var cssCode = "";
        if (((_a = node.children) === null || _a === void 0 ? void 0 : _a.length) === 0) {
            return {
                cssClassName: "",
                cssCode: ""
            };
        }
        if (args.depth === 0) {
            cssClassName = ".Container";
        }
        else {
            cssClassName = ".Container" + getNodeClassName(node);
        }
        cssLineCodes.push("width: " + node.absoluteBoundingBox.width + "px;");
        cssLineCodes.push("height: " + node.absoluteBoundingBox.height + "px;");
        if (args.isAbsolteLayout) {
            cssLineCodes.push("position: absolute;");
            if (parent) {
                var left = node.absoluteBoundingBox.x - parent.absoluteBoundingBox.x;
                var right = parent.absoluteBoundingBox.x +
                    parent.absoluteBoundingBox.width -
                    node.absoluteBoundingBox.x -
                    node.absoluteBoundingBox.width;
                if (left < right) {
                    cssLineCodes.push("left: " + left + "px;");
                }
                else {
                    cssLineCodes.push("right: " + right + "px;");
                }
                var top_2 = node.absoluteBoundingBox.y - parent.absoluteBoundingBox.y;
                var bottom = parent.absoluteBoundingBox.y +
                    parent.absoluteBoundingBox.height -
                    node.absoluteBoundingBox.y -
                    node.absoluteBoundingBox.height;
                if (top_2 < bottom) {
                    cssLineCodes.push("top: " + top_2 + "px;");
                }
                else {
                    cssLineCodes.push("bottom: " + bottom + "px;");
                }
            }
            else {
                cssLineCodes.push("left: 0px;");
                cssLineCodes.push("top: 0px;");
            }
        }
        if (node.children && ((_b = node.children) === null || _b === void 0 ? void 0 : _b.length) >= 2) {
            cssLineCodes.push("display: flex;");
        }
        // if (node.backgroundColor) {
        //   cssLineCodes.push(`background-color: ${node.backgroundColor};`);
        // }
        // if (node.paddingLeft) {
        //   cssLineCodes.push(`padding-left: ${node.paddingLeft};`);
        // }
        // if (node.paddingRight) {
        //   cssLineCodes.push(`padding-right: ${node.paddingRight};`);
        // }
        // if (node.rectangleCornerRadii) {
        //   const ra = node.rectangleCornerRadii;
        //   cssLineCodes.push(
        // 	`border-radius: ${ra[0]}px ${ra[1]}px ${ra[2]}px ${ra[3]}px;`
        //   );
        // }
        cssCode += cssClassName + "{" + cssLineCodes
            .map(function (code) { return "\t" + code; })
            .join("\n") + "}";
        return {
            cssClassName: cssClassName,
            cssCode: cssCode
        };
    }
    function CommonNodeHtmlProvider(node, parent, depth, className) {
        var _a;
        var htmlCodePrev = "";
        var htmlCodeBack = "";
        var tag = "div";
        var styleCode = "";
        var classNameCode = "";
        if (className) {
            classNameCode += "className={styles." + className + "}";
        }
        switch (node.type) {
            default: {
                break;
            }
            case figma_typing_2.Figma.NodeTypes.VECTOR: {
                tag = "Icon";
                styleCode = "style={{ fontSize: " + Math.ceil(node.absoluteBoundingBox.width) + "px }}";
                break;
            }
            case figma_typing_2.Figma.NodeTypes.INSTANCE: {
                if ((_a = node.inferedData) === null || _a === void 0 ? void 0 : _a.isButton) {
                    htmlCodePrev = "<Button " + classNameCode + " />";
                    return {
                        htmlCodePrev: htmlCodePrev,
                        htmlCodeBack: htmlCodeBack
                    };
                }
                break;
            }
        }
        htmlCodePrev += getTab(depth) + "<" + tag + " " + classNameCode + " " + styleCode + ">\n";
        htmlCodeBack += getTab(depth) + "</" + tag + ">";
        return {
            htmlCodePrev: htmlCodePrev,
            htmlCodeBack: htmlCodeBack
        };
    }
    function FrameCSSProvider(node, parent, args) {
        var _a;
        var cssLineCodes = [];
        var cssClassName = "";
        var cssCode = "";
        var isFlexContainer = false;
        if (node.children && ((_a = node.children) === null || _a === void 0 ? void 0 : _a.length) >= 2) {
            if (node.counterAxisAlignItems || node.primaryAxisAlignItems) {
                isFlexContainer = true;
            }
        }
        if (args.depth === 0) {
            cssClassName = ".Container";
        }
        else {
            cssClassName = ".Container" + getNodeClassName(node);
        }
        if (!isFlexContainer) {
            cssLineCodes.push("width: " + node.absoluteBoundingBox.width + "px;");
            cssLineCodes.push("height: " + node.absoluteBoundingBox.height + "px;");
        }
        if (args.isAbsolteLayout) {
            cssLineCodes.push("position: absolute;");
            if (parent) {
                var left = node.absoluteBoundingBox.x - parent.absoluteBoundingBox.x;
                var right = parent.absoluteBoundingBox.x +
                    parent.absoluteBoundingBox.width -
                    node.absoluteBoundingBox.x -
                    node.absoluteBoundingBox.width;
                if (left < right) {
                    cssLineCodes.push("left: " + left + "px;");
                }
                else {
                    cssLineCodes.push("right: " + right + "px;");
                }
                var top_3 = node.absoluteBoundingBox.y - parent.absoluteBoundingBox.y;
                var bottom = parent.absoluteBoundingBox.y +
                    parent.absoluteBoundingBox.height -
                    node.absoluteBoundingBox.y -
                    node.absoluteBoundingBox.height;
                if (top_3 < bottom) {
                    cssLineCodes.push("top: " + top_3 + "px;");
                }
                else {
                    cssLineCodes.push("bottom: " + bottom + "px;");
                }
            }
            else {
                cssLineCodes.push("left: 0px;");
                cssLineCodes.push("top: 0px;");
            }
        }
        if (isFlexContainer) {
            cssLineCodes.push("display: flex;");
            if (node.layoutMode === figma_typing_2.Figma.LayoutMode.VERTICAL) {
                cssLineCodes.push("flex-direction: column;");
            }
            switch (node.counterAxisAlignItems) {
                default: {
                    break;
                }
                case figma_typing_2.Figma.CounterAxisAlignItems.CENTER: {
                    cssLineCodes.push("align-items: center;");
                    break;
                }
            }
            switch (node.primaryAxisAlignItems) {
                default: {
                    break;
                }
                case figma_typing_2.Figma.PrimaryAxisAlignItems.CENTER: {
                    cssLineCodes.push("justify-content: center;");
                    break;
                }
                case figma_typing_2.Figma.PrimaryAxisAlignItems.SPACE_BETWEEN: {
                    cssLineCodes.push("justify-content: space-between;");
                    break;
                }
            }
        }
        if (node.backgroundColor) {
            cssLineCodes.push("background-color: " + node.backgroundColor + ";");
        }
        if (node.paddingLeft) {
            cssLineCodes.push("padding-left: " + node.paddingLeft + ";");
        }
        if (node.paddingRight) {
            cssLineCodes.push("padding-right: " + node.paddingRight + ";");
        }
        if (node.rectangleCornerRadii) {
            var ra = node.rectangleCornerRadii;
            cssLineCodes.push("border-radius: " + ra[0] + "px " + ra[1] + "px " + ra[2] + "px " + ra[3] + "px;");
        }
        cssCode += cssClassName + "{" + cssLineCodes
            .map(function (code) { return "\t" + code; })
            .join("\n") + "}";
        return {
            cssClassName: cssClassName,
            cssCode: cssCode
        };
    }
    function FrameHtmlProvider(node, parent, cssClassName, depth) {
        var _a, _b;
        var htmlCodePrev = "";
        var htmlCodeBack = "";
        var tag = "div";
        var notDeeperTraverse = false;
        // infter
        if ((_a = node.inferedData) === null || _a === void 0 ? void 0 : _a.isInputCombine) {
            var iconCode = "";
            if ((_b = node.inferedData) === null || _b === void 0 ? void 0 : _b.isInputCombineHasIconChild) {
                iconCode = 'prefix={<Icon type="icon" />';
            }
            htmlCodePrev += getTab(depth) + "<Input className={styles." + cssClassName + "} " + iconCode + " />\n";
        }
        htmlCodePrev += getTab(depth) + "<" + tag + " className={styles." + cssClassName + "}>\n";
        htmlCodeBack += getTab(depth) + "</" + tag + ">";
        return {
            htmlCodePrev: htmlCodePrev,
            htmlCodeBack: htmlCodeBack,
            notDeeperTraverse: notDeeperTraverse
        };
    }
    function TextCSSProvider(node, textStyleCodeMap) {
        var cssLineCodes = [];
        var cssClassName = "";
        var cssCode = "";
        var textStyleKey = "";
        if (node.style) {
            textStyleKey += "" + node.style.fontSize + node.style.fontWeight + node.style.color;
            if (textStyleCodeMap.has(textStyleKey)) {
                var data = textStyleCodeMap.get(textStyleKey);
                cssClassName = data.className;
                cssLineCodes = data.codes;
            }
            else {
                if (node.style.fontWeight) {
                    cssLineCodes.push("font-weight: " + node.style.fontWeight);
                }
                if (node.style.fontSize) {
                    cssLineCodes.push("font-size: " + node.style.fontSize + "px");
                }
                if (node.style.color) {
                    cssLineCodes.push("color: " + node.style.color);
                }
                cssClassName = ".Text" + getNodeClassName(node);
            }
        }
        cssCode += cssClassName + "{" + cssLineCodes
            .map(function (code) { return "\t" + code; })
            .join("\n") + "}";
        if (textStyleKey) {
            textStyleCodeMap.set(textStyleKey, {
                className: cssClassName,
                codes: cssLineCodes
            });
        }
        return {
            cssClassName: cssClassName,
            cssCode: cssCode
        };
    }
    function TextHtmlProvider(node, depth, cssClassName, parent) {
        var _a, _b;
        var htmlCodePrev = "";
        var htmlCodeBack = "";
        var tag = "span";
        // 计算tag
        if ((_a = parent === null || parent === void 0 ? void 0 : parent.children) === null || _a === void 0 ? void 0 : _a.length) {
            if (((_b = parent === null || parent === void 0 ? void 0 : parent.children) === null || _b === void 0 ? void 0 : _b.length) === 2) {
                tag = "label";
            }
            else {
                tag = "span";
            }
        }
        else if (node.style.fontSize) {
            var fontSize = node.style.fontSize;
            if (fontSize >= 40) {
                tag = "h0";
            }
            else if (fontSize < 40 && fontSize >= 32) {
                tag = "h1";
            }
            else if (fontSize < 32 && fontSize >= 26) {
                tag = "h2";
            }
            else if (fontSize < 26 && fontSize >= 22) {
                tag = "h3";
            }
            else if (fontSize < 22 && fontSize >= 20) {
                tag = "h4";
            }
            else {
                tag = "p";
            }
        }
        var classNameCode = "";
        if (cssClassName) {
            classNameCode = "className={styles." + cssClassName + "}";
        }
        htmlCodePrev += getTab(depth) + "}<" + tag + " " + classNameCode + ">" + node.characters + "\n";
        htmlCodeBack += getTab(depth) + "</" + tag + ">";
        return {
            htmlCodePrev: htmlCodePrev,
            htmlCodeBack: htmlCodeBack
        };
    }
    // 特征分析
    // 左侧面板选择当前激活的文件
    // 306:3404
    var FigmaProjectCodeProvider = /** @class */ (function () {
        function FigmaProjectCodeProvider() {
        }
        FigmaProjectCodeProvider.prototype.traverseSelectionNodeByDFS = function (callback, node, parent) {
            var _this = this;
            var _a;
            if (callback(node, parent)) {
                return true;
            }
            (_a = node.children) === null || _a === void 0 ? void 0 : _a.find(function (child) {
                return _this.traverseSelectionNodeByDFS(callback, child, node);
            });
            return false;
        };
        FigmaProjectCodeProvider.prototype.traverseNodeByDFS = function (callback, node, parent) {
            var _this = this;
            var _a;
            if (callback(node, parent)) {
                return true;
            }
            (_a = node.children) === null || _a === void 0 ? void 0 : _a.find(function (child) {
                return _this.traverseNodeByDFS(callback, child, node);
            });
            return false;
        };
        FigmaProjectCodeProvider.prototype.traverseByDFSGetCode = function (node, parent, _a) {
            var _this = this;
            var depth = _a.depth, textStyleCodeMap = _a.textStyleCodeMap;
            // 跳过的情况(忽略无效空节点)
            if (node.children && node.children.length === 1) {
                return this.traverseByDFSGetCode(node.children[0], parent, {
                    textStyleCodeMap: textStyleCodeMap,
                    depth: depth
                });
            }
            var htmlCodePrev = "";
            var htmlCodeBack = "";
            var cssCode = "";
            switch (node.type) {
                default: {
                    var cssData = CommonCSSProvider(node, parent, {
                        depth: depth,
                        isAbsolteLayout: false
                    });
                    var htmlData = CommonNodeHtmlProvider(node, parent, depth, cssData.cssClassName);
                    htmlCodePrev += htmlData.htmlCodePrev;
                    htmlCodeBack += htmlData.htmlCodeBack;
                    break;
                }
                case figma_typing_2.Figma.NodeTypes.FRAME: {
                    var cssData = FrameCSSProvider(node, parent, {
                        depth: depth,
                        isAbsolteLayout: false
                    });
                    var htmlData = FrameHtmlProvider(node, parent, cssData.cssClassName, depth);
                    htmlCodePrev += htmlData.htmlCodePrev;
                    htmlCodeBack += htmlData.htmlCodeBack;
                    break;
                }
                case figma_typing_2.Figma.NodeTypes.TEXT: {
                    var cssData = TextCSSProvider(node, textStyleCodeMap);
                    var htmlData = TextHtmlProvider(node, depth, cssData.cssClassName, parent);
                    htmlCodePrev += htmlData.htmlCodePrev;
                    htmlCodeBack += htmlData.htmlCodeBack;
                    break;
                }
            }
            if (node.children) {
                var sortedByPositionChild = node.children.sort(function (a, b) {
                    if (a.absoluteBoundingBox.y !== b.absoluteBoundingBox.y) {
                        return a.absoluteBoundingBox.y - b.absoluteBoundingBox.y;
                    }
                    return a.absoluteBoundingBox.x - b.absoluteBoundingBox.x;
                });
                sortedByPositionChild.forEach(function (child) {
                    var ret = _this.traverseByDFSGetCode(child, node, {
                        textStyleCodeMap: textStyleCodeMap,
                        depth: depth + 1
                    });
                    cssCode += ret.cssCode;
                    htmlCodePrev += ret.htmlCodePrev;
                    htmlCodeBack += ret.htmlCodeBack;
                });
            }
            return {
                htmlCodePrev: htmlCodePrev,
                htmlCodeBack: htmlCodeBack,
                cssCode: cssCode
            };
        };
        FigmaProjectCodeProvider.prototype.traverseSimilarSubTree = function (node) {
            var _this = this;
            var _a;
            var allChildTreeId = "";
            if (node.children.length) {
                var childTreeIdMap_1 = new Map();
                node.children.forEach(function (child, childIndex) {
                    var childTreeId = _this.traverseSimilarSubTree(child);
                    var prev = childTreeIdMap_1.get(childTreeId) || [];
                    childTreeIdMap_1.set(childTreeId, __spreadArray(__spreadArray([], prev), [childIndex]));
                    allChildTreeId += childTreeId;
                });
                childTreeIdMap_1.forEach(function (childIndexes) {
                    console.log(node.name, "node");
                    if (childIndexes.length > 1) {
                        if (!node.similarData) {
                            node.similarData = {
                                similarChildrenFirstIndexGroup: [],
                                similarChildrenGroup: []
                            };
                        }
                        node.similarData.similarChildrenFirstIndexGroup.push(childIndexes[0]);
                        node.similarData.similarChildrenGroup.push({
                            similarChildrenIndexes: childIndexes
                        });
                    }
                });
            }
            var currentNodeTreeId = node.type + "-" + (((_a = node.children) === null || _a === void 0 ? void 0 : _a.length) || 0) + "-" + allChildTreeId;
            return currentNodeTreeId;
        };
        FigmaProjectCodeProvider.prototype.traverseInferNodeComponent = function (node) {
            var _this = this;
            figma_componentInfer_1.inferNodeComponent(node);
            if (node.children.length) {
                node.children.forEach(function (child) {
                    _this.traverseInferNodeComponent(child);
                });
            }
        };
        FigmaProjectCodeProvider.prototype.getCode = function (selectedTopNode) {
            var htmlCode = "";
            var cssCode = "";
            var textStyleCodeMap = new Map();
            if (selectedTopNode.type === figma_typing_2.Figma.NodeTypes.CANVAS ||
                selectedTopNode.type === figma_typing_2.Figma.NodeTypes.DOCUMENT) {
                return undefined;
            }
            // 树相似分析（用于抽离组件）
            this.traverseSimilarSubTree(selectedTopNode);
            // 组件推断分析
            this.traverseInferNodeComponent(selectedTopNode);
            var data = this.traverseByDFSGetCode(selectedTopNode, undefined, {
                textStyleCodeMap: textStyleCodeMap,
                depth: 0
            });
            cssCode += data.cssCode;
            htmlCode += "" + data.htmlCodePrev + data.htmlCodeBack;
            return { htmlCode: htmlCode, cssCode: cssCode };
        };
        return FigmaProjectCodeProvider;
    }());
    exports.FigmaProjectCodeProvider = FigmaProjectCodeProvider;
});
define("figma.script", ["require", "exports", "figma.coder"], function (require, exports, figma_coder_1) {
    "use strict";
    exports.__esModule = true;
    var figma = window.figma;
    figma.on("selectionchange", function () {
        var keys = [
            "absoluteBoundingBox",
            "absoluteRenderBounds",
            "backgrounds",
            "bottomLeftRadius",
            "bottomRightRadius",
            "cornerRadius",
            "counterAxisAlignItems",
            "layoutMode",
            "name",
            "opacity",
            "paddingBottom",
            "paddingLeft",
            "paddingRight",
            "paddingTop",
            "primaryAxisAlignItems",
            "relativeTransform",
            "rotation",
            "topLeftRadius",
            "topRightRadius",
            "x",
            "y",
            "scaleFactor",
            "characters",
            "fontName",
            "fontSize",
            "fontWeight",
            "letterSpacing",
            "lineHeight",
            "textDecoration",
            "textAlignHorizontal",
            "textAlignVertical",
            "type",
        ];
        var first = figma.currentPage.selection[0];
        function travese(figmaNode) {
            var children = figmaNode.children || [];
            var data = __assign(__assign({}, figmaNode), { children: children.map(function (child) { return travese(child); }) });
            keys.forEach(function (key) {
                if (figmaNode[key] !== undefined) {
                    data[key] = figmaNode[key];
                }
            });
            return data;
        }
        if (first) {
            var node = travese(first);
            console.log(node, "node");
            var provider = new figma_coder_1.FigmaProjectCodeProvider();
            var code = provider.getCode(node);
            navigator.clipboard.writeText(code.htmlCode).then(function () {
                figma.notify("处理成功");
            });
            // fetch("http://127.0.0.1:${Port}/handle", {
            //   method: "POST",
            //   body: JSON.stringify(node),
            //   headers: { "Content-Type": "application/json" },
            // }).then((res) => {
            //   if (res.status === 200) {
            //     figma.notify("处理成功");
            //   } else {
            //     figma.notify("处理失败");
            //   }
            // });
        }
    });
});
