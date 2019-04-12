# @aphorica/json-processor

Environment: Node.js

## Overview

JSON is a terrific format, but the files can get long and unwieldy.

This utility reads JSON files and looks for directives in the keys it encounters
during traversal.  Possible keys are:

<dl>
<dt>file</dt>
<dd>The value is a file that contains further JSON (or other type &ndash; see below)
of information.  The file is read and traversal continues into the file (allowing
nesting.)</dd>
<dt>"!!" (anything following the bangs is ok)</dt>
</dd>A comment.  Comments are simply removed. The comment-prefix can be changed
in the passed in options (see below.)</dd>
</dt>

This allows two things:

1. Assembly of a large configuration from many smaller, more easily managed and
containable configuration files.

2. Meaningful commenting in a JSON file (Crockford indicates commenting was explicitly
left out of JSON, but I don't think he considered the vast usage that to which JSON
might be used.)  Without _json-processor_, you can certainly add a comment prefix key
if you want, but the problem is that when you fetch the keys, you'll have to
account for your comments and ignore them. _json-processor_ provides a canonical
form, so you don't have to think about it.

## Content

Here is an example JSON file with both a comment and file directives:

```
{
  "!!": "The summary sheet retabulates the 'Clockify' input into its final form.  Note the individual tab sheets are created in another process (driven by 'by_contractor.json')",

  "output": "none",
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
      "file": "{contractors}"
    }
  }
}
```

Note this will replace array items as long as they are objects.

In this example, the comment is long, but if you view it in an editor with soft
wraps set (_vscode_, in my case), it looks fine.

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

Anything underneath the comment key will be removed (you don't have to provide the
comment key in child objects.)

## Invoking
```
  processed = processJSON(base-path, file, options)
```

If provided, options are:

<dl>
<dt>paths:</dt>
<dd>An object of replacement keys and paths.  When encountered in a value (delimited
    by '{'-'}', it will be replaced with the path.</dd>

<dt>comment-prefix</dt>
<dd>Specify another comment prefix vs the default.  The processor will only
    look at the prefix to qualify a comment &ndash; any other characters are ignored.
</dl>


Here is an example invocation from an app I'm working on:

```
  return processJSON(Settings.outputsConfigPath, 
                        'config.json', {  // 'options'
                        paths: {
                          output: Settings.outputsConfigPath,
                          input: Settings.inputsConfigPath,
                          base: Settings.baseConfigPath,
                          contractors: Settings.contractorsFile
                        }})
```

## Notes

 - More complete documentation, tests and information will be forthcoming.  I'm currently
   in the process of factoring this out of an application.

 - I think it would be feasible to allow the processor to read other types of files &ndash;
   as long as the contents somehow resolve to a JSON object, it doesn't matter what
   the format is.  A potential approach would be in the options, provide a list of
   file suffixes and a functions to read the specific content per suffix and return
   an object.

 - On the name: I initially wanted to call it 'json-pp' for json _pre-processor_,
   however _pre-processor_ isn't exactly right, since the files are read before
   any processing.  So, I'm just calling it _'json-processor'_
