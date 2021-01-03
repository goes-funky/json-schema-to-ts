# json-schema-typescript-generator
Generate typescript files from json schema files

## Contents
[Install](#Install)

[Usage](#Usage)

[Typescript](#Typescript)

[JSONSchema](#JSONSchema)

[Approach](#Approach)


## Install
Install via one of the commands

    npm -i json-schema-typescript-generator -D
    yarn add json-schema-typescript-generator -D


## Usage
To generate .ts files, import the `main` function and `Options` interface like this

    import { main, Options } from 'json-schema-typescript-generator';

Then create an Options object and invoke the main function with it like this

    const options: Options = {...}
    main(options);

The [Options](src/options.ts) object is defined as follows:

    {
      files: {
        cwd: string;
        source: {
          dir: string;
          encoding: BufferEncoding;
          recursive: boolean;
        };
        destination: {
          dir: string;
          preClean: boolean;
        };
      };
      ts: {
        optionalFields: OptionalFieldPattern;
        untyped: UntypedType;
      };
    }

All options are optional and fall back to their defaults if not given, which are as follows:

    files: {
      cwd: process.cwd(),
      source: {
        dir: 'src/schemas',
        encoding: 'utf-8',
        recursive: true
      },
      destination: {
        dir: 'src/generated',
        preClean: false
      }
    },
    ts: {
      optionalFields: OptionalFieldPattern.QUESTION,
      untyped: UntypedType.UNKNOWN
    }

The option

    files/destination/preClean

defines whether the destination folder will be deleted before generating typescript files.<br><br>

Note that the folders given by the options

    files/source/dir
    files/destination/dir

will be resolved relative to the folder given by the option

    files/cwd


## Typescript

There are 2 options which define the style of code generated

### `OptionalFieldPattern`

This option defines how optional fields are represented

    ts/optionalFields

and can take 1 of 2 values:

    QUESTION

    type Example = {
      a?: string;
    };

or

    PIPE_UNDEFINED

    type Example = {
      a: string | undefined;
    }

### `UntypedType`

This option defines the fallback type used for types that failed to be generated, eg. perhaps the schema was empty, or an id was missing or a typo was made in a $ref entry etc. It is represented by

    ts/untyped

and takes 1 of 4 values:

    ANY

    type Example = {
      a: any
    }

or

    NEVER

    type Example = {
      a: never
    }

or

    UNDEFINED

    type Example = {
      a: undefined
    }

or

    UNKNOWN

    type Example = {
      a: unknown
    }


## JSONSchema
Support for properties defined in the JSON Schema are as follows:

| Key | Support | Notes
|---------|-----|------
| $id     | ✔
| $schema | ✘ | Action in TODO to support specific schema versions
| $ref | ✔ | local definition<br>absolute reference to root/inner definition<br>relative reference to root/inner definition
| enum | ✔ | null<br>booleans<br>numbers<br>strings
| type | ✔ | null<br>boolean<br>integer<br>number<br>string<br>array<br>object
| number properties | ✘ | multipleOf<br>minimum<br>maximum<br>exclusiveMinimum<br>exclusiveMaximum<br><br>No typescript support for `multipleOf`<br>[Open question on GitHub about number ranges](https://github.com/Microsoft/TypeScript/issues/15480)
| string properties | ✘ | minLength<br>maxLength<br>pattern<br>format<br><br>[Typescript support for string patterns and formats in v4.1](https://stackoverflow.com/questions/51445767/how-to-define-a-regex-matched-string-type-in-typescript)<br>Typescript's implementation produces a union of every possible combination so is not suitable for patterns or formats
| array properties | ✔ | items<br>uniqueItems<br>additionalItems<br><br>`T[]` - Array if `items` is a schema and `uniqueItems=false`<br>`Set<T>` - Set if `items` is a schema and `uniqueItems=true`<br>`[T, U, V]` - Tuple if `items` is an array
| array properties | ✘ | contains<br>minItems<br>maxItems<br><br>array (and possibly tuple) min length: `type MinLengthArray<T> = [T, T, ...T[]];` Although no typescript support for a `Set<T>` of specific size<br>No typescript support for contains
| object properties | ✔ | properties<br>additionalProperties
| combinations | ✔ | allOf<br>anyOf<br>oneOf<br><br>If oneOf is used, dynamic OneOf_n types are generated in files that need them, these can get large and will be updated if typescript adds native support

## Approach

The approach this utility takes is to only do one thing but do it well, ie. transforming schema files to typescript files. It doesn't download any schemas, or do any validation, consistency checking, linting, prettifying etc. It assumes the schema author knows exactly what they want and it will generate typescript files that represent the schemas given as closely as possible, even if the generated types don't make sense or cannot be satisfied.

An example will make this clear:

Given the following schema in a file called `A.json`

    {
      "type": "number",
      "$ref": "#/definitions/BOOL",
      "enum": [
        null,
        "tuv",
        "xyz"
      ],
      "oneOf": [
        {
          "type": "string"
        },
        {
          "$ref": "#/definitions/BOOL"
        }
      ],
      "definitions": {
        "BOOL": {
          "type": "boolean"
        }
      }
    }

Invoking the generator will generate a file `A.ts` containing:

    import { OneOf_2 } from 'json-schema-typescript-generator';

    export type A = number
    & BOOL
    & (null | 'tuv' | 'xyz')
    & OneOf_2<string, BOOL>;

    export type BOOL = boolean;


Clearly type `A` cannot ever be satisfied, but it does match what the schema specified
