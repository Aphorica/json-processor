"use strict"

import fs from 'fs'
import path from 'path'

const DEFAULT_COMMENT_PREFIX = '!!'
let commentPrefix

function processJSON(startPath, filename, options) {
  if (!filename || (typeof filename) === 'object') {
                  // startPath contains filename --
                  // note filepath substitutions will not work if startPath
                  // not a dir

    options = filename
    filename = ''
  }

  commentPrefix = DEFAULT_COMMENT_PREFIX
              // this can hang around between invocations,
              // set it to default and let options override
              // if specified

  if (options) {
    let optionsKeys = Object.keys(options)
    for (let ix = 0; ix < optionsKeys.length; ++ix) {
      switch(optionsKeys[ix]) {
        case 'comment-prefix':
          commentPrefix = options['comment-prefix']; break
      }
    }
  }

	function processEntries(dv) {
		let keys = Object.keys(dv), thisKey, thisItem, newItem
    let ix, nx
		for (ix = 0; ix < keys.length; ++ix) {
			thisKey = keys[ix]
      if (thisKey.startsWith(commentPrefix)) {
        delete dv[thisKey]
        continue
      }

			thisItem = dv[thisKey]

      if (Array.isArray(thisItem)) {
        let processedItem
        newItem = []
        for (nx = 0; nx < thisItem.length; ++nx) {
          if ((typeof thisItem[nx]) === 'object' &&
              Object.keys(thisItem[nx])[0].startsWith(commentPrefix))
              continue
                    // cull comments
          processedItem = processEntries({dummy: thisItem[nx]})
          newItem.push(processedItem.dummy)
                    // build up return array
        }
      
        dv[thisKey] = newItem
        continue
      }

			if (typeof thisItem === 'object') {
				let candidateKey = Object.keys(thisItem)[0]

				if (candidateKey === 'file') {
          let fn = thisItem[candidateKey], buf
          let ext = path.extname(fn)
          
          if (options && options.paths) {
            let varKeys = Object.keys(options.paths)
            for (let nx = 0; nx < varKeys.length; ++nx)
              if (fn.indexOf(varKeys[nx]) > -1 ) {
                fn = fn.replace('{' +  varKeys[nx] + '}', options.paths[varKeys[nx]])
                break
              }
          }

          if (fn.indexOf('{') > -1)
            throw('json-processor: no substitution path for fn: "' + fn + '"')

          if (!path.isAbsolute(fn))
            fn = startPath + fn

          if (!fs.existsSync(fn))
            throw('json-processor: included file not found: "' + fn + '"')

					buf = fs.readFileSync(fn, 'utf8')

					if (path.extname(fn) === ".json")
						newItem = JSON.parse(buf)

          else if (options && (ext in options.types))
            newItem = options.types[ext](buf)

					else
            throw("json-processor: Unrecognized file type: " + ext)

					dv[thisKey] = processEntries(newItem)
				}

				else
					dv[thisKey] = processEntries(thisItem)
			}
		}

		return dv
	}

  let fn = startPath + (filename || ''), inbuf, json_in, json_out
  if (!fs.existsSync(fn))
    throw("json-processor: Can't read file, doesn't exist: \"" + fn + '"')

  inbuf = fs.readFileSync(fn, 'utf8')
	json_in = JSON.parse(inbuf)
	json_out = processEntries(json_in)

	return json_out
}

export default processJSON
