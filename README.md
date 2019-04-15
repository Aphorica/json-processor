# @aphorica/json-processor

github: https://aphorica.github.io<br/>
Web: https://aphorica.com

Environment: Node.js

## Motivation

A recent project I worked on implemented a sophisticated process
that was configuration driven, the configuration being specified
in JSON files &ndash; a good idea, but the configuration
file was getting unwieldy.  I needed a way to
break the configuration into more manageable pieces.

Another driving factor was that this application could have several
kinds of inputs and outputs, each having their own partial configuration
sets.  These needed to be combined according options chosen in the UI.
By breaking the configuration into multiple files, I could also address
this feature.

There are other solutions for providing segmented configuration files,
but they implement YAL (yet another language), and provide kitchen
sink functionality.

What I was looking for was simple:

 - Stay within the JSON format &mdash; this should be doable
   with canonical JSON syntax, without having to extend the language.

 - Providing a commenting form might be a nice add-on, since I have
   to process the entire file, anyway.

 - I don't need or want anything more than this.

 - I want it nice and tiny.

I couldn't really find anything else on _npm_ or otherwise, so
I wrote this.

Enjoy, if you find it useful.

## Overview

The utility reads JSON files and looks for directives in the keys it encounters
during traversal.  Possible keys are:

<dl>
<dt>"file"</dt>
<dd>The value specifies a file that contains further JSON (or perhaps other input type &ndash; see below)
of information.  The file is read and traversal continues into the file (allowing
nesting.)</dd>
<dt>"!!" (anything following the bangs is ok)</dt>
<dd>A comment.  Comments are simply removed. The comment-prefix can be changed
in the passed-in options (see below.)</dd>
</dt>

This allows two things:

1. Assembly of a large configuration from many smaller, more easily managed and
containable configuration files.

2. Meaningful commenting in a JSON file (Crockford indicates commenting was explicitly left out of the JSON specification, but I think they're
    useful.)  Without _json-processor_, you can certainly add a comment
    prefix key in your objects, if you want, but in your program you'll
    have to handle them, yourself.
    
    _json-processor_ provides a canonical form and implementation, so
    you don't have to think about it.

## Content

Here is an example JSON file with both a comment and file directives:

```
{
  "!!": "The summary sheet retabulates the 'Clockify' input into its final form.  Note the individual tab sheets are created in another process (driven by 'by_contractor.json')",

  "links-actor":"target",
  "sheetStyle": {
    "font": {
      "name":"Calibri",
      "size":"10"
    }
  },
	"groups": [
    {"file": "{output}level_0.json"},
    {"file": "{output}level_10.json"},
    {"file": "{output}level_18.json"},
    {"file": "{input}level_20.json"}
	],
  "lookups": {
    "contractors": {
      "file": "[contractors]"
    }
  }
}
```
Notes on the file content:

- The object specifying a file will be replaced in its entirety by
  the content in the file.

- An array of items can be specified.  If an array item is an
  object specifying a file the entire item will be replaced with
  the content in the specified file.

- the {...} and [...] delimit substitution keys.  See the _Substitution_ topic,
  below.

In this example, the comment is long, but if you view it in an editor
with soft wraps set (_vscode_, in my case), it looks fine.

Alternatively, you can break up comments into sections, if you like,
using normal JSON syntax:

```
{
  "!!": [
     "Here is point 1",
     "Here is point 2",
     {"furthermore": "ad nauseum}
    ]
  ,
  "actual-data": {
      ...
  }
}
```

Any children under the comment key will be removed (you don't
have to provide the comment key in child objects.)

If a comment is an array item, the item will be removed from
the array and the array rebuilt, sans comment item (order will
be maintained)

## Substitution

Substitutions happen in the value field only for objects
containing _"file"_ keys. Substitution paths are listed in the
_"options/paths"_ argument on invocation (see next).

The substitution delimiters are _"{&nbsp;}"_.

When a delimited substitution value is encountered in a value, it will be
replaced with the corresponding path, and the base path prepended.

if the completed path is absolute (per `path.absolute()` test), the
base path will _not_ be prepended.

## Invoking
```
  processed = processJSON([base-path], file, [options])
```
Args:
<dl>
<dt>base-path (optional - needed if 'paths' are provided [see below])
<dd>
The root path of the collection of json files.</dd>
<dt>file</dt>
<dd>
The top-level json filename</dd>
<dt>options (optional)</dt>
<dd>
If provided, options are:
<dl>
<dt>paths:</dt>
<dd>An object of replacement keys and paths.  When encountered in a value (delimited
    by '{'-'}', it will be replaced with the path.</dd>

<dt>comment-prefix</dt>
<dd>Specify another comment prefix vs the default.  The processor will only
    look at the prefix to qualify a comment &ndash; any other characters are ignored.
</dl>
</dd>
</dl>

### Example Invocation
Here is an example invocation from an app I'm working on:

```
  return processJSON(Settings.outputsConfigPath, 
                        'config.json', {  // 'options'
                        paths: {
                          output: Settings.outputsConfigPath,
                          input: Settings.inputsConfigPath,
                          contractors: Settings.contractorsFile
                        }})
```

This uses paths contained in a `Settings` object.  For another
example, see the test file.

## Including Other File Types

You can include other file types by providing a list of objects,
each specifying a file extension and a processor to return a js
object.  For instance, a text file with arbirtrarily formatted
information could be processed by including it in a JSON file
like so:
```
  {
    ...
    "other": {
      "file": "somefile.txt"
    }
    ...
  }
```

And providing the extension and processor in the options:

```
  function parseText(text) {
    let retObj = {}
    // build up the object by parsing the text
    return retObj 
  }

  processJSON(path, fn, {
    types: {
      ".txt": procText
    }
  })
```

You can process YAML by providing a YAML parser.
```
  import yaml from 'js-yaml'

  function procYaml(text) {
    yaml.loadSafe(text) // provide additional args here, if needed
  }

  processJSON(path, fn, {
    types: {
      ".yml": procYaml
    }
  })
```

See the test for working examples

## Notes
 - All paths are expected to be trailed with a path separator.

 - On the name: I initially wanted to call it 'json-pp' for 'json _pre-processor_', however _pre-processor_ isn't exactly right,
    since the files are read and parsed before any processing.
    
    So, I'm just calling it _'json-processor'_
