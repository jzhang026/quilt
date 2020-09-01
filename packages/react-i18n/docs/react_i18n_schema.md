# Introduction <!-- omit in toc -->

React I18n is a schema comprised of a structure of nested key-value pairs (KVPs). This document captures the nuances of the constraints placed on the schema by the different levels of concern.

<!-- Created using "Markdown All in One" extension for VS Code -->
- [History](#history)
  - [Version 1.0](#version-10)
- [Versioning](#versioning)
- [Basic Structure](#basic-structure)
- [Pluralization](#pluralization)
  - [Reserved pluralization keys](#reserved-pluralization-keys)
  - [Invalid pluralization keys](#invalid-pluralization-keys)
  - [Detecting pluralization contexts](#detecting-pluralization-contexts)
- [Serialization](#serialization)
  - [Serialization to JSON](#serialization-to-json)
    - [Comments](#comments)
  - [Serialization to JSON+Comments](#serialization-to-jsoncomments)
    - [Why not JSON5?](#why-not-json5)
- [Comparison with Rails I18n](#comparison-with-rails-i18n)
    - [Root locale key](#root-locale-key)
    - [Pluralization](#pluralization-1)
    - [Interpolation](#interpolation)

# History

## Version 1.0

React I18n's schema was loosely based on the Rails I18n schema.

Prior to the creation of this document, the React I18n schema was not documented.
With the creation of this document, the schema was specified and given the version identifier `1.0`.

# Versioning

The version identifier for the schema is made of two parts, `<major>` and `<minor>`, separated by a `.`: `<major>.<minor>`.

the `<major>` version number will be incremented any time a change is introduced that would mean that existing parsers would break while parsing the new schema. Put another way, software that supports parsing version `x.y` of the schema will always be able to parse any version `x.z`, where `z >= y`.

The `<minor>` version number will be incremented for any other changes to the schema and/or serialization formats. For example, changes that make the schema "more strict" in what is accepted as valid can be done as increments to the `<minor>` version number, since parsers of older versions are still able to parse the newer versions, albeit "more loosely" than what a modern parser would.

# Basic Structure

React I18n is made of nested dictionaries of key-value pairs (KVPs). Each of the keys are strings, and the values are either strings, or a nested dictionary.

In TypeScript, the type is a recursive definition:

```typescript
export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}
```

When [serialized to JSON]](#serialization-to-json), each of the dictionaries become JSON `object` types, and the keys and leaf values are both JSON `string` types.

**Example React I18n JSON file**

```json5
{
  "hello": "My name is {name}",
  "parent": {
    "child_1": "I am the first child of `parent`!",
    "child_2": {
      "grandchild_1": "I am the first grandchild of `parent`!",
      "grandchild_2": "I am the second grandchild of `parent`!",
    }
  }
}
```

# Pluralization

Pluralization is handled by providing the pluarlization keys required by the language as leaf KVPs, creating a "pluralization context".

**Example English file with pluralization keys:**
```json5
{
  "cars": {  // All the children of `cars` are in a "pluralization context"
    "one": "I have {count} car",
    "other": "I have {count} cars"
  }
}
```

Different languages require different sets of pluralization keys. For example, the Polish (`pl`) has 4 required pluralization keys: `one`, `few`, `many`, and `other`. The Polish version of the previous example would be:

**Example Polish file with pluralization keys:**
```json5
{
  "cars": {
    "one": "Mam {count} samochód",
    "few": "Mam {count} samochody",
    "many": "Mam {count} samochodów",
    "other": "Mam {count} samochodu",
  }
}
```

## Reserved pluralization keys

In order to avoid collisions, the following keys are reserved for use as pluralization keys, and must not be used as keys of leaf KVPs outside of the pluralization context:

* `few`
* `many`
* `one`
* `other`
* `two`
* `zero`

These keys are derived from the names given to the pluralization rules of all languages, as defined in the [Unicode Consortium's Common Locale Data Repository (CLDR)](https://github.com/unicode-org/cldr).

This list is current as of verison `37` of the CLDR. In the unlikely event that new pluralization rules names are added, they will be added to this reserved list in a future version of this specification.

**Example INVALID English file:**
```json5
{
  "foo": "bar",
  "other": "Other" // INVALID: `other` is a keyword reserved for use in pluralization contexts!
}
```

## Invalid pluralization keys

Further, pluralization keys that are not required by the language must not be used, even within a pluralization context.

For example, even though `zero` is a required pluralization key for some languages (eg. Arabic), it is not a required pluralization key in English. Therefore, the `zero` key should not be present in an English file alongside the pluralization KVPs required by English.

**Example INVALID English file:**
```json5
{
  "cars": {
    "zero": "I have no cars", // INVALID: `zero` is not a required pluralization key for English!
    "one": "I have {count} car",
    "other": "I have {count} cars"
  }
}
```

## Detecting pluralization contexts

These constraints allow for an algorithm for identifying pluralization contexts:

If a node has child leaf KVPs for each of the pluralization keys required by the language, then its children are within a pluralization context.

Any additional children within the context are invalid.

# Serialization

React I18n can be serialized to different formats. However, not all serialization formats are created equal. Two serializations are officialy defined.

| Serialization Format | JSON+Comments | JSON |
| -------------------- | ------------- | ---- |
| Comments             | ✅             | ❌    |

## Serialization to JSON

When serialized to [JSON](https://www.json.org/json-en.html), each of the dictionaries become JSON `object` types, and the keys and leaf values are both JSON `string` types.

**Example React I18n JSON file**

```json
{
  "hello": "My name is {name}",
  "parent": {
    "child_1": "I am the first child of `parent`!",
    "child_2": {
      "grandchild_1": "I am the first grandchild of `parent`!",
      "grandchild_2": "I am the second grandchild of `parent`!"
    }
  }
}
```

### Comments

React I18n does not support the use of comments when serialized to JSON. This is due to JSON's lack of support for comments.

## Serialization to JSON+Comments

`JSON+Comments` is a serialization format whose syntax is a superset of `JSON`, but a subset of [`JSON5`](https://json5.org/).

```
JSON < JSON+Comments < JSON5
```

Historically, `JSON` had support for comments, but this [was then removed](https://web.archive.org/web/20120507093915/https://plus.google.com/118095276221607585885/posts/RK8qyGVaGSr). However, comments have proven to be a useful mechanism for developers to [provide additional context to translators](https://development.shopify.io/engineering/developing_at_Shopify/internationalization/providing_context_notes). The `JSON+Comments` serialization format extends the `JSON` serialization to re-add support for comments.

The `JSON+Comments` can be parsed using a `JSON5` parser, or a `JSON` parser that is not sensitive to comments.

**Example React I18n JSON5 file**

```json5
{
  // This is a context comment for `hello`!
  "hello": "My name is {name}",
  "parent": {
    "child_1": "I am the first child of `parent`!", // This is a trailing context comment for `child_1`!
    "child_2": {
      /*
        This is a multi-line
        context comment for `grandchild_1`!
      */
      "grandchild_1": "I am the first grandchild of `parent`!",
      "grandchild_2": "I am the second grandchild of `parent`!"
    }
  }
}
```

### Why not JSON5?

Ideally, we would not have needed a `JSON+Comments` serialization, and instead just defined a [`JSON5`](https://json5.org/) serialization instead.
However, `JSON5` parsers are immature, and notably there are no mature `JSON5` parsers in Ruby. Given that important consumers of React I18n files are written in Ruby, it would not make sense to define a serialization using the full syntax of `JSON5`, since those files would not be able to be handled.

Adding a `JSON5` serialization would be an excellent future addition to React I18n, at a point in time where these consumers could be made to understand `JSON5`.

Since `JSON+Comments` is a subset of `JSON5`, a `JSON5` parser can be used to parse `JSON+Comments` serialized files.

# Comparison with Rails I18n

React I18n's schema was loosely based on the Rails I18n schema.
This section compares the two schemas, in order to point out the ways in which they differ from one another.

### Root locale key

Rails I18n has a locale root key, while React I18n doesn't:

**Rails I18n:**
```yaml
en:
  foo: bar
```

**React I18n**

```json
{
  "foo": "bar"
}
```

Note the `en` (for English) locale key that is the root key for the Rails I18n file. This key is not present in the React I18n file.

### Pluralization

Rails I18n (when using the default backend) allows for the use of a `zero` key (regardless of the source language), while React I18n doesn't.

The use of `zero` in Rails I18n is a problematic, as there are languages (eg. Arabic) that use `zero` as a pluralization key.
This causes collisions when `zero` is supplied in a source file for a language that doesn't use the `zero` pluralization key (eg. English).

React I18n avoids this by disallowing the use of the `zero` key unless the source language requires the `zero` pluralization key.

When manually converting Rails I18n files to React I18n, use a separate key for storing strings that should be used for placeholder or empty values.

**Rails I18n:**
```yaml
en:
  cars:
    zero: "I don't have any cars" # Problematic when translating into languages that use the `zero` pluralization key
    one: "I have %{count} car"
    other: "I have %{count} car"
```

**React I18n**

```json
{
  "cars": {
    "one": "I have {count} car",
    "other": "I have {count} cars"
  },
  "no_cars": "I don't have any cars"
}
```

### Interpolation

While neither schemas define an interpolation syntax, the most common syntax used in Rails I18n is `%{}`, while in React I18n, the most common syntax is `{}`.

**Rails I18n:**
```yaml
en:
  hello: My name is %{name}
```

**React I18n**

```json
{
  "hello": "My name is {name}"
}
```
