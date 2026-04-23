import type {
  $defs,
  components,
  operations,
  paths,
} from "../generated/openapi";

export type OpenApiPaths = paths;
export type OpenApiComponents = components;
export type OpenApiOperations = operations;
export type OpenApiDefs = $defs;

export type PathKey = keyof OpenApiPaths;
export type ComponentSchemaKey = keyof OpenApiComponents["schemas"];

export type PathMethod<TPath extends PathKey> = keyof OpenApiPaths[TPath];
