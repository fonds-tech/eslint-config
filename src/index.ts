/**
 * @senran/eslint-config - ESLint Flat Config 库
 * 项目入口文件，导出所有公共 API
 */
export * from "./globs";
export * from "./rules";
export * from "./types";
export * from "./utils";
export * from "./integrations";
import { eslint } from "./integration";

export { eslint } from "./integration";

export default eslint;
