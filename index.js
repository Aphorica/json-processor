"use strict"

import fs from 'fs'
import path from 'path'

let commentPrefix = '!!'

function processJSON(startPath, filename, options) {
  if (!filename || (typeof filename) === 'object') {
                  // startPath contains filename --
                  // note filepath substitutions will not work if startPath
                  // not a dir

    options = filename
    filename = ''
  }

  if (options) {
    let optionsKeys = Object.keys(options)
    for (let ix = 0; ix < optionsKeys.length; ++ix) {
      switch(optionsKeys[ix]) {
        case 'comment-prefix':
          commentPrefix = options['comment-prefix']; break;
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

			thisItem = dv[thisKey];

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

			if (typeof thisItem === 'object') {  // (Array is object - handles the same)
				let candidateKey = Object.keys(thisItem)[0];
				if (candidateKey === 'file') {
          let fn = thisItem[candidateKey], buf

          if (options.paths) {
            let varKeys = Object.keys(options.paths)
            for (let nx = 0; nx < varKeys.length; ++nx)
              fn = fn.replace('{' +  varKeys[nx] + '}', options.paths[varKeys[nx]])
          }

					buf = fs.readFileSync(fn, 'utf8');

					switch (path.extname(fn)) {
						case ".json":
							newItem = JSON.parse(buf);
							break;

						case ".txt": {
								let nameItems = buf.split("\n"), nx, splitName;
							  newItem = {};
								for (nx = 0; nx < nameItems.length; ++nx) {
									splitName = nameItems[nx].split(':');
									newItem[splitName[0].trim()] = splitName[1].trim();
								}
							}
							break;

						default:
							console.log("ERROR: Unrecognized file type");
							break;
						}

					dv[thisKey] = processEntries(newItem);
				}

				else
					dv[thisKey] = processEntries(thisItem);
			}
		}

		return dv;
	}

  let inbuf = fs.readFileSync(startPath + (filename || ''));
	let directivesBuf = JSON.parse(inbuf);
	let directives = processEntries(directivesBuf);
	return directives
}

export default processJSON
