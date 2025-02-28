declare type SchemaPrimitive = null | boolean | number | string;
declare type SchemaEnum = Set<SchemaPrimitive>;
interface Schema {
    $id?: string;
    $ref?: string;
    type?: Set<string>;
    const?: null | boolean | number | string;
    enum?: SchemaEnum;
    items?: Schema | Schema[];
    uniqueItems?: boolean;
    additionalItems?: false | Schema;
    allOf?: Schema[];
    anyOf?: Schema[];
    oneOf?: Schema[];
    properties?: Map<string, Schema>;
    additionalProperties?: false | Schema;
    required?: Set<string>;
    definitions?: Map<string, Schema>;
}
export { SchemaPrimitive, SchemaEnum, Schema };
